"use client";

import { useState } from "react";
import { useAddContentStore } from "@/store/addContentStore";
import { TagChip } from "@/components/shared/TagChip";
import { MOCK_TAGS } from "@/lib/mock-data";
import { useCollections, useCreateCollection } from "@/hooks/useCollections";

interface MetadataFormProps {
  onSave: () => void;
  onSaveAndAdd: () => void;
  isSaving: boolean;
}

export function MetadataForm({ onSave, onSaveAndAdd, isSaving }: MetadataFormProps) {
  const { tags, collectionId, setTags, setCollectionId, setStep } = useAddContentStore();
  const { data: collections = [] } = useCollections();
  const createCollection = useCreateCollection();

  const [tagInput, setTagInput] = useState("");
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionError, setCollectionError] = useState<string | null>(null);

  const filteredSuggestions = MOCK_TAGS
    .filter(
      (t) =>
        t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
        !tags.includes(t.name)
    )
    .slice(0, 5);

  const addTag = (name: string) => {
    if (tags.length < 5 && !tags.includes(name)) {
      setTags([...tags, name]);
    }
    setTagInput("");
  };

  const removeTag = (name: string) => {
    setTags(tags.filter((t) => t !== name));
  };

  const handleCreateCollection = async () => {
    const normalizedName = newCollectionName.trim();
    if (!normalizedName) {
      setCollectionError("Collection name is required.");
      return;
    }

    try {
      setCollectionError(null);
      const created = await createCollection.mutateAsync({ name: normalizedName });
      setCollectionId(created.id);
      setNewCollectionName("");
      setShowCreateCollection(false);
    } catch (err: any) {
      setCollectionError(err?.body?.error ?? "Failed to create collection.");
    }
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => setStep("input")}
        className="flex items-center gap-1 text-sm font-medium focus-ring"
        style={{ color: "var(--accent-500)" }}
      >
        Back
      </button>

      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Tags and Collection
      </h3>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Tags (up to 5)
        </label>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((t) => (
              <TagChip key={t} name={t} removable onRemove={() => removeTag(t)} />
            ))}
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                addTag(tagInput.trim());
              }
            }}
            placeholder={tags.length >= 5 ? "Max 5 tags" : "Type a tag and press Enter..."}
            disabled={tags.length >= 5}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring disabled:opacity-40"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-md)",
            }}
          />

          {tagInput && filteredSuggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {filteredSuggestions.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag.name)}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: "var(--text-primary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  #{tag.name}
                  {tag.isAiGenerated && <span className="ml-1 opacity-50">AI</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Add to Collection (optional)
        </label>
        <select
          value={collectionId ?? ""}
          onChange={(e) => {
            if (e.target.value === "__new_collection__") {
              setShowCreateCollection(true);
              return;
            }
            setCollectionId(e.target.value || null);
          }}
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <option value="">No collection</option>
          <option value="__new_collection__">+ Create new collection</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {showCreateCollection && (
          <div className="mt-2 space-y-2">
            <input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="New collection name"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus-ring"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />

            {collectionError && <p className="text-xs text-red-500">{collectionError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateCollection}
                disabled={createCollection.isPending}
                className="btn-secondary focus-ring rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-60"
              >
                {createCollection.isPending ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateCollection(false);
                  setCollectionError(null);
                }}
                className="btn-secondary focus-ring rounded-lg px-3 py-2 text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="btn-primary focus-ring flex-1 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onSaveAndAdd}
          disabled={isSaving}
          className="btn-secondary focus-ring flex-1 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          Save and Add Another
        </button>
      </div>
    </div>
  );
}
