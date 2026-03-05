"use client";

import { useEffect, useState } from "react";

interface StaffMember {
  id: number;
  name: string;
}

function StaffList({
  title,
  apiPath,
  items,
  onRefresh,
}: {
  title: string;
  apiPath: string;
  items: StaffMember[];
  onRefresh: () => void;
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
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">{title}</h2>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter name..."
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
        />
        <button
          type="submit"
          disabled={loading || !newName.trim()}
          className="px-4 py-2 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm disabled:opacity-50 shrink-0"
        >
          Add
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {/* List */}
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">No entries yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50"
            >
              {editId === item.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#386E65]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(item.id);
                      if (e.key === "Escape") { setEditId(null); setEditName(""); }
                    }}
                  />
                  <button
                    onClick={() => handleUpdate(item.id)}
                    className="text-xs text-green-600 hover:text-green-800 font-medium shrink-0"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditId(null); setEditName(""); }}
                    className="text-xs text-gray-500 hover:text-gray-700 shrink-0"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800 min-w-0 truncate">{item.name}</span>
                  <button
                    onClick={() => { setEditId(item.id); setEditName(item.name); }}
                    className="text-xs text-blue-600 hover:text-blue-800 shrink-0"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="text-xs text-red-600 hover:text-red-800 shrink-0"
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
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Staff Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StaffList
          title="Examining Physicians"
          apiPath="physicians"
          items={physicians}
          onRefresh={loadData}
        />
        <StaffList
          title="Medical Officers"
          apiPath="medical-officers"
          items={officers}
          onRefresh={loadData}
        />
      </div>
    </div>
  );
}
