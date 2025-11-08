export const Industries = [
  'Restaurant',
  'Fashion',
  'Pharmacy',
  'Electronics',
  'General Shop',
];

export const getIndustryFields = (industry) => {
  const name = (industry || '').toLowerCase();

  switch (name) {
    case 'restaurant':
      return [
        // { name: 'size', label: 'Size (Small/Medium/Large)', type: 'text' },
        { name: 'addons', label: 'Add-ons (comma separated)', type: 'text' },
        { name: 'tableNo', label: 'Table No', type: 'text' },
        { name: 'waiterName', label: 'Waiter Name', type: 'text' },
        { name: 'waiterId', label: 'Waiter Id', type: 'text' },
        {
          name: 'specialInstructions',
          label: 'Special Instructions',
          type: 'textarea',
        },
        {
          name: 'orderType',
          label: 'Order Type',
          type: 'select',
          options: ['Dine-In', 'Takeaway', 'Delivery'],
        },
        // {
        //   name: 'orderStatus',
        //   label: 'Order Status',
        //   type: 'select',
        //   options: [
        //     'pending',
        //     'cooking',
        //     'ready',
        //     'collected',
        //     'handed_over',
        //     'served',
        //   ],
        // },
      ];

    case 'fashion':
      return [
        { name: 'brand', label: 'Brand', type: 'text' },
        { name: 'size', label: 'Size', type: 'text' },
        { name: 'color', label: 'Color', type: 'text' },
        {
          name: 'orderType',
          label: 'Order Type',
          type: 'select',
          options: ['In-Store', 'Online'],
        },
        // {
        //   name: 'orderStatus',
        //   label: 'Order Status',
        //   type: 'select',
        //   options: [
        //     'pending',
        //     'shipped',
        //     'delivered',
        //     'cancelled',
        //     'returned_request',
        //     'returned_accept',
        //     'returned_reject',
        //   ],
        //   dependsOn: { field: 'orderType', value: 'Online' },
        // },
      ];

    case 'pharmacy':
      return [
        // { name: 'doctorName', label: 'Doctor Name', type: 'text' },
        {
          name: 'prescriptionRequired',
          label: 'Prescription Required',
          type: 'checkbox',
        },
        { name: 'dosage', label: 'Dosage', type: 'text' },
        {
          name: 'form',
          label: 'Form',
          type: 'text',
        },
        { name: 'brand', label: 'Brand', type: 'text' },
        { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
        {
          name: 'orderType',
          label: 'Order Type',
          type: 'select',
          options: ['In-Store', 'Online'],
        },

        // {
        //   name: 'orderStatus',
        //   label: 'Order Status',
        //   type: 'select',
        //   options: [
        //     'pending',
        //     'shipped',
        //     'delivered',
        //     'cancelled',
        //     'returned_request',
        //     'returned_accept',
        //     'returned_reject',
        //   ],
        //  dependsOn: { field: 'orderType', value: 'Online' },
        // },
      ];

    case 'electronics':
      return [
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
