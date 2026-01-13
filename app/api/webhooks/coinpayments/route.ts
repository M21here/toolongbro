import { NextRequest } from "next/server";
import { verifyIPN, parseIPNData, isPaymentComplete, COINPAYMENTS_CONFIG } from "@/lib/coinpayments";
import { createSubscription } from "@/lib/subscription";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Get raw body for HMAC verification
    const body = await req.text();
    const hmac = req.headers.get("hmac") || "";

    // Verify IPN authenticity
    const isValid = verifyIPN(
      COINPAYMENTS_CONFIG.ipnSecret,
      COINPAYMENTS_CONFIG.merchantId,
      hmac,
      body
    );

    if (!isValid) {
      console.error("[CoinPayments] Invalid IPN signature");
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse IPN data
    const params = new URLSearchParams(body);
    const ipnData = parseIPNData(params);

    console.log("[CoinPayments] IPN received:", {
      txnId: ipnData.txnId,
      status: ipnData.status,
      statusText: ipnData.statusText,
      userId: ipnData.custom,
    });

    // Check if payment is complete
    if (isPaymentComplete(ipnData.status)) {
      const userId = ipnData.custom;

      if (!userId) {
        console.error("[CoinPayments] No userId in IPN data");
        return Response.json({ error: "No user ID" }, { status: 400 });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.error("[CoinPayments] User not found:", userId);
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      // Check if subscription already exists
      const existingSub = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (existingSub) {
        // Reset quota for existing subscription
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

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
        await createSubscription(
          userId,
          ipnData.txnId, // Use transaction ID as customer ID
          ipnData.txnId  // Use transaction ID as subscription ID
        );

        console.log("[CoinPayments] New subscription created for user:", userId);
      }

      // Log the payment
      await prisma.summary.create({
        data: {
          userId,
          fileName: "Payment",
          fileSize: 0,
          style: "subscription",
          language: "n/a",
          detailLevel: "n/a",
          wordCount: 0,
        },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[CoinPayments] Webhook error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
