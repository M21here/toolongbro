import { NextRequest } from "next/server";
import { verifyPrivyToken } from "@/lib/privy-server";
import { getUserSubscription } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyPrivyToken();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(user.userId);

    if (!subscription) {
      return Response.json({ error: "No subscription found" }, { status: 404 });
    }

    return Response.json({
      status: subscription.status,
      filesRemaining: subscription.filesRemaining,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
