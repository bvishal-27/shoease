import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PriceSummary from "@/components/PriceSummary";
import { createOrder } from "@/api/orderApi";
import { fetchCart, resetCart } from "@/redux/cartSlice";
import { formatPrice } from "@/lib/format";

const ADDRESS_KEY = "shopease_address";

const METHODS = [
  {
    value: "COD",
    title: "Cash on delivery",
    desc: "Pay when your order arrives",
  },
  {
    value: "Razorpay",
    title: "Pay online (Razorpay)",
    desc: "Cards, UPI and netbanking.  You pay in a secure popup",
  },
];

const loadSavedAddress = () => {
  try {
    return JSON.parse(localStorage.getItem(ADDRESS_KEY)) || {};
  } catch {
    return {};
  }
};

const validate = (f) => {
  if (!f.fullName.trim()) return "Please enter your full name";
  if (!/^\d{10}$/.test(f.phone.trim())) return "Phone number must be 10 digits";
  if (!f.address.trim()) return "Please enter your address";
  if (!f.city.trim()) return "Please enter your city";
  if (!f.state.trim()) return "Please enter your state";
  if (!/^\d{6}$/.test(f.postalCode.trim())) return "Postal code must be 6 digits";
  return null;
};

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);

  const [form, setForm] = useState(() => ({
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    ...loadSavedAddress(), // a saved address from the last order wins
  }));
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Wait for the cart to load before deciding it is empty
  if (!cart.loaded) {
    return <p className="py-8 text-center text-muted-foreground">Loading...</p>;
  }

  // Nothing to buy: back to the cart (but not right after we placed an order)
  if (!placed && cart.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validate(form);
    if (error) return toast.error(error);

    // send trimmed values
    const shippingAddress = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );

    try {
      setSubmitting(true);
      const order = await createOrder({ shippingAddress, paymentMethod });

      localStorage.setItem(ADDRESS_KEY, JSON.stringify(shippingAddress));
      setPlaced(true);
      dispatch(resetCart()); // the server already emptied the cart
      toast.success("Order placed!");
      navigate(`/order/${order._id}`, {
        replace: true,
        state: { justPlaced: true, autoPay: paymentMethod === "Razorpay" },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place order");
      dispatch(fetchCart()); // refresh the cart in case stock changed
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Shipping address */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-bold">Shipping address</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="House no, street, area"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit PIN code"
                  value={form.postalCode}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value="India" disabled />
              </div>
            </div>
          </section>

          {/* Payment method */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-bold">Payment method</h2>

            <div className="mt-4 space-y-3" role="radiogroup">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition ${
                    paymentMethod === m.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span
                    className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                      paymentMethod === m.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  />
                  <span>
                    <span className="block font-medium">{m.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {m.desc}
                    </span>
                  </span>
                </button>
              ))}
            </div>

                        {paymentMethod === "Razorpay" && (
              <p className="mt-3 text-sm text-muted-foreground">
                The payment popup opens right after you place the order. If you close
                it, you can pay later from the order page.
              </p>
            )}
          </section>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-xl border bg-card p-6 lg:sticky lg:top-6">
          <h2 className="mb-4 text-lg font-bold">Order summary</h2>

          <ul className="mb-4 space-y-3">
            {cart.items.map((item) => (
              <li key={item.product} className="flex items-center gap-3 text-sm">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-12 w-12 rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="line-clamp-1 font-medium">{item.name}</p>
                  <p className="text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <span>{formatPrice(item.subtotal)}</span>
              </li>
            ))}
          </ul>

          <PriceSummary {...cart} />

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
            {submitting ? "Placing order..." : "Place order"}
          </Button>
        </aside>
      </form>
    </div>
  );
}