import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useAuthMock, useUserMock, apiPostMock, routerMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useUserMock: vi.fn(),
  apiPostMock: vi.fn(),
  routerMock: { replace: vi.fn() },
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: useAuthMock,
  useUser: useUserMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/dashboard",
}));
vi.mock("@/components/ui/unique-loader-components", () => ({
  LoaderFive: ({ text }: { text: string }) => <div>{text}</div>,
}));
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, api: { post: apiPostMock } };
});

import { ApiError } from "@/lib/api";
import { AuthGuard } from "@/components/auth/AuthGuard";

describe("AuthGuard", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      getToken: vi.fn().mockResolvedValue("clerk-token"),
    });
    useUserMock.mockReturnValue({
      user: {
        id: "clerk_user_123",
        primaryEmailAddress: { emailAddress: "person@example.com" },
        fullName: "Person Example",
        imageUrl: "https://example.com/avatar.png",
      },
    });
  });

  it("keeps dashboard content blocked when local user sync returns 401", async () => {
    apiPostMock.mockRejectedValue(new ApiError(401, "Unauthorized", { error: "Missing Clerk userId" }));

    render(
      <AuthGuard>
        <div data-testid="dashboard-content">Sensitive dashboard</div>
      </AuthGuard>,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());

    expect(screen.getByRole("alert")).toHaveTextContent(/session synchronization failed/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeVisible();
    expect(screen.queryByTestId("dashboard-content")).not.toBeInTheDocument();
  });

  it("retries transient token unavailability, then shows a recoverable error", async () => {
    const getToken = vi.fn().mockResolvedValue(null);
    useAuthMock.mockReturnValue({ isLoaded: true, isSignedIn: true, getToken });

    render(
      <AuthGuard>
        <div data-testid="dashboard-content">Sensitive dashboard</div>
      </AuthGuard>,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible(), { timeout: 2_000 });

    expect(getToken).toHaveBeenCalledTimes(3);
    expect(screen.queryByTestId("dashboard-content")).not.toBeInTheDocument();
  });
});
