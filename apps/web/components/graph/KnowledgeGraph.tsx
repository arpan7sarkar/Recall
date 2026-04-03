"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// ForceGraph must be dynamically imported for SSR compatibility in Next.js
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-slate-50/50 animate-pulse rounded-2xl h-[600px]">
      <p className="text-slate-400 font-medium">Initialising Knowledge Graph…</p>
    </div>
  ),
});

interface Node {
  id: string;
  label: string;
  type: string;
  saveSource: string;
  tags: string[];
  size: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  strength: number;
  type: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface KnowledgeGraphProps {
  data: {
    nodes: any[];
    edges: any[];
  };
}

export function KnowledgeGraph({ data }: KnowledgeGraphProps) {
  const router = useRouter();
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const graphData: GraphData = {
    nodes: data.nodes,
    links: data.edges.map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    })),
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
      case "article": return "#6366f1"; // Indigo
      case "youtube": return "#ef4444"; // Red
      case "tweet": return "#38bdf8"; // Sky
      case "pdf": return "#f59e0b"; // Amber
      case "image": return "#22c55e"; // Green
      default: return "#94a3b8"; // Slate
    }
  };

  return (
    <div 
      className="rounded-2xl overflow-hidden border bg-white shadow-sm" 
      style={{ borderColor: "var(--border)" }}
      id="knowledge-graph-container"
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#ffffff"
        
        // Node styling
        nodeLabel={(node: any) => node.label}
        nodeRelSize={6}
        nodeColor={(node: any) => getNodeColor(node.type)}
        
        // Link styling
        linkColor={(link: any) => 
          link.type === "similarity" ? "rgba(0,0,0,0.08)" : "rgba(99, 102, 241, 0.15)"
        }
        linkWidth={(link: any) => (link.type === "similarity" ? 1 : 1.5)}
        linkLineDash={(link: any) => (link.type === "similarity" ? [3, 2] : null)}
        
        // Visual particles for active relationships
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={(link: any) => (link.strength || 1) * 0.005}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={() => "rgba(99, 102, 241, 0.4)"}

        // Interaction
        onNodeClick={(node: any) => {
          router.push(`/dashboard/items/${node.id}`);
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
