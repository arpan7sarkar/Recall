import { afterEach, describe, expect, it, vi } from "vitest";
import { lookup } from "node:dns/promises";
import {
  RemoteFetchError,
  assertSafeRemoteUrl,
  fetchRemoteResource,
} from "./remoteFetch";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]),
}));

describe("remote resource safety", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(lookup).mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  it("rejects loopback, private, link-local, and metadata targets", () => {
    for (const url of [
      "http://127.0.0.1/internal",
      "http://10.0.0.4/config",
      "http://192.168.1.20/admin",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/health",
      "http://localhost:4000/health",
    ]) {
      expect(() => assertSafeRemoteUrl(url)).toThrow(RemoteFetchError);
    }
  });

  it("rejects unsafe schemes and embedded credentials", () => {
    expect(() => assertSafeRemoteUrl("file:///etc/passwd")).toThrow(/http or https/i);
    expect(() => assertSafeRemoteUrl("https://user:pass@example.com/a")).toThrow(/credentials/i);
  });

  it("fails closed when a public hostname resolves to a private address", async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: "10.0.0.2", family: 4 }]);

    await expect(fetchRemoteResource("https://public.example/article")).rejects.toThrow(/resolves to a private/i);
  });

  it("rejects a redirect that targets a private address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { location: "http://127.0.0.1:3000/admin" },
        }),
      ),
    );

    await expect(fetchRemoteResource("https://public.example/article")).rejects.toThrow(/private|unsafe/i);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("bounds streamed responses even when content length is missing", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(8));
        controller.enqueue(new Uint8Array(8));
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    await expect(
      fetchRemoteResource("https://public.example/article", { maxBytes: 12 }),
    ).rejects.toThrow(/exceeds/i);
  });

  it("enforces content-type allowlists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not an image", {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      ),
    );

    await expect(
      fetchRemoteResource("https://public.example/image", { allowedContentTypes: ["image/"] }),
    ).rejects.toThrow(/content type/i);
  });
});
