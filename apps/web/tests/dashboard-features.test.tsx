import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  searchHookMock,
  refetchSearchMock,
  tagsHookMock,
  createTagMutationMock,
  updateTagMutationMock,
  deleteTagMutationMock,
  routerMock,
} = vi.hoisted(() => ({
  searchHookMock: vi.fn(),
  refetchSearchMock: vi.fn(),
  tagsHookMock: vi.fn(),
  createTagMutationMock: { mutateAsync: vi.fn(), isPending: false },
  updateTagMutationMock: { mutateAsync: vi.fn(), isPending: false },
  deleteTagMutationMock: { mutateAsync: vi.fn(), isPending: false },
  routerMock: { replace: vi.fn(), push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("q=react&type=keyword"),
  useRouter: () => routerMock,
}));
vi.mock("@/hooks/useSearch", () => ({ useSearch: searchHookMock }));
vi.mock("@/hooks/useTags", () => ({
  useTags: tagsHookMock,
  useCreateTag: () => createTagMutationMock,
  useUpdateTag: () => updateTagMutationMock,
  useDeleteTag: () => deleteTagMutationMock,
}));
vi.mock("@/components/items/ItemCard", () => ({ ItemCard: () => <div>Search result</div> }));
vi.mock("@/components/ui/unique-loader-components", () => ({
  LoaderOne: () => <span>Loading</span>,
  LoaderThree: () => null,
  LoaderFive: () => <span>Searching</span>,
}));
vi.mock("@/lib/api", () => ({
  getApiErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
}));

import SearchPage from "@/app/dashboard/search/page";
import TagsPage from "@/app/dashboard/tags/page";

const existingTag = {
  id: "tag-1",
  userId: "user-1",
  name: "Research",
  color: "#6B8E8E",
  isAiGenerated: false,
  _count: { items: 3 },
  createdAt: "2026-08-24T00:00:00.000Z",
};

describe("dashboard search and tag features", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    refetchSearchMock.mockResolvedValue({});
    searchHookMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchSearchMock,
    });
    tagsHookMock.mockReturnValue({ data: [existingTag], isLoading: false, error: null });
    createTagMutationMock.isPending = false;
    updateTagMutationMock.isPending = false;
    deleteTagMutationMock.isPending = false;
  });

  it("shows a retry action when search fails instead of rendering an empty result state", async () => {
    searchHookMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: new Error("Search service unavailable"),
      refetch: refetchSearchMock,
    });

    render(<SearchPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Search service unavailable");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Try search again" }));

    expect(refetchSearchMock).toHaveBeenCalledTimes(1);
  });

  it("turns a visible tag into a keyword search action", async () => {
    render(<TagsPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Search for Research" }));

    expect(routerMock.push).toHaveBeenCalledWith("/dashboard/search?q=Research&type=keyword");
  });

  it("rejects duplicate tag names before sending a create request", async () => {
    render(<TagsPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("New tag name"), " research ");
    await user.click(screen.getByRole("button", { name: "Create tag" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/already exists/i);
    expect(createTagMutationMock.mutateAsync).not.toHaveBeenCalled();
  });
});
