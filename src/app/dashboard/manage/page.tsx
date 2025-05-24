"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  status: string;
  createdAt: string;
}

export default function ManageOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/offers?businessId=1"); // TODO: Get actual business ID
      if (!response.ok) {
        throw new Error("Failed to fetch offers");
      }
      const data = await response.json();
      setOffers(data.offers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const response = await fetch(`/api/offers?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete offer");
      }

      setOffers(offers.filter((offer) => offer.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete offer");
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/make-offer?id=${id}`);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Offers & Ads</h1>
        <button
          onClick={() => router.push("/dashboard/make-offer")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Offer
        </button>
      </div>

      <div className="grid gap-6">
        {offers.map((offer) => (
          <div key={offer.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">{offer.title}</h2>
                <p className="text-gray-600 mb-2">{offer.description}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Price: ${offer.price}</span>
                  <span>Duration: {offer.duration}</span>
                  <span>Status: {offer.status}</span>
                  <span>
                    Created: {new Date(offer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(offer.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(offer.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {offers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No offers found. Create your first offer!
          </div>
        )}
      </div>
    </div>
  );
}
