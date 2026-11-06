const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatPrice = (value) => priceFormatter.format(value || 0);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  // Badge style for an order status
export const statusVariant = (status) => {
  if (status === "Cancelled") return "destructive";
  if (status === "Delivered") return "default";
  return "secondary";
};

// "ab12cd34" style short id for display
export const shortOrderId = (id) => id.slice(-8).toUpperCase();