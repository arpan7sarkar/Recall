import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { infiniteItemsMock, useUIStoreMock } = vi.hoisted(() => ({
  infiniteItemsMock: vi.fn(),
  useUIStoreMock: vi.fn(),
}));

vi.mock("@/hooks/useItems", () => ({
  useInfiniteItems: infiniteItemsMock,
  useItems: vi.fn(),
}));
vi.mock("@/store/uiStore", () => ({ useUIStore: useUIStoreMock }));
vi.mock("@/components/items/ItemCard", () => ({ ItemCard: () => <div>Item card</div> }));
vi.mock("@/components/items/ItemFilters", () => ({ ItemFilters: () => <div>Filters</div> }));
vi.mock("@/components/items/ItemCardSkeleton", () => ({ ItemCardSkeleton: () => <div>Loading item</div> }));
vi.mock("@/components/shared/EmptyState", () => ({ EmptyState: () => <div>Empty state</div> }));
vi.mock("@/components/shared/Icon", () => ({ Icon: () => <span aria-hidden="true">icon</span> }));
vi.mock("@/components/ui/unique-loader-components", () => ({
  LoaderFive: () => <span>Loading</span>,
  LoaderTwo: () => <span>Loading more</span>,
}));

import DashboardPage from "@/app/dashboard/page";
import ArchivePage from "@/app/dashboard/archive/page";

const item = {
  id: "item-1",
  title: "A saved item",
  itemType: "article",
  status: "ready",
  isArchived: false,
};

describe("dashboard item pagination", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    useUIStoreMock.mockReturnValue({
      viewMode: "list",
      setViewMode: vi.fn(),
      openAddContent: vi.fn(),
    });
    infiniteItemsMock.mockReturnValue({
      items: [item],
      total: 21,
      processingTotal: 0,
      isLoading: false,
      error: null,
      hasNextPage: true,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
      isFetchNextPageError: false,
    });
  });

  it("shows a user-visible control to load the next dashboard page", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    const loadMore = screen.getByRole("button", { name: /load more items/i });
    expect(loadMore).toBeInTheDocument();
    await user.click(loadMore);

    expect(infiniteItemsMock.mock.results[0]?.value.fetchNextPage).toHaveBeenCalledOnce();
  });

  it("shows a user-visible control to load the next archive page", async () => {
    const user = userEvent.setup();
    render(<ArchivePage />);

    const loadMore = screen.getByRole("button", { name: /load more archived items/i });
    expect(loadMore).toBeInTheDocument();
    await user.click(loadMore);

    expect(infiniteItemsMock.mock.results[0]?.value.fetchNextPage).toHaveBeenCalledOnce();
  });
});
