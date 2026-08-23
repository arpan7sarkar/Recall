import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  favoriteMutationMock,
  retryMutationMock,
  useItemMock,
  routerMock,
} = vi.hoisted(() => ({
  favoriteMutationMock: { mutateAsync: vi.fn(), isPending: false },
  retryMutationMock: { mutateAsync: vi.fn(), isPending: false },
  useItemMock: vi.fn(),
  routerMock: { back: vi.fn(), push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "item-1" }),
  useRouter: () => routerMock,
}));
vi.mock("@/hooks/useItems", () => ({
  useItem: useItemMock,
  useArchiveItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUnarchiveItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useToggleFavorite: () => favoriteMutationMock,
  useRetryItem: () => retryMutationMock,
}));
vi.mock("@/hooks/useCollections", () => ({
  useCollections: () => ({ data: [] }),
  useAddItemToCollection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateCollection: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/components/shared/TypeBadge", () => ({ TypeBadge: () => <span>Article</span> }));
vi.mock("@/components/shared/TagChip", () => ({ TagChip: () => null }));
vi.mock("@/components/shared/Icon", () => ({ Icon: () => <span aria-hidden="true">icon</span> }));
vi.mock("@/components/items/RelatedItems", () => ({ RelatedItems: () => null }));
vi.mock("@/components/items/TweetPreview", () => ({ TweetPreview: () => null }));
vi.mock("@/components/items/SocialPostPreview", () => ({ SocialPostPreview: () => null }));
vi.mock("@/components/items/InstagramAutoEmbed", () => ({ InstagramAutoEmbed: () => null }));
vi.mock("@/components/ui/unique-loader-components", () => ({
  LoaderFive: () => <span>Loading</span>,
  LoaderTwo: () => null,
}));
vi.mock("@/lib/api", () => ({
  getApiErrorMessage: (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback,
}));

import ItemDetailPage from "@/app/dashboard/items/[id]/page";
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

describe("item detail recovery actions", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    favoriteMutationMock.isPending = false;
    retryMutationMock.isPending = false;
    useItemMock.mockReturnValue({ data: item, isLoading: false, error: null });
  });

  it("connects the detail favorite control to the API mutation", async () => {
    favoriteMutationMock.mutateAsync.mockResolvedValue({ ...item, isFavourite: true });
    const user = userEvent.setup();

    render(<ItemDetailPage />);
    await user.click(screen.getByRole("button", { name: "Save to Favorites" }));

    expect(favoriteMutationMock.mutateAsync).toHaveBeenCalledWith({ id: "item-1", isFavourite: true });
  });

  it("shows the detail retry reason and queue failure", async () => {
    const failedItem: Item = { ...item, status: "failed", processingStage: "queue", processingError: "Redis is unavailable." };
    useItemMock.mockReturnValue({ data: failedItem, isLoading: false, error: null });
    retryMutationMock.mutateAsync.mockRejectedValue(new Error("Retry could not be queued."));
    const user = userEvent.setup();

    render(<ItemDetailPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Redis is unavailable/i);
    await user.click(screen.getByRole("button", { name: "Retry processing" }));

    await waitFor(() => expect(screen.getAllByRole("alert").some((alert) => /Retry could not be queued/i.test(alert.textContent ?? ""))).toBe(true));
  });
});
