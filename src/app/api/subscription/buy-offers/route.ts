import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

const ADDITIONAL_OFFER_PRICE = 2.99; // Price per additional offer

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { quantity } = await request.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    // Get user's current subscription
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        user: {
          email: session.user.email,
        },
      },
    });

    if (!currentSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Create a Stripe checkout session for additional offers
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Additional Offers",
              description: `${quantity} additional offers`,
            },
            unit_amount: Math.round(ADDITIONAL_OFFER_PRICE * quantity * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?offers=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?offers=canceled`,
      customer: currentSubscription.stripeCustomerId || undefined,
      metadata: {
        type: "additional_offers",
        quantity: quantity.toString(),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error buying additional offers:", error);
    return NextResponse.json(
      { error: "Failed to process additional offers purchase" },
      { status: 500 }
    );
  }
} 