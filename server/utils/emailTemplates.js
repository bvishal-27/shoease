const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n || 0);

// Names and addresses come from users, so escape them before putting them in HTML
const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const shortId = (order) => order._id.toString().slice(-8).toUpperCase();

const orderLink = (order) =>
  `${process.env.CLIENT_URL || "http://localhost:5173"}/order/${order._id}`;

const layout = (title, intro, order) => {
  const a = order.shippingAddress;

  const rows = order.orderItems
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${esc(i.name)} × ${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${inr(i.price * i.quantity)}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#171717;">
    <h2 style="margin-bottom:4px;">${esc(title)}</h2>
    <p style="color:#555;margin-top:0;">${intro}</p>

    <p><strong>Order #${shortId(order)}</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows}
      <tr><td style="padding-top:12px;color:#555;">Items</td><td style="padding-top:12px;text-align:right;">${inr(order.itemsPrice)}</td></tr>
      <tr><td style="color:#555;">Shipping</td><td style="text-align:right;">${order.shippingPrice === 0 ? "Free" : inr(order.shippingPrice)}</td></tr>
      <tr><td style="color:#555;">Tax (18% GST)</td><td style="text-align:right;">${inr(order.taxPrice)}</td></tr>
      <tr><td style="padding-top:8px;font-weight:bold;">Total</td><td style="padding-top:8px;text-align:right;font-weight:bold;">${inr(order.totalPrice)}</td></tr>
    </table>

    <p style="margin-top:20px;"><strong>Shipping to</strong><br/>
      ${esc(a.fullName)}<br/>
      ${esc(a.address)}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.postalCode)}<br/>
      Phone: ${esc(a.phone)}
    </p>

    <p>
      <a href="${orderLink(order)}"
         style="display:inline-block;background:#171717;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
        View your order
      </a>
    </p>
    <p style="color:#888;font-size:12px;">ShopEase, a demo store.</p>
  </div>`;
};

export const orderConfirmationEmail = (order, user) => {
  const needsPayment = order.paymentMethod === "Razorpay" && !order.isPaid;

  const intro = `Hi ${esc(user.name)}, thank you for your order. ${
    needsPayment
      ? "Please complete the payment from your order page to confirm it."
      : "Payment method: Cash on delivery."
  }`;

  return {
    subject: `Order #${shortId(order)} placed`,
    html: layout("Your order is placed", intro, order),
  };
};

export const paymentReceivedEmail = (order, user) => ({
  subject: `Payment received for order #${shortId(order)}`,
  html: layout(
    "Payment received",
    `Hi ${esc(user.name)}, we have received your payment of ${inr(order.totalPrice)}. We will ship your order soon.`,
    order
  ),
});