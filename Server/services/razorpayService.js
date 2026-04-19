import crypto from "crypto";
import axios from "axios";

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
  try {
    const response = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount: amountInPaise,
        currency,
        receipt,
        notes,
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.error?.description ||
      error.response?.data?.message ||
      error.message ||
      "Failed to create Razorpay order";
    throw new Error(message);
  }
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
