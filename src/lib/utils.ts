import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatDate(date: string | Date) {
  const d = new Date(date);
  const formattedDate = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return formattedDate;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clearLocalStorage() {
  // Clear all form data
  localStorage.removeItem("adFormData");
  localStorage.removeItem("adGeneratedText");
  localStorage.removeItem("adShowPreview");
  localStorage.removeItem("offerFormData");
  localStorage.removeItem("generatedOffer");
} 