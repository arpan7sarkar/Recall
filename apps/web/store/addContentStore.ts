"use client";

import { create } from "zustand";
import type { ItemType } from "@/types";

type AddStep = "type" | "input" | "metadata";

interface AddContentState {
  step: AddStep;
  selectedType: ItemType | null;
  url: string;
  file: File | null;
  title: string;
  author: string;
  note: string;
  podcastName: string;
  youtubeTimestamp: string;
  tags: string[];
  collectionId: string | null;

  setStep: (step: AddStep) => void;
  setSelectedType: (type: ItemType) => void;
  setUrl: (url: string) => void;
  setFile: (file: File | null) => void;
  setTitle: (title: string) => void;
  setAuthor: (author: string) => void;
  setNote: (note: string) => void;
  setPodcastName: (name: string) => void;
  setYoutubeTimestamp: (ts: string) => void;
  setTags: (tags: string[]) => void;
  setCollectionId: (id: string | null) => void;
  resetForm: () => void;
  resetForAnotherSave: () => void;
}

const initialState = {
  step: "type" as AddStep,
  selectedType: null as ItemType | null,
  url: "",
  file: null as File | null,
  title: "",
  author: "",
  note: "",
  podcastName: "",
  youtubeTimestamp: "",
  tags: [] as string[],
  collectionId: null as string | null,
};

export const useAddContentStore = create<AddContentState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setSelectedType: (type) => set({ selectedType: type, step: "input" }),
  setUrl: (url) => set({ url }),
  setFile: (file) => set({ file }),
  setTitle: (title) => set({ title }),
  setAuthor: (author) => set({ author }),
  setNote: (note) => set({ note }),
  setPodcastName: (name) => set({ podcastName: name }),
  setYoutubeTimestamp: (ts) => set({ youtubeTimestamp: ts }),
  setTags: (tags) => set({ tags }),
  setCollectionId: (id) => set({ collectionId: id }),
  resetForm: () => set(initialState),
  resetForAnotherSave: () =>
    set((s) => ({
      ...initialState,
      step: "input",
      selectedType: s.selectedType,
    })),
}));
