"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => { if (data.role) setRole(data.role); });
  }, []);

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
    navItems.push({ href: "/dashboard/admins", label: "Admin Management", icon: "🔐" });
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a2a3a] text-white flex flex-col min-h-screen">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">MHU Admin</h2>
          <p className="text-xs text-gray-400 mt-1">Certificate Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
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
            className="w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
