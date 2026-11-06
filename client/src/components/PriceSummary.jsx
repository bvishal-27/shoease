import { formatPrice } from "@/lib/format";

export default function PriceSummary({
  itemsPrice,
  shippingPrice,
  taxPrice,
  totalPrice,
}) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Items</span>
        <span>{formatPrice(itemsPrice)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Shipping</span>
        <span>{shippingPrice === 0 ? "Free" : formatPrice(shippingPrice)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tax (18% GST)</span>
        <span>{formatPrice(taxPrice)}</span>
      </div>
      {shippingPrice > 0 && (
        <p className="text-xs text-muted-foreground">
          Free shipping on items above ₹1,000
        </p>
      )}
      <div className="flex justify-between border-t pt-3 text-base font-bold">
        <span>Total</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>
    </div>
  );
}