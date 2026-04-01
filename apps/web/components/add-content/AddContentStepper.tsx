"use client";

import { useState, useCallback } from "react";
import { useAddContentStore } from "@/store/addContentStore";
import { useUIStore } from "@/store/uiStore";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { SourceTypePicker } from "./SourceTypePicker";
import { ContentDetailsForm } from "./ContentDetailsForm";
import { MetadataForm } from "./MetadataForm";

export function AddContentStepper() {
  const { step, resetForm, resetForAnotherSave } = useAddContentStore();
  const { closeAddContent } = useUIStore();
  const { getToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const performSave = async () => {
    const { selectedType, url, file, title, note, youtubeTimestamp, tags, collectionId } = useAddContentStore.getState();
    const token = await getToken();
    const isUpload = selectedType === "pdf" || selectedType === "image";

    if (isUpload && file) {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      formData.append("itemType", selectedType || "pdf");
      if (note) formData.append("note", note);
      if (collectionId) formData.append("collectionId", collectionId);
      tags.forEach(t => formData.append("tags", t)); // Send multiple tags
      
      await api.upload("/items/upload", formData, { token: token || undefined });
    } else {
      await api.post("/items", {
        url,
        itemType: selectedType,
        tags,
        collectionId,
        note,
        youtubeTimestamp,
      }, { token: token || undefined });
    }
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await performSave();
      resetForm();
      closeAddContent();
    } catch (error) {
      console.error("Failed to save item:", error);
    } finally {
      setIsSaving(false);
    }
  }, [resetForm, closeAddContent, getToken]);

  const handleSaveAndAdd = useCallback(async () => {
    setIsSaving(true);
    try {
      await performSave();
      resetForAnotherSave();
    } catch (error) {
      console.error("Failed to save item:", error);
    } finally {
      setIsSaving(false);
    }
  }, [resetForAnotherSave, getToken]);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(["type", "input", "metadata"] as const).map((s, i) => (
          <div
            key={s}
            className="rounded-full transition-all duration-200"
            style={{
              width: step === s ? 24 : 8,
              height: 8,
              background: step === s ? "var(--accent-500)" :
                (["type", "input", "metadata"].indexOf(step) > i ? "var(--accent-100)" : "var(--border)"),
              borderRadius: 999,
            }}
          />
        ))}
      </div>

      {step === "type" && <SourceTypePicker />}
      {step === "input" && <ContentDetailsForm />}
      {step === "metadata" && (
        <MetadataForm
          onSave={handleSave}
          onSaveAndAdd={handleSaveAndAdd}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
