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

interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth2 access token from CoinPayments API
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${COINPAYMENTS_CONFIG.clientId}:${COINPAYMENTS_CONFIG.clientSecret}`
  ).toString("base64");

  const response = await fetch(`${COINPAYMENTS_CONFIG.apiUrl}/api/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[CoinPayments] Token error:", error);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken.token;
}

/**
 * Create a payment invoice using CoinPayments API v2
 */
export async function createInvoice(
  userId: string,
  userEmail: string
): Promise<{ invoiceId: string; checkoutUrl: string }> {
  const accessToken = await getAccessToken();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://toolongbro.com";

  const invoiceData = {
    currency: {
      currencyId: 5057, // USD
    },
    amount: {
      value: COINPAYMENTS_CONFIG.amount,
    },
    clientId: COINPAYMENTS_CONFIG.clientId,
    invoiceId: `TLB-${userId}-${Date.now()}`,
    description: COINPAYMENTS_CONFIG.itemName,
    metadata: {
      userId: userId,
      email: userEmail,
      plan: "monthly",
    },
    buyer: {
      email: userEmail,
    },
    customData: {
      userId: userId,
    },
    successUrl: `${baseUrl}/subscription/success`,
    cancelUrl: `${baseUrl}/subscription`,
    ipnUrl: `${baseUrl}/api/webhooks/coinpayments`,
  };

  const response = await fetch(`${COINPAYMENTS_CONFIG.apiUrl}/api/v1/invoices`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[CoinPayments] Invoice creation error:", error);
    throw new Error(`Failed to create invoice: ${response.status}`);
  }

  const data = await response.json();

  return {
    invoiceId: data.id || data.invoiceId,
    checkoutUrl: data.checkoutLink || data.invoiceUrl || `https://checkout.coinpayments.net/invoice/${data.id}`,
  };
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
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${COINPAYMENTS_CONFIG.apiUrl}/api/v1/invoices/${invoiceId}`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get invoice status: ${response.status}`);
  }

  const data = await response.json();

  return {
    status: data.status,
    paid: data.status === "Completed" || data.status === "Paid",
    amount: data.amount?.value || "0",
    currency: data.currency?.symbol || "USD",
  };
}

/**
 * Verify webhook signature from CoinPayments
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!COINPAYMENTS_CONFIG.webhookSecret) {
    console.warn("[CoinPayments] No webhook secret configured, skipping verification");
    return true;
  }

  const hmac = crypto
    .createHmac("sha256", COINPAYMENTS_CONFIG.webhookSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(signature)
  );
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
  customData?: {
    userId?: string;
  };
  metadata?: {
    userId?: string;
    email?: string;
  };
}

export function parseWebhookPayload(body: string): WebhookPayload {
  const data = JSON.parse(body);

  return {
    event: data.event || data.type,
    invoiceId: data.invoiceId || data.invoice?.id || data.id,
    status: data.status || data.invoice?.status,
    amount: data.amount?.value || data.invoice?.amount?.value || "0",
    currency: data.currency?.symbol || data.invoice?.currency?.symbol || "USD",
    customData: data.customData || data.invoice?.customData,
    metadata: data.metadata || data.invoice?.metadata,
  };
}

/**
 * Check if payment/invoice is complete
 */
export function isPaymentComplete(status: string): boolean {
  const completedStatuses = ["Completed", "Paid", "Complete", "confirmed"];
  return completedStatuses.some(s =>
    status.toLowerCase().includes(s.toLowerCase())
  );
}

// Legacy support - keep old function for backward compatibility
export function generatePaymentButtonUrl(
  userId: string,
  userEmail: string
): string {
  // Return empty - we now use createInvoice for API-based payments
  return "";
}

// Legacy IPN types for backward compatibility
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
