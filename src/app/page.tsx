"use client";

import { useState } from "react";
import Overview from "@/components/Overview";
import OpportunitiesTable from "@/components/OpportunitiesTable";
import Pipeline from "@/components/Pipeline";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "opportunities", label: "Opportunities" },
  { id: "pipeline", label: "Pipeline" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">RFP Scout</h1>
              <p className="text-blue-200 text-sm mt-1">WolfGrey.ai — Automated Apparel RFP Discovery</p>
            </div>
            <div className="text-right text-sm text-blue-200">
              <div>Dashboard</div>
              <div className="text-white font-medium">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-6 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-50 text-gray-900"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "overview" && <Overview />}
        {activeTab === "opportunities" && <OpportunitiesTable />}
        {activeTab === "pipeline" && <Pipeline />}
      </main>
    </div>
  );
}
