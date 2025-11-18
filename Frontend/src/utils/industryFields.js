// utils/industryFields.js

export const Industries = [
  'Restaurant',
  'Fashion',
  'Pharmacy',
  'Electronics',
  'General Shop',
];

// Field visibility and behavior rules by industry and product type
export const getFieldRules = (industry) => {
  const i = industry?.toLowerCase();
  const baseRules = {
    global: {
      alwaysHidden: ['productType'],
      required: ['productName']
    }
  };

  switch (i) {
    case 'restaurant':
      return {
        ...baseRules,
        raw: {
          hidden: ['ingredients', 'preparationTime', 'isVegetarian', 'spiceLevel'],
          required: ['costPrice', 'quantity', 'SKU', 'category', 'subCategoryName']
        },
        prepared: {
          hidden: ['costPrice', 'quantity', 'SKU', 'category', 'subCategoryName', 'vendor'],
          required: ['sellingPrice', 'preparationTime']
        }
      };
    
    case 'fashion':
      return {
        ...baseRules,
        common: {
          required: ['category', 'brand', 'size', 'color']
        }
      };
    
    case 'pharmacy':
      return {
        ...baseRules,
        common: {
          required: ['category', 'brand', 'dosage', 'form', 'expiryDate']
        }
      };
    
    case 'electronics':
      return {
        ...baseRules,
        common: {
          required: ['category', 'brand', 'model', 'warranty']
        }
      };
    
    case 'general shop':
      return {
        ...baseRules,
        common: {
          required: ['category', 'brand', 'weight']
        }
      };
    
    default:
      return baseRules;
  }
};

// Filter fields based on industry and product type
export const filterFieldsByProductType = (fields, industry, productType) => {
  const rules = getFieldRules(industry);
  const i = industry?.toLowerCase();
  
  return fields.filter(field => {
    const fieldName = field.name;
    
    if (rules.global?.alwaysHidden?.includes(fieldName)) {
      return false;
    }
    
    if (i === 'restaurant') {
      if (productType === 'raw') {
        return !rules.raw?.hidden?.includes(fieldName);
      } else if (productType === 'prepared') {
        return !rules.prepared?.hidden?.includes(fieldName);
      }
    }
    
    return true;
  });
};

// Get required fields for validation
export const getRequiredFields = (industry, productType, hasCategories) => {
  const rules = getFieldRules(industry);
  const required = [...(rules.global?.required || [])];
  
  if (industry?.toLowerCase() === 'restaurant') {
    if (productType === 'raw') {
      required.push(...(rules.raw?.required || []));
    } else if (productType === 'prepared') {
      required.push(...(rules.prepared?.required || []));
    }
  } else {
    required.push(...(rules.common?.required || []));
  }
  
  // Remove category if categories feature is disabled
  if (!hasCategories) {
    return required.filter(field => field !== 'category');
  }
  
  return required;
};

// Main field definitions
export const getProductFields = (industry) => {
  const i = industry?.toLowerCase();
  
  const baseFields = [
    {
      name: 'productName',
      label: 'Name',
      type: 'text',
      placeholder: 'Enter Product Name',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter description of the product',
    },
    {
      name: 'SKU',
      label: 'SKU',
      type: 'text',
      placeholder: 'Enter SKU (optional)',
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
      name: 'vendor',
      label: 'Vendor',
      type: 'select-vendor',
      placeholder: 'Select vendor',
    }
  ];

  const industrySpecificFields = {
    restaurant: [
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
    ],

    fashion: [
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
    ],

    pharmacy: [
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        placeholder: 'Enter brand name',
      },
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
        options: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'],
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
      },
    ],

    electronics: [
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
    ],

    'general shop': [
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
    ]
  };

  const specificFields = industrySpecificFields[i] || [];
  return [...baseFields, ...specificFields];
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
    default:
      return [];
  }
};