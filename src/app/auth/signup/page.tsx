import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignUpPageClient from "./SignUpPageClient";
import { prisma } from "@/lib/db";

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  // Get subscription plans directly from the database
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: {
      price: "asc",
    },
  });

  // Ensure plans are properly serialized
  const serializedPlans = plans.map((plan) => ({
    ...plan,
    features: plan.features, // features is already a JSON string
    price: Number(plan.price), // ensure price is a number
  }));

  console.log("Subscription plans:", JSON.stringify(serializedPlans, null, 2));

  return <SignUpPageClient plans={serializedPlans} />;
}
