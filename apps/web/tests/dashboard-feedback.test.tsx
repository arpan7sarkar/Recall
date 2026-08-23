import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  routerMock,
  removeMutationMock,
  collectionHookMock,
  retrySearchMock,
} = vi.hoisted(() => ({
  routerMock: { push: vi.fn() },
  removeMutationMock: { mutateAsync: vi.fn(), isPending: false },
  collectionHookMock: vi.fn(),
  retrySearchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useParams: () => ({ id: "collection-1" }),
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("@/components/shared/TypeBadge", () => ({ TypeBadge: () => <span>Article</span> }));
vi.mock("@/components/ui/unique-loader-components", () => ({
  LoaderFive: () => <span>Loading</span>,
}));
vi.mock("@/components/items/ItemCard", () => ({ ItemCard: () => <div>Collection item</div> }));
vi.mock("@/components/items/ItemCardSkeleton", () => ({ ItemCardSkeleton: () => <div>Loading item</div> }));
vi.mock("@/components/shared/Icon", () => ({ Icon: () => <span aria-hidden="true">icon</span> }));
vi.mock("@/store/uiStore", () => ({ useUIStore: () => ({ viewMode: "list" }) }));
vi.mock("@/hooks/useCollections", () => ({
  useCollection: collectionHookMock,
  useRemoveItemFromCollection: () => removeMutationMock,
  useShareCollection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUnshareCollection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteCollection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCollection: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/api", () => ({
  getApiErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
}));

import { SearchDropdown } from "@/components/layout/SearchDropdown";
import CollectionDetailPage from "@/app/dashboard/collections/[id]/page";

const item = {
  id: "item-1",
  userId: "user-1",
  url: "https://example.com/story",
  title: "A saved story",
  description: "A useful story",
  contentText: null,
  thumbnailUrl: null,
  fileUrl: null,
  itemType: "article" as const,
  saveSource: "web_url" as const,
  status: "ready" as const,
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

const collection = {
  id: "collection-1",
  userId: "user-1",
  name: "Research",
  description: "Useful stories",
  coverImage: null,
  isPublic: false,
  publicSlug: null,
  itemCount: 1,
  createdAt: "2026-08-24T00:00:00.000Z",
  items: [item],
};

describe("dashboard search and collection feedback", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    retrySearchMock.mockResolvedValue({});
    removeMutationMock.isPending = false;
    collectionHookMock.mockReturnValue({ data: collection, isLoading: false, error: null });
  });

  it("shows a retry action when the top-bar search request fails", async () => {
    const props = {
      results: [],
      isLoading: false,
      query: "react",
      onClose: vi.fn(),
      error: new Error("Search service unavailable"),
      onRetry: retrySearchMock,
    } as unknown as React.ComponentProps<typeof SearchDropdown>;

    render(<SearchDropdown {...props} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Search service unavailable");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Try search again" }));
    expect(retrySearchMock).toHaveBeenCalledTimes(1);
  });

  it("confirms a collection item was removed", async () => {
    removeMutationMock.mutateAsync.mockResolvedValue({});
    render(<CollectionDetailPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Remove from Collection" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/removed from collection/i));
    expect(removeMutationMock.mutateAsync).toHaveBeenCalledWith({
      collectionId: "collection-1",
      itemId: "item-1",
    });
  });

  it("keeps collection removal failures visible", async () => {
    removeMutationMock.mutateAsync.mockRejectedValue(new Error("Collection service unavailable"));
    render(<CollectionDetailPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Remove from Collection" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/collection service unavailable/i));
  });
});
