"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface OfferFormData {
  title: string;
  description: string;
  price: number;
  duration: string;
  imageUrl?: string;
}

export default function MakeOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get("id");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<OfferFormData>({
    title: "",
    description: "",
    price: 0,
    duration: "",
  });

  useEffect(() => {
    if (offerId) {
      fetchOffer(offerId);
    }
  }, [offerId]);

  const fetchOffer = async (id: string) => {
    try {
      const response = await fetch(`/api/offers?id=${id}`);
      if (!response.ok) throw new Error("Failed to fetch offer");
      const data = await response.json();
      setFormData(data.offer);
    } catch (error) {
      console.error("Error fetching offer:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      // Generate description using AI
      const response = await fetch("/api/generate-offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          businessId: "1", // TODO: Get actual business ID
        }),
      });

      if (!response.ok) throw new Error("Failed to generate offer");
      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        description: data.description,
      }));

      // Generate image using AI
      const imageResponse = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Create a professional business advertisement image for: ${formData.title}`,
          businessId: "1", // TODO: Get actual business ID
        }),
      });

      if (!imageResponse.ok) throw new Error("Failed to generate image");
      const imageData = await imageResponse.json();

      setFormData((prev) => ({
        ...prev,
        imageUrl: imageData.imageUrl,
      }));
    } catch (error) {
      console.error("Error generating with AI:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleEdit = () => {
    setIsPreviewOpen(false);
  };

  const handleSubmit = async () => {
    try {
      const url = offerId ? `/api/offers?id=${offerId}` : "/api/offers";
      const method = offerId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          businessId: "1", // TODO: Get actual business ID
        }),
      });

      if (!response.ok) throw new Error("Failed to submit offer");

      router.push("/dashboard/manage");
    } catch (error) {
      console.error("Error submitting offer:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {offerId ? "Edit Offer" : "Create New Offer"}
      </h1>

      {!isPreviewOpen ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded h-32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Duration</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !formData.title}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate with AI"}
            </button>
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Preview Offer
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Offer Preview</h2>

          {formData.imageUrl && (
            <div className="mb-6 relative w-full h-64">
              <Image
                src={formData.imageUrl}
                alt="Generated offer image"
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Title</h3>
              <p>{formData.title}</p>
            </div>

            <div>
              <h3 className="font-medium">Description</h3>
              <p>{formData.description}</p>
            </div>

            <div>
              <h3 className="font-medium">Price</h3>
              <p>${formData.price}</p>
            </div>

            <div>
              <h3 className="font-medium">Duration</h3>
              <p>{formData.duration}</p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Edit Offer
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Submit Offer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
