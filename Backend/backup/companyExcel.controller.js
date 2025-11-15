// src/controllers/companyExcelController.js
import ExcelJS from "exceljs";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGO_URI;

// Common fields to exclude from ALL collections
const commonExclude = ["_id", "history", "__v", "isActive", "deleted", "updatedAt"];

export const exportCompanyExcel = async (req, res) => {
  const { companyId } = req.query;
  let client;

  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();

    // -------------------------------------------------
    // CACHES
    // -------------------------------------------------
    const nameCache = {
      users: {},     // userId → name
      companies: {}, // companyId → name
      ids: {}        // flat cache for any ObjectId → name
    };

    // Preload users
    const usersColl = db.collection("users");
    const users = await usersColl.find({ companyId }).toArray();
    users.forEach(u => {
      const key = u.userId || u._id?.toString();
      nameCache.users[key] = u.name || u.email || "Unknown User";
    });

    // Preload companies
    const companiesColl = db.collection("companies");
    const companies = await companiesColl.find({ companyId }).toArray();
    companies.forEach(c => {
      const key = c.companyId || c._id?.toString();
      nameCache.companies[key] = c.name || "Unknown Company";
    });

    // -------------------------------------------------
    // FIND RELEVANT COLLECTIONS
    // -------------------------------------------------
    const allColls = await db.listCollections().toArray();
    const relevantColls = [];

    for (const collInfo of allColls) {
      if (collInfo.name === "companies") continue;
      const coll = db.collection(collInfo.name);
      const sample = collInfo.name === "users"
        ? await coll.findOne({ companyId, role: "staff" })
        : await coll.findOne({ companyId });

      if (sample) relevantColls.push({ name: collInfo.name, collection: coll });
    }

    if (!relevantColls.length) {
      return res.status(404).json({ message: "No data found for this company" });
    }

    // -------------------------------------------------
    // RESOLVE ANY OBJECTID → NAME (search across relevant collections)
    // -------------------------------------------------
    const resolveIdToName = async (id) => {
      if (!id) return "";
      const idStr = id.toString();

      if (nameCache.ids[idStr]) {
        return nameCache.ids[idStr];
      }

      const objId = id instanceof ObjectId ? id : new ObjectId(id);

      for (const { name: collName, collection } of relevantColls) {
        const doc = await collection.findOne({ _id: objId });
        if (doc) {
          const name = doc.productName || doc.name || doc.vendorName ||
                       doc.categoryName || doc.billNumber || idStr;
          nameCache.ids[idStr] = name;
          return name;
        }
      }

      return idStr;
    };

    // -------------------------------------------------
    // EXCEL SETUP
    // -------------------------------------------------
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "YourApp";
    workbook.created = new Date();

    const detailSheetMap = {};

    // -------------------------------------------------
    // GET MAIN FIELDS (dynamic + special case for users)
    // -------------------------------------------------
    const getMainFields = async (collName, collection) => {
      // Special case: users sheet uses fixed fields
      if (collName === "users") {
        return ["name", "email", "role", "subRole", "department", "phone", "address", "baseSalaryMonthly"];
      }

      // For all other collections: discover fields from first 5 docs
      const cursor = collection.find({ companyId }).limit(5);
      const samples = await cursor.toArray();
      if (!samples.length) return [];

      const keySet = new Set();
      samples.forEach(doc => {
        Object.keys(doc).forEach(k => {
          if (!commonExclude.includes(k)) keySet.add(k);
        });
      });

      // Order: fields present in all samples first
      const alwaysPresent = samples.reduce((acc, doc) => {
        const present = Object.keys(doc).filter(k => !commonExclude.includes(k));
        return acc.filter(k => present.includes(k));
      }, Object.keys(samples[0]).filter(k => !commonExclude.includes(k)));

      const rest = [...keySet].filter(k => !alwaysPresent.includes(k));
      return [...alwaysPresent, ...rest];
    };

    // -------------------------------------------------
    // PROCESS EACH COLLECTION
    // -------------------------------------------------
    for (const { name: collName, collection } of relevantColls) {
      const docs = collName === "users"
        ? await collection.find({ companyId, role: "staff" }).toArray()
        : await collection.find({ companyId }).toArray();

      if (!docs.length) continue;

      const sanitized = collName.replace(/[^a-zA-Z0-9]/g, "_");
      const sheetName = (collName === "users" ? "staff" : sanitized).slice(0, 31);
      const worksheet = workbook.addWorksheet(sheetName);

      const mainFields = await getMainFields(collName, collection);
      if (!mainFields.length) continue;

      // Header row (camelCase → Title Case)
      worksheet.addRow(mainFields.map(camelToTitle));

      for (const [docIndex, doc] of docs.entries()) {
        const row = [];

        for (const field of mainFields) {
          let value = doc[field];

          // Special: userId / createdBy
          if (field === "userId" || field === "createdBy") {
            value = nameCache.users[value] || value || "";
          }
          // Special: companyId
          else if (field === "companyId") {
            value = nameCache.companies[value] || value || "";
          }
          // Handle ObjectId or hex string → resolve name
          else if (value && (value instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(value))) {
            value = await resolveIdToName(value);
          }
          // Nested object → detail sheet
          else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof ObjectId) && Object.keys(value).length) {
            const key = `${collName}_${field}_detail_${docIndex}`;
            if (!detailSheetMap[key]) {
              detailSheetMap[key] = await createObjectDetailSheet(
                workbook, collName, doc, field, mainFields, docIndex,
                nameCache, resolveIdToName
              );
            }
            const sName = detailSheetMap[key].name;
            row.push({
              text: "View Detail",
              hyperlink: `#'${sName}'!A1`,
              tooltip: `View full ${field}`
            });
            continue;
          }
          // Array → detail sheet
          else if (Array.isArray(value) && value.length) {
            const key = `${collName}_${field}_detail_${docIndex}`;
            if (!detailSheetMap[key]) {
              detailSheetMap[key] = await createArrayDetailSheet(
                workbook, collName, doc, field, mainFields, docIndex,
                nameCache, resolveIdToName
              );
            }
            const sName = detailSheetMap[key].name;
            row.push({
              text: "View Detail",
              hyperlink: `#'${sName}'!A1`,
              tooltip: `View ${value.length} ${field}`
            });
            continue;
          }

          row.push(value ?? "-");
        }

        const rowObj = worksheet.addRow(row);

        // Style hyperlinks
        mainFields.forEach((f, i) => {
          const cell = rowObj.getCell(i + 1);
          const val = doc[f];
          if ((Array.isArray(val) && val.length) ||
              (val && typeof val === "object" && !(val instanceof ObjectId) && Object.keys(val).length)) {
            cell.font = { color: { argb: "FF0000FF" }, underline: true };
            cell.value = row[i];
          }
        });
      }

      // Column config
      worksheet.columns = mainFields.map(k => ({
        header: camelToTitle(k),
        key: k,
        width: Math.max(k.length + 2, 15)
      }));
    }

    // -------------------------------------------------
    // SEND FILE
    // -------------------------------------------------
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="company-${companyId}-export-${new Date().toISOString().slice(0, 10)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ message: "Export failed", error: err.message });
  } finally {
    if (client) await client.close();
  }
};

// -------------------------------------------------
// UTILS
// -------------------------------------------------
function camelToTitle(str) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

// === Detail Sheet: Object ===
async function createObjectDetailSheet(
  workbook, collName, doc, fieldName, mainFields, docIndex,
  nameCache, resolveIdToName
) {
  const safeName = `${collName}_${fieldName}_detail_${docIndex}`.slice(0, 31);
  let sheet = workbook.getWorksheet(safeName);
  if (sheet) return { name: safeName };

  sheet = workbook.addWorksheet(safeName);
  sheet.addRow([`Details for ${collName} Row ${docIndex + 1}`]);
  sheet.addRow([]);

  // Main fields
  for (const field of mainFields) {
    let value = doc[field];
    if (field === "userId" || field === "createdBy") {
      value = nameCache.users[value] || value || "";
    } else if (field === "companyId") {
      value = nameCache.companies[value] || value || "";
    } else if (value && (value instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(value))) {
      value = await resolveIdToName(value);
    }
    if (typeof value !== "object" || value == null) {
      sheet.addRow([field, value ?? "-"]);
    }
  }

  sheet.addRow([]);
  sheet.addRow([`Expanded: ${fieldName}`]);
  sheet.addRow(["Field", "Value"]);

  const data = doc[fieldName];
  const keys = Object.keys(data).filter(k => !k.startsWith("__") && k !== "_id");
  for (const key of keys) {
    let val = data[key];
    if (val && (val instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(val))) {
      val = await resolveIdToName(val);
    } else if (Array.isArray(val)) {
      val = JSON.stringify(val);
    }
    sheet.addRow([key, val ?? "-"]);
  }

  sheet.columns = [{ width: 25 }, { width: 40 }];
  return { name: safeName };
}

// === Detail Sheet: Array ===
async function createArrayDetailSheet(
  workbook, collName, doc, fieldName, mainFields, docIndex,
  nameCache, resolveIdToName
) {
  const safeName = `${collName}_${fieldName}_detail_${docIndex}`.slice(0, 31);
  let sheet = workbook.getWorksheet(safeName);
  if (sheet) return { name: safeName };

  sheet = workbook.addWorksheet(safeName);
  sheet.addRow([`Details for ${collName} Row ${docIndex + 1}`]);
  sheet.addRow([]);

  // Main fields
  for (const field of mainFields) {
    let value = doc[field];
    if (field === "userId" || field === "createdBy") {
      value = nameCache.users[value] || value || "";
    } else if (field === "companyId") {
      value = nameCache.companies[value] || value || "";
    } else if (value && (value instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(value))) {
      value = await resolveIdToName(value);
    }
    if (typeof value !== "object" || value == null) {
      sheet.addRow([field, value ?? "-"]);
    }
  }

  sheet.addRow([]);
  const array = doc[fieldName];
  sheet.addRow([`Expanded: ${fieldName} (${array.length} items)`]);
  sheet.addRow([]);

  if (array.length === 0) {
    sheet.addRow(["No items"]);
    return { name: safeName };
  }

  if (array.every(item => item && typeof item === "object")) {
    const keys = [...new Set(array.flatMap(Object.keys))].filter(k => !k.startsWith("__") && k !== "_id");
    sheet.addRow(keys);

    for (const item of array) {
      const row = await Promise.all(keys.map(async (k) => {
        let val = item[k];
        if (val && (val instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(val))) {
          val = await resolveIdToName(val);
        }
        return val ?? "-";
      }));
      sheet.addRow(row);
    }
    sheet.columns = keys.map(() => ({ width: 20 }));
  } else {
    array.forEach((item, i) => {
      sheet.addRow([i + 1, item]);
    });
    sheet.columns = [{ width: 10 }, { width: 30 }];
  }

  return { name: safeName };
}