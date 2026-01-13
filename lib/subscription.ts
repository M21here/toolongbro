import { prisma } from "./db";

export async function getUserSubscription(userId: string) {
  return await prisma.subscription.findUnique({
    where: { userId },
  });
}

export async function canUserSummarize(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  // Check if subscription is active
  if (subscription.status !== "active") {
    return false;
  }

  // Check if current period is valid
  const now = new Date();
  if (now > subscription.currentPeriodEnd) {
    return false;
  }

  // Check if user has files remaining
  return subscription.filesRemaining > 0;
}

export async function decrementUserFiles(userId: string): Promise<void> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    throw new Error("No subscription found");
  }

  if (subscription.filesRemaining <= 0) {
    throw new Error("No files remaining in subscription");
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      filesRemaining: subscription.filesRemaining - 1,
    },
  });
}

export async function resetMonthlyQuota(userId: string): Promise<void> {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  await prisma.subscription.update({
    where: { userId },
    data: {
      filesRemaining: 10,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });
}

export async function createSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  return await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      filesRemaining: 10,
    },
  });
}

export async function cancelSubscription(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: "canceled",
    },
  });
}
