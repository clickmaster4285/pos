// src/controllers/companyExcelController.js
import ExcelJS from "exceljs";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI;

export const exportCompanyExcel = async (req, res) => {
  const { companyId } = req.query;
  let client;

  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();

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

    const detailSheetMap = {}; // To store detail sheet references

    for (const { name: collName, collection } of relevantColls) {
      const docs = await collection.find({ companyId }).toArray();
      if (!docs.length) continue;

      const sanitizedName = collName.replace(/[^a-zA-Z0-9]/g, "_");
      const worksheet = workbook.addWorksheet(sanitizedName.slice(0, 31)); // Excel limit

      // Define allowed fields per collection
      const fieldConfig = getFieldConfig(collName);
      const mainFields = fieldConfig.main;

      // Add header
      worksheet.addRow(mainFields);

      // Process each document
      docs.forEach((doc, docIndex) => {
        const row = [];

        mainFields.forEach((field) => {
          const value = doc[field];

          // Handle objects → create detail sheet
          if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0) {
            const detailKey = `${collName}_${field}_detail_${docIndex}`;
            if (!detailSheetMap[detailKey]) {
              detailSheetMap[detailKey] = createObjectDetailSheet(workbook, collName, doc, field, mainFields, docIndex);
            }
            const sheetName = detailSheetMap[detailKey].name;
            row.push({
              text: "View Detail",
              hyperlink: `#'${sheetName}'!A1`,
              tooltip: `View full ${field}`
            });
          }
          // Handle arrays
          else if (Array.isArray(value) && value.length > 0) {
            const detailKey = `${collName}_${field}_detail_${docIndex}`;
            if (!detailSheetMap[detailKey]) {
              detailSheetMap[detailKey] = createArrayDetailSheet(workbook, collName, doc, field, mainFields, docIndex);
            }
            const sheetName = detailSheetMap[detailKey].name;
            row.push({
              text: "View Detail",
              hyperlink: `#'${sheetName}'!A1`,
              tooltip: `View ${value.length} ${field}`
            });
          }
          // Normal value
          else {
            row.push(value ?? "");
          }
        });

        const rowObj = worksheet.addRow(row);

        // Apply hyperlinks
        mainFields.forEach((field, colIdx) => {
          const cell = rowObj.getCell(colIdx + 1);
          const val = doc[field];
          if ((Array.isArray(val) && val.length > 0) || (val && typeof val === "object" && Object.keys(val).length > 0)) {
            cell.font = { color: { argb: "FF0000FF" }, underline: true };
            cell.value = row[colIdx]; // already has hyperlink
          }
        });
      });

      // Auto-size columns
      worksheet.columns = mainFields.map((key) => ({
        header: key,
        key,
        width: Math.max(key.length + 2, 15),
      }));
    }

    // Write file
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

// Helper: Define which fields to show per collection
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

// Create detail sheet for object field (with parent row context)
function createObjectDetailSheet(workbook, collName, doc, fieldName, mainFields, docIndex) {
  const safeName = `${collName}_${fieldName}_detail_${docIndex}`.slice(0, 31);
  let sheet = workbook.getWorksheet(safeName);
  if (sheet) return { name: safeName };

  sheet = workbook.addWorksheet(safeName);

  // Add parent row context header
  sheet.addRow([`Full Details for ${collName} Row ${docIndex + 1}`]);
  mainFields.forEach(field => {
    if (typeof doc[field] !== "object" || doc[field] == null) { // Only simple fields
      sheet.addRow([field, doc[field] ?? ""]);
    }
  });
  sheet.addRow([]); // Spacer

  // Now the specific object field
  const data = doc[fieldName];
  if (!data || typeof data !== "object") return { name: safeName };

  sheet.addRow([`Expanded: ${fieldName}`]);
  const keys = Object.keys(data).filter(k => !k.startsWith("__") && k !== "_id");
  sheet.addRow(["Field", "Value"]);
  keys.forEach(key => {
    const val = data[key];
    const displayVal = Array.isArray(val) ? JSON.stringify(val) : (val ?? "");
    sheet.addRow([key, displayVal]);
  });

  sheet.columns = [
    { width: 25 }, { width: 40 }
  ];

  return { name: safeName };
}

// Create detail sheet for array field (with parent row context)
function createArrayDetailSheet(workbook, collName, doc, fieldName, mainFields, docIndex) {
  const safeName = `${collName}_${fieldName}_detail_${docIndex}`.slice(0, 31);
  let sheet = workbook.getWorksheet(safeName);
  if (sheet) return { name: safeName };

  sheet = workbook.addWorksheet(safeName);

  // Add parent row context header
  sheet.addRow([`Full Details for ${collName} Row ${docIndex + 1}`]);
  mainFields.forEach(field => {
    if (typeof doc[field] !== "object" || doc[field] == null) { // Only simple fields
      sheet.addRow([field, doc[field] ?? ""]);
    }
  });
  sheet.addRow([]); // Spacer

  // Now the specific array field
  const array = doc[fieldName];
  sheet.addRow([`Expanded: ${fieldName} (${array.length} items)`]);
  sheet.addRow([]);

  if (array.length === 0) {
    sheet.addRow(["No items"]);
    return { name: safeName };
  }

  // If array of objects → show as table
  if (array.every(item => item && typeof item === "object")) {
    const keys = [...new Set(array.flatMap(Object.keys))].filter(k => !k.startsWith("__") && k !== "_id");
    sheet.addRow(keys);

    array.forEach(item => {
      const row = keys.map(k => {
        const val = item[k];
        return val ?? "";
      });
      sheet.addRow(row);
    });
    sheet.columns = keys.map(() => ({ width: 20 }));
  } else {
    // Primitive array
    array.forEach((item, i) => {
      sheet.addRow([i + 1, item]);
    });
    sheet.columns = [{ width: 10 }, { width: 30 }];
  }

  return { name: safeName };
}