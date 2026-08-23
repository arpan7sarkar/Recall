import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  favoriteMutationMock,
  retryMutationMock,
  useToggleFavoriteMock,
  useRetryItemMock,
  routerMock,
} = vi.hoisted(() => ({
  favoriteMutationMock: { mutateAsync: vi.fn(), isPending: false },
  retryMutationMock: { mutateAsync: vi.fn(), isPending: false },
  useToggleFavoriteMock: vi.fn(),
  useRetryItemMock: vi.fn(),
  routerMock: { push: vi.fn() },
}));

vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));
vi.mock("next/script", () => ({ default: () => null }));
vi.mock("@/components/shared/TypeBadge", () => ({ TypeBadge: () => <span>Article</span> }));
vi.mock("@/components/shared/Icon", () => ({ Icon: () => <span aria-hidden="true">icon</span> }));
vi.mock("@/components/ui/unique-loader-components", () => ({ LoaderOne: () => <span>Loading</span> }));
vi.mock("@/components/items/SocialPostPreview", () => ({ SocialPostPreview: () => null }));
vi.mock("@/components/items/InstagramAutoEmbed", () => ({ InstagramAutoEmbed: () => null }));
vi.mock("@/hooks/useItems", () => ({
  useArchiveItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUnarchiveItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useToggleFavorite: useToggleFavoriteMock,
  useRetryItem: useRetryItemMock,
}));

import { ItemCard } from "@/components/items/ItemCard";
import type { Item } from "@/types";

const item: Item = {
  id: "item-1",
  userId: "user-1",
  url: "https://example.com/story",
  title: "A saved story",
  description: "A useful story",
  contentText: null,
  thumbnailUrl: null,
  fileUrl: null,
  itemType: "article",
  saveSource: "web_url",
  status: "ready",
  processingStage: "complete",
  processingError: null,
  processingAttempt: 0,
  readingTime: 3,
  wordCount: 500,
  sourceDomain: "example.com",
  author: null,
  publishedAt: null,
  savedAt: "2026-08-24T00:00:00.000Z",
  lastViewedAt: null,
  viewCount: 0,
  isArchived: false,
  isFavourite: false,
  userNote: null,
  youtubeTimestamp: null,
  tags: [],
};

describe("ItemCard recovery actions", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    useToggleFavoriteMock.mockReturnValue(favoriteMutationMock);
    useRetryItemMock.mockReturnValue(retryMutationMock);
    favoriteMutationMock.isPending = false;
    retryMutationMock.isPending = false;
  });

  it("lets a user favorite an item instead of rendering a non-interactive heart", async () => {
    favoriteMutationMock.mutateAsync.mockResolvedValue({ ...item, isFavourite: true });
    const user = userEvent.setup();

    render(<ItemCard item={item} />);
    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    expect(favoriteMutationMock.mutateAsync).toHaveBeenCalledWith({ id: "item-1", isFavourite: true });
  });

  it("shows the persisted failure reason and offers retry", async () => {
    const failedItem: Item = {
      ...item,
      status: "failed",
      processingStage: "queue",
      processingError: "Redis is unavailable. Start the worker and retry.",
    };
    retryMutationMock.mutateAsync.mockResolvedValue({ ...failedItem, status: "pending" });
    const user = userEvent.setup();

    render(<ItemCard item={failedItem} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/Redis is unavailable/i);
    expect(screen.getByText(/Stage: queue/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry processing" }));

    expect(retryMutationMock.mutateAsync).toHaveBeenCalledWith("item-1");
    expect(await screen.findByRole("status")).toHaveTextContent(/Retry queued/i);
  });

  it("keeps retry errors visible and actionable when the queue rejects them", async () => {
    const failedItem: Item = { ...item, status: "failed", processingError: "The worker stopped." };
    retryMutationMock.mutateAsync.mockRejectedValue(new Error("Redis is unavailable. Start the worker and retry."));
    const user = userEvent.setup();

    render(<ItemCard item={failedItem} />);
    await user.click(screen.getByRole("button", { name: "Retry processing" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Redis is unavailable/i));
  });

  it("explains duplicate retries instead of silently doing nothing", async () => {
    const failedItem: Item = { ...item, status: "failed", processingError: "The worker stopped." };
    retryMutationMock.mutateAsync.mockRejectedValue(new Error("Item is already being retried. Refresh and try again."));
    const user = userEvent.setup();

    render(<ItemCard item={failedItem} />);
    await user.click(screen.getByRole("button", { name: "Retry processing" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/already being retried/i));
  });
});
