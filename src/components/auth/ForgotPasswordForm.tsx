"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

interface ForgotPasswordFormData {
  email: string;
  code?: string;
  newPassword?: string;
}

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<"email" | "code" | "newPassword">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      if (step === "email") {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error sending recovery code");
        }

        setEmail(data.email);
        setMessage("Recovery code has been sent to your email");
        setStep("code");
      } else if (step === "code") {
        const response = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            code: data.code,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Invalid code");
        }

        setStep("newPassword");
      } else {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            code: data.code,
            newPassword: data.newPassword,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error changing password");
        }

        setMessage("Password changed successfully");
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          window.location.href = "/auth/signin";
        }, 2000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md"
      suppressHydrationWarning
    >
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        Password Recovery
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        suppressHydrationWarning
      >
        {step === "email" && (
          <div suppressHydrationWarning>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              suppressHydrationWarning
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
        )}

        {step === "code" && (
          <div suppressHydrationWarning>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Recovery Code
            </label>
            <input
              type="text"
              id="code"
              {...register("code", {
                required: "Recovery code is required",
                pattern: {
                  value: /^\d{6}$/,
                  message: "Code must be 6 digits",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              placeholder="6-digit code"
              suppressHydrationWarning
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              Enter the 6-digit code sent to your email
            </p>
          </div>
        )}

        {step === "newPassword" && (
          <div suppressHydrationWarning>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              {...register("newPassword", {
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              suppressHydrationWarning
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.newPassword.message}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              Enter your new password (minimum 8 characters)
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          suppressHydrationWarning
        >
          {isLoading
            ? "Processing..."
            : step === "email"
              ? "Send Recovery Code"
              : step === "code"
                ? "Verify Code"
                : "Change Password"}
        </button>
      </form>
    </div>
  );
}
