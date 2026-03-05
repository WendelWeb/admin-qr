"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => { if (data.role) setRole(data.role); });

    fetch("/api/credits")
      .then((r) => r.json())
      .then((data) => { if (typeof data.credits === "number") setCredits(data.credits); });
  }, []);

  // Refresh credits when navigating (e.g. after creating a certificate)
  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((data) => { if (typeof data.credits === "number") setCredits(data.credits); });
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
        {/* Credits badge - mobile */}
        <div className="flex items-center gap-1.5">
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
          fixed top-0 left-0 z-50 w-64 bg-[#1a2a3a] text-white flex flex-col min-h-screen h-full
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
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

        {/* Credits indicator in sidebar */}
        {credits !== null && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
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
      <main className="flex-1 p-4 pt-[4.5rem] lg:pt-6 lg:p-6 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
