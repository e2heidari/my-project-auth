"use client";

import React, { useState } from "react";
import { FiSearch, FiEdit2, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import Image from "next/image";

interface Offer {
  id: string;
  title: string;
  description: string;
  status: "active" | "pending" | "completed";
  createdAt: string;
}

interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  status: "active" | "pending" | "completed";
  createdAt: string;
}

export default function ManageAds() {
  const [activeTab, setActiveTab] = useState<"offers" | "ads">("offers");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([
    {
      id: "1",
      title: "Special Offer for New Customers",
      description: "Get 20% off on your first purchase",
      status: "active",
      createdAt: "2024-03-20",
    },
  ]);
  const [ads, setAds] = useState<Advertisement[]>([
    {
      id: "1",
      title: "Summer Collection",
      description: "Check out our new summer collection",
      imageUrl: "/placeholder.jpg",
      status: "active",
      createdAt: "2024-03-20",
    },
  ]);

  // Filter items based on search term and status
  const filteredItems =
    activeTab === "offers"
      ? offers.filter(
          (offer) =>
            (offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              offer.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) &&
            (filterStatus ? offer.status === filterStatus : true)
        )
      : ads.filter(
          (ad) =>
            (ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              ad.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) &&
            (filterStatus ? ad.status === filterStatus : true)
        );

  const handleStatusChange = async (
    type: "offers" | "ads",
    id: string,
    newStatus: "active" | "pending" | "completed"
  ) => {
    setIsLoading(true);
    try {
      if (type === "offers") {
        setOffers(
          offers.map((offer) =>
            offer.id === id ? { ...offer, status: newStatus } : offer
          )
        );
      } else {
        setAds(
          ads.map((ad) => (ad.id === id ? { ...ad, status: newStatus } : ad))
        );
      }
      toast.success("Status updated successfully");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (type: "offers" | "ads", id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setIsLoading(true);
    try {
      if (type === "offers") {
        setOffers(offers.filter((offer) => offer.id !== id));
      } else {
        setAds(ads.filter((ad) => ad.id !== id));
      }
      toast.success("Item deleted successfully");
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    toast.success("Edit functionality coming soon!");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Active Items
          </h3>
          <p className="text-3xl font-bold text-indigo-600">
            {offers.filter((o) => o.status === "active").length +
              ads.filter((a) => a.status === "active").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Pending Items
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {offers.filter((o) => o.status === "pending").length +
              ads.filter((a) => a.status === "pending").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-100">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Completed Items
          </h3>
          <p className="text-3xl font-bold text-yellow-600">
            {offers.filter((o) => o.status === "completed").length +
              ads.filter((a) => a.status === "completed").length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab("offers")}
          className={`pb-2 px-4 ${
            activeTab === "offers"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Offers
        </button>
        <button
          onClick={() => setActiveTab("ads")}
          className={`pb-2 px-4 ${
            activeTab === "ads"
              ? "border-b-2 border-indigo-500 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Advertisements
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
        >
          <option value="" className="text-gray-400">
            All Status
          </option>
          <option value="active" className="text-gray-900">
            Active
          </option>
          <option value="pending" className="text-gray-900">
            Pending
          </option>
          <option value="completed" className="text-gray-900">
            Completed
          </option>
        </select>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No items found</div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex space-x-4">
                  {"imageUrl" in item && (
                    <Image
                      src={item.imageUrl as string}
                      alt={item.title}
                      width={80}
                      height={80}
                      className="object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Created: {item.createdAt}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      handleStatusChange(
                        activeTab,
                        item.id,
                        e.target.value as "active" | "pending" | "completed"
                      )
                    }
                    className="text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    disabled={isLoading}
                  >
                    <option value="active" className="text-gray-900">
                      Active
                    </option>
                    <option value="pending" className="text-gray-900">
                      Pending
                    </option>
                    <option value="completed" className="text-gray-900">
                      Completed
                    </option>
                  </select>
                  <button
                    onClick={() => handleEdit()}
                    className="p-1 text-gray-600 hover:text-indigo-600"
                    title="Edit"
                  >
                    <FiEdit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(activeTab, item.id)}
                    className="p-1 text-gray-600 hover:text-red-600"
                    title="Delete"
                    disabled={isLoading}
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
