import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function syncPrivyUser(userId: string, email?: string, walletAddress?: string) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      // Create new user
      await prisma.user.create({
        data: {
          id: userId,
          email: email || null,
          walletAddress: walletAddress || null,
        },
      });
      console.log(`[User Sync] Created new user: ${userId}`);
    } else if (email && existingUser.email !== email) {
      // Update email if changed
      await prisma.user.update({
        where: { id: userId },
        data: { email },
      });
      console.log(`[User Sync] Updated user email: ${userId}`);
    }

    return true;
  } catch (error) {
    console.error("[User Sync] Error syncing user:", error);
    return false;
  }
}
