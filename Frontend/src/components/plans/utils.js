// components/utils.js
export const capFirst = (s = '') =>
  s.trim().replace(/^./, (c) => c.toUpperCase());

export const getTypeColor = (type) => {
  switch (type) {
    case 'Basic':
      return 'bg-blue-100 text-blue-800';
    case 'Premium':
      return 'bg-purple-100 text-purple-800';
    case 'Enterprise':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
