"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase, RFPOpportunity } from "@/lib/supabase";

export default function OpportunitiesTable() {
  const [opportunities, setOpportunities] = useState<RFPOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<"title" | "due_date" | "source_name" | "estimated_value">("due_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("rfp_opportunities").select("*").order("created_at", { ascending: false });
      setOpportunities(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const sources = useMemo(() => [...new Set(opportunities.map((o) => o.source_name))].sort(), [opportunities]);
  const categories = useMemo(() => [...new Set(opportunities.map((o) => o.source_category))].sort(), [opportunities]);

  const filtered = useMemo(() => {
    let result = opportunities;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.title.toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q) ||
        (o.organization_name || "").toLowerCase().includes(q)
      );
    }
    if (sourceFilter !== "all") result = result.filter((o) => o.source_name === sourceFilter);
    if (categoryFilter !== "all") result = result.filter((o) => o.source_category === categoryFilter);

    result.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortField === "estimated_value") {
        va = parseFloat((a.estimated_value || "0").replace(/[^0-9.-]/g, "")) || 0;
        vb = parseFloat((b.estimated_value || "0").replace(/[^0-9.-]/g, "")) || 0;
      } else {
        va = (a[sortField] || "").toLowerCase();
        vb = (b[sortField] || "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [opportunities, search, sourceFilter, categoryFilter, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const esc = (v: string | null) => {
      if (!v) return "";
      const s = v.replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };
    const headers = ["Title", "Source", "Category", "Organization", "Value", "Due Date", "Apparel Type", "URL"];
    const rows = filtered.map((o) => [
      esc(o.title), esc(o.source_name), esc(o.source_category), esc(o.organization_name),
      esc(o.estimated_value), esc(o.due_date), esc((o.apparel_type || []).join("; ")), esc(o.source_url),
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rfp-opportunities-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading opportunities...</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search title, description, org..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="all">All Sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-500">{filtered.length} results</span>
          <button onClick={exportCSV} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort("title")}>
                  Title {sortField === "title" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort("source_name")}>
                  Source {sortField === "source_name" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Apparel Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort("estimated_value")}>
                  Value {sortField === "estimated_value" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort("due_date")}>
                  Due Date {sortField === "due_date" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((o) => {
                const isUrgent = o.due_date && new Date(o.due_date) <= new Date(Date.now() + 7 * 86400000) && new Date(o.due_date) >= new Date();
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 max-w-md">
                      <a href={o.source_url || "#"} target="_blank" rel="noopener" className="text-blue-600 hover:underline font-medium line-clamp-2">
                        {o.title}
                      </a>
                      {o.organization_name && <div className="text-xs text-gray-400 mt-0.5">{o.organization_name}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{o.source_name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full capitalize">{o.source_category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(o.apparel_type || []).slice(0, 2).map((t) => (
                          <span key={t} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{t.replace(/_/g, " ")}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{o.estimated_value || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {o.due_date ? (
                        <span className={isUrgent ? "text-red-600 font-semibold" : ""}>
                          {new Date(o.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {isUrgent && " ⚠"}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && <div className="text-center py-3 text-sm text-gray-400 border-t">Showing first 100 of {filtered.length} results</div>}
      </div>
    </div>
  );
}
