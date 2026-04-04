"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { useAddContentStore } from "@/store/addContentStore";
import { AddContentStepper } from "@/components/add-content/AddContentStepper";

export function AddContentModal() {
  const { addContentModalOpen, closeAddContent } = useUIStore();
  const { resetForm } = useAddContentStore();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && addContentModalOpen) {
        closeAddContent();
        resetForm();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addContentModalOpen, closeAddContent, resetForm]);

  // Prevent body scroll when open
  useEffect(() => {
    if (addContentModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [addContentModalOpen]);

  if (!addContentModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => {
          closeAddContent();
          resetForm();
        }}
      />

      {/* Modal body */}
      <div
        className="relative w-full max-w-xl mx-4 p-10 rounded-2xl overflow-y-auto max-h-[85vh] bg-[#0e0e0e] border border-white/5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Add content"
      >
        {/* Close button */}
        <button
          onClick={() => {
            closeAddContent();
            resetForm();
          }}
          className="absolute top-6 right-6 p-2 rounded-lg transition-all duration-300 text-zinc-500 hover:text-white hover:bg-white/5"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <AddContentStepper />
      </div>
    </div>
  );
}
