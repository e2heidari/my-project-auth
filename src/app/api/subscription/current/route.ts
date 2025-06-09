import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in current subscription endpoint:", session);

    if (!session?.user?.email) {
      console.log("No session or email found in current subscription endpoint");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Fetching subscription for user:", session.user.email);

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

    console.log("Found subscription:", subscription);

    if (!subscription) {
      console.log("No subscription found for user");
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error in current subscription endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
} 