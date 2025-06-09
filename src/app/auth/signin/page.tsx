"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm p-4 sm:p-8 border-black">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-black">
          Sign In
        </h1>
        {message && (
          <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
            {message}
          </Alert>
        )}
        <form
          onSubmit={handleSubmit}
          className="space-y-3 sm:space-y-4"
          suppressHydrationWarning
        >
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
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-black"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="mt-1 text-black border-black focus:border-black focus:ring-black pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
              >
                {showPassword ? (
                  <Eye className="h-4 w-4 text-gray-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          {error && (
            <Alert
              variant="destructive"
              className="mt-4 bg-white text-black border-black"
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
                <span className="text-white">Signing in...</span>
              </>
            ) : (
              <span className="text-white">Sign In</span>
            )}
          </Button>
        </form>
        <div className="mt-3 sm:mt-4 text-center">
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-700 text-sm sm:text-base"
            onClick={() => router.push("/auth/forgot-password")}
          >
            Forgot Password?
          </Button>
        </div>
        <div className="mt-3 sm:mt-4 text-center">
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-700 text-sm sm:text-base"
            onClick={() => router.push("/auth/signup")}
          >
            Don&apos;t have an account? Sign Up
          </Button>
        </div>
      </Card>
    </div>
  );
}
