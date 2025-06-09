import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function AdminSubscriptionPlansPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if plans exist
  const existingPlans = await prisma.subscriptionPlan.findMany();

  // If no plans exist, create them
  if (existingPlans.length === 0) {
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: "Basic",
          description: "Perfect for small businesses",
          price: 9.99,
          currency: "CAD",
          offerLimit: 5,
          features: JSON.stringify([
            "5 offers per month",
            "Basic analytics",
            "Email support",
          ]),
        },
        {
          name: "Professional",
          description: "Ideal for growing businesses",
          price: 14.99,
          currency: "CAD",
          offerLimit: 10,
          features: JSON.stringify([
            "10 offers per month",
            "Advanced analytics",
            "Priority support",
            "Custom branding",
          ]),
        },
      ],
    });
  }

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: {
      price: "asc",
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Subscription Plans</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-gray-700 mb-4">{plan.description}</p>
            <p className="text-3xl font-bold mb-4">
              ${plan.price} <span className="text-sm font-normal">/month</span>
            </p>
            <ul className="space-y-2 mb-6">
              {JSON.parse(plan.features).map(
                (feature: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                )
              )}
            </ul>
            <p className="text-sm text-gray-500">
              Offer Limit: {plan.offerLimit} offers per month
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
