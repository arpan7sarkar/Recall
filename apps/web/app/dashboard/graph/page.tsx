"use client";

import { useGraphData } from "@/hooks/useGraphData";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoaderFive } from "@/components/ui/unique-loader-components";

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
        icon="⚠️"
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
        icon="🕸️"
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
        <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
           <div className="flex items-center gap-1.5 no-shrink">
             <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#6366f1" }} />
             <span className="text-xs font-medium text-slate-500">Article</span>
           </div>
           <div className="flex items-center gap-1.5 no-shrink">
             <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
             <span className="text-xs font-medium text-slate-500">Video</span>
           </div>
           <div className="flex items-center gap-1.5 no-shrink">
             <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#38bdf8" }} />
             <span className="text-xs font-medium text-slate-500">Tweet</span>
           </div>
           <div className="flex items-center gap-1.5 no-shrink">
             <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} />
             <span className="text-xs font-medium text-slate-500">PDF</span>
           </div>
           <div className="flex items-center gap-1.5 no-shrink">
             <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
             <span className="text-xs font-medium text-slate-500">Image</span>
           </div>
           <div className="h-4 w-px bg-slate-200 mx-1" />
           <div className="flex items-center gap-1.5 no-shrink">
             <div className="w-4 h-px border-t border-dashed border-slate-400" />
             <span className="text-xs font-medium text-slate-500 italic">Similarity</span>
           </div>
        </div>
      </div>

      {/* Main Graph */}
      <div className="relative group">
        <KnowledgeGraph data={data} />
        
        {/* Help Tip Overlay */}
        <div className="absolute bottom-6 left-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium">
             🖱️ Drag to pan • 🛞 Scroll to zoom • 👆 Click node to view item
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
           Showing <span className="font-bold text-slate-600">{data.nodes.length}</span> nodes and <span className="font-bold text-slate-600">{data.edges.length}</span> connections.
        </div>
        
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus-ring bg-slate-100/80 hover:bg-slate-100 border border-slate-200"
          style={{ color: "var(--text-secondary)" }}
        >
          Refresh Graph
        </button>
      </div>
    </div>
  );
}
