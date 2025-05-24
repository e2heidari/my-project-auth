"use client";

import { useState } from "react";
import Image from "next/image";

export interface AdFormData {
  title: string;
  description: string;
  targetPage: string;
  imageFile: File | null;
  imageDescription: string;
  generatedImage: string | null;
}

export default function CreateAdForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AdFormData>({
    title: "",
    description: "",
    targetPage: "",
    imageFile: null,
    imageDescription: "",
    generatedImage: null,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.imageDescription) {
      alert("Please provide an image description first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: formData.imageDescription,
          businessId: "current-business-id", // TODO: Get this from your auth context
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      setFormData({
        ...formData,
        generatedImage: data.imageUrl,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement ad submission API call here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Advertisement created successfully!");
      setFormData({
        title: "",
        description: "",
        targetPage: "",
        imageFile: null,
        imageDescription: "",
        generatedImage: null,
      });
    } catch (error) {
      console.error("Error creating advertisement:", error);
      alert("Failed to create advertisement. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-gray-700">
        Create Advertisement
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Advertisement Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Advertisement Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
            required
          />
        </div>

        <div>
          <label
            htmlFor="targetPage"
            className="block text-sm font-medium text-gray-700"
          >
            Target Page
          </label>
          <select
            id="targetPage"
            value={formData.targetPage}
            onChange={(e) =>
              setFormData({ ...formData, targetPage: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
            required
          >
            <option value="" className="text-gray-400">
              Select a page
            </option>
            <option value="home" className="text-gray-900">
              Home Page
            </option>
            <option value="category" className="text-gray-900">
              Category Page
            </option>
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="imageDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Image Description for AI Generation
            </label>
            <textarea
              id="imageDescription"
              value={formData.imageDescription}
              onChange={(e) =>
                setFormData({ ...formData, imageDescription: e.target.value })
              }
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
              placeholder="Describe the image you want to generate..."
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateImage}
            disabled={isLoading || !formData.imageDescription}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Generating..." : "Generate Image with AI"}
          </button>

          {formData.generatedImage && (
            <div className="mt-4">
              <Image
                src={formData.generatedImage}
                alt="Generated advertisement"
                width={400}
                height={300}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="imageUpload"
            className="block text-sm font-medium text-gray-700"
          >
            Or Upload Your Own Image
          </label>
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            onChange={handleImageUpload}
            className="mt-1 block w-full"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Advertisement"}
          </button>
        </div>
      </form>
    </div>
  );
}
