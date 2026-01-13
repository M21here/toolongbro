import { PrivyClient } from "@privy-io/node";
import { cookies } from "next/headers";

const privyClient = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

export async function verifyPrivyToken(): Promise<{ userId: string; email?: string } | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("privy-token")?.value;

    if (!authToken) {
      return null;
    }

    const verifiedClaims = await privyClient.utils().auth().verifyAccessToken(authToken);

    return {
      userId: verifiedClaims.user_id,
      email: undefined, // Email not available directly from token, fetch from user if needed
    };
  } catch (error) {
    console.error("Privy token verification error:", error);
    return null;
  }
}

export { privyClient };
