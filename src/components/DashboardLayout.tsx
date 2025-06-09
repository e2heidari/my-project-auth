"use client";

import { useState, useRef, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { FiMenu, FiX } from "react-icons/fi";
import SignOutButton from "./SignOutButton";
import MakeOfferForm from "./MakeOfferForm";
import CreateAdForm from "@/components/CreateAdForm";
import ManageAds from "@/components/ManageAds";
import { useSession } from "next-auth/react";
import SubscriptionManagement from "./SubscriptionManagement";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeContent, setActiveContent] = useState<
    "dashboard" | "make-offer" | "create-ad" | "manage" | "subscription"
  >("dashboard");
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleContentChange = (content: typeof activeContent) => {
    // Save current form data before switching
    if (activeContent === "make-offer" && session?.user?.id) {
      const offerFormData = localStorage.getItem(
        `offerFormData_${session.user.id}`
      );
      if (offerFormData) {
        // Keep the data in localStorage with the user-specific key
        localStorage.setItem(`offerFormData_${session.user.id}`, offerFormData);
      }
    } else if (activeContent === "create-ad" && session?.user?.id) {
      const adFormData = localStorage.getItem(`adFormData_${session.user.id}`);
      if (adFormData) {
        // Keep the data in localStorage with the user-specific key
        localStorage.setItem(`adFormData_${session.user.id}`, adFormData);
      }
    }

    // No need to move data between different keys, just keep it in the user-specific key
    setActiveContent(content);
    setIsSidebarOpen(false);
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up localStorage when component unmounts
      if (session?.user?.id) {
        localStorage.removeItem(`offerFormData_${session.user.id}`);
        localStorage.removeItem(`adFormData_${session.user.id}`);
      }
    };
  }, [session?.user?.id]);

  const getHeaderText = () => {
    switch (activeContent) {
      case "dashboard":
        return "Dashboard";
      case "make-offer":
        return "Make Offer";
      case "create-ad":
        return "Create Advertisement";
      case "manage":
        return "Manage Offers & Ads";
      case "subscription":
        return "Subscription";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Fixed Header Container */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white z-50 shadow-sm">
        {/* Mobile Burger Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-[60] md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
        >
          {isSidebarOpen ? (
            <FiX className="h-6 w-6" />
          ) : (
            <FiMenu className="h-6 w-6" />
          )}
        </button>

        {/* Header Text */}
        <div
          className={`fixed top-4 left-16 md:left-72 z-[60] bg-white px-4 py-2 rounded-md transition-opacity duration-300 ${isSidebarOpen ? "opacity-0 md:opacity-100" : "opacity-100"}`}
        >
          <span className="text-xl font-semibold text-gray-800">
            {getHeaderText()}
          </span>
        </div>

        {/* Sign Out Button */}
        <div className="fixed top-4 right-4 z-[60]">
          <SignOutButton />
        </div>
      </div>

      <div className="flex pt-16">
        {/* Sidebar - Mobile Overlay */}
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 z-40 transition-opacity duration-300 md:hidden ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`fixed top-16 bottom-0 left-0 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition duration-300 ease-in-out z-40 w-64 bg-white shadow-sm`}
        >
          <nav className="space-y-1">
            <button
              onClick={() => handleContentChange("dashboard")}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                activeContent === "dashboard"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <svg
                className="mr-3 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => handleContentChange("make-offer")}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                activeContent === "make-offer"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <svg
                className="mr-3 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Make Offer
            </button>

            <button
              onClick={() => handleContentChange("create-ad")}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                activeContent === "create-ad"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <svg
                className="mr-3 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Create Ad
            </button>

            <button
              onClick={() => handleContentChange("manage")}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                activeContent === "manage"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <svg
                className="mr-3 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Manage
            </button>

            <button
              onClick={() => handleContentChange("subscription")}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                activeContent === "subscription"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <svg
                className="mr-3 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
              Subscription
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {activeContent === "dashboard" && children}
              {activeContent === "make-offer" && <MakeOfferForm />}
              {activeContent === "create-ad" && <CreateAdForm />}
              {activeContent === "manage" && <ManageAds />}
              {activeContent === "subscription" && <SubscriptionManagement />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
