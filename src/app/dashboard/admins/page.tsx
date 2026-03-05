"use client";

import { useEffect, useState } from "react";

interface Admin {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  // Add form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adding, setAdding] = useState(false);

  // Reset password
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");

  function loadData() {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setRole(data.role || "");
      });

    fetch("/api/users")
      .then((r) => {
        if (r.status === 403) return [];
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setAdmins(data);
        setLoading(false);
      });
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAdding(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create admin");
    } else {
      setSuccess(`Admin ${email} created successfully!`);
      setEmail("");
      setPassword("");
      loadData();
    }
    setAdding(false);
  }

  async function handleDelete(admin: Admin) {
    if (!confirm(`Remove admin "${admin.email}"? They will no longer be able to log in.`)) return;

    const res = await fetch(`/api/users/${admin.id}`, { method: "DELETE" });
    if (res.ok) loadData();
  }

  async function handleResetPassword(id: number) {
    setResetError("");

    if (!resetPassword || resetPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }

    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });

    if (res.ok) {
      setResetId(null);
      setResetPassword("");
      setSuccess("Password reset successfully!");
    } else {
      const data = await res.json();
      setResetError(data.error || "Failed to reset password");
    }
  }

  if (role !== "super_admin") {
    return (
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Admin Management</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 text-sm">Only the super admin can manage admin accounts.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Admin Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Admin */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Add New Admin</h2>
          <p className="text-xs text-gray-400 mb-4">Create a new admin account. They will be able to create and manage certificates.</p>

          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">The admin can change their password later in Settings.</p>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <button
              type="submit"
              disabled={adding}
              className="px-5 py-2 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm disabled:opacity-50"
            >
              {adding ? "Creating..." : "Create Admin"}
            </button>
          </form>
        </div>

        {/* Admin List */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Current Admins</h2>

          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="p-3 rounded-md border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{admin.email}</p>
                    <p className="text-xs text-gray-400">
                      {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                      {" - "}
                      {new Date(admin.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {admin.role !== "super_admin" && !resetId && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setResetId(admin.id); setResetPassword(""); setResetError(""); }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleDelete(admin)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Reset password inline - shown below on mobile */}
                {admin.role !== "super_admin" && resetId === admin.id && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="New password"
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#386E65]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleResetPassword(admin.id);
                          if (e.key === "Escape") { setResetId(null); setResetPassword(""); setResetError(""); }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResetPassword(admin.id)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium px-2 py-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setResetId(null); setResetPassword(""); setResetError(""); }}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    {resetError && <p className="text-red-600 text-xs mt-1">{resetError}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
