// src/controllers/companyExcelController.js
import ExcelJS from "exceljs";
import { MongoClient } from "mongodb";
// import Company from '../models/company.model.js';

const MONGO_URI = process.env.MONGO_URI;

export const exportCompanyExcel = async (req, res) => {
  const { companyId } = req.query;
  const user = req.user; // attached by auth middleware
  console.log("the companyId: ", companyId);
  // ------------------------------------------------------------
  // 1. Permission check
  // ------------------------------------------------------------
  // const isSuperAdmin = user?.role === 'superadmin';
  // console.log("teh e ")
  // if (!isSuperAdmin) {
  //   const company = await Company.findOne({ companyId: companyId, owner: user.userId });
  //   if (!company) return res.status(403).json({ message: 'Forbidden' });
  // }

  let client;
  try {
    // ------------------------------------------------------------
    // 2. Connect once
    // ------------------------------------------------------------
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();

    // ------------------------------------------------------------
    // 3. Find **all** collections that contain at least one doc
    //     with `companyId` field equal to the requested id
    // ------------------------------------------------------------
    const allColls = await db.listCollections().toArray();
    const relevantColls = [];

    for (const collInfo of allColls) {
      const coll = db.collection(collInfo.name);
      const sample = await coll.findOne({ companyId: companyId });
      if (sample) {
        relevantColls.push({ name: collInfo.name, collection: coll });
      }
    }

    if (relevantColls.length === 0) {
      return res
        .status(404)
        .json({ message: "No data found for this company" });
    }

    // ------------------------------------------------------------
    // 4. Build Excel workbook
    // ------------------------------------------------------------
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "YourApp";
    workbook.created = new Date();

    for (const { name: sheetName, collection } of relevantColls) {
      // fetch *all* docs for this collection
      const docs = await collection.find({ companyId }).toArray();
      if (!docs.length) continue; // safety

      const worksheet = workbook.addWorksheet(sheetName);

      // ---- Header (keys of first document, skip internal fields) ----
      const first = docs[0];
      const keys = Object.keys(first).filter(
        (k) => !k.startsWith("__") && k !== "_id"
      );

      worksheet.addRow(keys); // header row

      // ---- Data rows ------------------------------------------------
      docs.forEach((doc) => {
        const row = keys.map((k) => {
          const val = doc[k];
          // format Date objects nicely
          if (val instanceof Date) return val.toISOString().split("T")[0];
          return val ?? "";
        });
        worksheet.addRow(row);
      });

      // ---- Auto-size columns ----------------------------------------
      worksheet.columns = keys.map((key) => ({
        header: key,
        key,
        width: Math.max(key.length, 12),
      }));
    }

    // ------------------------------------------------------------
    // 5. Stream the file back to the client
    // ------------------------------------------------------------
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="company-${companyId}-export-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`
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
