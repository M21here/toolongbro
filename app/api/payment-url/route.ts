import { NextRequest } from "next/server";
import { verifyPrivyToken } from "@/lib/privy-server";
import { createInvoice } from "@/lib/coinpayments";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyPrivyToken();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId, checkoutUrl } = await createInvoice(
      user.userId,
      user.email || "user@privy.io"
    );

    return Response.json({
      url: checkoutUrl,
      invoiceId: invoiceId,
    });
  } catch (error) {
    console.error("Payment URL generation error:", error);
    return Response.json(
      { error: "Failed to create payment. Please try again." },
      { status: 500 }
    );
  }
}
