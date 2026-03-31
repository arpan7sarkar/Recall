"use client";

import { useState, useCallback } from "react";
import { useAddContentStore } from "@/store/addContentStore";
import { useUIStore } from "@/store/uiStore";
import { SourceTypePicker } from "./SourceTypePicker";
import { ContentDetailsForm } from "./ContentDetailsForm";
import { MetadataForm } from "./MetadataForm";

export function AddContentStepper() {
  const { step, resetForm, resetForAnotherSave } = useAddContentStore();
  const { closeAddContent } = useUIStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Simulate save — in production this calls useCreateItem or useUploadItem
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    resetForm();
    closeAddContent();
  }, [resetForm, closeAddContent]);

  const handleSaveAndAdd = useCallback(async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    resetForAnotherSave();
  }, [resetForAnotherSave]);

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
