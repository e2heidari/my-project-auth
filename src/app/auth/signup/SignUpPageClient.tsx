"use client";

import { useState, useEffect } from "react";
import SignUpForm from "@/components/SignUpForm";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  offerLimit: number;
  features: string;
}

interface SignUpPageClientProps {
  plans: Plan[];
}

export default function SignUpPageClient({ plans }: SignUpPageClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    console.log("Client received plans:", JSON.stringify(plans, null, 2));
  }, [plans]);

  if (!plans || !Array.isArray(plans) || plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-700">
            Loading plans...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-700">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-700">
          Choose a plan that works for you
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`border rounded-lg p-6 cursor-pointer transition-colors ${
                  selectedPlanId === plan.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-blue-500"
                }`}
              >
                <h3 className="text-2xl font-semibold mb-2 text-gray-700">
                  {plan.name}
                </h3>
                <p className="text-gray-700 mb-4">{plan.description}</p>
                <p className="text-3xl font-bold mb-4 text-gray-700">
                  ${plan.price}{" "}
                  <span className="text-sm font-normal">/month</span>
                </p>
                <ul className="space-y-2 mb-6">
                  {JSON.parse(plan.features).map(
                    (feature: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-center text-gray-700"
                      >
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
                <p className="text-sm text-gray-700">
                  Offer Limit: {plan.offerLimit} offers per month
                </p>
              </div>
            ))}
          </div>

          {selectedPlanId ? (
            <SignUpForm selectedPlanId={selectedPlanId} />
          ) : (
            <div className="text-center text-gray-700">
              Please select a plan to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
