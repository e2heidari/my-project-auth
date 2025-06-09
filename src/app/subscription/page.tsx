import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SubscriptionPlans from "@/components/SubscriptionPlans";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Redirect to sign in with a callback URL
    redirect("/auth/signin?callbackUrl=/subscription");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <SubscriptionPlans />
    </main>
  );
}
