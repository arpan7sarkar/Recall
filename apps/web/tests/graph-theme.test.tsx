import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GRAPH_LEGEND_ITEMS, getGraphNodeColor } from "@/lib/graphTheme";
import { TYPE_COLORS } from "@/lib/constants";
import { useAddContentStore } from "@/store/addContentStore";
import { SourceTypePicker } from "@/components/add-content/SourceTypePicker";

const { collectionsHookMock, createCollectionMock, deleteCollectionMock, routerMock } = vi.hoisted(() => ({
  collectionsHookMock: vi.fn(),
  createCollectionMock: { mutateAsync: vi.fn(), isPending: false },
  deleteCollectionMock: { mutateAsync: vi.fn(), isPending: false },
  routerMock: { push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));
vi.mock("@/hooks/useCollections", () => ({
  useCollections: collectionsHookMock,
  useCreateCollection: () => createCollectionMock,
  useDeleteCollection: () => deleteCollectionMock,
}));

import CollectionsPage from "@/app/dashboard/collections/page";

describe("dashboard graph and theme contracts", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    useAddContentStore.setState({ selectedType: "podcast", url: "" });
    collectionsHookMock.mockReturnValue({
      data: [
        {
          id: "collection-1",
          userId: "user-1",
          name: "Research",
          description: "Saved research",
          coverImage: null,
          isPublic: true,
          publicSlug: "research",
          itemCount: 2,
          _count: { items: 2 },
          createdAt: "2026-08-24T00:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
    });
  });

  it("keeps every supported item type represented in the graph palette", () => {
    const legendTypes = GRAPH_LEGEND_ITEMS.map((item) => item.type);

    expect(legendTypes).toEqual(Object.keys(TYPE_COLORS));
    for (const type of legendTypes) {
      expect(getGraphNodeColor(type)).toBe(TYPE_COLORS[type]);
    }
    expect(getGraphNodeColor("unknown")).toBe(TYPE_COLORS.link);
  });

  it("uses valid semantic colors for the selected source type", () => {
    render(<SourceTypePicker />);

    const podcast = screen.getByRole("button", { name: /podcast episode/i });
    expect(podcast).toHaveAttribute("aria-pressed", "true");
    expect(podcast).toHaveStyle({
      background: "var(--accent-50)",
      color: "var(--accent-500)",
      boxShadow: "0 0 0 2px var(--accent-500)",
    });
  });

  it("renders collection cards with theme tokens instead of fixed dark text", () => {
    render(<CollectionsPage />);

    const heading = screen.getByRole("heading", { name: "Research" });
    expect(heading.className).toContain("text-(--text-primary)");
    expect(heading.closest("div[style]")?.getAttribute("style")).toContain(
      "var(--bg-secondary)"
    );

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(deleteButton).toHaveStyle({
      background: "var(--bg-tertiary)",
      color: "var(--text-primary)",
    });
  });
});
