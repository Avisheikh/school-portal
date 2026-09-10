"use client";

import { FormEvent, useEffect, useState } from "react";
import { Field, Modal, apiJson } from "@/components/admin/ui";
import type { Activity } from "@/lib/types";

const empty: Partial<Activity> = {
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  category: "General",
  imageUrl: "",
  published: true,
};

export default function ActivitiesManager() {
  const [rows, setRows] = useState<Activity[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Activity>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    setRows(await apiJson<Activity[]>("/api/activities?all=1"));
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
      await apiJson("/api/activities", {
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
    if (!confirm("Delete this activity?")) return;
    await apiJson(`/api/activities?id=${id}`, { method: "DELETE" });
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
        Upload / add activity
      </button>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Category</th>
              <th>Published</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.title}</strong>
                  {a.imageUrl && (
                    <div className="text-xs text-muted">Has image</div>
                  )}
                </td>
                <td>{a.date}</td>
                <td>{a.category}</td>
                <td>{a.published ? "Yes" : "No"}</td>
                <td className="space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky"
                    onClick={() => {
                      setEditingId(a.id);
                      setForm(a);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-700"
                    onClick={() => remove(a.id)}
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
        title={editingId ? "Edit activity" : "Add activity"}
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
          <Field label="Date">
            <input
              className="input"
              type="date"
              required
              value={form.date || ""}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Category">
            <input
              className="input"
              value={form.category || ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
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
          <Field label="Photo">
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />
            {uploading && (
              <p className="mt-1 text-xs text-muted">Uploading…</p>
            )}
            {form.imageUrl && (
              <p className="mt-1 text-xs text-green-800">
                Uploaded: {form.imageUrl}
              </p>
            )}
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published ?? true}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />
            Publish on public website
          </label>
          <button type="submit" className="btn btn-dark w-full">
            Save activity
          </button>
        </form>
      </Modal>
    </div>
  );
}
