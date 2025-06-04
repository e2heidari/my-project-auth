"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const code = searchParams.get("code");

  useEffect(() => {
    const verifyCode = async () => {
      if (!email || !code) {
        setVerifying(false);
        return;
      }

      try {
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

        setVerifying(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid reset link");
        setVerifying(false);
      }
    };

    verifyCode();
  }, [email, code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      // Redirect to sign in page with success message
      router.push(
        "/auth/signin?message=Password reset successful. Please sign in with your new password."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
            <span className="text-gray-700">Verifying reset code...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!email || !code || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <Alert variant="destructive" className="mb-4">
            {error ||
              "Invalid reset link. Please request a new password reset."}
          </Alert>
          <Button
            className="w-full"
            onClick={() => router.push("/auth/forgot-password")}
          >
            Request New Reset Link
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-700">
          Reset Password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="mt-1 text-gray-700"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="mt-1 text-gray-700"
            />
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4 text-gray-700">
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                <span className="text-white">Resetting...</span>
              </>
            ) : (
              <span className="text-white">Reset Password</span>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
