"use client";

import { useState, useEffect } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/en";
import { useSession } from "next-auth/react";

interface OfferFormData {
  goal: string;
  discountType: string;
  productOrService: string;
  customMessage?: string;
  category: string;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
}

export default function MakeOfferForm() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOffer, setGeneratedOffer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<OfferFormData>(() => {
    // Try to load saved form data from localStorage
    if (typeof window !== "undefined" && session?.user?.id) {
      const savedFormData = localStorage.getItem(
        `offerFormData_${session.user.id}`
      );
      if (savedFormData) {
        try {
          const parsed = JSON.parse(savedFormData);
          // Convert string dates back to dayjs objects
          return {
            ...parsed,
            startDate: parsed.startDate ? dayjs(parsed.startDate) : null,
            endDate: parsed.endDate ? dayjs(parsed.endDate) : null,
          };
        } catch (e) {
          console.error("Error parsing saved form data:", e);
        }
      }
    }
    return {
      goal: "",
      discountType: "",
      productOrService: "",
      customMessage: "",
      category: "",
      startDate: null,
      endDate: null,
    };
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && session?.user?.id) {
      const dataToSave = {
        ...formData,
        startDate: formData.startDate?.toISOString() || null,
        endDate: formData.endDate?.toISOString() || null,
      };
      localStorage.setItem(
        `offerFormData_${session.user.id}`,
        JSON.stringify(dataToSave)
      );
    }
  }, [formData, session?.user?.id]);

  // Load saved offer from localStorage on component mount
  useEffect(() => {
    if (session?.user?.id) {
      const savedOffer = localStorage.getItem(
        `generatedOffer_${session.user.id}`
      );
      if (savedOffer) {
        setGeneratedOffer(savedOffer);
      }
    }
  }, [session?.user?.id]);

  // Save offer to localStorage when it changes
  useEffect(() => {
    if (generatedOffer && session?.user?.id) {
      localStorage.setItem(`generatedOffer_${session.user.id}`, generatedOffer);
    }
  }, [generatedOffer, session?.user?.id]);

  // Clean up localStorage when component unmounts
  useEffect(() => {
    return () => {
      if (session?.user?.id) {
        // Don't remove the data when unmounting, as we want to keep it for when the user returns
        // localStorage.removeItem(`offerFormData_${session.user.id}`);
      }
    };
  }, [session?.user?.id]);

  const generateOffer = async (): Promise<void> => {
    try {
      // Basic validation
      if (
        !formData.goal ||
        !formData.discountType ||
        !formData.productOrService ||
        !formData.category ||
        !formData.startDate ||
        !formData.endDate
      ) {
        setError("لطفاً تمام فیلدهای ضروری را پر کنید");
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/generate-offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: formData.goal,
          discountType: formData.discountType,
          productOrService: formData.productOrService,
          category: formData.category,
          customMessage: formData.customMessage,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        switch (response.status) {
          case 400:
            setError(data.error || "لطفاً ورودی‌های خود را بررسی کنید");
            break;
          case 401:
            setError("خطای پیکربندی سرور. لطفاً با پشتیبانی تماس بگیرید");
            break;
          case 429:
            setError(data.error || "تعداد درخواست‌های شما بیش از حد مجاز است");
            break;
          case 500:
            setError(
              data.error || "خطا در تولید پیشنهاد. لطفاً دوباره تلاش کنید"
            );
            break;
          default:
            setError(data.error || "خطایی رخ داد. لطفاً دوباره تلاش کنید");
        }
        return;
      }

      if (data.success && data.description) {
        setGeneratedOffer(data.description);
        setIsEditing(false);
      } else {
        setError("پیشنهادی تولید نشد. لطفاً دوباره تلاش کنید");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "خطایی رخ داد. لطفاً دوباره تلاش کنید"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateOffer();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleReset = () => {
    setFormData({
      goal: "",
      discountType: "",
      productOrService: "",
      customMessage: "",
      category: "",
      startDate: null,
      endDate: null,
    });
    if (session?.user?.id) {
      localStorage.removeItem(`offerFormData_${session.user.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Create Your Offer ✨
      </h1>

      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="goal"
              className="block text-sm font-medium text-gray-700"
            >
              Goal
            </label>
            <input
              type="text"
              id="goal"
              value={formData.goal}
              onChange={(e) =>
                setFormData({ ...formData, goal: e.target.value })
              }
              placeholder="e.g., Increase weekend sales"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="discountType"
              className="block text-sm font-medium text-gray-700"
            >
              Discount Type
            </label>
            <input
              type="text"
              id="discountType"
              value={formData.discountType}
              onChange={(e) =>
                setFormData({ ...formData, discountType: e.target.value })
              }
              placeholder="e.g., 20% off, Buy 1 Get 1 Free"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="productOrService"
              className="block text-sm font-medium text-gray-700"
            >
              Product/Service
            </label>
            <input
              type="text"
              id="productOrService"
              value={formData.productOrService}
              onChange={(e) =>
                setFormData({ ...formData, productOrService: e.target.value })
              }
              placeholder="e.g., Premium coffee, Fitness classes"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Business Category
            </label>
            <input
              type="text"
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="e.g., Cafe, Gym, Salon"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="customMessage"
              className="block text-sm font-medium text-gray-700"
            >
              Custom Message (Optional)
            </label>
            <textarea
              id="customMessage"
              value={formData.customMessage}
              onChange={(e) =>
                setFormData({ ...formData, customMessage: e.target.value })
              }
              placeholder="💌 Add any personal message or special instructions..."
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Offer Start Date
              </label>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="en"
              >
                <DatePicker
                  value={formData.startDate || null}
                  onChange={(date) =>
                    setFormData({ ...formData, startDate: date })
                  }
                  minDate={dayjs()}
                  format="D MMMM YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      placeholder: "Select start date",
                      className:
                        "w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900",
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Offer End Date
              </label>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="en"
              >
                <DatePicker
                  value={formData.endDate || null}
                  onChange={(date) =>
                    setFormData({ ...formData, endDate: date })
                  }
                  minDate={formData.startDate || dayjs()}
                  format="D MMMM YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      placeholder: "Select end date",
                      className:
                        "w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900",
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? "✨ Generating..." : "✨ Generate Offer"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              Reset Form
            </button>
          </div>
        </form>

        {generatedOffer && (
          <div className="p-6 bg-white rounded-lg shadow-lg border border-indigo-100">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">
              ✨ Generated Offer
            </h2>
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={generatedOffer}
                  onChange={(e) => setGeneratedOffer(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 font-vazirmatn"
                  dir="rtl"
                  style={{ unicodeBidi: "bidi-override" }}
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="prose max-w-none">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-2 rounded-lg">
                    <div className="flex flex-col items-center mt-2 mb-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-2 rounded-lg shadow-lg">
                        <h3 className="text-white text-2xl font-bold text-center font-vazirmatn">
                          {formData.discountType}
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-col items-end" dir="rtl">
                      {generatedOffer
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((line, index) => (
                          <p
                            key={index}
                            className="text-lg md:text-xl leading-relaxed w-full px-4 py-2 font-vazirmatn text-gray-700"
                            style={{ unicodeBidi: "bidi-override" }}
                          >
                            {line.trim()}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={handleEdit}
                    className="flex-1 flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    ✏️ Edit Offer
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
