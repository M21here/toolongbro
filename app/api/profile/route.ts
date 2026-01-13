import { NextRequest } from "next/server";
import { verifyPrivyToken } from "@/lib/privy-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyPrivyToken();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with subscription and summaries
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        subscription: true,
        summaries: {
          where: {
            style: { not: "payment" }, // Exclude payment records
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!dbUser) {
      // Create user if doesn't exist
      const newUser = await prisma.user.create({
        data: {
          id: user.userId,
          email: user.email,
        },
      });

      return Response.json({
        user: {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
        subscription: null,
        usage: {
          totalSummaries: 0,
          filesThisMonth: 0,
          filesRemaining: 0,
        },
        recentSummaries: [],
      });
    }

    // Calculate usage stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const filesThisMonth = await prisma.summary.count({
      where: {
        userId: user.userId,
        style: { not: "payment" },
        createdAt: { gte: startOfMonth },
      },
    });

    const totalSummaries = await prisma.summary.count({
      where: {
        userId: user.userId,
        style: { not: "payment" },
      },
    });

    return Response.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        walletAddress: dbUser.walletAddress,
        createdAt: dbUser.createdAt,
      },
      subscription: dbUser.subscription
        ? {
            status: dbUser.subscription.status,
            filesRemaining: dbUser.subscription.filesRemaining,
            currentPeriodStart: dbUser.subscription.currentPeriodStart,
            currentPeriodEnd: dbUser.subscription.currentPeriodEnd,
            createdAt: dbUser.subscription.createdAt,
          }
        : null,
      usage: {
        totalSummaries,
        filesThisMonth,
        filesRemaining: dbUser.subscription?.filesRemaining || 0,
      },
      recentSummaries: dbUser.summaries.map((s) => ({
        id: s.id,
        fileName: s.fileName,
        style: s.style,
        language: s.language,
        wordCount: s.wordCount,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
