import crypto from "crypto";

export const COINPAYMENTS_CONFIG = {
  merchantId: process.env.COINPAYMENTS_MERCHANT_ID!,
  ipnSecret: process.env.COINPAYMENTS_IPN_SECRET!,
  currency: "USD",
  amount: "0.99",
  itemName: "ContextSummarizer Monthly Subscription",
  itemNumber: "MONTHLY_SUB",
};

/**
 * Generate CoinPayments payment button URL
 */
export function generatePaymentButtonUrl(
  userId: string,
  userEmail: string
): string {
  const params = new URLSearchParams({
    cmd: "_pay_simple",
    reset: "1",
    merchant: COINPAYMENTS_CONFIG.merchantId,
    item_name: COINPAYMENTS_CONFIG.itemName,
    item_number: COINPAYMENTS_CONFIG.itemNumber,
    currency: COINPAYMENTS_CONFIG.currency,
    amountf: COINPAYMENTS_CONFIG.amount,
    want_shipping: "0",
    custom: userId, // Pass userId for webhook processing
    success_url: `${process.env.NEXTAUTH_URL}/subscription/success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/subscription`,
    ipn_url: `${process.env.NEXTAUTH_URL}/api/webhooks/coinpayments`,
  });

  return `https://www.coinpayments.net/index.php?${params.toString()}`;
}

/**
 * Verify IPN (Instant Payment Notification) from CoinPayments
 */
export function verifyIPN(
  ipnSecret: string,
  merchantId: string,
  receivedHmac: string,
  postData: string
): boolean {
  // Verify merchant ID matches
  const params = new URLSearchParams(postData);
  if (params.get("merchant") !== merchantId) {
    return false;
  }

  // Verify HMAC signature
  const hmac = crypto
    .createHmac("sha512", ipnSecret)
    .update(postData)
    .digest("hex");

  return hmac === receivedHmac;
}

/**
 * Parse IPN data from CoinPayments webhook
 */
export interface IPNData {
  txnId: string;
  status: number; // 0 = pending, 1 = confirmed, 2 = complete, -1 = cancelled/timeout
  statusText: string;
  currency1: string; // Original currency (USD)
  amount1: string; // Original amount (0.99)
  currency2: string; // Crypto currency used
  amount2: string; // Crypto amount
  custom: string; // userId we passed
  email: string;
  fee: string;
}

export function parseIPNData(postData: URLSearchParams): IPNData {
  return {
    txnId: postData.get("txn_id") || "",
    status: parseInt(postData.get("status") || "0"),
    statusText: postData.get("status_text") || "",
    currency1: postData.get("currency1") || "",
    amount1: postData.get("amount1") || "",
    currency2: postData.get("currency2") || "",
    amount2: postData.get("amount2") || "",
    custom: postData.get("custom") || "", // userId
    email: postData.get("email") || "",
    fee: postData.get("fee") || "",
  };
}

/**
 * Check if payment is complete
 */
export function isPaymentComplete(status: number): boolean {
  // Status >= 100 means payment is complete or confirmed
  // Status 2 = Complete
  // Status >= 100 = Completed with confirmations
  return status >= 2 || status >= 100;
}
