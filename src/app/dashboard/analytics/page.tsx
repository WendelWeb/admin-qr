"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area,
} from "recharts";

// ─── TYPES ───────────────────────────────────────────────
interface Comparison {
  current: number; previous: number; change: number; label: string;
}

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
    id: number; name: string; certificateNumber: number;
    country: string; examiningPhysician: string;
    createdBy: string | null; createdAt: string; expiryDate: string;
  }[];
  comparisons: {
    today: Comparison; week: Comparison; month: Comparison;
    quarter: Comparison; semester: Comparison; year: Comparison;
  };
  heatmap: { date: string; count: number }[];
  calendarDaily: { date: string; count: number }[];
  calendarMonth: number;
  calendarYear: number;
  last24h: { hour: string; count: number }[];
  records: {
    busiestDay: { date: string; count: number } | null;
    busiestWeek: { week: string; count: number } | null;
    busiestMonth: { month: string; count: number } | null;
    mostActiveAdmin: { admin: string; count: number } | null;
    topCountry: { name: string; count: number } | null;
    topPhysician: { name: string; count: number } | null;
    longestStreak: number;
  };
  projection: {
    avgPerDay: number;
    projectedMonthTotal: number;
    projectedMonthCost: string;
    daysRemaining: number;
    trend: string;
  };
  sparklineData: number[];
}

// ─── CONSTANTS ───────────────────────────────────────────
const COLORS = ["#386E65", "#1a2a3a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#059669", "#e11d48", "#6366f1", "#f59e0b"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type PresetKey = "1d" | "3d" | "7d" | "14d" | "30d" | "90d" | "6m" | "1y" | "all";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "1d", label: "1 Day" },
  { key: "3d", label: "3 Days" },
  { key: "7d", label: "7 Days" },
  { key: "14d", label: "14 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "6m", label: "6 Months" },
  { key: "1y", label: "1 Year" },
  { key: "all", label: "All Time" },
];

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "comparisons", label: "Comparisons" },
  { id: "charts", label: "Charts" },
  { id: "costs", label: "Costs" },
  { id: "heatmap", label: "Heatmap" },
  { id: "calendar", label: "Calendar" },
  { id: "live", label: "Live 24h" },
  { id: "physicians", label: "Physicians" },
  { id: "countries", label: "Countries" },
  { id: "admins", label: "Admins" },
  { id: "records", label: "Records" },
  { id: "recent", label: "Recent" },
];

// ─── HELPERS ─────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }

function getPresetDates(preset: PresetKey): { from: string; to: string } {
  const to = todayStr();
  const d = new Date();
  switch (preset) {
    case "1d": return { from: to, to };
    case "3d": d.setDate(d.getDate() - 2); break;
    case "7d": d.setDate(d.getDate() - 6); break;
    case "14d": d.setDate(d.getDate() - 13); break;
    case "30d": d.setDate(d.getDate() - 29); break;
    case "90d": d.setDate(d.getDate() - 89); break;
    case "6m": d.setMonth(d.getMonth() - 6); break;
    case "1y": d.setFullYear(d.getFullYear() - 1); break;
    case "all": return { from: "", to: "" };
  }
  return { from: d.toISOString().split("T")[0], to };
}

function fmtDateShort(s: string) { const d = new Date(s + "T00:00:00"); return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`; }
function fmtDateFull(s: string) { const d = new Date(s + "T00:00:00"); return `${MONTH_FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; }
function fmtMonth(s: string) { const [y, m] = s.split("-"); return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`; }
function fmtWeek(s: string) { return `Wk ${fmtDateShort(s)}`; }

// Mini sparkline SVG component
function Sparkline({ data, color = "#386E65", height = 28, width = 80 }: { data: number[]; color?: string; height?: number; width?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// Change badge
function ChangeBadge({ change }: { change: number }) {
  const isUp = change > 0;
  const isDown = change < 0;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold ${
      isUp ? "bg-emerald-100 text-emerald-700" : isDown ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
    }`}>
      {isUp ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
      ) : isDown ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
      ) : null}
      {change === 0 ? "—" : `${Math.abs(change)}%`}
    </span>
  );
}

// ─── PAGE ────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => { const d = getPresetDates("1d"); return d.from; });
  const [to, setTo] = useState(todayStr());
  const [activePreset, setActivePreset] = useState<PresetKey>("1d");
  const [chartView, setChartView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [exporting, setExporting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Day/period detail drill-down
  interface DrillCert {
    id: number; name: string; certificateNumber: number;
    country: string; examiningPhysician: string; medicalOfficer?: string;
    dateIssued?: string; expiryDate: string;
    createdBy: string | null; createdAt: string;
  }
  const [drillLabel, setDrillLabel] = useState("");
  const [drillCerts, setDrillCerts] = useState<DrillCert[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillOpen, setDrillOpen] = useState(false);
  const drillRef = useRef<HTMLDivElement | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const res = await fetch(`/api/analytics?${p}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
    setTimeout(() => setLoaded(true), 50);
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function applyPreset(p: PresetKey) {
    setActivePreset(p);
    const { from: f, to: t } = getPresetDates(p);
    setFrom(f);
    setTo(t);
  }

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleExportCSV() {
    setExporting(true);
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    try {
      const res = await fetch(`/api/analytics/export?${p}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificates-${from || "all"}-to-${to || "all"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* fallback handled */ }
    setExporting(false);
  }

  function handlePrint() { window.print(); }

  async function drillInto(label: string, fromDate: string, toDate: string) {
    setDrillLabel(label);
    setDrillOpen(true);
    setDrillLoading(true);
    const p = new URLSearchParams();
    p.set("from", fromDate);
    p.set("to", toDate);
    const res = await fetch(`/api/analytics/details?${p}`);
    const certs = await res.json();
    setDrillCerts(certs);
    setDrillLoading(false);
    setTimeout(() => drillRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function drillDay(dateStr: string) {
    drillInto(fmtDateFull(dateStr), dateStr, dateStr);
  }

  function drillWeek(weekStart: string) {
    const end = new Date(weekStart + "T00:00:00");
    end.setDate(end.getDate() + 6);
    drillInto(`Week of ${fmtDateShort(weekStart)}`, weekStart, end.toISOString().split("T")[0]);
  }

  function drillMonth(monthStr: string) {
    const [y, m] = monthStr.split("-");
    const start = `${y}-${m}-01`;
    const end = new Date(parseInt(y), parseInt(m), 0);
    drillInto(fmtMonth(monthStr), start, end.toISOString().split("T")[0]);
  }

  // Prepare chart data
  const chartData = chartView === "daily"
    ? (data?.daily || []).map((d) => ({ label: fmtDateShort(d.date), raw: d.date, count: d.count, cost: d.count * (data?.qrPrice || 0) }))
    : chartView === "weekly"
      ? (data?.weekly || []).map((w) => ({ label: fmtWeek(w.week), raw: w.week, count: w.count, cost: w.count * (data?.qrPrice || 0) }))
      : (data?.monthly || []).map((m) => ({ label: fmtMonth(m.month), raw: m.month, count: m.count, cost: m.count * (data?.qrPrice || 0) }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleChartClick(entry: any) {
    if (!entry?.activePayload?.[0]?.payload?.raw) return;
    const raw = entry.activePayload[0].payload.raw;
    if (chartView === "daily") drillDay(raw);
    else if (chartView === "weekly") drillWeek(raw);
    else drillMonth(raw);
  }

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

  // 24h data
  const last24hData = Array.from({ length: 24 }, (_, i) => {
    const h = `${i.toString().padStart(2, "0")}:00`;
    return { hour: h, count: data?.last24h?.find((d) => d.hour === h)?.count || 0 };
  });

  // Heatmap
  const heatmapMap: Record<string, number> = {};
  data?.heatmap?.forEach((h) => { heatmapMap[h.date] = h.count; });
  const heatmapMax = Math.max(...(data?.heatmap?.map((h) => h.count) || [1]), 1);

  // Calendar
  const calMonth = data?.calendarMonth ?? new Date().getMonth();
  const calYear = data?.calendarYear ?? new Date().getFullYear();
  const calMap: Record<string, number> = {};
  data?.calendarDaily?.forEach((d) => { calMap[d.date] = d.count; });
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calMax = Math.max(...(data?.calendarDaily?.map((d) => d.count) || [1]), 1);

  function heatColor(count: number, max: number) {
    if (count === 0) return "bg-gray-100";
    const intensity = count / max;
    if (intensity > 0.75) return "bg-emerald-700";
    if (intensity > 0.5) return "bg-emerald-500";
    if (intensity > 0.25) return "bg-emerald-400";
    return "bg-emerald-200";
  }

  // Generate heatmap grid (last 52 weeks)
  function renderHeatmap() {
    const weeks: { date: string; count: number; day: number }[][] = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay());

    let currentWeek: { date: string; count: number; day: number }[] = [];
    const d = new Date(start);
    while (d <= today) {
      const key = d.toISOString().split("T")[0];
      currentWeek.push({ date: key, count: heatmapMap[key] || 0, day: d.getDay() });
      if (d.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length) weeks.push(currentWeek);

    return (
      <div className="overflow-x-auto">
        <div className="inline-flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  onClick={() => day.count > 0 && drillDay(day.date)}
                  className={`w-[11px] h-[11px] rounded-[2px] ${heatColor(day.count, heatmapMax)} transition-colors ${day.count > 0 ? "cursor-pointer hover:ring-1 hover:ring-gray-400" : ""}`}
                  title={`${fmtDateFull(day.date)}: ${day.count} certificate${day.count !== 1 ? "s" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
          <span>Less</span>
          <div className="w-[11px] h-[11px] rounded-[2px] bg-gray-100" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-200" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-400" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-500" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-700" />
          <span>More</span>
        </div>
      </div>
    );
  }

  // ─── RENDER ────────────────────────────────────────────
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

  const animClass = loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0";
  const animStyle = "transition-all duration-500 ease-out";

  return (
    <div className="max-w-[1400px] print:max-w-full">
      {/* ─── HEADER ─── */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${animStyle} ${animClass}`}>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive certificate activity dashboard</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
          </button>
          <button onClick={handleExportCSV} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1a2a3a] text-white rounded-lg hover:bg-[#243545] transition-colors text-sm font-medium disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? "Exporting..." : "CSV"}
          </button>
        </div>
      </div>

      {/* ─── QUICK NAV ─── */}
      <div className={`sticky top-0 z-10 bg-gray-100/95 backdrop-blur-sm py-2 mb-4 -mx-4 px-4 lg:-mx-6 lg:px-6 border-b border-gray-200 print:hidden ${animStyle} ${animClass}`} style={{ transitionDelay: "50ms" }}>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => scrollTo(s.id)} className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-white transition-colors whitespace-nowrap">
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── DATE FILTER ─── */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6 print:hidden ${animStyle} ${animClass}`} style={{ transitionDelay: "100ms" }}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(({ key, label }) => (
              <button key={key} onClick={() => applyPreset(key)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePreset === key ? "bg-[#386E65] text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium w-10">From</label>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setActivePreset("1d"); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium w-10">To</label>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setActivePreset("1d"); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent" />
            </div>
            {loading && <div className="w-4 h-4 border-2 border-[#386E65] border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>
      </div>

      {/* ─── KPI CARDS WITH SPARKLINES ─── */}
      <div ref={(el) => { sectionRefs.current["overview"] = el; }} className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "150ms" }}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Certificates</p>
            <Sparkline data={data.sparklineData} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{data.totalInRange}</p>
          <p className="text-xs text-gray-400 mt-1">in selected range</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">QR Cost</p>
            <Sparkline data={data.sparklineData.map((v) => v * data.qrPrice)} color="#059669" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">${data.totalCost}</p>
          <p className="text-xs text-gray-400 mt-1">${data.qrPrice.toFixed(2)} x {data.totalInRange}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Credits Used</p>
            <Sparkline data={data.sparklineData} color="#d97706" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">{data.creditCost}</p>
          <p className="text-xs text-gray-400 mt-1">1 credit = 1 cert (PDF)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">All Time</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{data.totalAllTime}</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{data.totalAllTime}</p>
          <p className="text-xs text-gray-400 mt-1">total certificates</p>
        </div>
      </div>

      {/* ─── PROJECTION BAR ─── */}
      <div className={`bg-gradient-to-r from-[#386E65] to-[#2d5a53] text-white rounded-xl p-4 sm:p-5 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "200ms" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm opacity-80">End of Month Projection</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl sm:text-3xl font-bold">{data.projection.projectedMonthTotal} certs</span>
              <span className="text-lg opacity-80">(~${data.projection.projectedMonthCost})</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-xs opacity-60">Avg/Day</p>
              <p className="font-bold text-lg">{data.projection.avgPerDay}</p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-60">Days Left</p>
              <p className="font-bold text-lg">{data.projection.daysRemaining}</p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-60">Trend</p>
              <span className={`text-lg ${data.projection.trend === "up" ? "text-emerald-300" : data.projection.trend === "down" ? "text-red-300" : "text-gray-300"}`}>
                {data.projection.trend === "up" ? "↑" : data.projection.trend === "down" ? "↓" : "→"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── COMPARISONS ─── */}
      <div ref={(el) => { sectionRefs.current["comparisons"] = el; }} className={`mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "250ms" }}>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Period Comparisons</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.entries(data.comparisons) as [string, Comparison][]).map(([key, comp]) => (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
              <p className="text-xs text-gray-500 font-medium mb-2 truncate">{comp.label}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-800">{comp.current}</span>
                <ChangeBadge change={comp.change} />
              </div>
              <p className="text-xs text-gray-400 mt-1">prev: {comp.previous}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MAIN CHART ─── */}
      <div ref={(el) => { sectionRefs.current["charts"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "300ms" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-gray-700">Certificate Generation</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["daily", "weekly", "monthly"] as const).map((v) => (
              <button key={v} onClick={() => setChartView(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartView === v ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data for this range</div>
        ) : (
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === "daily" ? (
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }} onClick={handleChartClick} style={{ cursor: "pointer" }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(value: number | undefined) => [value ?? 0, "Certificates"]}
                    labelFormatter={(l) => `${l} — click to view details`} />
                  <Bar dataKey="count" fill="#386E65" radius={[4, 4, 0, 0]} maxBarSize={40} className="cursor-pointer" />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }} onClick={handleChartClick} style={{ cursor: "pointer" }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#386E65" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#386E65" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(value: number | undefined) => [value ?? 0, "Certificates"]} />
                  <Area type="monotone" dataKey="count" stroke="#386E65" strokeWidth={2} fill="url(#colorCount)" dot={{ fill: "#386E65", r: 3 }} activeDot={{ r: 6 }} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── COST BREAKDOWN ─── */}
      <div ref={(el) => { sectionRefs.current["costs"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "350ms" }}>
        <h2 className="text-base font-semibold text-gray-700 mb-4">Cost Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">QR Code Cost</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">${data.totalCost}</p>
            <p className="text-xs text-emerald-500 mt-1">{data.totalInRange} x ${data.qrPrice.toFixed(2)}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">PDF / Credits</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{data.creditCost}</p>
            <p className="text-xs text-amber-500 mt-1">1 credit per certificate</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Projected Month</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">${data.projection.projectedMonthCost}</p>
            <p className="text-xs text-blue-500 mt-1">~{data.projection.projectedMonthTotal} certs</p>
          </div>
        </div>
        {/* Daily cost chart */}
        {chartData.length > 0 && (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9ca3af" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                  formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, "Cost"]} />
                <Bar dataKey="cost" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── HEATMAP GITHUB ─── */}
      <div ref={(el) => { sectionRefs.current["heatmap"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "400ms" }}>
        <h2 className="text-base font-semibold text-gray-700 mb-1">Activity Heatmap</h2>
        <p className="text-xs text-gray-400 mb-4">Certificate generation over the past year</p>
        {renderHeatmap()}
      </div>

      {/* ─── MONTHLY CALENDAR ─── */}
      <div ref={(el) => { sectionRefs.current["calendar"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "420ms" }}>
        <h2 className="text-base font-semibold text-gray-700 mb-4">{MONTH_FULL[calMonth]} {calYear}</h2>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count = calMap[dateStr] || 0;
            const isToday = dateStr === todayStr();
            return (
              <div key={day} onClick={() => count > 0 && drillDay(dateStr)} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${
                isToday ? "ring-2 ring-[#386E65]" : ""
              } ${heatColor(count, calMax)} ${count > 0 ? "cursor-pointer hover:ring-2 hover:ring-gray-400" : ""}`} title={`${fmtDateFull(dateStr)}: ${count} certificate${count !== 1 ? "s" : ""} — click to view`}>
                <span className={`font-medium ${count > 0 ? "text-gray-800" : "text-gray-400"}`}>{day}</span>
                {count > 0 && <span className="text-[10px] font-bold text-emerald-800">{count}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── LIVE 24H ─── */}
      <div ref={(el) => { sectionRefs.current["live"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "440ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-base font-semibold text-gray-700">Last 24 Hours</h2>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last24hData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="color24h" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#9ca3af" }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                formatter={(value: number | undefined) => [value ?? 0, "Certificates"]} />
              <Area type="monotone" dataKey="count" stroke="#0891b2" strokeWidth={2} fill="url(#color24h)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── STATUS + PEAK HOURS + DAY OF WEEK ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Status pie */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "460ms" }}>
          <h2 className="text-base font-semibold text-gray-700 mb-4">Certificate Status</h2>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>
          ) : (
            <>
              <div className="h-40 w-40 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={4} stroke="none">
                      <Cell fill="#059669" />
                      <Cell fill="#dc2626" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600" />
                  <span className="text-sm text-gray-600">Active <strong>{data.activeCount}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                  <span className="text-sm text-gray-600">Expired <strong>{data.expiredCount}</strong></span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Peak hours */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "480ms" }}>
          <h2 className="text-base font-semibold text-gray-700 mb-4">Peak Hours</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 8, fill: "#9ca3af" }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "10px", fontSize: "13px" }}
                  formatter={(value: number | undefined) => [value ?? 0, "Certs"]} />
                <Bar dataKey="count" fill="#1a2a3a" radius={[2, 2, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of week */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "500ms" }}>
          <h2 className="text-base font-semibold text-gray-700 mb-4">Activity by Day</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "10px", fontSize: "13px" }}
                  formatter={(value: number | undefined) => [value ?? 0, "Certs"]} />
                <Bar dataKey="count" fill="#d97706" radius={[3, 3, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── TOP PHYSICIANS + COUNTRIES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div ref={(el) => { sectionRefs.current["physicians"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "520ms" }}>
          <h2 className="text-base font-semibold text-gray-700 mb-4">Top Physicians</h2>
          {data.topPhysicians.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">No data</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="h-44 w-44 shrink-0 mx-auto sm:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.topPhysicians} cx="50%" cy="50%" outerRadius={75} dataKey="count" stroke="none">
                      {data.topPhysicians.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "10px", fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-2 w-full">
                {data.topPhysicians.map((p, i) => {
                  const pct = data.totalInRange > 0 ? Math.round((p.count / data.totalInRange) * 100) : 0;
                  return (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-700 truncate flex-1">{p.name}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                      <span className="text-sm font-semibold text-gray-800 shrink-0">{p.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div ref={(el) => { sectionRefs.current["countries"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "540ms" }}>
          <h2 className="text-base font-semibold text-gray-700 mb-4">Top Countries</h2>
          {data.topCountries.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">No data</div>
          ) : (
            <div className="space-y-3">
              {data.topCountries.map((c, i) => {
                const max = data.topCountries[0].count;
                const pct = max > 0 ? (c.count / max) * 100 : 0;
                const totalPct = data.totalInRange > 0 ? Math.round((c.count / data.totalInRange) * 100) : 0;
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate">{c.name}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-gray-400">{totalPct}%</span>
                        <span className="text-sm font-semibold text-gray-800">{c.count}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── ACTIVITY BY ADMIN ─── */}
      <div ref={(el) => { sectionRefs.current["admins"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "560ms" }}>
        <h2 className="text-base font-semibold text-gray-700 mb-4">Activity by Admin</h2>
        {data.byAdmin.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-8">No data</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.byAdmin.map((a, i) => {
              const pct = data.totalInRange > 0 ? Math.round((a.count / data.totalInRange) * 100) : 0;
              return (
                <div key={a.admin} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                      {a.admin.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.admin}</p>
                      <p className="text-xs text-gray-400">{pct}% of total</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-800">{a.count}</span>
                    <span className="text-xs text-gray-400">certificates</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── RECORDS ─── */}
      <div ref={(el) => { sectionRefs.current["records"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "580ms" }}>
        <h2 className="text-base font-semibold text-gray-700 mb-4">Records & Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.records.busiestDay && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Busiest Day</p>
              <p className="text-xl font-bold text-amber-800 mt-1">{data.records.busiestDay.count}</p>
              <p className="text-xs text-amber-500 mt-1">{fmtDateFull(data.records.busiestDay.date)}</p>
            </div>
          )}
          {data.records.busiestWeek && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Busiest Week</p>
              <p className="text-xl font-bold text-blue-800 mt-1">{data.records.busiestWeek.count}</p>
              <p className="text-xs text-blue-500 mt-1">Week of {fmtDateShort(data.records.busiestWeek.week)}</p>
            </div>
          )}
          {data.records.busiestMonth && (
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-100">
              <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Best Month</p>
              <p className="text-xl font-bold text-purple-800 mt-1">{data.records.busiestMonth.count}</p>
              <p className="text-xs text-purple-500 mt-1">{fmtMonth(data.records.busiestMonth.month)}</p>
            </div>
          )}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Longest Streak</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{data.records.longestStreak}</p>
            <p className="text-xs text-emerald-500 mt-1">consecutive days</p>
          </div>
          {data.records.mostActiveAdmin && (
            <div className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-lg p-4 border border-cyan-100">
              <p className="text-xs text-cyan-600 font-medium uppercase tracking-wide">Top Admin</p>
              <p className="text-xl font-bold text-cyan-800 mt-1">{data.records.mostActiveAdmin.count}</p>
              <p className="text-xs text-cyan-500 mt-1 truncate">{data.records.mostActiveAdmin.admin}</p>
            </div>
          )}
          {data.records.topCountry && (
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-4 border border-rose-100">
              <p className="text-xs text-rose-600 font-medium uppercase tracking-wide">Top Country</p>
              <p className="text-xl font-bold text-rose-800 mt-1">{data.records.topCountry.count}</p>
              <p className="text-xs text-rose-500 mt-1 truncate">{data.records.topCountry.name}</p>
            </div>
          )}
          {data.records.topPhysician && (
            <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-lg p-4 border border-lime-100">
              <p className="text-xs text-lime-600 font-medium uppercase tracking-wide">Top Physician</p>
              <p className="text-xl font-bold text-lime-800 mt-1">{data.records.topPhysician.count}</p>
              <p className="text-xs text-lime-500 mt-1 truncate">{data.records.topPhysician.name}</p>
            </div>
          )}
          {data.validityDist.length > 0 && data.validityDist.map((v) => (
            <div key={v.years} className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{v.years}yr Validity</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{v.count}</p>
              <p className="text-xs text-gray-400 mt-1">certificates</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RECENT CERTIFICATES ─── */}
      <div ref={(el) => { sectionRefs.current["recent"] = el; }} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 ${animStyle} ${animClass}`} style={{ transitionDelay: "600ms" }}>
        <h2 className="text-base font-semibold text-gray-700 mb-4">Recent Certificates</h2>
        {data.recent.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-8">No certificates in this range</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Cert #</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Country</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Physician</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">By</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Date</th>
                    <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => {
                    const isExpired = r.expiryDate < todayStr();
                    return (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-gray-800">{r.name}</td>
                        <td className="py-2.5 px-3 text-gray-600 font-mono text-xs">{r.certificateNumber}</td>
                        <td className="py-2.5 px-3 text-gray-600">{r.country}</td>
                        <td className="py-2.5 px-3 text-gray-600">{r.examiningPhysician}</td>
                        <td className="py-2.5 px-3 text-gray-500 text-xs">{r.createdBy || "—"}</td>
                        <td className="py-2.5 px-3 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${isExpired ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {isExpired ? "Expired" : "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
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
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${isExpired ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
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

      {/* ─── DRILL-DOWN DETAIL PANEL ─── */}
      {drillOpen && (
        <div ref={drillRef} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 ${animStyle} ${animClass}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-700">Certificates — {drillLabel}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{drillCerts.length} certificate{drillCerts.length !== 1 ? "s" : ""} found</p>
            </div>
            <button onClick={() => setDrillOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {drillLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-[#386E65] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-500 text-sm">Loading certificates...</span>
            </div>
          ) : drillCerts.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">No certificates found for this period</div>
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
                      <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Officer</th>
                      <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Created By</th>
                      <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Date Issued</th>
                      <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Expires</th>
                      <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillCerts.map((c) => {
                      const isExpired = c.expiryDate < todayStr();
                      return (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-gray-800">{c.name}</td>
                          <td className="py-2.5 px-3 text-gray-600 font-mono text-xs">{c.certificateNumber}</td>
                          <td className="py-2.5 px-3 text-gray-600">{c.country}</td>
                          <td className="py-2.5 px-3 text-gray-600">{c.examiningPhysician}</td>
                          <td className="py-2.5 px-3 text-gray-600">{c.medicalOfficer || "—"}</td>
                          <td className="py-2.5 px-3 text-gray-500 text-xs">{c.createdBy || "—"}</td>
                          <td className="py-2.5 px-3 text-gray-500 text-xs">{c.dateIssued || "—"}</td>
                          <td className="py-2.5 px-3 text-gray-500 text-xs">{c.expiryDate}</td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${isExpired ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
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
                {drillCerts.map((c) => {
                  const isExpired = c.expiryDate < todayStr();
                  return (
                    <div key={c.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">#{c.certificateNumber}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${isExpired ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {isExpired ? "Expired" : "Active"}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{c.country}</span>
                        <span>{c.examiningPhysician}</span>
                        <span>{c.createdBy || "Unknown"}</span>
                        <span>Issued: {c.dateIssued || "—"}</span>
                        <span>Expires: {c.expiryDate}</span>
                        <span>Officer: {c.medicalOfficer || "—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
                <span><strong className="text-gray-700">{drillCerts.length}</strong> certificates</span>
                <span>QR cost: <strong className="text-gray-700">${(drillCerts.length * (data?.qrPrice || 0.40)).toFixed(2)}</strong></span>
                <span>Credits: <strong className="text-gray-700">{drillCerts.length}</strong></span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── FOOTER INFO ─── */}
      <div className={`bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4 sm:p-5 ${animStyle} ${animClass}`} style={{ transitionDelay: "620ms" }}>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-600">
            <strong>Cost breakdown:</strong> QR code = <strong>${data.qrPrice.toFixed(2)}</strong>/cert. PDF generation = <strong>1 credit</strong>/cert.
            Range total: <strong>${data.totalCost}</strong> QR + <strong>{data.creditCost}</strong> credits.
            Projected this month: <strong>~${data.projection.projectedMonthCost}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
