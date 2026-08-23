import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ItemFilters } from "@/components/items/ItemFilters";
import SwitchButton from "@/components/ui/SwitchButton";
import { getGraphDimensions } from "@/components/graph/graphDimensions";
import { useUIStore } from "@/store/uiStore";

describe("dashboard shell", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useUIStore.setState({
      sidebarOpen: false,
      sidebarCollapsed: false,
      viewMode: "grid",
      theme: "dark",
      addContentModalOpen: false,
    });
  });

  it("starts with the mobile sidebar closed", () => {
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it("exposes the theme switch as a pressed state and action", async () => {
    render(<SwitchButton />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAccessibleName("Switch to light mode");

    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAccessibleName("Switch to dark mode");
  });

  it("marks the selected item view and filter for assistive technology", () => {
    render(
      <ItemFilters
        activeFilter="article"
        onFilterChange={() => undefined}
        viewMode="list"
        onViewModeChange={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: "Articles" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByRole("button", { name: "List view" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("derives graph dimensions from the available content width", () => {
    expect(getGraphDimensions({ width: 1024, height: 900 })).toEqual({
      width: 1024,
      height: 660,
    });
    expect(getGraphDimensions({ width: 120, height: 280 })).toEqual({
      width: 300,
      height: 400,
    });
  });
});
