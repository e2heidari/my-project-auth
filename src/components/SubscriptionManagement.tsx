"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  offerLimit: number;
  features: string[]; // This will be the parsed features array
}

interface RawPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  offerLimit: number;
  features: string; // This is the raw JSON string from the database
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  plan: Plan;
}

interface Usage {
  totalOffers: number;
  remainingOffers: number;
}

export default function SubscriptionManagement() {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSubscriptionData();
    } else if (status === "unauthenticated") {
      setLoading(false);
      setSubscription(null);
      setPlans([]);
      setUsage(null);
    }
  }, [session, status]);

  const fetchSubscriptionData = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [subscriptionRes, plansRes, usageRes] = await Promise.all([
        fetch("/api/subscription/current", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),
        fetch("/api/subscription/plans", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),
        fetch("/api/subscription/usage", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),
      ]);

      // Log individual responses
      console.log("Subscription Response:", {
        status: subscriptionRes.status,
        ok: subscriptionRes.ok,
        statusText: subscriptionRes.statusText,
      });
      console.log("Plans Response:", {
        status: plansRes.status,
        ok: plansRes.ok,
        statusText: plansRes.statusText,
      });
      console.log("Usage Response:", {
        status: usageRes.status,
        ok: usageRes.ok,
        statusText: usageRes.statusText,
      });

      if (!subscriptionRes.ok) {
        if (subscriptionRes.status === 401) {
          // Handle unauthorized - user is not authenticated
          setSubscription(null);
          setLoading(false);
          return;
        }
        const errorData = await subscriptionRes.json();
        console.error("Subscription API Error:", errorData);
        throw new Error(
          `Failed to fetch subscription: ${subscriptionRes.statusText}`
        );
      }
      if (!plansRes.ok) {
        const errorData = await plansRes.json();
        console.error("Plans API Error:", errorData);
        throw new Error(`Failed to fetch plans: ${plansRes.statusText}`);
      }
      if (!usageRes.ok) {
        const errorData = await usageRes.json();
        console.error("Usage API Error:", errorData);
        throw new Error(`Failed to fetch usage: ${usageRes.statusText}`);
      }

      const [subscriptionData, plansData, usageData] = await Promise.all([
        subscriptionRes.json(),
        plansRes.json(),
        usageRes.json(),
      ]);

      // Parse features JSON string for each plan
      const plansWithParsedFeatures = (plansData as RawPlan[]).map((plan) => ({
        ...plan,
        features: JSON.parse(plan.features) as string[],
      }));

      // Log the data
      console.log("Subscription Data:", subscriptionData);
      console.log("Plans Data:", plansWithParsedFeatures);
      console.log("Usage Data:", usageData);

      setSubscription(subscriptionData);
      setPlans(plansWithParsedFeatures);
      setUsage(usageData);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      console.log("Attempting to upgrade to plan:", planId);
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      console.log("Upgrade response status:", response.status);
      const responseData = await response.json();
      console.log("Upgrade response data:", responseData);

      if (!response.ok) {
        throw new Error(
          `Failed to upgrade plan: ${responseData.error || response.statusText}`
        );
      }

      const { url } = responseData;
      console.log("Redirecting to checkout URL:", url);
      window.location.href = url;
    } catch (error) {
      console.error("Error upgrading plan:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upgrade plan"
      );
    }
  };

  const handleBuyMoreOffers = async () => {
    try {
      const response = await fetch("/api/subscription/buy-offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: 5 }), // Default to buying 5 more offers
      });

      if (!response.ok) {
        throw new Error("Failed to purchase additional offers");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error buying more offers:", error);
      toast.error("Failed to purchase additional offers");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Current Subscription
        </h2>
        {subscription ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-700">Plan</p>
                <p className="font-medium text-gray-700">
                  {subscription.plan.name}
                </p>
              </div>
              <div>
                <p className="text-gray-700">Status</p>
                <p className="font-medium capitalize text-gray-700">
                  {subscription.status}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-700">Next Billing Date</p>
                <p className="font-medium text-gray-700">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-700">Offer Usage</p>
                <p className="font-medium text-gray-700">
                  {usage?.remainingOffers} / {usage?.totalOffers} remaining
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-700">No active subscription</p>
        )}
      </div>

      {/* Available Plans */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Available Plans
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 ${
                subscription?.plan.id === plan.id
                  ? "border-blue-500 bg-blue-50"
                  : "hover:border-blue-500"
              }`}
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                {plan.name}
              </h3>
              <p className="text-gray-700 mb-4">{plan.description}</p>
              <p className="text-2xl font-bold mb-4 text-gray-700">
                ${plan.price}
                <span className="text-sm font-normal">/month</span>
              </p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
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
                ))}
              </ul>
              {subscription?.plan.id !== plan.id && (
                <button
                  onClick={() => handleUpgradePlan(plan.id)}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                >
                  {subscription ? "Upgrade Plan" : "Select Plan"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Buy More Offers */}
      {subscription && usage?.remainingOffers === 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Need More Offers?
          </h2>
          <p className="text-gray-700 mb-4">
            You&apos;ve used all your available offers. Purchase more to
            continue creating offers.
          </p>
          <button
            onClick={handleBuyMoreOffers}
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
          >
            Buy 5 More Offers
          </button>
        </div>
      )}
    </div>
  );
}
