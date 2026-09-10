"use client";

import { FormEvent, useEffect, useState } from "react";
import { Field, Modal, apiJson } from "@/components/admin/ui";
import type { Staff } from "@/lib/types";

const empty: Partial<Staff> = {
  name: "",
  position: "",
  phone: "",
  joinDate: new Date().toISOString().slice(0, 10),
  status: "active",
};

export default function StaffManager() {
  const [rows, setRows] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Staff>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setRows(await apiJson<Staff[]>("/api/staff"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await apiJson("/api/staff", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this staff member?")) return;
    await apiJson(`/api/staff?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-dark mb-4"
        onClick={() => {
          setEditingId(null);
          setForm(empty);
          setOpen(true);
        }}
      >
        Add staff
      </button>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Phone</th>
              <th>Joined</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                </td>
                <td>{s.position}</td>
                <td>{s.phone}</td>
                <td>{s.joinDate}</td>
                <td>
                  <span
                    className={`badge ${
                      s.status === "active" ? "badge-green" : "badge-amber"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky"
                    onClick={() => {
                      setEditingId(s.id);
                      setForm(s);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-700"
                    onClick={() => remove(s.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={editingId ? "Edit staff" : "Add staff"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit} className="grid gap-3">
          <Field label="Name">
            <input
              className="input"
              required
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Position">
            <input
              className="input"
              required
              value={form.position || ""}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Join date">
            <input
              className="input"
              type="date"
              value={form.joinDate || ""}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status || "active"}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as Staff["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <button type="submit" className="btn btn-dark w-full">
            Save staff
          </button>
        </form>
      </Modal>
    </div>
  );
}
