"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, RFPOpportunity } from "@/lib/supabase";

const STAGES = [
  { id: "new", label: "New", color: "bg-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  { id: "reviewing", label: "Reviewing", color: "bg-yellow-500", bg: "bg-yellow-50", border: "border-yellow-200" },
  { id: "bidding", label: "Bidding", color: "bg-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
  { id: "won", label: "Won", color: "bg-green-500", bg: "bg-green-50", border: "border-green-200" },
  { id: "lost", label: "Lost / Passed", color: "bg-gray-400", bg: "bg-gray-50", border: "border-gray-200" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

export default function Pipeline() {
  const [opportunities, setOpportunities] = useState<RFPOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("rfp_opportunities").select("*").order("updated_at", { ascending: false });
    setOpportunities(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const moveToStage = async (oppId: string, newStatus: StageId) => {
    // Optimistic update
    setOpportunities((prev) => prev.map((o) => (o.id === oppId ? { ...o, status: newStatus } : o)));
    await supabase.from("rfp_opportunities").update({ status: newStatus }).eq("id", oppId);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, stageId: StageId) => {
    e.preventDefault();
    if (draggingId) {
      moveToStage(draggingId, stageId);
      setDraggingId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading pipeline...</div>;

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage.id] = opportunities.filter((o) => o.status === stage.id);
    return acc;
  }, {} as Record<StageId, RFPOpportunity[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Opportunity Pipeline</h2>
        <p className="text-sm text-gray-500">Drag cards between columns to update status</p>
      </div>

      <div className="grid grid-cols-5 gap-4 min-h-[600px]">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
            className={`rounded-xl border ${stage.border} ${stage.bg} p-3 flex flex-col`}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
              <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
              <span className="ml-auto text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border">{grouped[stage.id].length}</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
              {grouped[stage.id].map((o) => (
                <div
                  key={o.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, o.id)}
                  className={`bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
                    draggingId === o.id ? "opacity-50" : ""
                  }`}
                >
                  <a href={o.source_url || "#"} target="_blank" rel="noopener" className="text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-2 block">
                    {o.title}
                  </a>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500">{o.source_name}</span>
                    {o.estimated_value && <span className="text-xs text-green-700 font-medium ml-auto">{o.estimated_value}</span>}
                  </div>
                  {o.due_date && (
                    <div className={`text-xs mt-1 ${new Date(o.due_date) <= new Date(Date.now() + 7 * 86400000) ? "text-red-600 font-medium" : "text-gray-400"}`}>
                      Due: {new Date(o.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  )}
                  {o.apparel_type && o.apparel_type.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {o.apparel_type.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{t.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  )}

                  {/* Quick move buttons */}
                  <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
                    {STAGES.filter((s) => s.id !== stage.id).slice(0, 3).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => moveToStage(o.id, s.id)}
                        className="text-[10px] text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        → {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {grouped[stage.id].length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs">Drop items here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
