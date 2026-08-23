"use client";

import { useState, useCallback, useRef } from "react";
import { useAddContentStore } from "@/store/addContentStore";
import { useUIStore } from "@/store/uiStore";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api";
import { buildUrlSavePayload } from "@/lib/saveContract";
import { invalidateGraphQuery } from "@/lib/queryKeys";
import { SourceTypePicker } from "./SourceTypePicker";
import { ContentDetailsForm } from "./ContentDetailsForm";
import { MetadataForm } from "./MetadataForm";
import { cn } from "@/lib/utils";

export function AddContentStepper() {
  const { step, resetForm, resetForAnotherSave } = useAddContentStore();
  const { closeAddContent } = useUIStore();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveInFlight = useRef(false);

  const performSave = useCallback(async () => {
    const {
      selectedType,
      url,
      file,
      title,
      author,
      podcastName,
      note,
      youtubeTimestamp,
      tags,
      collectionId,
    } = useAddContentStore.getState();
    const token = await getToken();
    if (!token) throw new Error("Missing auth token");
    const isUpload = selectedType === "pdf" || selectedType === "image";

    if (isUpload && file) {
      const formData = new FormData();
      formData.append("file", file);
      if (title.trim()) formData.append("title", title.trim());
      formData.append("itemType", selectedType || "pdf");
      if (author.trim()) formData.append("author", author.trim());
      if (podcastName.trim()) formData.append("podcastName", podcastName.trim());
      if (note.trim()) formData.append("note", note.trim());
      if (collectionId) formData.append("collectionId", collectionId);
      tags.forEach(t => formData.append("tags", t)); // Send multiple tags
      
      await api.upload("/items/upload", formData, { token });
    } else {
      await api.post(
        "/items",
        buildUrlSavePayload({
          url,
          selectedType,
          title,
          author,
          podcastName,
          note,
          youtubeTimestamp,
          tags,
          collectionId,
        }),
        { token },
      );
    }
  }, [getToken]);

  const handleSave = useCallback(async () => {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      await performSave();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        invalidateGraphQuery(queryClient),
        queryClient.invalidateQueries({ queryKey: ["collections"] }),
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
      ]);
      resetForm();
      closeAddContent();
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Save failed. Check your connection and try again."));
    } finally {
      setIsSaving(false);
      saveInFlight.current = false;
    }
  }, [performSave, queryClient, resetForm, closeAddContent]);

  const handleSaveAndAdd = useCallback(async () => {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      await performSave();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        invalidateGraphQuery(queryClient),
        queryClient.invalidateQueries({ queryKey: ["collections"] }),
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
      ]);
      resetForAnotherSave();
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Save failed. Check your connection and try again."));
    } finally {
      setIsSaving(false);
      saveInFlight.current = false;
    }
  }, [performSave, queryClient, resetForAnotherSave]);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress indicators - Obsidian Style */}
      <div className="flex items-center justify-center gap-2.5 mb-10">
        {(["type", "input", "metadata"] as const).map((s, i) => (
          <div
            key={s}
            className={cn(
               "h-1 transition-all duration-500 rounded-full",
               step === s ? "w-8 bg-[var(--accent-500)] shadow-[0_0_10px_var(--accent-500)]" : 
               (["type", "input", "metadata"].indexOf(step) > i ? "w-4 bg-[var(--accent-500)]/40" : "bg-[var(--bg-tertiary)] w-4")
            )}
          />
        ))}
      </div>

      {saveError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <p>{saveError}</p>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="mt-2 text-xs font-medium underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

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
