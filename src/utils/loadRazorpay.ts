/**
 * Dynamically loads the official Razorpay Checkout SDK script
 * https://checkout.razorpay.com/v1/checkout.js
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && typeof (window as any).Razorpay === "function") {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById("razorpay-checkout-js") as HTMLScriptElement | null;
    if (existingScript) {
      if (typeof (window as any).Razorpay === "function") {
        resolve(true);
        return;
      }
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      resolve(typeof (window as any).Razorpay === "function");
    };
    script.onerror = (err) => {
      console.error("[Razorpay SDK] Failed to load checkout script from CDN:", err);
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
