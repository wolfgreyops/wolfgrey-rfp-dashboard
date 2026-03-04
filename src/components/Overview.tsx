"use client";

import { useEffect, useState } from "react";
import { supabase, RFPOpportunity, SearchRun } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#0077b6", "#00b4d8", "#48cae4", "#90e0ef", "#caf0f8", "#023e8a", "#0096c7", "#ade8f4"];

const DECORATION_METHODS = [
  { label: "Embroidery", pattern: /\bembroidery\b|\bembroidered\b|\bembroider\b/i },
  { label: "Screen Print", pattern: /\bscreen\s*print(ing|ed)?\b|\bsilkscreen\b/i },
  { label: "Heat Transfer", pattern: /\bheat\s*transfer(s)?\b|\bheat\s*applied\b/i },
  { label: "Sublimation", pattern: /\bsublimation\b|\bdye\s*sublimation\b|\bsublimated\b/i },
  { label: "DTG", pattern: /\bdtg\b|\bdirect[\s-]to[\s-]garment\b/i },
  { label: "Digital Print", pattern: /\bdigital\s*print(ing|ed)?\b/i },
  { label: "Pad Print", pattern: /\bpad\s*print(ing|ed)?\b/i },
  { label: "Laser Engrave", pattern: /\blaser\s*engrav(ing|ed|e)?\b/i },
  { label: "Vinyl", pattern: /\bvinyl\b|\bcut\s*vinyl\b|\bheat\s*press\b/i },
  { label: "Patches", pattern: /\bpatch(es)?\b|\btackle\s*twill\b|\bwoven\s*patch\b/i },
  { label: "Reflective", pattern: /\breflective\b|\bhigh[\s-]vis\b/i },
  { label: "Puff Print", pattern: /\bpuff\s*print(ing|ed)?\b|\bfoam\s*print\b/i },
];

function extractDecorationMethods(text: string | null): string[] {
  if (!text) return [];
  return DECORATION_METHODS.filter((m) => m.pattern.test(text)).map((m) => m.label);
}

function parseRevenue(raw: string | null): { display: string; numeric: number } {
  if (!raw) return { display: "—", numeric: 0 };
  const num = parseFloat(raw.replace(/[^0-9.-]/g, "")) || 0;
  const display = num >= 1_000_000
    ? `$${(num / 1_000_000).toFixed(2)}M`
    : num >= 1_000
    ? `$${(num / 1_000).toFixed(0)}K`
    : raw;
  return { display, numeric: num };
}

export default function Overview() {
  const [opportunities, setOpportunities] = useState<RFPOpportunity[]>([]);
  const [runs, setRuns] = useState<SearchRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [oppRes, runRes] = await Promise.all([
        supabase.from("rfp_opportunities").select("*").order("created_at", { ascending: false }),
        supabase.from("rfp_search_runs").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      setOpportunities(oppRes.data || []);
      setRuns(runRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;

  // Stats
  const total = opportunities.length;
  const bySource: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byApparelType: Record<string, number> = {};
  let withValue = 0;
  let totalValue = 0;
  const upcoming: RFPOpportunity[] = [];
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 86400000);

  for (const o of opportunities) {
    bySource[o.source_name] = (bySource[o.source_name] || 0) + 1;
    byCategory[o.source_category] = (byCategory[o.source_category] || 0) + 1;
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    if (o.apparel_type) {
      for (const t of o.apparel_type) {
        byApparelType[t.replace(/_/g, " ")] = (byApparelType[t.replace(/_/g, " ")] || 0) + 1;
      }
    }
    if (o.estimated_value) {
      const v = parseFloat(o.estimated_value.replace(/[^0-9.-]/g, ""));
      if (!isNaN(v) && v > 0) { withValue++; totalValue += v; }
    }
    if (o.due_date) {
      const d = new Date(o.due_date);
      if (d >= now && d <= twoWeeks) upcoming.push(o);
    }
  }

  const sourceData = Object.entries(bySource).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  const apparelData = Object.entries(byApparelType).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).sort((a, b) => b.value - a.value).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Opportunities" value={total} />
        <StatCard label="Active Sources" value={Object.keys(bySource).length} />
        <StatCard label="Due in 14 Days" value={upcoming.length} accent />
        <StatCard label="Total Value Tracked" value={totalValue > 0 ? `$${(totalValue / 1000000).toFixed(1)}M` : "N/A"} />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-sm text-gray-600 mb-4">OPPORTUNITIES BY SOURCE</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sourceData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0077b6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-sm text-gray-600 mb-4">BY CATEGORY</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Apparel Types */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-sm text-gray-600 mb-4">APPAREL TYPE BREAKDOWN</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={apparelData} margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#48cae4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recently Qualified Opportunities */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-sm text-gray-600 mb-4">RECENTLY DISCOVERED — QUALIFICATION SUMMARY</h3>
        {opportunities.slice(0, 5).length === 0 ? (
          <p className="text-gray-400 text-sm py-4">No opportunities found</p>
        ) : (
          <div className="space-y-4">
            {opportunities.slice(0, 5).map((o) => {
              const decorations = extractDecorationMethods(o.description);
              const revenue = parseRevenue(o.estimated_value);
              const isUrgent = o.due_date && new Date(o.due_date) <= new Date(Date.now() + 7 * 86400000) && new Date(o.due_date) >= new Date();
              return (
                <div key={o.id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <a href={o.source_url || "#"} target="_blank" rel="noopener" className="text-blue-600 hover:underline font-medium text-sm line-clamp-1">
                        {o.title}
                      </a>
                      {o.organization_name && <div className="text-xs text-gray-400 mt-0.5">{o.organization_name} · {o.source_name}</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      {revenue.numeric > 0 ? (
                        <div className="text-lg font-bold text-green-700">{revenue.display}</div>
                      ) : (
                        <div className="text-sm text-gray-400">Value TBD</div>
                      )}
                      {o.due_date && (
                        <div className={`text-xs mt-0.5 ${isUrgent ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                          Due {new Date(o.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{isUrgent ? " ⚠" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  {o.description && (
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2">{o.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {decorations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {decorations.map((d) => (
                          <span key={d} className="inline-block bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{d}</span>
                        ))}
                      </div>
                    )}
                    {(o.apparel_type || []).map((t) => (
                      <span key={t} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{t.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming + Recent Runs */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-sm text-gray-600 mb-3">UPCOMING DEADLINES</h3>
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">No deadlines in the next 14 days</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {upcoming.sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()).slice(0, 8).map((o) => (
                <div key={o.id} className="flex items-start gap-3 py-2 border-b border-gray-50">
                  <span className="inline-block bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded mt-0.5 shrink-0">
                    {new Date(o.due_date!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <div className="min-w-0">
                    <a href={o.source_url || "#"} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:underline line-clamp-1">{o.title}</a>
                    <div className="text-xs text-gray-400">{o.source_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-sm text-gray-600 mb-3">RECENT SEARCH RUNS</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {runs.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <div className="text-sm font-medium">{r.source}</div>
                  <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">{r.new_opportunities || 0} new</span>
                    <span className="text-gray-400 ml-1">/ {r.opportunities_found || 0}</span>
                  </div>
                  <span className={`text-xs ${r.status === "completed" ? "text-green-500" : r.status === "running" ? "text-yellow-500" : "text-gray-400"}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-red-50 border-red-200" : "bg-white"}`}>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${accent ? "text-red-600" : "text-gray-900"}`}>{value}</div>
    </div>
  );
}
