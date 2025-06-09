import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, type, quantity, planId, upgrade } = session.metadata!;

        if (type === "additional_offers") {
          // Handle additional offers purchase
          const user = await prisma.user.findFirst({
            where: {
              subscription: {
                stripeCustomerId: session.customer as string,
              },
            },
          });

          if (!user) {
            throw new Error("User not found");
          }

          // Update the subscription's offer limit
          await prisma.subscription.update({
            where: {
              userId: user.id,
            },
            data: {
              additionalOffers: {
                increment: parseInt(quantity || "0"),
              },
            },
          });
        } else if (upgrade === "true" && planId) {
          // Handle plan upgrade
          const user = await prisma.user.findFirst({
            where: {
              subscription: {
                stripeCustomerId: session.customer as string,
              },
            },
          });

          if (!user) {
            throw new Error("User not found");
          }

          // Update the subscription with the new plan
          await prisma.subscription.update({
            where: {
              userId: user.id,
            },
            data: {
              planId: planId,
              status: "active",
              stripeSubscriptionId: session.subscription as string,
              currentPeriodEnd: new Date(
                (session.subscription as unknown as { current_period_end: number }).current_period_end * 1000
              ),
            },
          });
        } else {
          // Handle new subscription
          await prisma.subscription.update({
            where: {
              userId: userId,
            },
            data: {
              status: "active",
              stripeSubscriptionId: session.subscription as string,
              currentPeriodEnd: new Date(
                (session.subscription as unknown as { current_period_end: number }).current_period_end * 1000
              ),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const userId = customer.metadata.userId;

        await prisma.subscription.update({
          where: {
            userId: userId,
          },
          data: {
            status: subscription.status === "active" ? "active" : "inactive",
            currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const userId = customer.metadata.userId;

        await prisma.subscription.update({
          where: {
            userId: userId,
          },
          data: {
            status: "cancelled",
            currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
} 