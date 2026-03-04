"use client";

import { useEffect, useState } from "react";

interface Stats {
  qrPrice: number;
  currentPeriod: {
    start: string;
    end: string;
    label: string;
    count: number;
    cost: string;
  };
  daily: { date: string; count: number }[];
  monthly: { month: string; count: number }[];
  previousPeriods: {
    start: string;
    end: string;
    label: string;
    count: number;
    cost: string;
  }[];
  totalCertificates: number;
  totalCost: string;
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export default function CostsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"daily" | "monthly" | "billing">("billing");

  useEffect(() => {
    fetch("/api/certificates/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-red-600">Failed to load analytics</div>;
  }

  const maxDaily = Math.max(...(stats.daily.map((d) => d.count)), 1);
  const maxMonthly = Math.max(...(stats.monthly.map((m) => m.count)), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Operating Costs</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">QR Code Price</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">${stats.qrPrice.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">per certificate</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Current Period</p>
          <p className="text-2xl font-bold text-[#386E65] mt-1">${stats.currentPeriod.cost}</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.currentPeriod.label} ({stats.currentPeriod.count} certs)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Certificates</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalCertificates}</p>
          <p className="text-xs text-gray-400 mt-1">all time</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Cost</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">${stats.totalCost}</p>
          <p className="text-xs text-gray-400 mt-1">all time</p>
        </div>
      </div>

      {/* Current Billing Period Highlight */}
      <div className="bg-[#386E65] text-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Current Billing Period</h2>
            <p className="text-sm opacity-80 mt-1">{stats.currentPeriod.label}</p>
            <p className="text-xs opacity-60 mt-0.5">
              {stats.currentPeriod.start} to {stats.currentPeriod.end}
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-3xl font-bold">${stats.currentPeriod.cost}</p>
            <p className="text-sm opacity-80">
              {stats.currentPeriod.count} certificates x ${stats.qrPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6">
        {(["billing", "daily", "monthly"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === tab
                ? "bg-[#386E65] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {tab === "billing" ? "Billing Periods" : tab === "daily" ? "Daily" : "Monthly"}
          </button>
        ))}
      </div>

      {/* Billing Periods Table */}
      {view === "billing" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Dates</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Certificates</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Amount Due</th>
              </tr>
            </thead>
            <tbody>
              {/* Current period */}
              <tr className="border-b bg-green-50">
                <td className="py-3 px-4 font-medium text-[#386E65]">
                  {stats.currentPeriod.label}
                  <span className="ml-2 text-xs bg-[#386E65] text-white px-2 py-0.5 rounded-full">
                    Current
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {stats.currentPeriod.start} to {stats.currentPeriod.end}
                </td>
                <td className="py-3 px-4 text-right font-medium">{stats.currentPeriod.count}</td>
                <td className="py-3 px-4 text-right font-bold text-[#386E65]">
                  ${stats.currentPeriod.cost}
                </td>
              </tr>

              {/* Previous periods */}
              {stats.previousPeriods.map((period, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-700">{period.label}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {period.start} to {period.end}
                  </td>
                  <td className="py-3 px-4 text-right">{period.count}</td>
                  <td className="py-3 px-4 text-right font-semibold">${period.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Daily Chart */}
      {view === "daily" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">
            Daily Breakdown - {stats.currentPeriod.label}
          </h3>
          {stats.daily.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No certificates in this period yet</p>
          ) : (
            <div className="space-y-2">
              {stats.daily.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 shrink-0">
                    {formatDateShort(day.date)}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-[#386E65] h-full rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${Math.max((day.count / maxDaily) * 100, 8)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{day.count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">
                    ${(day.count * stats.qrPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Monthly Chart */}
      {view === "monthly" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Monthly Overview (Last 6 Months)</h3>
          {stats.monthly.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.monthly.map((month) => (
                <div key={month.month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 shrink-0">
                    {formatMonth(month.month)}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-[#1a2a3a] h-full rounded-full flex items-center justify-end pr-3 transition-all"
                      style={{ width: `${Math.max((month.count / maxMonthly) * 100, 10)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{month.count}</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-20 text-right font-medium">
                    ${(month.count * stats.qrPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Each health certificate generated includes a QR code costing
          <strong> ${stats.qrPrice.toFixed(2)}</strong> per unit. Billing is calculated in 15-day cycles:
          the 1st to the 15th, and the 16th to the end of each month.
        </p>
      </div>
    </div>
  );
}
