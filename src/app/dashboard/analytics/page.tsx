"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

interface AnalyticsData {
  qrPrice: number;
  totalInRange: number;
  totalAllTime: number;
  totalCost: string;
  creditCost: number;
  daily: { date: string; count: number }[];
  weekly: { week: string; count: number }[];
  monthly: { month: string; count: number }[];
  topPhysicians: { name: string; count: number }[];
  topCountries: { name: string; count: number }[];
  activeCount: number;
  expiredCount: number;
  peakHours: { hour: number; count: number }[];
  dayOfWeek: { day: number; count: number }[];
  byAdmin: { admin: string; count: number }[];
  validityDist: { years: number; count: number }[];
  recent: {
    id: number;
    name: string;
    certificateNumber: number;
    country: string;
    examiningPhysician: string;
    createdBy: string | null;
    createdAt: string;
    expiryDate: string;
  }[];
}

const COLORS = ["#386E65", "#1a2a3a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#059669", "#e11d48", "#6366f1", "#f59e0b"];
const PIE_COLORS = ["#386E65", "#1a2a3a", "#d97706", "#7c3aed", "#0891b2", "#dc2626", "#059669", "#6366f1", "#e11d48", "#f59e0b"];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}

function formatWeek(weekStr: string) {
  const d = new Date(weekStr + "T00:00:00");
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

// Quick preset ranges
type PresetKey = "7d" | "30d" | "90d" | "6m" | "1y" | "all";

function getPresetDates(preset: PresetKey): { from: string; to: string } {
  const to = todayStr();
  const d = new Date();
  switch (preset) {
    case "7d": d.setDate(d.getDate() - 7); break;
    case "30d": d.setDate(d.getDate() - 30); break;
    case "90d": d.setDate(d.getDate() - 90); break;
    case "6m": d.setMonth(d.getMonth() - 6); break;
    case "1y": d.setFullYear(d.getFullYear() - 1); break;
    case "all": return { from: "", to: "" };
  }
  return { from: d.toISOString().split("T")[0], to };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(thirtyDaysAgo());
  const [to, setTo] = useState(todayStr());
  const [activePreset, setActivePreset] = useState<PresetKey>("30d");
  const [chartView, setChartView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/analytics?${params}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function applyPreset(preset: PresetKey) {
    setActivePreset(preset);
    const { from: f, to: t } = getPresetDates(preset);
    setFrom(f);
    setTo(t);
  }

  async function handleExportCSV() {
    if (!data) return;
    setExporting(true);

    // Build CSV from all certificates in range
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    try {
      const res = await fetch(`/api/analytics/export?${params}`);
      if (!res.ok) {
        // Fallback: export from current data
        exportFromCurrentData();
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificates-analytics-${from || "all"}-to-${to || "all"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      exportFromCurrentData();
    }
    setExporting(false);
  }

  function exportFromCurrentData() {
    if (!data) return;
    const headers = ["Date", "Name", "Certificate #", "Country", "Physician", "Created By", "Expiry"];
    const rows = data.recent.map((r) => [
      new Date(r.createdAt).toLocaleDateString(),
      r.name,
      r.certificateNumber,
      r.country,
      r.examiningPhysician,
      r.createdBy || "Unknown",
      r.expiryDate,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificates-summary-${from || "all"}-to-${to || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  // Chart data preparation
  const chartData = chartView === "daily"
    ? (data?.daily || []).map((d) => ({ label: formatDateShort(d.date), count: d.count }))
    : chartView === "weekly"
      ? (data?.weekly || []).map((w) => ({ label: formatWeek(w.week), count: w.count }))
      : (data?.monthly || []).map((m) => ({ label: formatMonth(m.month), count: m.count }));

  const statusData = data ? [
    { name: "Active", value: data.activeCount },
    { name: "Expired", value: data.expiredCount },
  ].filter((d) => d.value > 0) : [];

  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    count: data?.peakHours.find((h) => h.hour === i)?.count || 0,
  }));

  const dowData = Array.from({ length: 7 }, (_, i) => ({
    day: DAY_NAMES[i],
    count: data?.dayOfWeek.find((d) => d.day === i)?.count || 0,
  }));

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#386E65] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-red-600">Failed to load analytics</div>;

  return (
    <div className="max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive overview of all certificate activity</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a2a3a] text-white rounded-lg hover:bg-[#243545] transition-colors text-sm font-medium disabled:opacity-50 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="flex flex-col gap-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {([
              ["7d", "7 Days"],
              ["30d", "30 Days"],
              ["90d", "90 Days"],
              ["6m", "6 Months"],
              ["1y", "1 Year"],
              ["all", "All Time"],
            ] as [PresetKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activePreset === key
                    ? "bg-[#386E65] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setActivePreset("7d"); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setActivePreset("7d"); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent"
              />
            </div>
            {loading && (
              <div className="w-4 h-4 border-2 border-[#386E65] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Certificates</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{data.totalInRange}</p>
          <p className="text-xs text-gray-400 mt-1">in selected range</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">QR Cost</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#386E65] mt-1">${data.totalCost}</p>
          <p className="text-xs text-gray-400 mt-1">${data.qrPrice.toFixed(2)} x {data.totalInRange}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Credits Used</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">{data.creditCost}</p>
          <p className="text-xs text-gray-400 mt-1">1 credit per cert</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">All Time</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{data.totalAllTime}</p>
          <p className="text-xs text-gray-400 mt-1">total certificates</p>
        </div>
      </div>

      {/* Main Chart - Bar/Line */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-gray-700">Certificate Generation</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["daily", "weekly", "monthly"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartView === v
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            No data for this range
          </div>
        ) : (
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === "daily" ? (
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                    formatter={(value: number | undefined) => [value ?? 0, "Certificates"]}
                  />
                  <Bar dataKey="count" fill="#386E65" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                    formatter={(value: number | undefined) => [value ?? 0, "Certificates"]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#386E65" strokeWidth={2} dot={{ fill: "#386E65", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Active vs Expired - Pie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Certificate Status</h2>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={4}
                      stroke="none"
                    >
                      <Cell fill="#059669" />
                      <Cell fill="#dc2626" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Active</p>
                    <p className="text-lg font-bold text-emerald-600">{data.activeCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Expired</p>
                    <p className="text-lg font-bold text-red-600">{data.expiredCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Physicians - Pie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Top Physicians</h2>
          {data.topPhysicians.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.topPhysicians}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      stroke="none"
                    >
                      {data.topPhysicians.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-2 w-full">
                {data.topPhysicians.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm text-gray-700 truncate flex-1">{p.name}</span>
                    <span className="text-sm font-semibold text-gray-800 shrink-0">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Top Countries</h2>
          {data.topCountries.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
          ) : (
            <div className="space-y-3">
              {data.topCountries.map((c, i) => {
                const max = data.topCountries[0].count;
                const pct = max > 0 ? (c.count / max) * 100 : 0;
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate">{c.name}</span>
                      <span className="text-sm font-semibold text-gray-800 shrink-0 ml-2">{c.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity by Admin */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Activity by Admin</h2>
          {data.byAdmin.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
          ) : (
            <div className="space-y-3">
              {data.byAdmin.map((a, i) => {
                const max = data.byAdmin[0].count;
                const pct = max > 0 ? (a.count / max) * 100 : 0;
                return (
                  <div key={a.admin}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        >
                          {a.admin.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 truncate">{a.admin}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 shrink-0 ml-2">{a.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 ml-8">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Peak Hours & Day of Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Peak Hours */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Peak Hours</h2>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#9ca3af" }} interval={2} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                  formatter={(value: number | undefined) => [value ?? 0, "Certificates"]}
                />
                <Bar dataKey="count" fill="#1a2a3a" radius={[3, 3, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of Week */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Activity by Day</h2>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                  formatter={(value: number | undefined) => [value ?? 0, "Certificates"]}
                />
                <Bar dataKey="count" fill="#d97706" radius={[3, 3, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Validity Distribution */}
      {data.validityDist.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Certificate Validity Distribution</h2>
          <div className="flex flex-wrap gap-4">
            {data.validityDist.map((v) => (
              <div key={v.years} className="flex-1 min-w-[120px] bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{v.count}</p>
                <p className="text-sm text-gray-500 mt-1">{v.years} year{v.years !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Certificates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Recent Certificates</h2>
        {data.recent.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-8">No certificates in this range</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Cert #</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Country</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Physician</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Created By</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Date</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => {
                    const isExpired = r.expiryDate < todayStr();
                    return (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-medium text-gray-800">{r.name}</td>
                        <td className="py-2.5 px-3 text-gray-600 font-mono text-xs">{r.certificateNumber}</td>
                        <td className="py-2.5 px-3 text-gray-600">{r.country}</td>
                        <td className="py-2.5 px-3 text-gray-600">{r.examiningPhysician}</td>
                        <td className="py-2.5 px-3 text-gray-500 text-xs">{r.createdBy || "—"}</td>
                        <td className="py-2.5 px-3 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            isExpired
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {isExpired ? "Expired" : "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {data.recent.map((r) => {
                const isExpired = r.expiryDate < todayStr();
                return (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{r.name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">#{r.certificateNumber}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        isExpired
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {isExpired ? "Expired" : "Active"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{r.country}</span>
                      <span>{r.examiningPhysician}</span>
                      <span>{r.createdBy || "Unknown"}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Cost summary info */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Cost breakdown:</strong> Each certificate costs <strong>${data.qrPrice.toFixed(2)}</strong> for QR code generation
              and uses <strong>1 credit</strong> from the credit balance. Total QR cost for the selected period: <strong>${data.totalCost}</strong>,
              total credits consumed: <strong>{data.creditCost}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
