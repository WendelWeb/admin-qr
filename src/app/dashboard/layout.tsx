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

  // Refresh on navigation
  useEffect(() => {
    refreshData();
    setSidebarOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Certificates", icon: "📋" },
    { href: "/dashboard/certificates/new", label: "New Certificate", icon: "➕" },
    { href: "/dashboard/staff", label: "Staff", icon: "👨‍⚕️" },
    { href: "/dashboard/costs", label: "Operating Costs", icon: "💰" },
    { href: "/dashboard/analytics", label: "Analytics", icon: "📊" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ];

  // Super admin only
  if (role === "super_admin") {
    navItems.push({ href: "/dashboard/credits", label: "Credits", icon: "🎫" });
    navItems.push({ href: "/dashboard/admins", label: "Admin Management", icon: "🔐" });
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#1a2a3a] text-white flex items-center justify-between px-4 h-14 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-gray-700 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-base font-bold">MHU Admin</h2>
        {/* Status badges - mobile */}
        <div className="flex items-center gap-1.5">
          {maintenance && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="System maintenance" />
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 w-64 bg-[#1a2a3a] text-white flex flex-col h-screen
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:z-auto
        `}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">MHU Admin</h2>
            <p className="text-xs text-gray-400 mt-1">Certificate Management</p>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Maintenance mode indicator */}
        {maintenance && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="text-xs font-medium text-amber-400">System Maintenance</span>
            </div>
            <p className="text-xs text-amber-400/70 mt-1">Services temporarily unavailable</p>
          </div>
        )}

        {/* Service status indicator */}
        {!maintenance && billingExpired && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-xs font-medium text-red-400">Service Suspended</span>
            </div>
            <p className="text-xs text-red-400/70 mt-1">Payment overdue</p>
          </div>
        )}

        {/* Credits indicator in sidebar */}
        {credits !== null && (
          <div className={`mx-4 ${billingExpired ? "mt-2" : "mt-4"} p-3 rounded-lg bg-gray-800/50 border border-gray-700`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Credits</span>
              <span className={`text-lg font-bold ${
                credits === 0 ? "text-red-400" : "text-emerald-400"
              }`}>
                {credits}
              </span>
            </div>
            <div className="mt-1.5 w-full bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  credits === 0 ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min((credits / Math.max(credits, 50)) * 100, 100)}%` }}
              />
            </div>
            {credits === 0 && (
              <p className="text-xs text-red-400 mt-1.5">No credits remaining</p>
            )}
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors ${
                pathname === item.href
                  ? "bg-[#386E65] text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 pt-[4.5rem] lg:pt-6 lg:p-6 lg:ml-64 overflow-auto min-w-0">
        {maintenance && role !== "super_admin" ? (
          <div className="fixed inset-0 lg:left-64 z-30 bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center">
              {/* Server down icon */}
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 5.636a9 9 0 1012.728 0M12 3v6" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-800 mb-2">Server Unavailable</h1>
              <p className="text-red-600 font-medium text-sm mb-4">CONNECTION_REFUSED - Primary server is not responding</p>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left mb-6">
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

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-left mb-6">
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
        ) : (
          children
        )}
      </main>
    </div>
  );
}
