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
  nextBillingDate: string;
  daysUntilBilling: number;
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

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
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
  const [role, setRole] = useState("");
  const [billingExpired, setBillingExpired] = useState(false);
  const [billingPaidUntil, setBillingPaidUntil] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => { if (data.role) setRole(data.role); });

    fetch("/api/billing")
      .then((r) => r.json())
      .then((data) => {
        setBillingExpired(!!data.isExpired);
        setBillingPaidUntil(data.billingPaidUntil);
      });

    fetch("/api/certificates/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleConfirmPayment() {
    if (!confirm("Confirm that the monthly payment has been received? This will reactivate certificate generation until the next billing date.")) return;
    setConfirming(true);
    const res = await fetch("/api/billing", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setBillingExpired(false);
      setBillingPaidUntil(data.billingPaidUntil);
    }
    setConfirming(false);
  }

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
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Operating Costs</h1>

      {/* Next Billing Date - Payment Reminder */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800">Next Payment Due</h3>
              <p className="text-lg font-bold text-amber-900 mt-0.5">
                {formatDateFull(stats.nextBillingDate)}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Payment is mandatory on the 4th of each month. Failure to pay on time may result in service interruption.
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
              stats.daysUntilBilling <= 3
                ? "bg-red-100 text-red-700"
                : stats.daysUntilBilling <= 7
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
            }`}>
              <span className="text-lg">{stats.daysUntilBilling}</span>
              <span className="text-xs">day{stats.daysUntilBilling !== 1 ? "s" : ""} left</span>
            </div>
            <p className="text-xs text-amber-600 mt-1.5">
              Amount due: <strong className="text-amber-800">${stats.currentPeriod.cost}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Service Status - Super Admin Control */}
      {role === "super_admin" && (
        <div className={`rounded-xl p-4 sm:p-5 mb-6 border ${
          billingExpired
            ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
            : "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                billingExpired ? "bg-red-100" : "bg-emerald-100"
              }`}>
                {billingExpired ? (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${billingExpired ? "text-red-800" : "text-emerald-800"}`}>
                  {billingExpired ? "Service Suspended" : "Service Active"}
                </h3>
                <p className={`text-xs mt-0.5 ${billingExpired ? "text-red-600" : "text-emerald-600"}`}>
                  {billingExpired
                    ? "Payment has not been confirmed. Certificate generation is blocked for all admins."
                    : `Paid until ${billingPaidUntil ? formatDateFull(billingPaidUntil) : "—"}`
                  }
                </p>
              </div>
            </div>
            {billingExpired && (
              <button
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 shrink-0"
              >
                {confirming ? "Confirming..." : "Confirm Payment Received"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">QR Price</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">${stats.qrPrice.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">per certificate</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Current Period</p>
          <p className="text-xl sm:text-2xl font-bold text-[#386E65] mt-1">${stats.currentPeriod.cost}</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.currentPeriod.count} certs
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Certs</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{stats.totalCertificates}</p>
          <p className="text-xs text-gray-400 mt-1">all time</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Cost</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">${stats.totalCost}</p>
          <p className="text-xs text-gray-400 mt-1">all time</p>
        </div>
      </div>

      {/* Current Billing Period Highlight */}
      <div className="bg-[#386E65] text-white rounded-lg shadow p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">Current Billing Period</h2>
            <p className="text-sm opacity-80 mt-1">{stats.currentPeriod.label}</p>
          </div>
          <div className="mt-3 sm:mt-0 sm:text-right">
            <p className="text-2xl sm:text-3xl font-bold">${stats.currentPeriod.cost}</p>
            <p className="text-sm opacity-80">
              {stats.currentPeriod.count} certificates x ${stats.qrPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(["billing", "daily", "monthly"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              view === tab
                ? "bg-[#386E65] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {tab === "billing" ? "Billing Periods" : tab === "daily" ? "Daily" : "Monthly"}
          </button>
        ))}
      </div>

      {/* Billing Periods */}
      {view === "billing" && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
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
                  <td className="py-3 px-4 text-right font-medium">{stats.currentPeriod.count}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#386E65]">
                    ${stats.currentPeriod.cost}
                  </td>
                </tr>

                {/* Previous periods */}
                {stats.previousPeriods.map((period, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-700">{period.label}</td>
                    <td className="py-3 px-4 text-right">{period.count}</td>
                    <td className="py-3 px-4 text-right font-semibold">${period.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {/* Current period */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[#386E65]">{stats.currentPeriod.label}</span>
                <span className="text-xs bg-[#386E65] text-white px-2 py-0.5 rounded-full">Current</span>
              </div>
              <div className="flex justify-between items-end mt-2">
                <span className="text-xs text-gray-500">{stats.currentPeriod.count} certificates</span>
                <span className="text-lg font-bold text-[#386E65]">${stats.currentPeriod.cost}</span>
              </div>
            </div>

            {/* Previous periods */}
            {stats.previousPeriods.map((period, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{period.label}</p>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-gray-500">{period.count} certificates</span>
                  <span className="text-base font-semibold text-gray-800">${period.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Daily Chart */}
      {view === "daily" && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">
            Daily Breakdown — Current Period
          </h3>
          {stats.daily.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No certificates in this period yet</p>
          ) : (
            <div className="space-y-2">
              {stats.daily.map((day) => (
                <div key={day.date} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-gray-500 w-14 sm:w-16 shrink-0">
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
                  <span className="text-xs text-gray-500 w-14 sm:w-16 text-right">
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
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Monthly Overview (Last 6 Months)</h3>
          {stats.monthly.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.monthly.map((month) => (
                <div key={month.month} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-gray-500 w-16 sm:w-20 shrink-0">
                    {formatMonth(month.month)}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-7 sm:h-8 overflow-hidden">
                    <div
                      className="bg-[#1a2a3a] h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 transition-all"
                      style={{ width: `${Math.max((month.count / maxMonthly) * 100, 10)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{month.count}</span>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 w-16 sm:w-20 text-right font-medium">
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
          <strong> ${stats.qrPrice.toFixed(2)}</strong> per unit. Billing runs monthly from the 4th to the 3rd of the following month. <strong>Payment is due on the 4th of every month</strong> and is mandatory to maintain service.
        </p>
      </div>
    </div>
  );
}
