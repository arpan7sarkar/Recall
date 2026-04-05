"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { ForceGraphMethods } from "react-force-graph-2d";

import { useUIStore } from "@/store/uiStore";
import { LoaderFour } from "@/components/ui/unique-loader-components";

// ForceGraph must be dynamically imported for SSR compatibility in Next.js
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center bg-card animate-in fade-in duration-1000 rounded-2xl h-[600px] border border-border">
      <LoaderFour text="Graph engine in preparation" />
    </div>
  ),
});

interface GraphNode {
  id: string;
  label: string;
  type: string;
  saveSource: string;
  tags: string[];
  size: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface KnowledgeGraphProps {
  data: {
    nodes: GraphNode[];
    edges: GraphLink[];
  };
}

export function KnowledgeGraph({ data }: KnowledgeGraphProps) {
  const router = useRouter();
  const theme = useUIStore((s) => s.theme);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const graphData: GraphData = {
    nodes: data.nodes,
    links: data.edges,
  };

  useEffect(() => {
    const handleResize = () => {
      // Calculate responsive dimensions
      const sidebarWidth = window.innerWidth > 1024 ? 280 : 0;
      setDimensions({
        width: Math.max(300, window.innerWidth - sidebarWidth - 48),
        height: Math.max(400, window.innerHeight - 240),
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case "article": return "#3b82f6"; // Sapphire
      case "youtube": return "#e11d48"; // Ruby
      case "tweet": return "#94a3b8"; // Silver
      case "pdf": return "#ca8a04"; // Gold
      case "image": return "#27272a"; // Obsidian
      default: return "#18181b"; // Obsidian Deep
    }
  };

  const getNodeLabel = (node: unknown) => {
    const label = (node as { label?: unknown })?.label;
    return typeof label === "string" ? label : "";
  };

  const getNodeType = (node: unknown) => {
    const type = (node as { type?: unknown })?.type;
    return typeof type === "string" ? type : "";
  };

  const getLinkType = (link: unknown) => {
    const type = (link as { type?: unknown })?.type;
    return typeof type === "string" ? type : "";
  };

  const getLinkStrength = (link: unknown) => {
    const strength = (link as { strength?: unknown })?.strength;
    return typeof strength === "number" ? strength : 1;
  };

  const isDark = theme === "dark";

  return (
    <div 
      className="rounded-2xl overflow-hidden border bg-background shadow-sm transition-colors duration-500" 
      style={{ borderColor: "var(--border)" }}
      id="knowledge-graph-container"
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={isDark ? "#000000" : "#ffffff"}
        
        // Node styling
        nodeLabel={(node) => getNodeLabel(node)}
        nodeRelSize={6}
        nodeColor={(node) => getNodeColor(getNodeType(node))}
        
        // Link styling
        linkColor={(link) => {
          const type = getLinkType(link);
          if (type === "similarity") {
            return isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
          }
          return isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.15)";
        }}
        linkWidth={(link) => (getLinkType(link) === "similarity" ? 1 : 1.5)}
        linkLineDash={(link) => (getLinkType(link) === "similarity" ? [3, 2] : null)}
        
        // Visual particles for active relationships
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={(link) => getLinkStrength(link) * 0.005}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={() => isDark ? "rgba(255,255,255,0.2)" : "rgba(99, 102, 241, 0.4)"}

        // Interaction
        onNodeClick={(node) => {
          const id = (node as { id?: unknown })?.id;
          if (typeof id === "string" || typeof id === "number") {
            router.push(`/dashboard/items/${id}`);
          }
        }}
        
        // Engine settings for better UX
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        onEngineStop={() => {
          if (graphData.nodes.length > 0) {
            graphRef.current?.zoomToFit(400, 50);
          }
        }}
      />
    </div>
  );
}
