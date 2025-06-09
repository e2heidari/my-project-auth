import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error("NEXT_PUBLIC_APP_URL is not set in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in upgrade endpoint:", session);

    if (!session?.user?.email) {
      console.log("No session or email found in upgrade endpoint");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { planId } = await request.json();
    console.log("Upgrade request for planId:", planId);

    if (!planId) {
      console.log("No planId provided in request");
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Get the plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    console.log("Found plan:", plan);

    if (!plan) {
      console.log("Invalid plan selected:", planId);
      return NextResponse.json(
        { error: "Invalid plan selected" },
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
    console.log("Current subscription:", currentSubscription);

    if (!currentSubscription) {
      console.log("No active subscription found for user");
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    if (!currentSubscription.stripeCustomerId) {
      console.log("No Stripe customer ID found for subscription");
      return NextResponse.json(
        { error: "No Stripe customer ID found" },
        { status: 400 }
      );
    }

    try {
      // Verify the customer exists in Stripe
      const customer = await stripe.customers.retrieve(currentSubscription.stripeCustomerId);
      console.log("Stripe customer:", customer);

      if (customer.deleted) {
        console.log("Stripe customer has been deleted");
        return NextResponse.json(
          { error: "Stripe customer not found" },
          { status: 400 }
        );
      }

      // Create a Stripe checkout session for the upgrade
      const checkoutSession = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: plan.currency.toLowerCase(),
              product_data: {
                name: plan.name,
                description: plan.description,
              },
              unit_amount: Math.round(plan.price * 100), // Convert to cents
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=canceled`,
        customer: currentSubscription.stripeCustomerId,
        metadata: {
          planId: plan.id,
          upgrade: "true",
        },
      });
      console.log("Created checkout session:", checkoutSession);

      return NextResponse.json({ url: checkoutSession.url });
    } catch (stripeError: unknown) {
      console.error("Stripe error details:", {
        message: stripeError instanceof Error ? stripeError.message : String(stripeError),
        type: stripeError instanceof Error ? stripeError.name : typeof stripeError
      });
      return NextResponse.json(
        { error: `Failed to create Stripe checkout session: ${stripeError instanceof Error ? stripeError.message : String(stripeError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      { error: "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
} 