"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import {
  FiHome,
  FiPlusCircle,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import MakeOfferForm from "./MakeOfferForm";
import CreateAdForm from "@/components/CreateAdForm";
import ManageAds from "@/components/ManageAds";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeContent, setActiveContent] = useState<
    "dashboard" | "make-offer" | "create-ad" | "manage"
  >("dashboard");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleContentChange = (content: typeof activeContent) => {
    setActiveContent(content);
    setIsSidebarOpen(false);
  };

  const getHeaderText = () => {
    switch (activeContent) {
      case "dashboard":
        return "Business Dashboard";
      case "make-offer":
        return "Make Offer";
      case "create-ad":
        return "Create Advertisement";
      case "manage":
        return "Manage Offers & Ads";
      default:
        return "Business Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Fixed Header Container */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gray-50 z-50 shadow-sm">
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
          className={`fixed top-4 left-16 md:left-72 z-[60] bg-gray-50 px-4 py-2 rounded-md transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-0 md:opacity-100" : "opacity-100"
          }`}
        >
          <span className="text-xl font-semibold text-gray-800">
            {getHeaderText()}
          </span>
        </div>

        {/* Business Icon in Top Right Corner */}
        <div className="fixed top-4 right-4 z-[60]" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center focus:outline-none"
          >
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-md shadow-lg py-1 z-[70]">
              <button
                onClick={() => signOut()}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FiLogOut className="mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
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
          className={`fixed inset-y-0 left-0 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition duration-300 ease-in-out z-40 w-64 bg-white shadow-sm h-[calc(100vh-4rem)]`}
        >
          <nav className="mt-5 px-2">
            <button
              onClick={() => handleContentChange("dashboard")}
              className={`w-full group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                activeContent === "dashboard"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FiHome className="mr-3 h-5 w-5" />
              Dashboard
            </button>

            <button
              onClick={() => handleContentChange("make-offer")}
              className={`w-full group flex items-center px-2 py-2 text-base font-medium rounded-md mt-2 ${
                activeContent === "make-offer"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FiPlusCircle className="mr-3 h-5 w-5" />
              Make Offer
            </button>

            <button
              onClick={() => handleContentChange("create-ad")}
              className={`w-full group flex items-center px-2 py-2 text-base font-medium rounded-md mt-2 ${
                activeContent === "create-ad"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FiPlusCircle className="mr-3 h-5 w-5" />
              Create Advertisement
            </button>

            <button
              onClick={() => handleContentChange("manage")}
              className={`w-full group flex items-center px-2 py-2 text-base font-medium rounded-md mt-2 ${
                activeContent === "manage"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FiSettings className="mr-3 h-5 w-5" />
              Manage Offers & Ads
            </button>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <button className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <FiHelpCircle className="mr-3 h-5 w-5" />
                Help & Support
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 p-6">
          {activeContent === "make-offer" ? (
            <MakeOfferForm />
          ) : activeContent === "create-ad" ? (
            <CreateAdForm />
          ) : activeContent === "manage" ? (
            <ManageAds />
          ) : (
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900 mb-8">
                Welcome to Your Dashboard
              </h1>
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
