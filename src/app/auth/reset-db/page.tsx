"use client";

import { useState } from "react";

export default function ResetDB() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید تمام داده‌ها را پاک کنید؟")) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/reset-db", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در پاک کردن دیتابیس");
      }

      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در پاک کردن دیتابیس");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            پاک کردن دیتابیس
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            با کلیک روی دکمه زیر، تمام کاربران و توکن‌های تایید پاک خواهند شد.
          </p>
        </div>

        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {message}
                </h3>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div>
          <button
            onClick={handleReset}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {loading ? "در حال پاک کردن..." : "پاک کردن دیتابیس"}
          </button>
        </div>
      </div>
    </div>
  );
}
