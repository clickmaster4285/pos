// src/controllers/companyExcelController.js
import ExcelJS from "exceljs";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGO_URI;

export const exportCompanyExcel = async (req, res) => {
  const { companyId } = req.query;
  let client;

  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();

    // Master cache
    const nameCache = {
      users: {},     // userId -> name
      companies: {}, // companyId -> name
      collections: {} // collectionName -> { _id -> displayName }
    };

    // Preload users & companies
    const usersColl = db.collection("users");
    const users = await usersColl.find({ companyId }).toArray();
    users.forEach(u => {
      const key = u.userId || u._id?.toString();
      nameCache.users[key] = u.name || u.email || "Unknown User";
    });

    const companiesColl = db.collection("companies");
    const companies = await companiesColl.find({ companyId }).toArray();
    companies.forEach(c => {
      const key = c.companyId || c._id?.toString();
      nameCache.companies[key] = c.name || "Unknown Company";
    });

    // Find relevant collections
    const allColls = await db.listCollections().toArray();
    const relevantColls = [];

    for (const collInfo of allColls) {
      const coll = db.collection(collInfo.name);
      const sample = await coll.findOne({ companyId });
      if (sample) {
        relevantColls.push({ name: collInfo.name, collection: coll });
      }
    }

    if (relevantColls.length === 0) {
      return res.status(404).json({ message: "No data found for this company" });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "YourApp";
    workbook.created = new Date();

    const detailSheetMap = {};

    // Helper: Resolve any ObjectId/string to name
    const resolveIdToName = async (collectionName, id) => {
      if (!id) return "";

      const idStr = id.toString();
      if (!nameCache.collections[collectionName]) {
        nameCache.collections[collectionName] = {};
      }
      if (nameCache.collections[collectionName][idStr]) {
        return nameCache.collections[collectionName][idStr];
      }

      const coll = db.collection(collectionName);
      const doc = await coll.findOne({ _id: id instanceof ObjectId ? id : new ObjectId(id) });
      if (!doc) return idStr;

      const name = doc.productName || doc.name || doc.vendorName || doc.categoryName || doc.billNumber || idStr;
      nameCache.collections[collectionName][idStr] = name;
      return name;
    };

    // Guess collection from field name (e.g., "category" → "categories")
    const guessCollectionFromField = (field) => {
      const normalized = field.toLowerCase();
      if (normalized.includes("category")) return "categories";
      if (normalized.includes("vendor")) return "vendors";
      if (normalized.includes("buyer")) return "vendors"; // or customers?
      if (normalized.includes("product")) return "products";
      if (normalized.includes("bill")) return "bills";
      return field.replace(/s?$/i, "s"); // fallback: pluralize
    };

    for (const { name: collName, collection } of relevantColls) {
      const docs = await collection.find({ companyId }).toArray();
      if (!docs.length) continue;

      const sanitizedName = collName.replace(/[^a-zA-Z0-9]/g, "_");
      const worksheet = workbook.addWorksheet(sanitizedName.slice(0, 31));

      const fieldConfig = getFieldConfig(collName);
      const mainFields = fieldConfig.main;

      worksheet.addRow(mainFields);

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
          // Detect ObjectId or hex string
          else if (value && (value instanceof ObjectId || (typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value)))) {
            const possibleColl = guessCollectionFromField(field);
            if (relevantColls.some(c => c.name === possibleColl)) {
              value = await resolveIdToName(possibleColl, value);
            } else {
              // Fallback: same collection
              value = await resolveIdToName(collName, value);
            }
          }
          // Handle objects → detail sheet
          else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof ObjectId) && Object.keys(value).length > 0) {
            const detailKey = `${collName}_${field}_detail_${docIndex}`;
            if (!detailSheetMap[detailKey]) {
              detailSheetMap[detailKey] = await createObjectDetailSheet(
                workbook, collName, doc, field, mainFields, docIndex,
                nameCache, resolveIdToName, guessCollectionFromField
              );
            }
            const sheetName = detailSheetMap[detailKey].name;
            row.push({
              text: "View Detail",
              hyperlink: `#'${sheetName}'!A1`,
              tooltip: `View full ${field}`
            });
            continue;
          }
          // Handle arrays
          else if (Array.isArray(value) && value.length > 0) {
            const detailKey = `${collName}_${field}_detail_${docIndex}`;
            if (!detailSheetMap[detailKey]) {
              detailSheetMap[detailKey] = await createArrayDetailSheet(
                workbook, collName, doc, field, mainFields, docIndex,
                nameCache, resolveIdToName, guessCollectionFromField
              );
            }
            const sheetName = detailSheetMap[detailKey].name;
            row.push({
              text: "View Detail",
              hyperlink: `#'${sheetName}'!A1`,
              tooltip: `View ${value.length} ${field}`
            });
            continue;
          }

          row.push(value ?? "");
        }

        const rowObj = worksheet.addRow(row);

        // Hyperlink styling
        mainFields.forEach((field, colIdx) => {
          const cell = rowObj.getCell(colIdx + 1);
          const val = doc[field];
          if ((Array.isArray(val) && val.length > 0) || 
              (val && typeof val === "object" && !(val instanceof ObjectId) && Object.keys(val).length > 0)) {
            cell.font = { color: { argb: "FF0000FF" }, underline: true };
            cell.value = row[colIdx];
          }
        });
      }

      worksheet.columns = mainFields.map((key) => ({
        header: key,
        key,
        width: Math.max(key.length + 2, 15),
      }));
    }

    // Write response
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

// === Field Config ===
function getFieldConfig(collectionName) {
  const commonExclude = ["_id", "history", "__v", "isActive", "deleted", "createdAt", "updatedAt"];

  const configs = {
    products: {
      main: ["companyId", "productName", "SKU", "description", "tags", "imgUrl", "category", "subCategoryName", "vendor", "ingredient", "metaData", "sellingPrice", "costPrice", "quantity", "minStockLevel", "createdBy"]
    },
    categories: {
      main: ["categoryName", "subCategory", "companyId", "description", "tags", "createdBy"]
    },
    companies: {
      main: ["name", "companyId", "industryName", "address", "contactEmail", "contactPhone", "plan", "owner", "gain", "invoiceSettings", "companyLogo"]
    },
    vendors: {
      main: ["name", "contactName", "email", "phone", "address", "companyId", "paymentType", "createdBy"]
    },
    bills: {
      main: ["billNumber", "companyId", "createdBy", "buyer", "items", "subtotal", "taxPercent", "taxAmount", "total", "paymentMethod", "notes", "refundDetails", "status", "discountPercent", "discountAmount"]
    },
    users: {
      main: ["name", "userId", "companyId", "email", "role", "address", "baseSalaryMonthly"]
    }
  };

  const config = configs[collectionName] || { main: [] };
  return {
    main: config.main.filter(f => !commonExclude.includes(f))
  };
}

// === Detail Sheet: Object ===
async function createObjectDetailSheet(
  workbook, collName, doc, fieldName, mainFields, docIndex,
  nameCache, resolveIdToName, guessCollectionFromField
) {
  const safeName = `${collName}_${fieldName}_detail_${docIndex}`.slice(0, 31);
  let sheet = workbook.getWorksheet(safeName);
  if (sheet) return { name: safeName };

  sheet = workbook.addWorksheet(safeName);
  sheet.addRow([`Full Details for ${collName} Row ${docIndex + 1}`]);

  for (const field of mainFields) {
    let value = doc[field];
    if (field === "userId" || field === "createdBy") {
      value = nameCache.users[value] || value || "";
    } else if (field === "companyId") {
      value = nameCache.companies[value] || value || "";
    } else if (value && (value instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(value))) {
      const possibleColl = guessCollectionFromField(field);
      value = await resolveIdToName(possibleColl, value);
    }
    if (typeof value !== "object" || value == null) {
      sheet.addRow([field, value ?? ""]);
    }
  }
  sheet.addRow([]); // spacer

  const data = doc[fieldName];
  if (!data || typeof data !== "object") return { name: safeName };

  sheet.addRow([`Expanded: ${fieldName}`]);
  const keys = Object.keys(data).filter(k => !k.startsWith("__") && k !== "_id");
  sheet.addRow(["Field", "Value"]);

  for (const key of keys) {
    let val = data[key];
    if (val && (val instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(val))) {
      const possibleColl = guessCollectionFromField(key);
      val = await resolveIdToName(possibleColl, val);
    } else if (Array.isArray(val)) {
      val = JSON.stringify(val);
    }
    sheet.addRow([key, val ?? ""]);
  }

  sheet.columns = [{ width: 25 }, { width: 40 }];
  return { name: safeName };
}

// === Detail Sheet: Array ===
async function createArrayDetailSheet(
  workbook, collName, doc, fieldName, mainFields, docIndex,
  nameCache, resolveIdToName, guessCollectionFromField
) {
  const safeName = `${collName}_${fieldName}_detail_${docIndex}`.slice(0, 31);
  let sheet = workbook.getWorksheet(safeName);
  if (sheet) return { name: safeName };

  sheet = workbook.addWorksheet(safeName);
  sheet.addRow([`Full Details for ${collName} Row ${docIndex + 1}`]);

  for (const field of mainFields) {
    let value = doc[field];
    if (field === "userId" || field === "createdBy") {
      value = nameCache.users[value] || value || "";
    } else if (field === "companyId") {
      value = nameCache.companies[value] || value || "";
    } else if (value && (value instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(value))) {
      const possibleColl = guessCollectionFromField(field);
      value = await resolveIdToName(possibleColl, value);
    }
    if (typeof value !== "object" || value == null) {
      sheet.addRow([field, value ?? ""]);
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
          const possibleColl = guessCollectionFromField(k);
          val = await resolveIdToName(possibleColl, val);
        }
        return val ?? "";
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