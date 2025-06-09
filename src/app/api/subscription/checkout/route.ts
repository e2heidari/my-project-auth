import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    console.log("Checkout request body:", body);

    const { planId, email, businessName, verificationCode } = body;

    if (!planId) {
      console.log("Missing planId");
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Get the plan details from your database
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    console.log("Found plan:", plan);

    if (!plan) {
      console.log("Plan not found for ID:", planId);
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // If user is not logged in (during signup), verify the verification code
    if (!session?.user) {
      if (!email || !businessName || !verificationCode) {
        console.log("Missing required fields:", { email, businessName, verificationCode });
        return NextResponse.json(
          { error: "Email, business name, and verification code are required" },
          { status: 400 }
        );
      }

      // Verify the code
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          identifier: email,
          token: verificationCode,
          expires: {
            gt: new Date(),
          },
        },
      });

      console.log("Verification token:", verificationToken);

      if (!verificationToken) {
        console.log("Invalid or expired verification code");
        return NextResponse.json(
          { error: "Invalid or expired verification code" },
          { status: 400 }
        );
      }
    }

    // Create a Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup/password?email=${encodeURIComponent(email)}&code=${verificationCode}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?canceled=true`,
      customer_email: email,
      metadata: {
        email,
        businessName,
        verificationCode,
        planId: plan.id,
      },
    });

    console.log("Created checkout session:", checkoutSession.id);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
} 