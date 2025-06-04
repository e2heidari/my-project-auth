"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (step === "email") {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error sending request");
        }

        setSuccess(data.message);
        setStep("code");
      } else {
        // Verify the code
        const response = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Invalid code");
        }

        // If code is valid, redirect to reset password page
        router.push(
          `/auth/reset-password?email=${encodeURIComponent(email)}&code=${code}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === "email" ? (
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-700"
                placeholder="Enter your email"
              />
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              Recovery Code
            </label>
            <div className="mt-1">
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isLoading}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-700"
                placeholder="Enter the 6-digit code"
              />
            </div>
            <p className="mt-2 text-sm text-gray-700">
              Enter the 6-digit code sent to your email
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="text-sm text-gray-700">
            {error}
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-sm text-gray-700">
            {success}
          </Alert>
        )}

        <div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                <span className="text-white">
                  {step === "email" ? "Sending..." : "Verifying..."}
                </span>
              </>
            ) : (
              <span className="text-white">
                {step === "email" ? "Send Recovery Code" : "Verify Code"}
              </span>
            )}
          </Button>
        </div>

        <div className="text-sm text-center">
          <Link
            href="/auth/signin"
            className="font-medium text-gray-700 hover:text-gray-900"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
