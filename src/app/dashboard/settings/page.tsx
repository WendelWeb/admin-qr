"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Super admin price settings
  const [role, setRole] = useState("");
  const [qrPrice, setQrPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [priceSuccess, setPriceSuccess] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);

  // Maintenance mode
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  // Template settings
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [templateUploading, setTemplateUploading] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [templateSuccess, setTemplateSuccess] = useState("");

  // Billing simulation
  const [simulating, setSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState("");
  const [billingExpired, setBillingExpired] = useState(false);

  useEffect(() => {
    // Get current user role
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.role) setRole(data.role);
      });

    // Get current price + maintenance status
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.qrPrice) setQrPrice(data.qrPrice);
      });

    fetch("/api/billing")
      .then((r) => r.json())
      .then((data) => {
        setMaintenance(!!data.maintenanceMode);
        setBillingExpired(!!data.isExpired);
      });

    // Get current template
    fetch("/api/template")
      .then((r) => r.json())
      .then((data) => {
        if (data.template) setTemplateName(data.template.name);
      });
  }, []);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change password");
        setLoading(false);
        return;
      }

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("An error occurred. Please try again.");
    }
    setLoading(false);
  }

  async function handleTemplateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setTemplateError("");
    setTemplateSuccess("");
    setTemplateUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/template", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setTemplateError(data.error || "Failed to upload template");
      } else {
        setTemplateSuccess("Template uploaded successfully!");
        setTemplateName(data.name);
      }
    } catch {
      setTemplateError("An error occurred during upload.");
    }
    setTemplateUploading(false);
    e.target.value = "";
  }

  async function handleTemplateDelete() {
    if (!confirm("Remove the current template?")) return;
    setTemplateError("");
    setTemplateSuccess("");

    try {
      await fetch("/api/template", { method: "DELETE" });
      setTemplateName(null);
      setTemplateSuccess("Template removed.");
    } catch {
      setTemplateError("Failed to remove template.");
    }
  }

  async function handleMaintenanceToggle() {
    setMaintenanceLoading(true);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !maintenance }),
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenance(data.maintenanceMode);
      }
    } catch {
      // silently fail
    }
    setMaintenanceLoading(false);
  }

  async function handlePriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPriceError("");
    setPriceSuccess("");

    const price = parseFloat(qrPrice);
    if (isNaN(price) || price <= 0) {
      setPriceError("Please enter a valid price");
      return;
    }

    setPriceLoading(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrPrice: price }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPriceError(data.error || "Failed to update price");
        setPriceLoading(false);
        return;
      }

      setPriceSuccess("QR price updated successfully!");
      setQrPrice(data.qrPrice);
    } catch {
      setPriceError("An error occurred. Please try again.");
    }
    setPriceLoading(false);
  }

  return (
    <div>
      {/* ─── HERO ─── */}
      <div className="relative bg-gradient-to-br from-[#0e1c26] via-[#1a3530] to-[#386E65] rounded-3xl text-white overflow-hidden shadow-2xl mb-6">
        <div className="absolute -top-32 -right-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Dashboard · Settings</div>
          </div>
          {role && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/90 ring-1 ring-white/20">
              {role === "super_admin" ? "Super Admin" : "Admin"}
            </div>
          )}
        </div>

        <div className="relative px-6 sm:px-10 py-6 sm:py-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">Settings</h1>
          <p className="text-sm sm:text-base text-white/65 mt-2 max-w-xl">
            Manage your account, security, and system-wide preferences.
          </p>
        </div>

        <div className="relative px-6 sm:px-10 pb-6 sm:pb-8 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/20 ring-1 ring-emerald-300/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-white/50">Template</div>
              <div className="text-sm font-semibold text-white truncate">{templateName ? "Loaded" : "None"}</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${
              maintenance ? "bg-amber-400/20 ring-amber-300/30" : "bg-emerald-400/20 ring-emerald-300/30"
            }`}>
              <svg className={`w-5 h-5 ${maintenance ? "text-amber-200" : "text-emerald-200"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-white/50">System</div>
              <div className="text-sm font-semibold text-white">{maintenance ? "Maintenance" : "Online"}</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${
              billingExpired ? "bg-red-500/20 ring-red-300/30" : "bg-emerald-400/20 ring-emerald-300/30"
            }`}>
              <svg className={`w-5 h-5 ${billingExpired ? "text-red-200" : "text-emerald-200"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-white/50">Billing</div>
              <div className="text-sm font-semibold text-white">{billingExpired ? "Expired" : "Active"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 max-w-2xl">
        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Change Password</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65] text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65] text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65] text-sm transition-all"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#386E65] text-white rounded-xl hover:bg-[#2d5a53] transition-colors text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Saving..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* PDF Template */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Certificate Template</h2>
          <p className="text-xs text-gray-400 mb-4">
            Upload a PDF template. Certificate data and QR code will be overlaid on top.
          </p>

          {templateName ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-emerald-700 text-sm font-medium truncate min-w-0 flex-1">{templateName}</span>
              <button
                onClick={handleTemplateDelete}
                className="text-xs text-red-600 hover:text-red-800 font-medium shrink-0 cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No template uploaded yet.</p>
          )}

          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#386E65] text-white rounded-xl hover:bg-[#2d5a53] transition-colors text-sm font-medium cursor-pointer">
            {templateUploading ? "Uploading..." : templateName ? "Replace Template" : "Upload PDF Template"}
            <input
              type="file"
              accept=".pdf"
              onChange={handleTemplateUpload}
              disabled={templateUploading}
              className="hidden"
            />
          </label>

          {templateError && <p className="text-red-600 text-sm mt-2">{templateError}</p>}
          {templateSuccess && <p className="text-green-600 text-sm mt-2">{templateSuccess}</p>}
        </div>

        {/* Maintenance Mode - Super Admin Only */}
        {role === "super_admin" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-gray-700">System Maintenance</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                maintenance
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${maintenance ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
                {maintenance ? "Maintenance Active" : "System Online"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Only visible to super admins</p>

            <p className="text-sm text-gray-600 mb-4">
              {maintenance
                ? "The system is currently in maintenance mode. All certificate creation is suspended. Regular admins will see a maintenance notice when they access the system."
                : "The system is operating normally. Toggle maintenance mode to temporarily suspend all certificate creation services."}
            </p>

            <button
              onClick={handleMaintenanceToggle}
              disabled={maintenanceLoading}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                maintenance
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-amber-600 text-white hover:bg-amber-700"
              }`}
            >
              {maintenanceLoading
                ? "Updating..."
                : maintenance
                  ? "Disable Maintenance Mode"
                  : "Enable Maintenance Mode"}
            </button>

            {maintenance && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-700">
                  While maintenance mode is active, no admin can create new certificates. The system will display a professional maintenance notice to all users.
                </p>
              </div>
            )}
          </div>
        )}

        {/* QR Price - Super Admin Only */}
        {role === "super_admin" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-1">QR Code Price</h2>
            <p className="text-xs text-gray-400 mb-4">Only visible to super admins</p>

            <form onSubmit={handlePriceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per QR Code (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={qrPrice}
                    onChange={(e) => setQrPrice(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {priceError && <p className="text-red-600 text-sm">{priceError}</p>}
              {priceSuccess && <p className="text-green-600 text-sm">{priceSuccess}</p>}

              <button
                type="submit"
                disabled={priceLoading}
                className="px-6 py-2.5 bg-[#386E65] text-white rounded-xl hover:bg-[#2d5a53] transition-colors text-sm font-medium disabled:opacity-50"
              >
                {priceLoading ? "Saving..." : "Update Price"}
              </button>
            </form>
          </div>
        )}

        {/* Billing Simulation - Super Admin Only */}
        {role === "super_admin" && (
          <div className="bg-white rounded-2xl border border-gray-200 border-l-4 border-l-indigo-500 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-gray-700">Billing Simulation</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                billingExpired
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${billingExpired ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
                {billingExpired ? "Billing Expired" : "Billing Active"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Testing tool — only visible to super admins</p>

            <p className="text-sm text-gray-600 mb-4">
              Simulate what happens when the 4th of the month arrives. This will:
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1 ml-4 list-disc">
              <li>Expire the billing period immediately</li>
              <li>Block certificate creation for regular admins</li>
              <li>Display the full billing invoice to all admins</li>
            </ul>
            <p className="text-xs text-indigo-600 mb-4 font-medium">
              Your super admin account will not be affected — you can still create certificates and access all features.
            </p>

            {simSuccess && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                <p className="text-sm text-indigo-700">{simSuccess}</p>
              </div>
            )}

            <button
              onClick={async () => {
                if (!confirm("Simulate billing expiration? This will expire the billing period. Regular admins will be blocked from creating certificates.\n\nCredits will not be affected. You (super admin) will NOT be affected.")) return;
                setSimulating(true);
                setSimSuccess("");
                const res = await fetch("/api/billing", { method: "PATCH" });
                if (res.ok) {
                  setBillingExpired(true);
                  setSimSuccess("Billing expiration simulated. Log in as a regular admin to see the blocked experience. Use 'Confirm Payment Received' in Operating Costs to restore service.");
                }
                setSimulating(false);
              }}
              disabled={simulating || billingExpired}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {simulating ? "Simulating..." : billingExpired ? "Billing Already Expired" : "Simulate \"The 4th Has Arrived\""}
            </button>

            {billingExpired && (
              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={async () => {
                    if (!confirm("End the simulation and restore billing to active?")) return;
                    setSimulating(true);
                    setSimSuccess("");
                    const res = await fetch("/api/billing", { method: "POST" });
                    if (res.ok) {
                      setBillingExpired(false);
                      setSimSuccess("Simulation ended. Billing restored to active.");
                    }
                    setSimulating(false);
                  }}
                  disabled={simulating}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {simulating ? "Restoring..." : "End Simulation — Restore Billing"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
