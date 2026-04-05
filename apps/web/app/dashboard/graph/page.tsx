"use client";

import { useGraphData } from "@/hooks/useGraphData";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoaderFive } from "@/components/ui/unique-loader-components";
import { MousePointer2, Maximize2, Pointer } from "lucide-react";

export default function GraphPage() {
  const { data, isLoading, error, refetch } = useGraphData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
        <LoaderFive text="Architecting your Knowledge Graph" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="alert"
        title="Failed to load graph"
        description="There was an error generating your knowledge graph. Please try again."
        action={{
          label: "Retry",
          onClick: () => refetch(),
        }}
      />
    );
  }

  if (data.nodes.length === 0) {
    return (
      <EmptyState
        icon="graph"
        title="Knowledge graph empty"
        description="Save some more items to see how they connect!"
      />
    );
  }

  return (
    <div className="p-1">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Knowledge Graph
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            A spatial map of your Recall, clustered by semantic similarity and shared tags.
          </p>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-5 px-5 py-2.5 rounded-2xl bg-muted/50 border border-border backdrop-blur-sm shadow-sm group/legend">
           <div className="flex items-center gap-2 group-hover/legend:opacity-100 transition-opacity">
             <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ background: "#3b82f6" }} />
             <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Article</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.5)]" style={{ background: "#e11d48" }} />
             <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Video</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(148,163,184,0.5)]" style={{ background: "#94a3b8" }} />
             <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tweet</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(202,138,4,0.5)]" style={{ background: "#ca8a04" }} />
             <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">PDF</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(39,39,42,0.5)] border border-white/10" style={{ background: "#27272a" }} />
             <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Image</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(217,70,239,0.5)] border border-white/10" style={{ background: "#d946ef" }} />
             <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Instagram</span>
           </div>
           <div className="h-4 w-px bg-border/50 mx-1" />
           <div className="flex items-center gap-2">
             <div className="w-5 h-px border-t border-dashed border-muted-foreground/30" />
             <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 italic">Connections</span>
           </div>
        </div>
      </div>

      {/* Main Graph */}
      <div className="relative group">
        <KnowledgeGraph data={data} />
        
        {/* Help Tip Overlay */}
        <div className="absolute bottom-6 left-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <div className="flex items-center gap-4 bg-card/80 backdrop-blur-md text-(--text-primary) px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider border border-border shadow-xl">
             <div className="flex items-center gap-2">
               <MousePointer2 size={12} className="text-(--accent-500)" />
               <span className="opacity-60">Pan</span>
             </div>
             <div className="w-px h-3 bg-border" />
             <div className="flex items-center gap-2">
               <Maximize2 size={12} className="text-(--accent-500)" />
               <span className="opacity-60">Zoom</span>
             </div>
             <div className="w-px h-3 bg-border" />
             <div className="flex items-center gap-2">
               <Pointer size={12} className="text-(--accent-500)" />
               <span className="opacity-60">Click View</span>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
           Displaying <span className="text-(--text-primary)">{data.nodes.length}</span> active nodes & <span className="text-(--text-primary)">{data.edges.length}</span> semantic bridges.
        </div>
        
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 focus-ring bg-muted border border-border text-muted-foreground hover:bg-card hover:text-(--text-primary) shadow-sm active:scale-95"
        >
          Resync Graph
        </button>
      </div>
    </div>
  );
}
