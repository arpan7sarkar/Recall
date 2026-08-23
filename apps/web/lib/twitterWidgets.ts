export const TWITTER_WIDGET_SCRIPT_ID = "twitter-widgets-script";
export const TWITTER_WIDGET_SCRIPT_SRC = "https://platform.twitter.com/widgets.js";

interface TwitterRuntime {
  widgets?: {
    load?: (container?: HTMLElement) => void;
  };
}

export function loadTwitterWidgets(container?: HTMLElement | null): boolean {
  if (typeof window === "undefined") return false;

  const runtime = (window as Window & { twttr?: TwitterRuntime }).twttr;
  if (typeof runtime?.widgets?.load !== "function") return false;

  runtime.widgets.load(container ?? undefined);
  return true;
}
