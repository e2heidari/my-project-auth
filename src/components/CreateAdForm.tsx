"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

export interface AdFormData {
  title: string;
  description: string;
  targetPage: string;
  imageFile: File | null;
  imageDescription: string;
  generatedImage: string | null;
  uploadedImageUrl: string | null;
}

export default function CreateAdForm() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>("");
  const [formData, setFormData] = useState<AdFormData>(() => {
    // Load saved data from localStorage if it exists
    if (typeof window !== "undefined" && session?.user?.id) {
      const savedData = localStorage.getItem(`adFormData_${session.user.id}`);
      const savedGeneratedText = localStorage.getItem(
        `adGeneratedText_${session.user.id}`
      );
      const savedShowPreview = localStorage.getItem(
        `adShowPreview_${session.user.id}`
      );

      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          return {
            ...parsedData,
            imageFile: null, // We can't store File objects in localStorage
          };
        } catch (error) {
          console.error("Error parsing saved form data:", error);
        }
      }

      if (savedGeneratedText) {
        setGeneratedText(savedGeneratedText);
      }

      if (savedShowPreview) {
        setShowPreview(savedShowPreview === "true");
      }
    }

    return {
      title: "",
      description: "",
      targetPage: "",
      imageFile: null,
      imageDescription: "",
      generatedImage: null,
      uploadedImageUrl: null,
    };
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && session?.user?.id) {
      localStorage.setItem(
        `adFormData_${session.user.id}`,
        JSON.stringify({
          ...formData,
          imageFile: null, // Don't store File objects
        })
      );
      localStorage.setItem(`adGeneratedText_${session.user.id}`, generatedText);
      localStorage.setItem(
        `adShowPreview_${session.user.id}`,
        showPreview.toString()
      );
    }
  }, [formData, generatedText, showPreview, session?.user?.id]);

  // Cleanup effect with proper dependencies
  useEffect(() => {
    const userId = session?.user?.id;
    const isSubmitting = isLoading;

    return () => {
      // Only clean up if we're actually submitting the form
      if (userId && !isSubmitting) {
        // localStorage.removeItem(`adFormData_${userId}`);
        // localStorage.removeItem(`adGeneratedText_${userId}`);
        // localStorage.removeItem(`adShowPreview_${userId}`);
      }
    };
  }, []); // Empty dependency array since we're using closure values

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a URL for the uploaded file
      const imageUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        imageFile: file,
        uploadedImageUrl: imageUrl,
      });
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (formData.uploadedImageUrl) {
        URL.revokeObjectURL(formData.uploadedImageUrl);
      }
    };
  }, [formData.uploadedImageUrl]);

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

  const handleCreatePreview = async () => {
    if (
      !formData.title ||
      !formData.targetPage ||
      (!formData.imageFile && !formData.imageDescription)
    ) {
      alert("Please fill in all required fields first");
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Sending request with data:", {
        title: formData.title,
        description: formData.description,
        targetPage: formData.targetPage,
        imageDescription: formData.imageDescription || "",
        hasUploadedImage: !!formData.imageFile,
      });

      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          targetPage: formData.targetPage,
          imageDescription: formData.imageDescription || "",
          hasUploadedImage: !!formData.imageFile,
        }),
      });

      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (!response.ok) {
        throw new Error(
          responseData.error || "Failed to generate advertisement"
        );
      }

      // Store the generated text in a separate state
      setGeneratedText(responseData.adText);

      // Update form data with generated content
      setFormData((prevData) => ({
        ...prevData,
        imageDescription: responseData.imagePrompt || prevData.imageDescription,
      }));

      // Generate image using the enhanced prompt only if no image is uploaded
      if (responseData.imagePrompt && !formData.imageFile) {
        // Update the image description with the new prompt before generating
        setFormData((prevData) => ({
          ...prevData,
          imageDescription: responseData.imagePrompt,
        }));

        // Wait for state update
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Now generate the image with the new prompt
        await handleGenerateImage();
      }

      setShowPreview(true);
    } catch (error) {
      console.error("Error creating preview:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create preview. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Add a function to handle description changes
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newDescription = e.target.value;
    setFormData((prevData) => ({
      ...prevData,
      description: newDescription,
    }));
    // Clear generated text when user manually changes the description
    setGeneratedText("");
  };

  // Add a function to reset the form
  const handleReset = () => {
    // Revoke the object URL before resetting
    if (formData.uploadedImageUrl) {
      URL.revokeObjectURL(formData.uploadedImageUrl);
    }

    setFormData({
      title: "",
      description: "",
      targetPage: "",
      imageFile: null,
      imageDescription: "",
      generatedImage: null,
      uploadedImageUrl: null,
    });
    setGeneratedText("");
    setShowPreview(false);

    // Clear localStorage
    if (typeof window !== "undefined" && session?.user?.id) {
      localStorage.removeItem(`adFormData_${session.user.id}`);
      localStorage.removeItem(`adGeneratedText_${session.user.id}`);
      localStorage.removeItem(`adShowPreview_${session.user.id}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showPreview) {
      alert("Please create and review the preview first");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement ad submission API call here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Advertisement created successfully!");

      // Only clear the form data after successful submission
      handleReset();
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
            onChange={handleDescriptionChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
            required
            dir="rtl"
            placeholder="توضیحات آگهی را وارد کنید..."
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

        {!formData.imageFile ? (
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
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Image uploaded successfully
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    imageFile: null,
                    imageDescription: "",
                    generatedImage: null,
                    uploadedImageUrl: null,
                  })
                }
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove Image
              </button>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="imageUpload"
            className="block text-sm font-medium text-gray-700"
          >
            {formData.imageFile ? "Change Image" : "Upload Your Own Image"}
          </label>
          <div className="mt-1">
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label
              htmlFor="imageUpload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              Choose File
            </label>
            <span className="ml-3 text-sm text-gray-500">
              {formData.imageFile ? formData.imageFile.name : "No file chosen"}
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reset Form
          </button>
          <button
            type="button"
            onClick={handleCreatePreview}
            disabled={
              isGenerating ||
              !formData.title ||
              !formData.targetPage ||
              (!formData.imageFile && !formData.imageDescription)
            }
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "در حال تولید..." : "ایجاد پیش‌نمایش آگهی"}
          </button>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border border-indigo-100">
            <h3 className="text-xl font-semibold mb-4 text-indigo-600">
              Advertisement Preview
            </h3>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
              <div className="flex flex-col items-center mt-2 mb-2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 rounded-lg shadow-lg">
                  <h3 className="text-white text-2xl font-bold text-center font-vazirmatn">
                    {formData.title}
                  </h3>
                </div>
              </div>

              {/* Image Section */}
              {(formData.generatedImage || formData.uploadedImageUrl) && (
                <div className="mt-4 mb-4 relative w-full h-64">
                  {formData.generatedImage ? (
                    <Image
                      src={formData.generatedImage}
                      alt="Advertisement preview"
                      fill
                      className="object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    formData.uploadedImageUrl && (
                      <Image
                        src={formData.uploadedImageUrl}
                        alt="Uploaded advertisement"
                        fill
                        className="object-cover rounded-lg shadow-md"
                      />
                    )
                  )}
                </div>
              )}

              {/* Text Section */}
              <div className="flex flex-col items-end mt-4" dir="rtl">
                <p className="text-lg md:text-xl leading-relaxed w-full px-4 py-2 font-vazirmatn text-gray-700">
                  {generatedText}
                </p>
              </div>

              <div className="mt-4 text-sm text-gray-500 text-center">
                Target Page: {formData.targetPage}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Submit Advertisement"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
