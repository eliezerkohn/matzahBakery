export const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');
