"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Field, Modal, apiJson } from "@/components/admin/ui";
import type { Teacher } from "@/lib/types";

const empty: Partial<Teacher> = {
  name: "",
  role: "",
  qualification: "",
  photoUrl: "",
  phone: "",
  email: "",
  subjects: "",
  joinDate: new Date().toISOString().slice(0, 10),
  status: "active",
  bio: "",
};

export default function TeachersManager() {
  const [rows, setRows] = useState<Teacher[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Teacher>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    setRows(await apiJson<Teacher[]>("/api/teachers"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((f) => ({ ...f, photoUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await apiJson("/api/teachers", {
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
    if (!confirm("Delete this teacher?")) return;
    await apiJson(`/api/teachers?id=${id}`, { method: "DELETE" });
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
        Add teacher
      </button>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Role</th>
              <th>Qualification</th>
              <th>Subjects</th>
              <th>Contact</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  {t.photoUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-mist">
                      <Image
                        src={t.photoUrl}
                        alt={t.name}
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mist text-xs text-muted">
                      No photo
                    </div>
                  )}
                </td>
                <td>
                  <strong>{t.name}</strong>
                </td>
                <td>{t.role}</td>
                <td>{t.qualification || "—"}</td>
                <td>{t.subjects}</td>
                <td>
                  {t.phone}
                  <div className="text-xs text-muted">{t.email}</div>
                </td>
                <td>
                  <span
                    className={`badge ${
                      t.status === "active" ? "badge-green" : "badge-amber"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand"
                    onClick={() => {
                      setEditingId(t.id);
                      setForm({ ...t, photoUrl: t.photoUrl || "" });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-700"
                    onClick={() => remove(t.id)}
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
        title={editingId ? "Edit teacher" : "Add teacher"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit} className="grid gap-3">
          <Field label="Photo">
            <div className="flex items-center gap-4">
              {form.photoUrl ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-mist">
                  <Image
                    src={form.photoUrl}
                    alt="Teacher"
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mist text-xs text-muted">
                  Preview
                </div>
              )}
              <div className="flex-1">
                <input
                  className="input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                />
                {uploading && (
                  <p className="mt-1 text-xs text-muted">Uploading photo…</p>
                )}
                {form.photoUrl && (
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-red-700"
                    onClick={() => setForm({ ...form, photoUrl: "" })}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </Field>
          <Field label="Name">
            <input
              className="input"
              required
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <input
              className="input"
              required
              value={form.role || ""}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </Field>
          <Field label="Qualification">
            <input
              className="input"
              placeholder="e.g. B.Ed, +2 Education, Montessori"
              value={form.qualification || ""}
              onChange={(e) =>
                setForm({ ...form, qualification: e.target.value })
              }
            />
          </Field>
          <Field label="Subjects">
            <input
              className="input"
              value={form.subjects || ""}
              onChange={(e) => setForm({ ...form, subjects: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  status: e.target.value as Teacher["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Bio">
            <textarea
              className="input"
              rows={3}
              value={form.bio || ""}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </Field>
          <button type="submit" className="btn btn-dark w-full" disabled={uploading}>
            Save teacher
          </button>
        </form>
      </Modal>
    </div>
  );
}
