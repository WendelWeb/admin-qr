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

  // Template settings
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [templateUploading, setTemplateUploading] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [templateSuccess, setTemplateSuccess] = useState("");

  useEffect(() => {
    // Get current user role
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.role) setRole(data.role);
      });

    // Get current price
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.qrPrice) setQrPrice(data.qrPrice);
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
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      <div className="space-y-6 max-w-lg">
        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Change Password</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* PDF Template */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Certificate Template</h2>
          <p className="text-xs text-gray-400 mb-4">
            Upload a PDF template. Certificate data and QR code will be overlaid on top.
          </p>

          {templateName ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md mb-4">
              <span className="text-green-700 text-sm font-medium truncate min-w-0 flex-1">{templateName}</span>
              <button
                onClick={handleTemplateDelete}
                className="text-xs text-red-600 hover:text-red-800 underline shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No template uploaded yet.</p>
          )}

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm cursor-pointer">
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

        {/* QR Price - Super Admin Only */}
        {role === "super_admin" && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
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
                className="px-6 py-2 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm disabled:opacity-50"
              >
                {priceLoading ? "Saving..." : "Update Price"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
