import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("No session or email found in usage endpoint");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Fetching usage for user:", session.user.email);

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        user: {
          email: session.user.email,
        },
      },
      include: {
        plan: true,
      },
    });

    console.log("Found subscription for usage:", subscription);

    if (!subscription) {
      console.log("No subscription found for usage");
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Get the current month's offers count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const offersCount = await prisma.offer.count({
      where: {
        userId: subscription.userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    console.log("Offers count:", offersCount);

    const totalOffers = subscription.plan.offerLimit + subscription.additionalOffers;
    const remainingOffers = Math.max(0, totalOffers - offersCount);

    const response = {
      totalOffers,
      remainingOffers,
      baseLimit: subscription.plan.offerLimit,
      additionalOffers: subscription.additionalOffers,
    };

    console.log("Usage response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in usage endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription usage" },
      { status: 500 }
    );
  }
} 