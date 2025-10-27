// utils/industryFields.js

export const Industries =[
  "Fashion",
  "Pharmacy",
  "Restaurant",
]

// ========== PRODUCT FIELDS ==========
const getProductFields = (industryName) => {
  switch (industryName?.toLowerCase()) {
    case "food":
    case "restaurant":
      return [
        { name: "size", label: "Size (Small/Medium/Large)", type: "text" },
        { name: "addons", label: "Add-ons (comma separated)", type: "text" },
      ];

    case "fashion":
    case "clothing":
      return [
        { name: "brand", label: "Brand", type: "text" },
        { name: "size", label: "Size", type: "text" },
        { name: "color", label: "Color", type: "text" },
      ];

    case "pharmacy":
    case "medical":
      return [
        { name: "genericName", label: "Generic Name", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "expiryDate", label: "Expiry Date", type: "date" },
        { name: "manufacturer", label: "Manufacturer", type: "text" },
      ];

    default:
      return [
      ];
  }
};

// ========== BILLING FIELDS ==========
const getBillingFields = (industryName) => {
  switch (industryName?.toLowerCase()) {
    case "food":
    case "restaurant":
      return [
        { name: "tableNo", label: "Table No", type: "text" },
        { name: "waiterName", label: "Waiter", type: "text" },
        { name: "orderType", label: "Order Type", type: "select", options: ["Dine-In", "Takeaway", "Delivery"] },
          ];

    case "fashion":
    case "clothing":
      return [
      ];

    case "pharmacy":
    case "medical":
      return [
        { name: "doctorName", label: "Doctor Name", type: "text" },
      ];

    default:
      return [
      ];
  }
};
