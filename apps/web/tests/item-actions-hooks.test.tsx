import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MutationOptions = {
  mutationFn: (value: unknown) => Promise<unknown>;
  onSuccess?: (data: unknown, variables: unknown) => unknown;
};

const {
  apiMock,
  getTokenMock,
  invalidateQueriesMock,
  mutationOptions,
  useAuthMock,
  useMutationMock,
  useQueryClientMock,
} = vi.hoisted(() => ({
  apiMock: {
    patch: vi.fn(),
    post: vi.fn(),
  },
  getTokenMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
  mutationOptions: [] as MutationOptions[],
  useAuthMock: vi.fn(),
  useMutationMock: vi.fn(),
  useQueryClientMock: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({ useAuth: useAuthMock }));
vi.mock("@tanstack/react-query", () => ({
  useMutation: useMutationMock,
  useQuery: vi.fn(),
  useQueryClient: useQueryClientMock,
}));
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { useRetryItem, useToggleFavorite } from "@/hooks/useItems";

function HookHarness() {
  useToggleFavorite();
  useRetryItem();
  return null;
}

describe("item action mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mutationOptions.length = 0;
    getTokenMock.mockResolvedValue("token");
    useAuthMock.mockReturnValue({ getToken: getTokenMock });
    useQueryClientMock.mockReturnValue({ invalidateQueries: invalidateQueriesMock });
    useMutationMock.mockImplementation((options: MutationOptions) => {
      mutationOptions.push(options);
      return { mutateAsync: vi.fn(), isPending: false };
    });
  });

  it("patches favorite state and refreshes every item projection", async () => {
    apiMock.patch.mockResolvedValue({ id: "item-1", isFavourite: true });
    render(<HookHarness />);

    await mutationOptions[0].mutationFn({ id: "item-1", isFavourite: true });
    await mutationOptions[0].onSuccess?.(undefined, { id: "item-1", isFavourite: true });

    expect(apiMock.patch).toHaveBeenCalledWith("/items/item-1", { isFavourite: true }, { token: "token" });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["items"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["item", "item-1"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["search"] });
  });

  it("posts a retry and refreshes the item after the queue accepts it", async () => {
    apiMock.post.mockResolvedValue({ id: "item-1", status: "pending" });
    render(<HookHarness />);

    await mutationOptions[1].mutationFn("item-1");
    await mutationOptions[1].onSuccess?.(undefined, "item-1");

    expect(apiMock.post).toHaveBeenCalledWith("/items/item-1/retry", undefined, { token: "token" });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["items"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["item", "item-1"] });
  });
});
