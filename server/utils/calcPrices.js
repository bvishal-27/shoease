export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Shipping: free above ₹1000, otherwise ₹49. Tax: 18% GST.
export const calcPrices = (itemsPrice) => {
  const items = round2(itemsPrice);
  const shippingPrice = items === 0 || items > 1000 ? 0 : 49;
  const taxPrice = round2(items * 0.18);
  const totalPrice = round2(items + shippingPrice + taxPrice);

  return { itemsPrice: items, shippingPrice, taxPrice, totalPrice };
};