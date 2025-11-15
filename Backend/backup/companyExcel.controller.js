// src/controllers/companyExcelController.js
import ExcelJS from "exceljs";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGO_URI;

// Fields to exclude from every collection
const commonExclude = ["_id", "history", "__v", "isActive", "deleted", "updatedAt", "companyId", "imgUrl"];

// Colour palette
const COLORS = {
  primary: '4F81BD',
  secondary: 'D0CECE',
  accent: 'FFC000',
  success: '70AD47',
  header: '4F81BD',
  lightBlue: 'DDEBF7',
  lightGray: 'F2F2F2',
  white: 'FFFFFF',
  border: 'A5A5A5'
};

/* -------------------------------------------------
   Helper: "-" for any empty value
   ------------------------------------------------- */
const toDash = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  if (Array.isArray(v) && v.length === 0) return "-";
  if (typeof v === "object" && Object.keys(v).length === 0) return "-";
  return v;
};

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
      ids: {}        // ObjectId → name
    };

    // Pre‑load users
    const usersColl = db.collection("users");
    const users = await usersColl.find({ companyId }).toArray();
    users.forEach(u => {
      const key = u.userId || u._id?.toString();
      nameCache.users[key] = u.name || u.email || "Unknown User";
    });

    // Pre‑load companies
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
    const detailSheets = [];

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
    // RESOLVE OBJECTID → NAME
    // -------------------------------------------------
    const resolveIdToName = async (id) => {
      if (!id) return "-";
      const idStr = id.toString();
      if (nameCache.ids[idStr]) return nameCache.ids[idStr];

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

    // -------------------------------------------------
    // GET MAIN FIELDS – scan **all** docs (no .limit)
    // -------------------------------------------------
    const getMainFields = async (collName, collection) => {
      if (collName === "users") {
        return ["name", "email", "role", "subRole", "department", "phone", "address", "baseSalaryMonthly"];
      }

      const docs = await collection.find({ companyId }).toArray();
      if (!docs.length) return [];

      const keySet = new Set();
      docs.forEach(doc => {
        Object.keys(doc).forEach(k => {
          if (!commonExclude.includes(k)) keySet.add(k);
        });
      });

      // fields present in **every** document first
      const alwaysPresent = docs.reduce((acc, doc) => {
        const present = Object.keys(doc).filter(k => !commonExclude.includes(k));
        return acc.filter(k => present.includes(k));
      }, [...keySet]);

      const rest = [...keySet].filter(k => !alwaysPresent.includes(k));
      return [...alwaysPresent, ...rest];
    };

    // -------------------------------------------------
    // PROCESS EACH COLLECTION (MAIN SHEETS)
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

      // ---------- TITLE (collection name) ----------
      const titleRow = worksheet.addRow([`${camelToTitle(sheetName)} Data`]);
      titleRow.font = { size: 16, bold: true, color: { argb: COLORS.white } };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } };
      titleRow.alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.mergeCells(1, 1, 1, mainFields.length);

      // ---------- HEADER (field titles) ----------
      const headerRow = worksheet.addRow(mainFields.map(camelToTitle));
      headerRow.font = { bold: true, color: { argb: COLORS.white } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
      headerRow.alignment = { horizontal: 'left', vertical: 'middle' };
      headerRow.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: COLORS.border } },
          left: { style: 'thin', color: { argb: COLORS.border } },
          bottom: { style: 'thin', color: { argb: COLORS.border } },
          right: { style: 'thin', color: { argb: COLORS.border } }
        };
      });

      // ---------- DATA ROWS ----------
      for (const [docIndex, doc] of docs.entries()) {
        const row = [];

        for (const field of mainFields) {
          let value = doc[field];

          if (field === "userId" || field === "createdBy") {
            value = nameCache.users[value] || value || "-";
          } else if (field === "companyId") {
            value = nameCache.companies[value] || value || "-";
          } else if (value && (value instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(value))) {
            value = await resolveIdToName(value);
          }
          // nested object → detail sheet
          else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof ObjectId) && Object.keys(value).length) {
            const detailSheet = await createObjectDetailSheet(
              workbook, collName, doc, field, mainFields, docIndex,
              nameCache, resolveIdToName
            );
            detailSheets.push(detailSheet);
            row.push({
              text: "View Details",
              hyperlink: `#'${detailSheet.name}'!A1`,
              tooltip: `View full ${field} details`
            });
            continue;
          }
          // array → detail sheet
          else if (Array.isArray(value) && value.length) {
            const detailSheet = await createArrayDetailSheet(
              workbook, collName, doc, field, mainFields, docIndex,
              nameCache, resolveIdToName
            );
            detailSheets.push(detailSheet);
            row.push({
              text: `View ${value.length} Items`,
              hyperlink: `#'${detailSheet.name}'!A1`,
              tooltip: `View ${value.length} ${field} items`
            });
            continue;
          }

          row.push(toDash(value));
        }

        const rowObj = worksheet.addRow(row);

        // alternate row colour
        if (docIndex % 2 === 0) {
          rowObj.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } });
        } else {
          rowObj.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } });
        }

        // hyperlink style + borders + left‑align (numbers/booleans stay centered)
        mainFields.forEach((f, i) => {
          const cell = rowObj.getCell(i + 1);
          const val = doc[f];

          if ((Array.isArray(val) && val.length) ||
              (val && typeof val === "object" && !(val instanceof ObjectId) && Object.keys(val).length)) {
            cell.font = { color: { argb: "FF0000FF" }, underline: true };
            cell.value = row[i];
          }

          cell.border = {
            top: { style: 'thin', color: { argb: COLORS.border } },
            left: { style: 'thin', color: { argb: COLORS.border } },
            bottom: { style: 'thin', color: { argb: COLORS.border } },
            right: { style: 'thin', color: { argb: COLORS.border } }
          };

          // left‑align everything except numbers/booleans
          if (typeof cell.value === 'number' || typeof cell.value === 'boolean') {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      }

      // ---------- COLUMN SETTINGS ----------
      const displayName = collName === "users" ? "Staff" : camelToTitle(collName);
      worksheet.columns = mainFields.map(k => ({
        header: displayName,//camelToTitle(k)
        key: k,
        width: Math.max(k.length + 4, 12),
        style: { alignment: { vertical: 'middle' } }
      }));

      // freeze title + header
      worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];
    }

    // -------------------------------------------------
    // RE‑ORDER SHEETS – main first, details last
    // -------------------------------------------------
    workbook.worksheets.sort((a, b) => {
      const aMain = !a.name.includes('_detail_');
      const bMain = !b.name.includes('_detail_');
      if (aMain && !bMain) return -1;
      if (!aMain && bMain) return 1;
      return 0;
    });

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

  // title
  const titleRow = sheet.addRow([`Details: ${camelToTitle(collName)} - ${camelToTitle(fieldName)} (Row ${docIndex + 1})`]);
  titleRow.font = { size: 14, bold: true, color: { argb: COLORS.white } };
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } };
  titleRow.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.mergeCells(1, 1, 1, 2);
  sheet.addRow([]);

  // main fields header
  const mfHeader = sheet.addRow(["Main Document Fields"]);
  mfHeader.font = { bold: true, color: { argb: COLORS.white } };
  mfHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
  mfHeader.alignment = { horizontal: 'left' };
  sheet.mergeCells(3, 1, 3, 2);

  // main fields rows
  for (const field of mainFields) {
    let value = doc[field];
    if (field === "userId" || field === "createdBy") value = nameCache.users[value] || value || "-";
    else if (field === "companyId") value = nameCache.companies[value] || value || "-";
    else if (value && (value instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(value))) value = await resolveIdToName(value);

    if (typeof value !== "object" || value == null) {
      const r = sheet.addRow([camelToTitle(field), toDash(value)]);
      r.alignment = { horizontal: 'left', vertical: 'middle' };
      if (sheet.rowCount % 2 === 0) {
        r.getCell(1).fill = r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } };
      } else {
        r.getCell(1).fill = r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } };
      }
    }
  }

  sheet.addRow([]);

  // expanded object header
  const expHeader = sheet.addRow([`Expanded: ${camelToTitle(fieldName)}`]);
  expHeader.font = { bold: true, color: { argb: COLORS.white } };
  expHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
  expHeader.alignment = { horizontal: 'left' };
  sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, 2);

  const subHeader = sheet.addRow(["Field", "Value"]);
  subHeader.font = { bold: true, color: { argb: COLORS.white } };
  subHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
  subHeader.alignment = { horizontal: 'left' };

  const data = doc[fieldName];
  const keys = Object.keys(data).filter(k => !k.startsWith("__") && k !== "_id");
  for (const key of keys) {
    let val = data[key];
    if (val && (val instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(val))) val = await resolveIdToName(val);
    else if (Array.isArray(val)) val = JSON.stringify(val);
    const r = sheet.addRow([camelToTitle(key), toDash(val)]);
    r.alignment = { horizontal: 'left', vertical: 'middle' };
    if (sheet.rowCount % 2 === 0) {
      r.getCell(1).fill = r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } };
    } else {
      r.getCell(1).fill = r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } };
    }
  }

  // borders
  for (let i = 1; i <= sheet.rowCount; i++) {
    for (let j = 1; j <= 2; j++) {
      const c = sheet.getCell(i, j);
      c.border = {
        top: { style: 'thin', color: { argb: COLORS.border } },
        left: { style: 'thin', color: { argb: COLORS.border } },
        bottom: { style: 'thin', color: { argb: COLORS.border } },
        right: { style: 'thin', color: { argb: COLORS.border } }
      };
    }
  }

  sheet.columns = [
    { width: 25, style: { alignment: { vertical: 'middle' } } },
    { width: 40, style: { alignment: { vertical: 'middle' } } }
  ];

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

  // title
  const titleRow = sheet.addRow([`Details: ${camelToTitle(collName)} - ${camelToTitle(fieldName)} (Row ${docIndex + 1})`]);
  titleRow.font = { size: 14, bold: true, color: { argb: COLORS.white } };
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } };
  titleRow.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.mergeCells(1, 1, 1, 2);
  sheet.addRow([]);

  // main fields header
  const mfHeader = sheet.addRow(["Main Document Fields"]);
  mfHeader.font = { bold: true, color: { argb: COLORS.white } };
  mfHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
  mfHeader.alignment = { horizontal: 'left' };
  sheet.mergeCells(3, 1, 3, 2);

  // main fields rows
  for (const field of mainFields) {
    let value = doc[field];
    if (field === "userId" || field === "createdBy") value = nameCache.users[value] || value || "-";
    else if (field === "companyId") value = nameCache.companies[value] || value || "-";
    else if (value && (value instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(value))) value = await resolveIdToName(value);

    if (typeof value !== "object" || value == null) {
      const r = sheet.addRow([camelToTitle(field), toDash(value)]);
      r.alignment = { horizontal: 'left', vertical: 'middle' };
      if (sheet.rowCount % 2 === 0) {
        r.getCell(1).fill = r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } };
      } else {
        r.getCell(1).fill = r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } };
      }
    }
  }

  sheet.addRow([]);
  const array = doc[fieldName];

  // array header
  const arrHeader = sheet.addRow([`Expanded: ${camelToTitle(fieldName)} (${array.length} items)`]);
  arrHeader.font = { bold: true, color: { argb: COLORS.white } };
  arrHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
  arrHeader.alignment = { horizontal: 'left' };

  if (array.length === 0) {
    sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, 2);
    const noRow = sheet.addRow(["-"]);
    noRow.alignment = { horizontal: 'left' };
    sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, 2);
    return { name: safeName };
  }

  if (array.every(item => item && typeof item === "object")) {
    const keys = [...new Set(array.flatMap(Object.keys))].filter(k => !k.startsWith("__") && k !== "_id");
    const headerRow = sheet.addRow(keys.map(camelToTitle));
    headerRow.font = { bold: true, color: { argb: COLORS.white } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
    headerRow.alignment = { horizontal: 'left' };
    sheet.mergeCells(sheet.rowCount - 1, 1, sheet.rowCount - 1, keys.length || 1);

    for (const [idx, item] of array.entries()) {
      const row = await Promise.all(keys.map(async k => {
        let v = item[k];
        if (v && (v instanceof ObjectId || /^[0-9a-fA-F]{24}$/.test(v))) v = await resolveIdToName(v);
        return toDash(v);
      }));
      const dataRow = sheet.addRow(row);
      dataRow.alignment = { horizontal: 'left', vertical: 'middle' };
      if (idx % 2 === 0) {
        dataRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } });
      } else {
        dataRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } });
      }
    }
    sheet.columns = keys.map(() => ({ width: 20, style: { alignment: { vertical: 'middle' } } }));
  } else {
    sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, 2);
    const simpleHeader = sheet.addRow(["Index", "Value"]);
    simpleHeader.font = { bold: true, color: { argb: COLORS.white } };
    simpleHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
    simpleHeader.alignment = { horizontal: 'left' };

    array.forEach((item, i) => {
      const r = sheet.addRow([i + 1, toDash(item)]);
      r.alignment = { horizontal: 'left', vertical: 'middle' };
      if (i % 2 === 0) {
        r.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } });
      } else {
        r.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } });
      }
    });
    sheet.columns = [
      { width: 10, style: { alignment: { vertical: 'middle' } } },
      { width: 30, style: { alignment: { vertical: 'middle' } } }
    ];
  }

  // borders for whole sheet
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.border } },
        left: { style: 'thin', color: { argb: COLORS.border } },
        bottom: { style: 'thin', color: { argb: COLORS.border } },
        right: { style: 'thin', color: { argb: COLORS.border } }
      };
    });
  }

  return { name: safeName };
}