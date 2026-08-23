import { describe, expect, it } from "vitest";
import { buildUrlSavePayload, SaveFormValidationError } from "@/lib/saveContract";
import { ApiError, getApiErrorMessage } from "@/lib/api";

describe("web save form contract", () => {
  it("builds the URL payload with user-provided metadata", () => {
    expect(buildUrlSavePayload({
      url: " https://example.com/story ",
      selectedType: "podcast",
      title: " Episode 12 ",
      author: " Host ",
      podcastName: " The Show ",
      note: " Remember this ",
      youtubeTimestamp: "",
      tags: ["ai", " ai ", "design"],
      collectionId: "collection-1",
    })).toEqual({
      url: "https://example.com/story",
      itemType: "podcast",
      title: "Episode 12",
      author: "Host",
      podcastName: "The Show",
      note: "Remember this",
      youtubeTimestamp: undefined,
      tags: ["ai", "design"],
      collectionId: "collection-1",
    });
  });

  it("converts clock timestamps before making the request", () => {
    expect(buildUrlSavePayload({ url: "https://youtube.com/watch?v=abc", selectedType: "youtube", youtubeTimestamp: "1:23:45" }).youtubeTimestamp).toBe(5025);
  });

  it("rejects malformed URLs and invalid timestamps", () => {
    expect(() => buildUrlSavePayload({ url: "not a url", selectedType: "article" })).toThrowError(SaveFormValidationError);
    expect(() => buildUrlSavePayload({ url: "https://youtube.com/watch?v=abc", selectedType: "youtube", youtubeTimestamp: "1:90" })).toThrow(/timestamp/i);
  });

  it("turns structured API failures into actionable text", () => {
    expect(getApiErrorMessage(new ApiError(503, "Service Unavailable", { error: "Item saved, but processing could not be queued.", reason: "Redis is unavailable." }))).toBe("Item saved, but processing could not be queued. Redis is unavailable.");
  });
});
