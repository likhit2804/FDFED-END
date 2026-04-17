let razorpayScriptPromise = null;

export function loadRazorpayCheckout() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout."));
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export async function openRazorpayCheckout({
  key,
  amount,
  currency = "INR",
  orderId,
  name,
  description,
  prefill,
  notes,
  theme = { color: "#2563eb" },
}) {
  const Razorpay = await loadRazorpayCheckout();

  return new Promise((resolve, reject) => {
    const instance = new Razorpay({
      key,
      amount,
      currency,
      order_id: orderId,
      name,
      description,
      prefill,
      notes,
      theme,
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment was cancelled.")),
      },
    });

    instance.open();
  });
}
