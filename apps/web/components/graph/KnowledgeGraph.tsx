"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { ForceGraphMethods } from "react-force-graph-2d";

import { useUIStore } from "@/store/uiStore";
import { LoaderFour } from "@/components/ui/unique-loader-components";
import { getGraphRenderPolicy } from "@/lib/dashboardPerformance";
import { getGraphNodeColor } from "@/lib/graphTheme";
import { getGraphDimensions } from "./graphDimensions";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState(() =>
    getGraphDimensions({ width: 300, height: 400 })
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const graphData = useMemo<GraphData>(
    () => ({
      nodes: data.nodes,
      links: data.edges,
    }),
    [data.edges, data.nodes]
  );

  const renderPolicy = getGraphRenderPolicy({
    nodeCount: graphData.nodes.length,
    isVisible,
    isDocumentVisible,
    prefersReducedMotion,
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateDimensions = () => {
      const rect = element.getBoundingClientRect();
      setDimensions(
        getGraphDimensions({
          width: rect.width,
          height: window.innerHeight - 240,
        })
      );
    };

    updateDimensions();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const supportsIntersectionObserver = "IntersectionObserver" in window;
    if (!supportsIntersectionObserver) {
      const frameId = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frameId);
    } else {
      const observer = new IntersectionObserver(
        ([entry]) => setIsVisible(Boolean(entry?.isIntersecting)),
        { rootMargin: "200px 0px", threshold: 0.01 },
      );
      observer.observe(container);

      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(document.visibilityState === "visible");
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updateVisibility();
    updateMotionPreference();
    document.addEventListener("visibilitychange", updateVisibility);
    mediaQuery.addEventListener?.("change", updateMotionPreference);

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      mediaQuery.removeEventListener?.("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !isDocumentVisible) {
      graphRef.current?.pauseAnimation();
    } else {
      graphRef.current?.resumeAnimation();
    }
  }, [isDocumentVisible, isVisible]);

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
      ref={containerRef}
      role="img"
      aria-label="Interactive knowledge graph. Select a node to open its saved item."
      className="w-full min-w-0 rounded-2xl overflow-hidden border bg-background shadow-sm transition-colors duration-500"
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
        nodeColor={(node) => getGraphNodeColor(getNodeType(node))}
        
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
        linkDirectionalParticles={renderPolicy.directionalParticles}
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
        cooldownTicks={renderPolicy.cooldownTicks}
        cooldownTime={renderPolicy.cooldownTime}
        d3AlphaDecay={0.05}
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
