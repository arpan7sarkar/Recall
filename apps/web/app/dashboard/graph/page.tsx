"use client";

import { EmptyState } from "@/components/shared/EmptyState";

export default function GraphPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Knowledge Graph
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Visualise connections between your saved content
        </p>
      </div>

      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          height: "calc(100vh - 240px)",
          background: "var(--bg-secondary)",
          border: "1px dashed var(--border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <EmptyState
          icon="🕸️"
          title="Knowledge Graph"
          description="The D3.js interactive graph will be rendered here. Save more items to build connections."
        />
      </div>
    </div>
  );
}
