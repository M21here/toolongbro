import crypto from "crypto";

// CoinPayments API v2 Configuration
export const COINPAYMENTS_CONFIG = {
  apiUrl: process.env.COINPAYMENTS_API_URL || "https://a-api.coinpayments.net",
  clientId: process.env.COINPAYMENTS_CLIENT_ID!,
  clientSecret: process.env.COINPAYMENTS_CLIENT_SECRET!,
  webhookSecret: process.env.COINPAYMENTS_WEBHOOK_SECRET || "",
  currency: "USD",
  amount: "0.99",
  itemName: "Too Long Bro Monthly Subscription",
  itemNumber: "MONTHLY_SUB",
};

/**
 * Generate timestamp in ISO-8601 format without milliseconds
 * Format: YYYY-MM-DDTHH:mm:ss
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().split('.')[0]; // Remove milliseconds
}

/**
 * Generate HMAC signature for CoinPayments API v2
 * Format: BOM + METHOD + URL + CLIENT_ID + TIMESTAMP + BODY
 * Returns Base64 encoded signature
 */
function generateSignature(
  method: string,
  url: string,
  timestamp: string,
  body: string = ""
): string {
  // BOM character + method + url + clientId + timestamp + body
  const message = `\ufeff${method}${url}${COINPAYMENTS_CONFIG.clientId}${timestamp}${body}`;

  return crypto
    .createHmac("sha256", COINPAYMENTS_CONFIG.clientSecret)
    .update(message)
    .digest("base64");
}

/**
 * Make authenticated request to CoinPayments API v2
 */
async function apiRequest(
  method: string,
  endpoint: string,
  body?: object
): Promise<any> {
  const url = `${COINPAYMENTS_CONFIG.apiUrl}/api/v1${endpoint}`;
  const timestamp = getTimestamp();
  const bodyStr = body ? JSON.stringify(body) : "";

  const signature = generateSignature(method, url, timestamp, bodyStr);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-CoinPayments-Client": COINPAYMENTS_CONFIG.clientId,
    "X-CoinPayments-Timestamp": timestamp,
    "X-CoinPayments-Signature": signature,
  };

  console.log("[CoinPayments] Request:", { method, url, timestamp });

  const response = await fetch(url, {
    method,
    headers,
    body: body ? bodyStr : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[CoinPayments] API error (${response.status}):`, error);
    throw new Error(`CoinPayments API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a payment invoice using CoinPayments API v2
 */
export async function createInvoice(
  userId: string,
  userEmail: string
): Promise<{ invoiceId: string; checkoutUrl: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://toolongbro.com";

  const invoiceData = {
    clientId: COINPAYMENTS_CONFIG.clientId,
    invoiceId: `TLB-${userId.slice(0, 8)}-${Date.now()}`,
    amount: {
      currencyId: "5057", // USD
      displayValue: COINPAYMENTS_CONFIG.amount,
      value: COINPAYMENTS_CONFIG.amount,
    },
    description: COINPAYMENTS_CONFIG.itemName,
    metadata: {
      userId: userId,
      email: userEmail,
      plan: "monthly",
    },
    buyer: {
      companyName: "",
      name: {
        firstName: "",
        lastName: "",
      },
      emailAddress: userEmail,
    },
    customData: JSON.stringify({ userId }),
    redirectUrl: `${baseUrl}/subscription/success`,
    notificationUrl: `${baseUrl}/api/webhooks/coinpayments`,
  };

  try {
    const data = await apiRequest("POST", "/merchant/invoices", invoiceData);

    return {
      invoiceId: data.invoiceId || data.id,
      checkoutUrl: data.checkoutUrl || data.invoices?.[0]?.checkoutLink || `https://checkout.coinpayments.net/${data.id}`,
    };
  } catch (error) {
    console.error("[CoinPayments] Invoice creation failed:", error);
    throw error;
  }
}

/**
 * Get invoice status from CoinPayments API v2
 */
export async function getInvoiceStatus(invoiceId: string): Promise<{
  status: string;
  paid: boolean;
  amount: string;
  currency: string;
}> {
  try {
    const data = await apiRequest("GET", `/merchant/invoices/${invoiceId}`);

    return {
      status: data.status,
      paid: data.status === "Completed" || data.status === "Paid",
      amount: data.amount?.displayValue || "0",
      currency: data.amount?.currencyId || "USD",
    };
  } catch (error) {
    console.error("[CoinPayments] Get invoice status failed:", error);
    throw error;
  }
}

/**
 * Verify webhook signature from CoinPayments
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  clientId: string
): boolean {
  if (!COINPAYMENTS_CONFIG.clientSecret) {
    console.warn("[CoinPayments] No client secret configured");
    return true;
  }

  // Verify client ID matches
  if (clientId !== COINPAYMENTS_CONFIG.clientId) {
    console.error("[CoinPayments] Client ID mismatch");
    return false;
  }

  // Generate expected signature
  const expectedSignature = crypto
    .createHmac("sha256", COINPAYMENTS_CONFIG.clientSecret)
    .update(`POST${timestamp}${payload}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * Parse webhook payload from CoinPayments
 */
export interface WebhookPayload {
  event: string;
  invoiceId: string;
  status: string;
  amount: string;
  currency: string;
  customData?: string;
  metadata?: {
    userId?: string;
    email?: string;
  };
}

export function parseWebhookPayload(body: string): WebhookPayload {
  const data = JSON.parse(body);

  let customData: any = {};
  try {
    if (data.customData) {
      customData = JSON.parse(data.customData);
    }
  } catch {
    customData = {};
  }

  return {
    event: data.event || data.type || "invoice.completed",
    invoiceId: data.invoiceId || data.invoice?.id || data.id,
    status: data.status || data.invoice?.status || "",
    amount: data.amount?.displayValue || data.invoice?.amount?.displayValue || "0",
    currency: data.amount?.currencyId || "USD",
    customData: data.customData,
    metadata: {
      userId: customData.userId || data.metadata?.userId,
      email: data.buyer?.emailAddress || data.metadata?.email,
    },
  };
}

/**
 * Check if payment/invoice is complete
 */
export function isPaymentComplete(status: string): boolean {
  const completedStatuses = ["Completed", "Paid", "Complete", "confirmed", "Confirmed"];
  return completedStatuses.some(s =>
    status.toLowerCase() === s.toLowerCase()
  );
}

// Legacy IPN support for backward compatibility
export interface IPNData {
  txnId: string;
  status: number;
  statusText: string;
  currency1: string;
  amount1: string;
  currency2: string;
  amount2: string;
  custom: string;
  email: string;
  fee: string;
}

export function verifyIPN(
  ipnSecret: string,
  merchantId: string,
  receivedHmac: string,
  postData: string
): boolean {
  const hmac = crypto
    .createHmac("sha512", ipnSecret)
    .update(postData)
    .digest("hex");
  return hmac === receivedHmac;
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
    custom: postData.get("custom") || "",
    email: postData.get("email") || "",
    fee: postData.get("fee") || "",
  };
}
