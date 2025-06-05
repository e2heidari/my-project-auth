"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "verification" | "password">(
    "email"
  );
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, businessName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setStep("verification");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid verification code");
      }

      setStep("password");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          businessName,
          verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      router.push(
        "/auth/signin?message=Account created successfully. Please sign in."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  if (step === "email") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 border-black">
          <h1 className="text-2xl font-bold text-center mb-6 text-black">
            Create Account
          </h1>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium text-black"
              >
                Business Name
              </label>
              <Input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                required
                className="mt-1 text-black border-black focus:border-black focus:ring-black"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="mt-1 text-black border-black focus:border-black focus:ring-black"
              />
            </div>
            {error && (
              <Alert
                variant="destructive"
                className="mt-4 text-black border-black"
              >
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  <span className="text-white">Sending Code...</span>
                </>
              ) : (
                <span className="text-white">Send Verification Code</span>
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-700"
              onClick={() => router.push("/auth/signin")}
            >
              Already have an account? Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "verification") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8 border-black">
          <h1 className="text-2xl font-bold text-center mb-6 text-black">
            Verify Email
          </h1>
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-black"
              >
                Verification Code
              </label>
              <Input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                required
                className="mt-1 text-black border-black focus:border-black focus:ring-black"
              />
            </div>
            {error && (
              <Alert
                variant="destructive"
                className="mt-4 text-black border-black"
              >
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  <span className="text-white">Verifying...</span>
                </>
              ) : (
                <span className="text-white">Verify Code</span>
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-700"
              onClick={() => setStep("email")}
            >
              Back to Email
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8 border-black">
        <h1 className="text-2xl font-bold text-center mb-6 text-black">
          Complete Registration
        </h1>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label
              htmlFor="businessName"
              className="block text-sm font-medium text-black"
            >
              Business Name
            </label>
            <Input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              required
              className="mt-1 text-black border-black focus:border-black focus:ring-black"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-black"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="mt-1 text-black border-black focus:border-black focus:ring-black"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-black"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              className="mt-1 text-black border-black focus:border-black focus:ring-black"
            />
          </div>
          {error && (
            <Alert
              variant="destructive"
              className="mt-4 text-black border-black"
            >
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-colors duration-200"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                <span className="text-white">Creating Account...</span>
              </>
            ) : (
              <span className="text-white">Create Account</span>
            )}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-700"
            onClick={() => setStep("verification")}
          >
            Back to Verification
          </Button>
        </div>
      </Card>
    </div>
  );
}
