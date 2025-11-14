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
          placeholder: 'Enter selling price',
        },
        {
          name: 'ingredients',
          label: 'Ingredients',
          type: 'ingredients-array',
          // rendered via custom UI, so no placeholder needed
        },
        {
          name: 'preparationTime',
          label: 'Preparation Time (min)',
          type: 'number',
          min: 1,
          placeholder: 'e.g. 15',
        },
        {
          name: 'isVegetarian',
          label: 'Vegetarian',
          type: 'checkbox',
        },
        {
          name: 'spiceLevel',
          label: 'Spice Level',
          type: 'select',
          options: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
          placeholder: 'Select spice level',
        },
      ];

    case 'fashion':
      return [
        {
          name: 'category',
          label: 'Category',
          type: 'select-category',
          placeholder: 'Select category',
        },
        {
          name: 'subCategoryName',
          label: 'Sub Category',
          type: 'select',
          options: [],
          placeholder: 'Select sub-category',
        },
        {
          name: 'costPrice',
          label: 'Cost Price',
          type: 'number',
          min: 1,
          placeholder: 'Enter cost price',
        },
        {
          name: 'sellingPrice',
          label: 'Selling Price',
          type: 'number',
          min: 1,
          placeholder: 'Enter selling price',
        },
        {
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          min: 1,
          placeholder: 'Enter stock quantity',
        },
        {
          name: 'SKU',
          label: 'SKU',
          type: 'text',
          placeholder: 'Enter SKU (optional)',
        },
        {
          name: 'vendor',
          label: 'Vendor',
          type: 'select-vendor',
          placeholder: 'Select vendor',
        },
        {
          name: 'brand',
          label: 'Brand',
          type: 'text',
          placeholder: 'e.g. Nike, Zara',
        },
        {
          name: 'color',
          label: 'Color',
          type: 'text',
          placeholder: 'e.g. Black, Red',
        },
        {
          name: 'material',
          label: 'Material',
          type: 'text',
          placeholder: 'e.g. Cotton, Denim',
        },
        {
          name: 'size',
          label: 'Size',
          type: 'select',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          placeholder: 'Select size',
        },
        {
          name: 'careInstructions',
          label: 'Care Instructions',
          type: 'textarea',
          placeholder: 'e.g. Hand wash only, Do not tumble dry',
        },
      ];

    case 'pharmacy':
      return [
        {
          name: 'category',
          label: 'Category',
          type: 'select-category',
          placeholder: 'Select category',
        },
        {
          name: 'subCategoryName',
          label: 'Sub Category',
          type: 'select',
          options: [],
          placeholder: 'Select sub-category',
        },
        {
          name: 'costPrice',
          label: 'Cost Price',
          type: 'number',
          min: 1,
          placeholder: 'Enter cost price',
        },
        {
          name: 'sellingPrice',
          label: 'Selling Price',
          type: 'number',
          min: 1,
          placeholder: 'Enter selling price',
        },
        {
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          min: 1,
          placeholder: 'Enter stock quantity',
        },
        {
          name: 'SKU',
          label: 'SKU',
          type: 'text',
          placeholder: 'Enter SKU (optional)',
        },
        {
          name: 'vendor',
          label: 'Vendor',
          type: 'select-vendor',
          placeholder: 'Select vendor',
        },
        {
          name: 'brand',
          label: 'Brand',
          type: 'text',
          placeholder: 'Enter brand name',
        },
        // { name: "activeIngredient", label: "Active Ingredient", type: "text" },
        {
          name: 'dosage',
          label: 'Dosage',
          type: 'text',
          placeholder: 'e.g. 500mg, 10ml',
        },
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
          placeholder: 'Select form',
        },
        {
          name: 'prescriptionRequired',
          label: 'Prescription Required',
          type: 'checkbox',
        },
        {
          name: 'expiryDate',
          label: 'Expiry Date',
          type: 'date',
          // date inputs don’t use placeholder well across browsers
        },
      ];

    case 'electronics':
      return [
        {
          name: 'category',
          label: 'Category',
          type: 'select-category',
          placeholder: 'Select category',
        },
        {
          name: 'subCategoryName',
          label: 'Sub Category',
          type: 'select',
          options: [],
          placeholder: 'Select sub-category',
        },
        {
          name: 'costPrice',
          label: 'Cost Price',
          type: 'number',
          min: 1,
          placeholder: 'Enter cost price',
        },
        {
          name: 'sellingPrice',
          label: 'Selling Price',
          type: 'number',
          min: 1,
          placeholder: 'Enter selling price',
        },
        {
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          min: 1,
          placeholder: 'Enter stock quantity',
        },
        {
          name: 'SKU',
          label: 'SKU',
          type: 'text',
          placeholder: 'Enter SKU (optional)',
        },
        {
          name: 'vendor',
          label: 'Vendor',
          type: 'select-vendor',
          placeholder: 'Select vendor',
        },
        {
          name: 'brand',
          label: 'Brand',
          type: 'text',
          placeholder: 'e.g. Samsung, Apple',
        },
        {
          name: 'model',
          label: 'Model',
          type: 'text',
          placeholder: 'e.g. iPhone 15, Galaxy S24',
        },
        {
          name: 'warranty',
          label: 'Warranty (months)',
          type: 'number',
          min: 0,
          placeholder: 'e.g. 12',
        },
        {
          name: 'voltage',
          label: 'Voltage',
          type: 'text',
          placeholder: 'e.g. 220V, 110V',
        },
        {
          name: 'powerConsumption',
          label: 'Power Consumption',
          type: 'text',
          placeholder: 'e.g. 65W, 1500W',
        },
        {
          name: 'color',
          label: 'Color',
          type: 'text',
          placeholder: 'e.g. Black, Silver',
        },
        {
          name: 'specifications',
          label: 'Specifications',
          type: 'textarea',
          placeholder: 'e.g. RAM, storage, processor details…',
        },
      ];

    case 'general shop':
      return [
        {
          name: 'category',
          label: 'Category',
          type: 'select-category',
          placeholder: 'Select category',
        },
        {
          name: 'subCategoryName',
          label: 'Sub Category',
          type: 'select',
          options: [],
          placeholder: 'Select sub-category',
        },
        {
          name: 'costPrice',
          label: 'Cost Price',
          type: 'number',
          min: 1,
          placeholder: 'Enter cost price',
        },
        {
          name: 'sellingPrice',
          label: 'Selling Price',
          type: 'number',
          min: 1,
          placeholder: 'Enter selling price',
        },
        {
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          min: 1,
          placeholder: 'Enter stock quantity',
        },
        {
          name: 'SKU',
          label: 'SKU',
          type: 'text',
          placeholder: 'Enter SKU (optional)',
        },
        {
          name: 'vendor',
          label: 'Vendor',
          type: 'select-vendor',
          placeholder: 'Select vendor',
        },
        {
          name: 'brand',
          label: 'Brand',
          type: 'text',
          placeholder: 'Enter brand name',
        },
        {
          name: 'weight',
          label: 'Weight (kg)',
          type: 'number',
          min: 0.01,
          step: 0.01,
          placeholder: 'e.g. 0.50',
        },
        {
          name: 'dimensions',
          label: 'Dimensions (LxWxH cm)',
          type: 'text',
          placeholder: 'e.g. 10 x 5 x 3',
        },
        {
          name: 'shelfLife',
          label: 'Shelf Life (days)',
          type: 'number',
          min: 1,
          placeholder: 'e.g. 180',
        },
        {
          name: 'storageConditions',
          label: 'Storage Conditions',
          type: 'textarea',
          placeholder: 'e.g. Keep in a cool, dry place',
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
          placeholder: 'Select storage type',
        },
      ];
    case 'pharmacy':
      return [
        {
          name: 'activeIngredient',
          label: 'Active Ingredient',
          type: 'text',
          placeholder: 'e.g. Paracetamol, Ibuprofen',
        },
        {
          name: 'purity',
          label: 'Purity %',
          type: 'number',
          min: 0,
          max: 100,
          placeholder: 'e.g. 99.5',
        },
      ];
    default:
      return [];
  }
};
