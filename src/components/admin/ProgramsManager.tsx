"use client";

import { FormEvent, useEffect, useState } from "react";
import { Field, Modal, apiJson } from "@/components/admin/ui";
import type { Program } from "@/lib/types";

const empty: Partial<Program> = {
  title: "",
  description: "",
  level: "",
  duration: "",
  capacity: undefined,
  status: "active",
  date: new Date().toISOString().slice(0, 10),
  imageUrl: "",
};

export default function ProgramsManager() {
  const [rows, setRows] = useState<Program[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Program>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    setRows(await apiJson<Program[]>("/api/programs"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await apiJson("/api/programs", {
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
    if (!confirm("Delete this program?")) return;
    await apiJson(`/api/programs?id=${id}`, { method: "DELETE" });
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
        Add program
      </button>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Level</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap">{p.date || "—"}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : null}
                    <strong>{p.title}</strong>
                  </div>
                </td>
                <td>{p.level}</td>
                <td>{p.status}</td>
                <td className="space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky"
                    onClick={() => {
                      setEditingId(p.id);
                      setForm(p);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-700"
                    onClick={() => remove(p.id)}
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
        title={editingId ? "Edit program" : "Add program"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit} className="grid gap-3">
          <Field label="Title">
            <input
              className="input"
              required
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Date (for yearly progress timeline)">
            <input
              className="input"
              type="date"
              value={form.date || ""}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Level">
            <input
              className="input"
              value={form.level || ""}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            />
          </Field>
          <Field label="Duration">
            <input
              className="input"
              value={form.duration || ""}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </Field>
          <Field label="Capacity (optional)">
            <input
              className="input"
              type="number"
              value={form.capacity ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  capacity: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status || "active"}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as Program["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Photo">
            <input
              className="input"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadImage(file);
              }}
            />
            {uploading && (
              <p className="mt-1 text-xs text-muted">Uploading…</p>
            )}
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imageUrl}
                alt="Program"
                className="mt-2 max-h-40 rounded object-cover"
              />
            ) : null}
          </Field>
          <Field label="Description">
            <textarea
              className="input"
              rows={4}
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <button type="submit" className="btn btn-dark w-full">
            Save program
          </button>
        </form>
      </Modal>
    </div>
  );
}
