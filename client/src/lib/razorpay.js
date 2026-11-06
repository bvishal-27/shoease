const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

// Resolves true when window.Razorpay is ready, false if the script failed to load
export const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    let script = document.querySelector(`script[src="${SCRIPT_URL}"]`);

    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_URL;
      document.body.appendChild(script);
    }

    script.addEventListener("load", () => resolve(true));
    script.addEventListener("error", () => resolve(false));
  });