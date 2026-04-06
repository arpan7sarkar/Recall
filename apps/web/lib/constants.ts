import type { ItemType } from "@/types";

/** Navigation routes */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  add: "/dashboard/add",
  graph: "/dashboard/graph",
  collections: "/dashboard/collections",
  tags: "/dashboard/tags",
  archive: "/dashboard/archive",
  search: "/dashboard/search",
  settings: "/dashboard/settings",
  item: (id: string) => `/dashboard/items/${id}`,
  collection: (id: string) => `/dashboard/collections/${id}`,
} as const;

/** Sidebar navigation items */
export const NAV_ITEMS = [
  { label: "Home", icon: "home", href: ROUTES.dashboard },
  { label: "Collections", icon: "collection", href: ROUTES.collections },
  { label: "Tags", icon: "tag", href: ROUTES.tags },
  { label: "Graph", icon: "graph", href: ROUTES.graph },
  { label: "Archive", icon: "archive", href: ROUTES.archive },
  { label: "Settings", icon: "settings", href: ROUTES.settings },
] as const;

/** Content type filter options */
export const CONTENT_TYPE_FILTERS: { label: string; value: ItemType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Articles", value: "article" },
  { label: "Videos", value: "youtube" },
  { label: "PDFs", value: "pdf" },
  { label: "Tweets", value: "tweet" },
  { label: "Podcasts", value: "podcast" },
  { label: "Images", value: "image" },
  { label: "Instagram", value: "instagram" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Links", value: "link" },
];

/** Content type colour map (HSL strings for badges and graph nodes) */
export const TYPE_COLORS: Record<ItemType, string> = {
  article: "hsl(215, 20%, 55%)",
  youtube: "hsl(8, 30%, 55%)",
  tweet: "hsl(160, 15%, 50%)",
  pdf: "hsl(35, 30%, 55%)",
  podcast: "hsl(280, 12%, 55%)",
  image: "hsl(100, 18%, 50%)",
  instagram: "hsl(330, 45%, 55%)",
  linkedin: "hsl(210, 65%, 45%)",
  link: "hsl(220, 10%, 55%)",
};

/** Content type Tailwind bg classes for badges */
export const TYPE_BG_CLASSES: Record<ItemType, string> = {
  article: "bg-slate-100 text-slate-700",
  youtube: "bg-red-50 text-red-700",
  tweet: "bg-emerald-50 text-emerald-700",
  pdf: "bg-amber-50 text-amber-700",
  podcast: "bg-purple-50 text-purple-700",
  image: "bg-green-50 text-green-700",
  instagram: "bg-pink-50 text-pink-700",
  linkedin: "bg-sky-50 text-sky-700",
  link: "bg-gray-100 text-gray-600",
};

/** Source type options for the Add Content picker */
export const SOURCE_TYPE_OPTIONS: {
  type: ItemType;
  icon: string;
  label: string;
  description: string;
  inputMode: "url" | "file" | "both";
}[] = [
  {
    type: "article",
    icon: "article",
    label: "Article / Blog",
    description: "Paste a link to any article or blog post",
    inputMode: "url",
  },
  {
    type: "youtube",
    icon: "youtube",
    label: "YouTube Video",
    description: "Save a YouTube video with optional timestamp",
    inputMode: "url",
  },
  {
    type: "tweet",
    icon: "tweet",
    label: "Tweet / Post",
    description: "Save a tweet or social media post",
    inputMode: "url",
  },
  {
    type: "pdf",
    icon: "pdf",
    label: "PDF / Document",
    description: "Upload a PDF or paste a link to one",
    inputMode: "both",
  },
  {
    type: "podcast",
    icon: "podcast",
    label: "Podcast Episode",
    description: "Save a podcast episode link",
    inputMode: "url",
  },
  {
    type: "image",
    icon: "image",
    label: "Image / GIF",
    description: "Upload an image or paste a link",
    inputMode: "both",
  },
  {
    type: "instagram",
    icon: "instagram",
    label: "Instagram Reel / Post",
    description: "Save an Instagram reel or post",
    inputMode: "url",
  },
  {
    type: "linkedin",
    icon: "linkedin",
    label: "LinkedIn Post",
    description: "Save a LinkedIn post URL",
    inputMode: "url",
  },
  {
    type: "link",
    icon: "link",
    label: "Other Link",
    description: "Any other URL you want to save",
    inputMode: "url",
  },
];
