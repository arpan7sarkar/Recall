"use client";

import { 
  FileText, 
  Play, 
  MessageSquare,
  Mic, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  File,
  Home,
  Folder,
  Tag as TagIcon,
  Network,
  Archive,
  Search,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Clock,
  ExternalLink,
  Plus,
  X,
  Check,
  AlertCircle,
  Library,
  Lightbulb,
  Instagram,
  Linkedin
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom X (Twitter) icon as an SVG since Lucide might only have the old bird or MessageSquare
const XIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    aria-hidden="true" 
    className={className} 
    fill="currentColor"
    width="1em"
    height="1em"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export type IconName = 
  | "article" 
  | "youtube" 
  | "tweet" 
  | "pdf" 
  | "podcast" 
  | "image" 
  | "link"
  | "home"
  | "collection"
  | "tag"
  | "graph"
  | "archive"
  | "search"
  | "moon"
  | "sun"
  | "left"
  | "right"
  | "more"
  | "clock"
  | "external"
  | "plus"
  | "close"
  | "check" 
  | "alert"
  | "library"
  | "lightbulb"
  | "instagram"
  | "linkedin";

interface IconProps {
  name: IconName | string;
  className?: string;
  size?: number | string;
}

export function Icon({ name, className, size = 18 }: IconProps) {
  const props = { className: cn("shrink-0", className), size };

  switch (name) {
    case "article":
      return <FileText {...props} />;
    case "youtube":
      return <Play {...props} />;
    case "tweet":
      return <XIcon className={cn("shrink-0", className)} />;
    case "pdf":
      return <File {...props} />;
    case "podcast":
      return <Mic {...props} />;
    case "image":
      return <ImageIcon {...props} />;
    case "link":
      return <LinkIcon {...props} />;
    case "home":
      return <Home {...props} />;
    case "collection":
      return <Folder {...props} />;
    case "tag":
      return <TagIcon {...props} />;
    case "graph":
      return <Network {...props} />;
    case "archive":
      return <Archive {...props} />;
    case "search":
      return <Search {...props} />;
    case "moon":
      return <Moon {...props} />;
    case "sun":
      return <Sun {...props} />;
    case "left":
      return <ChevronLeft {...props} />;
    case "right":
      return <ChevronRight {...props} />;
    case "more":
      return <MoreVertical {...props} />;
    case "clock":
      return <Clock {...props} />;
    case "external":
      return <ExternalLink {...props} />;
    case "plus":
      return <Plus {...props} />;
    case "close":
      return <X {...props} />;
    case "check":
      return <Check {...props} />;
    case "alert":
      return <AlertCircle {...props} />;
    case "library":
      return <Library {...props} />;
    case "lightbulb":
      return <Lightbulb {...props} />;
    case "instagram":
      return <Instagram {...props} />;
    case "linkedin":
      return <Linkedin {...props} />;
    default:
      return <LinkIcon {...props} />;
  }
}
