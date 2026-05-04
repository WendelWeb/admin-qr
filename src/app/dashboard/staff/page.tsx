"use client";

import { useEffect, useState } from "react";

interface StaffMember {
  id: number;
  name: string;
}

function StaffList({
  title,
  subtitle,
  apiPath,
  items,
  onRefresh,
  iconColor,
}: {
  title: string;
  subtitle: string;
  apiPath: string;
  items: StaffMember[];
  onRefresh: () => void;
  iconColor: string;
}) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    setLoading(true);

    const res = await fetch(`/api/${apiPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add");
    } else {
      setNewName("");
      onRefresh();
    }
    setLoading(false);
  }

  async function handleUpdate(id: number) {
    if (!editName.trim()) return;
    setError("");

    const res = await fetch(`/api/${apiPath}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update");
    } else {
      setEditId(null);
      setEditName("");
      onRefresh();
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remove "${name}"?`)) return;
    setError("");

    await fetch(`/api/${apiPath}/${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <span className="ml-auto text-xs font-mono px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {items.length}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {/* Add form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter name..."
            className="flex-1 min-w-0 px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65] text-sm transition-all"
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            className="px-4 py-2.5 bg-[#386E65] text-white rounded-xl hover:bg-[#2d5a53] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          >
            Add
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* List */}
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No entries yet.</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                {editId === item.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(item.id);
                        if (e.key === "Escape") { setEditId(null); setEditName(""); }
                      }}
                    />
                    <button
                      onClick={() => handleUpdate(item.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-800 font-medium shrink-0 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditId(null); setEditName(""); }}
                      className="text-xs text-gray-500 hover:text-gray-700 shrink-0 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm text-gray-800 min-w-0 truncate font-medium">{item.name}</span>
                    <button
                      onClick={() => { setEditId(item.id); setEditName(item.name); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [physicians, setPhysicians] = useState<StaffMember[]>([]);
  const [officers, setOfficers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  function loadData() {
    Promise.all([
      fetch("/api/physicians").then((r) => r.json()),
      fetch("/api/medical-officers").then((r) => r.json()),
    ]).then(([p, o]) => {
      setPhysicians(p);
      setOfficers(o);
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading staff...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
        <p className="text-sm text-gray-500 mt-1">Add, edit, and remove the physicians and officers who appear on certificates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StaffList
          title="Examining Physicians"
          subtitle="Doctors who perform examinations"
          apiPath="physicians"
          items={physicians}
          onRefresh={loadData}
          iconColor="bg-[#386E65]/10 text-[#386E65]"
        />
        <StaffList
          title="Medical Officers"
          subtitle="TCIG officers who verify exams"
          apiPath="medical-officers"
          items={officers}
          onRefresh={loadData}
          iconColor="bg-indigo-100 text-indigo-600"
        />
      </div>
    </div>
  );
}
