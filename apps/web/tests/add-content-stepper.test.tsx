import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiPostMock, getTokenMock, invalidateQueriesMock, useAuthMock, useQueryClientMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(),
  getTokenMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
  useAuthMock: vi.fn(),
  useQueryClientMock: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({ useAuth: useAuthMock }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: useQueryClientMock }));
vi.mock("@/lib/api", () => ({
  api: { post: apiPostMock, upload: vi.fn() },
  getApiErrorMessage: (error: unknown) => error instanceof Error ? error.message : "Save failed. Please try again.",
}));
vi.mock("@/hooks/useCollections", () => ({
  useCollections: () => ({ data: [] }),
  useCreateCollection: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { AddContentStepper } from "@/components/add-content/AddContentStepper";
import { useAddContentStore } from "@/store/addContentStore";
import { useUIStore } from "@/store/uiStore";

describe("AddContentStepper save flow", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    getTokenMock.mockResolvedValue("token");
    useAuthMock.mockReturnValue({ getToken: getTokenMock });
    useQueryClientMock.mockReturnValue({ invalidateQueries: invalidateQueriesMock });
    useAddContentStore.getState().resetForm();
    useAddContentStore.setState({
      step: "metadata",
      selectedType: "article",
      url: "https://example.com/story",
      title: "Saved title",
      author: "Saved author",
      podcastName: "",
      note: "A note",
      youtubeTimestamp: "",
      tags: ["design"],
      collectionId: "collection-1",
    });
    useUIStore.getState().openAddContent();
  });

  it("sends metadata and refreshes related queries after saving", async () => {
    apiPostMock.mockResolvedValue({ id: "item-1" });
    const user = userEvent.setup();
    render(<AddContentStepper />);
    await user.click(screen.getByRole("button", { name: /^Save$/ }));
    await waitFor(() => expect(apiPostMock).toHaveBeenCalledOnce());
    expect(apiPostMock).toHaveBeenCalledWith("/items", expect.objectContaining({
      url: "https://example.com/story",
      title: "Saved title",
      author: "Saved author",
      tags: ["design"],
      collectionId: "collection-1",
    }), { token: "token" });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["collections"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["tags"] });
    expect(useUIStore.getState().addContentModalOpen).toBe(false);
  });

  it("shows an actionable error and keeps form values after a failed save", async () => {
    apiPostMock.mockRejectedValue(new Error("Redis is unavailable. Start the worker and retry."));
    const user = userEvent.setup();
    render(<AddContentStepper />);
    await user.click(screen.getByRole("button", { name: /^Save$/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Redis is unavailable/i);
    expect(useAddContentStore.getState()).toMatchObject({ url: "https://example.com/story", title: "Saved title", author: "Saved author", note: "A note" });
    expect(useUIStore.getState().addContentModalOpen).toBe(true);
  });

  it("does not submit twice while the first save is in flight", async () => {
    let resolveSave: (value: { id: string }) => void = () => undefined;
    apiPostMock.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
    const user = userEvent.setup();
    render(<AddContentStepper />);
    const saveButton = screen.getByRole("button", { name: /^Save$/ });
    await user.click(saveButton);
    await user.click(saveButton);
    expect(apiPostMock).toHaveBeenCalledOnce();
    resolveSave({ id: "item-1" });
    await waitFor(() => expect(useUIStore.getState().addContentModalOpen).toBe(false));
  });
});
