// utils/industryFields.js
export const Industries = [
  'Restaurant',
  'Fashion',
  'Pharmacy',
  'Electronics',
  'General Shop',
];

export const getProductFields = (industry) => {
  const i = industry?.toLowerCase();
  switch (i) {
    case 'restaurant':
      return [
        {
          name: 'sellingPrice',
          label: 'Selling Price',
          type: 'number',
          min: 1,
          
        },
        {
          name: 'ingredients',
          label: 'Ingredients',
          type: 'ingredients-array',
        },
        {
          name: 'preparationTime',
          label: 'Preparation Time (min)',
          type: 'number',
          min: 1,
        },
        { name: 'isVegetarian', label: 'Vegetarian', type: 'checkbox' },
        {
          name: 'spiceLevel',
          label: 'Spice Level',
          type: 'select',
          options: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
        },
      ];

    case 'fashion':
      return [
        { name: 'category', label: 'Category', type: 'select-category' },
        {
          name: 'subCategoryName',
          label: 'Sub Category',
          type: 'select',
          options: [],
        },
        { name: 'costPrice', label: 'Cost Price', type: 'number', min: 1 },
        {
          name: 'sellingPrice',
          label: 'Selling Price',
          type: 'number',
          min: 1,
        },
        { name: 'quantity', label: 'Quantity', type: 'number', min: 1 },
        { name: 'SKU', label: 'SKU', type: 'text' },
        { name: 'vendor', label: 'Vendor', type: 'select-vendor' },
        { name: 'brand', label: 'Brand', type: 'text' },
        { name: 'color', label: 'Color', type: 'text' },
        { name: 'material', label: 'Material', type: 'text' },
        {
          name: 'size',
          label: 'Size',
          type: 'select',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        },
        {
          name: 'careInstructions',
          label: 'Care Instructions',
          type: 'textarea',
        },
      ];

    case 'pharmacy':
      return [
        { name: 'category', label: 'Category', type: 'select-category' },
        {
          name: 'subCategoryName',
          label: 'Sub Category',
          type: 'select',
          options: [],
        },
        { name: 'costPrice', label: 'Cost Price', type: 'number', min: 1 },
        {
          name: 'sellingPrice',
          label: 'Selling Price',
          type: 'number',
          min: 1,
        },
        { name: 'quantity', label: 'Quantity', type: 'number', min: 1 },
        { name: 'SKU', label: 'SKU', type: 'text' },
        { name: 'vendor', label: 'Vendor', type: 'select-vendor' },
        { name: 'brand', label: 'Brand', type: 'text' },
        // { name: "activeIngredient", label: "Active Ingredient", type: "text" },
        { name: 'dosage', label: 'Dosage', type: 'text' },
        {
          name: 'form',
          label: 'Form',
          type: 'select',
          options: [
            'Tablet',
            'Capsule',
            'Syrup',
            'Injection',
            'Ointment',
            'Drops',
          ],
        },
        {
          name: 'prescriptionRequired',
          label: 'Prescription Required',
          type: 'checkbox',
        },
        { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
      ];

    case 'electronics':
      return [
        { name: 'category', label: 'Category', type: 'select-category' },
        {
          name: 'subCategoryName',
          label: 'Sub Category',
          type: 'select',
          options: [],
        },
        { name: 'costPrice', label: 'Cost Price', type: 'number', min: 1 },
        {
          name: 'sellingPrice',
          label: 'Selling Price',
          type: 'number',
          min: 1,
        },
        { name: 'quantity', label: 'Quantity', type: 'number', min: 1 },
        { name: 'SKU', label: 'SKU', type: 'text' },
        { name: 'vendor', label: 'Vendor', type: 'select-vendor' },
        { name: 'brand', label: 'Brand', type: 'text' },
        { name: 'model', label: 'Model', type: 'text' },
        {
          name: 'warranty',
          label: 'Warranty (months)',
          type: 'number',
          min: 0,
        },
        { name: 'voltage', label: 'Voltage', type: 'text' },
        { name: 'powerConsumption', label: 'Power Consumption', type: 'text' },
        { name: 'color', label: 'Color', type: 'text' },
        { name: 'specifications', label: 'Specifications', type: 'textarea' },
      ];

    case 'general shop':
      return [
        { name: 'category', label: 'Category', type: 'select-category' },
        {
          name: 'subCategoryName',
          label: 'Sub Category',
          type: 'select',
          options: [],
        },
        { name: 'costPrice', label: 'Cost Price', type: 'number', min: 1 },
        {
          name: 'sellingPrice',
          label: 'Selling Price',
          type: 'number',
          min: 1,
        },
        { name: 'quantity', label: 'Quantity', type: 'number', min: 1 },
        { name: 'SKU', label: 'SKU', type: 'text' },
        { name: 'vendor', label: 'Vendor', type: 'select-vendor' },
        { name: 'brand', label: 'Brand', type: 'text' },
        {
          name: 'weight',
          label: 'Weight (kg)',
          type: 'number',
          min: 0.01,
          step: 0.01,
        },
        { name: 'dimensions', label: 'Dimensions (LxWxH cm)', type: 'text' },
        {
          name: 'shelfLife',
          label: 'Shelf Life (days)',
          type: 'number',
          min: 1,
        },
        {
          name: 'storageConditions',
          label: 'Storage Conditions',
          type: 'textarea',
        },
      ];

    default:
      return [];
  }
};

export const getIngredientFields = (industry) => {
  const i = industry?.toLowerCase();
  switch (i) {
    case 'restaurant':
      return [
        {
          name: 'storage',
          label: 'Storage',
          type: 'select',
          options: ['room', 'fridge', 'freezer'],
        },
      ];
    case 'pharmacy':
      return [
        { name: 'activeIngredient', label: 'Active Ingredient', type: 'text' },
        { name: 'purity', label: 'Purity %', type: 'number', min: 0, max: 100 },
      ];
    default:
      return [];
  }
};
