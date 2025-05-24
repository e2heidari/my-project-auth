"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">
          Welcome, {session?.user?.name || session?.user?.email}!
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1">{session?.user?.email}</p>
          </div>
          {session?.user?.name && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="mt-1">{session.user.name}</p>
            </div>
          )}
          {session?.user?.image && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Profile Picture
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="mt-2 h-20 w-20 rounded-full"
                />
              </h3>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
