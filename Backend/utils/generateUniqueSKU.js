import indexModel from "../models/indexModel.js";

export const generateSKU = async (itemType, companyId, count = 1) => {
  if (count === 0) return [];
  try {
    const prefix = itemType.toUpperCase().slice(0, 3); // e.g., PAR for part, VEH for vehicle
    const companyPrefix = companyId.slice(-4).toUpperCase(); // Last 4 chars of companyId
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp

    const skus = [];
    let sequence = 1;

    // Helper function to check if SKU exists in Inventory
    const checkExists = async (SKU) => {
      const productExists = await indexModel.Product.findOne({SKU });
      return !!productExists; // true if found, false otherwise
    };

    while (skus.length < count) {
      const SKU = `${prefix}-${companyPrefix}-${timestamp}-${sequence.toString().padStart(3, "0")}`;
      const exists = await checkExists(SKU);

      if (!exists) {
        skus.push(SKU);
      }

      sequence++;
      if (sequence > 10000) {
        throw new Error(`Unable to generate ${count} unique SKUs after 10,000 attempts`);
      }
    }

    return skus;
  } catch (error) {
    throw new Error("Error generating SKUs: " + error.message);
  }
};