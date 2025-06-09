import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Check if plans already exist
    const existingPlans = await prisma.subscriptionPlan.findMany();
    
    if (existingPlans.length === 0) {
      // Create default plans
      await prisma.subscriptionPlan.createMany({
        data: [
          {
            name: "Basic",
            description: "Perfect for small businesses",
            price: 9.99,
            currency: "USD",
            offerLimit: 5,
            features: JSON.stringify([
              "5 offers per month",
              "Basic analytics",
              "Email support",
              "Standard templates"
            ])
          },
          {
            name: "Professional",
            description: "Ideal for growing businesses",
            price: 14.99,
            currency: "USD",
            offerLimit: 10,
            features: JSON.stringify([
              "10 offers per month",
              "Advanced analytics",
              "Priority support",
              "Custom templates",
              "API access"
            ])
          }
        ]
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error initializing subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to initialize subscription plans" },
      { status: 500 }
    );
  }
} 