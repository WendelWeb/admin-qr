"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [billingExpired, setBillingExpired] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function refreshData() {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((data) => { if (typeof data.credits === "number") setCredits(data.credits); });

    fetch("/api/billing")
      .then((r) => r.json())
      .then((data) => { setBillingExpired(!!data.isExpired); setMaintenance(!!data.maintenanceMode); });
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => { if (data.role) setRole(data.role); });

    refreshData();
  }, []);

  useEffect(() => {
    refreshData();
    setSidebarOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Certificates", icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6m-6 4h6" />
      </svg>
    )},
    { href: "/dashboard/certificates/new", label: "New Certificate", icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    )},
    { href: "/dashboard/staff", label: "Staff", icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { href: "/dashboard/costs", label: "Operating Costs", icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { href: "/dashboard/analytics", label: "Analytics", icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { href: "/dashboard/settings", label: "Settings", icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  // Super admin only
  if (role === "super_admin") {
    navItems.push(
      { href: "/dashboard/credits", label: "Credits", icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      )},
      { href: "/dashboard/admins", label: "Admin Management", icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )},
      { href: "/dashboard/deleted-certificates", label: "Deleted Certificates", icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )},
    );
  }

  // Total blackout for non-super-admin during maintenance
  if (maintenance && role && role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 5.636a9 9 0 1012.728 0M12 3v6" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Server Unavailable</h1>
          <p className="text-red-600 font-medium text-sm mb-4">CONNECTION_REFUSED — Primary server is not responding</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-left mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-700">Status: Offline</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              The primary application server has experienced an unexpected failure and is currently unreachable. All services, including certificate generation, data retrieval, and system management, are temporarily unavailable.
            </p>
            <p className="text-sm text-gray-600">
              Our technical team has been automatically alerted and is working to restore service as quickly as possible. No data has been lost during this outage.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-left mb-6">
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">Why does this happen?</p>
            <p className="text-sm text-blue-700">
              This system currently operates on a single-server architecture. When that server goes down — whether for maintenance, hardware failure, or unexpected load — the entire platform becomes inaccessible.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              This is why it is strongly recommended to invest in a <strong>multi-server infrastructure</strong>. With two or more redundant servers, if one node fails, traffic is automatically routed to the remaining healthy nodes — ensuring <strong>zero downtime</strong>, continuous availability, and uninterrupted service for all users.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Attempting to reconnect...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-[#0e1c26] to-[#1a2a3a] text-white flex items-center justify-between px-4 h-14 lg:hidden border-b border-white/5">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#386E65] flex items-center justify-center text-xs font-bold">M</div>
          <h2 className="text-base font-bold tracking-tight">MHU Admin</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {maintenance && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" title="System maintenance" />
          )}
          {!maintenance && billingExpired && (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Service suspended" />
          )}
          {credits !== null && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              credits === 0
                ? "bg-red-500/20 text-red-300"
                : "bg-[#386E65]/30 text-emerald-300"
            }`}>
              {credits}
            </span>
          )}
        </div>
      </div>

      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0e1c26] to-[#162735] text-white flex flex-col h-screen
          transform transition-transform duration-200 ease-in-out border-r border-white/5
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#386E65] to-[#1f4640] flex items-center justify-center text-white font-bold shadow-lg shadow-[#386E65]/20 ring-1 ring-white/10">
              M
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight leading-tight">MHU Admin</h2>
              <p className="text-[11px] text-white/50 mt-0.5">Certificate Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Maintenance mode indicator */}
        {maintenance && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <span className="text-xs font-medium text-amber-300">System Maintenance</span>
            </div>
            <p className="text-[11px] text-amber-300/70 mt-1 leading-relaxed">Services temporarily unavailable</p>
          </div>
        )}

        {/* Credits indicator */}
        {credits !== null && (
          <div className={`mx-4 ${maintenance ? "mt-2" : "mt-4"}`}>
            <div className={`relative overflow-hidden rounded-xl p-3.5 ring-1 ${
              credits === 0
                ? "bg-red-500/10 ring-red-500/20"
                : "bg-gradient-to-br from-[#386E65]/20 to-[#1f4640]/20 ring-white/10"
            }`}>
              {credits > 0 && (
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
              )}
              <div className="relative flex items-center justify-between">
                <span className="text-[11px] text-white/50 uppercase tracking-widest font-medium">Credits</span>
                <span className={`text-xl font-bold tabular-nums ${
                  credits === 0 ? "text-red-300" : "text-emerald-300"
                }`}>
                  {credits}
                </span>
              </div>
              <div className="relative mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    credits === 0 ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  }`}
                  style={{ width: `${Math.min((credits / Math.max(credits, 50)) * 100, 100)}%` }}
                />
              </div>
              {credits === 0 && (
                <p className="relative text-[11px] text-red-300 mt-2 leading-relaxed">No credits remaining</p>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#386E65] to-[#2d5a53] text-white shadow-lg shadow-[#386E65]/20 ring-1 ring-white/10"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/40" />
                )}
                <span className={`shrink-0 ${active ? "text-white" : "text-white/50 group-hover:text-white/80"} transition-colors`}>
                  {item.icon}
                </span>
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/65 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 pt-[4.5rem] lg:pt-8 lg:p-8 lg:ml-64 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
