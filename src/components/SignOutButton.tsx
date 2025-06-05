"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    // Clear localStorage
    localStorage.clear();

    // Sign out from NextAuth
    await signOut({
      redirect: false,
      callbackUrl: "/auth/signin",
    });

    // Redirect to sign in page
    router.push("/auth/signin");
  };

  return (
    <button onClick={handleSignOut} className="text-red-600 hover:text-red-800">
      Sign Out
    </button>
  );
}
