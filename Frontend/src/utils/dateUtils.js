export const formatTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toISOString().split('T')[0];
};