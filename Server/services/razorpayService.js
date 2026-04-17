import crypto from "crypto";

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }

  return { keyId, keySecret };
}

export function getRazorpayPublicConfig() {
  const { keyId } = getRazorpayCredentials();
  return { keyId };
}

export async function createRazorpayOrder({
  amountInPaise,
  receipt,
  notes = {},
  currency = "INR",
}) {
  const { keyId, keySecret } = getRazorpayCredentials();

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt,
      notes,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.description || data?.message || "Failed to create Razorpay order";
    throw new Error(message);
  }

  return data;
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}) {
  const { keySecret } = getRazorpayCredentials();

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}
