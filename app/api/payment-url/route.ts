import { NextRequest } from "next/server";
import { verifyPrivyToken } from "@/lib/privy-server";
import { generatePaymentButtonUrl } from "@/lib/coinpayments";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyPrivyToken();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentUrl = generatePaymentButtonUrl(
      user.userId,
      user.email || "user@privy.io"
    );

    return Response.json({ url: paymentUrl });
  } catch (error) {
    console.error("Payment URL generation error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
