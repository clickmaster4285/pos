// utils/industryFields.js
export const Industries = ["Restaurant", "Fashion", "Pharmacy", "Electronics", "General"];

export const getProductFields = (industry) => {
  const i = industry?.toLowerCase();
  switch (i) {
    case "restaurant":
      return [
        { name: "sellingPrice", label: "Sell Price", type: "number", min: 1 },
      ];
      case "fashion":
        return [
          { name: "brand", label: "Brand", type: "text" },
          { name: "color", label: "Color", type: "text" },
          { name: "material", label: "Material", type: "text" },
          { name: "costPrice", label: "Cost Price", type: "number", min: 1 },
          { name: "quantity", label: "Quantity", type: "number", min: 1 },
        { name: "sellingPrice", label: "Sell Price", type: "number", min: 1 },
        { name: "vendor", label: "Vendor", type: "select", options: [] },
        { name: "SKU", label: "Sell Price", type: "number", min: 1 },
        { name: "SKU", label: "Sell Price", type: "number", min: 1 },

      ];
    case "pharmacy":
      return [
        { name: "genericName", label: "Generic Name", type: "text" },
        { name: "dosage", label: "Dosage", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "costPrice", label: "Cost Price", type: "number", min: 1 },
        { name: "quantity", label: "Quantity", type: "number", min: 1 },
        { name: "sellingPrice", label: "Sell Price", type: "number", min: 1 },
        { name: "vendor", label: "Vendor", type: "select", options: [] },

      ];
    default:
      return [];
  }
};

export const getIngredientFields = (industry) => {
  const i = industry?.toLowerCase();
  switch (i) {
    case "restaurant":
      return [
        { name: "storage", label: "Storage", type: "select", options: ["room", "fridge", "freezer"] },

      ];
    case "pharmacy":
      return [
        { name: "activeIngredient", label: "Active Ingredient", type: "text" },
        { name: "purity", label: "Purity %", type: "number", min: 0, max: 100 },
      ];
    default:
      return [];
  }
};