import { NextRequest } from "next/server";
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  isPaymentComplete,
  verifyIPN,
  parseIPNData,
  COINPAYMENTS_CONFIG,
} from "@/lib/coinpayments";
import { createSubscription } from "@/lib/subscription";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const contentType = req.headers.get("content-type") || "";

    // Determine if this is a new API webhook (JSON) or legacy IPN (form-urlencoded)
    if (contentType.includes("application/json")) {
      return handleNewWebhook(req, body);
    } else {
      return handleLegacyIPN(req, body);
    }
  } catch (error) {
    console.error("[CoinPayments] Webhook error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle new CoinPayments API v2 webhooks (JSON format)
 */
async function handleNewWebhook(req: NextRequest, body: string) {
  const signature = req.headers.get("x-coinpayments-signature") || "";
  const timestamp = req.headers.get("x-coinpayments-timestamp") || "";
  const clientId = req.headers.get("x-coinpayments-client") || "";

  // Verify signature
  if (!verifyWebhookSignature(body, signature, timestamp, clientId)) {
    console.error("[CoinPayments] Invalid webhook signature");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = parseWebhookPayload(body);

  console.log("[CoinPayments] Webhook received:", {
    event: payload.event,
    invoiceId: payload.invoiceId,
    status: payload.status,
    userId: payload.metadata?.userId,
  });

  // Check if payment is complete
  if (isPaymentComplete(payload.status)) {
    const userId = payload.metadata?.userId;

    if (!userId) {
      console.error("[CoinPayments] No userId in webhook data");
      return Response.json({ error: "No user ID" }, { status: 400 });
    }

    await processSuccessfulPayment(userId, payload.invoiceId);
  }

  return Response.json({ success: true });
}

/**
 * Handle legacy CoinPayments IPN (form-urlencoded format)
 */
async function handleLegacyIPN(req: NextRequest, body: string) {
  const hmac = req.headers.get("hmac") || "";

  const isValid = verifyIPN(
    process.env.COINPAYMENTS_IPN_SECRET || COINPAYMENTS_CONFIG.clientSecret,
    process.env.COINPAYMENTS_MERCHANT_ID || COINPAYMENTS_CONFIG.clientId,
    hmac,
    body
  );

  if (!isValid) {
    console.error("[CoinPayments] Invalid IPN signature");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const params = new URLSearchParams(body);
  const ipnData = parseIPNData(params);

  console.log("[CoinPayments] IPN received:", {
    txnId: ipnData.txnId,
    status: ipnData.status,
    statusText: ipnData.statusText,
    userId: ipnData.custom,
  });

  // Check if payment is complete (status >= 2 or >= 100)
  if (ipnData.status >= 2 || ipnData.status >= 100) {
    const userId = ipnData.custom;

    if (!userId) {
      console.error("[CoinPayments] No userId in IPN data");
      return Response.json({ error: "No user ID" }, { status: 400 });
    }

    await processSuccessfulPayment(userId, ipnData.txnId);
  }

  return Response.json({ success: true });
}

/**
 * Process a successful payment and create/renew subscription
 */
async function processSuccessfulPayment(userId: string, transactionId: string) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error("[CoinPayments] User not found:", userId);
    throw new Error("User not found");
  }

  // Check if subscription already exists
  const existingSub = await prisma.subscription.findUnique({
    where: { userId },
  });

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  if (existingSub) {
    // Renew existing subscription
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: "active",
        filesRemaining: 10,
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        updatedAt: now,
      },
    });

    console.log("[CoinPayments] Subscription renewed for user:", userId);
  } else {
    // Create new subscription
    await createSubscription(userId, transactionId, transactionId);

    console.log("[CoinPayments] New subscription created for user:", userId);
  }

  // Log the payment as a record
  await prisma.summary.create({
    data: {
      userId,
      fileName: `Payment: ${transactionId}`,
      fileSize: 0,
      style: "payment",
      language: "n/a",
      detailLevel: "n/a",
      wordCount: 0,
    },
  });
}
