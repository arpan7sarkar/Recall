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
    delete: vi.fn(),
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

import {
  useArchiveItem,
  useDeleteItem,
  useRetryItem,
  useToggleFavorite,
  useUnarchiveItem,
} from "@/hooks/useItems";

function HookHarness() {
  useToggleFavorite();
  useRetryItem();
  useArchiveItem();
  useUnarchiveItem();
  useDeleteItem();
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

  it.each([
    ["archives", 2, "/items/item-1/archive"],
    ["unarchives", 3, "/items/item-1/unarchive"],
  ])("%s an item and refreshes every projection", async (_label, index, path) => {
    apiMock.post.mockResolvedValue({ id: "item-1", isArchived: path.endsWith("archive") });
    render(<HookHarness />);

    await mutationOptions[index].mutationFn("item-1");
    await mutationOptions[index].onSuccess?.(undefined, "item-1");

    expect(apiMock.post).toHaveBeenCalledWith(path, undefined, { token: "token" });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["items"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["item", "item-1"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["collections"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["collection"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["search"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["graph"] });
  });

  it("deletes an item and refreshes every projection", async () => {
    apiMock.delete.mockResolvedValue(undefined);
    render(<HookHarness />);

    await mutationOptions[4].mutationFn("item-1");
    await mutationOptions[4].onSuccess?.(undefined, "item-1");

    expect(apiMock.delete).toHaveBeenCalledWith("/items/item-1", { token: "token" });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["items"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["item", "item-1"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["collections"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["collection"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["search"] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["graph"] });
  });
});
