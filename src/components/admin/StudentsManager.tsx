"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Field, Modal, apiJson } from "@/components/admin/ui";
import { STUDENT_CLASSES } from "@/lib/studentClasses";
import type { Student } from "@/lib/types";

const empty: Partial<Student> = {
  name: "",
  gender: "other",
  dateOfBirth: "",
  classLevel: "Play Group",
  fatherName: "",
  motherName: "",
  parentPhone: "",
  parentPhoneAlt: "",
  address: "Bodgaun, Indrawati-11",
  enrollmentDate: new Date().toISOString().slice(0, 10),
  status: "active",
  notes: "",
};

export default function StudentsManager() {
  const [rows, setRows] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Student>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setRows(await apiJson<Student[]>("/api/students"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(s: Student) {
    setEditingId(s.id);
    setForm({
      ...s,
      fatherName: s.fatherName || s.guardianName || "",
      motherName: s.motherName || "",
      parentPhone: s.parentPhone || s.guardianPhone || "",
      parentPhoneAlt: s.parentPhoneAlt || "",
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await apiJson("/api/students", {
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
    if (!confirm("Delete this student?")) return;
    await apiJson(`/api/students?id=${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = useMemo(() => {
    return rows.filter((s) => {
      const hay = [
        s.name,
        s.classLevel,
        s.fatherName,
        s.motherName,
        s.parentPhone,
        s.guardianName,
        s.guardianPhone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchQ = !q || hay.includes(q.toLowerCase());
      const matchClass = !classFilter || s.classLevel === classFilter;
      return matchQ && matchClass;
    });
  }, [rows, q, classFilter]);

  const byClass = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of STUDENT_CLASSES) map[c] = 0;
    for (const s of rows) {
      if (s.status === "active") {
        map[s.classLevel] = (map[s.classLevel] || 0) + 1;
      }
    }
    return map;
  }, [rows]);

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Classes: Play Group → Nursery → LKG → UKG → Class 1 → Class 2 → Class 3.
        Parent name and phone are required for each student.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {STUDENT_CLASSES.map((c) => (
          <button
            key={c}
            type="button"
            className={`btn text-xs ${
              classFilter === c ? "btn-brand" : "btn-ghost"
            }`}
            onClick={() => setClassFilter(classFilter === c ? "" : c)}
          >
            {c} ({byClass[c] || 0})
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search name, parent, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className="btn btn-dark" onClick={openCreate}>
          Add student
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Father</th>
              <th>Mother</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <div className="text-xs capitalize text-muted">{s.gender}</div>
                </td>
                <td>
                  <span className="badge badge-blue">{s.classLevel}</span>
                </td>
                <td>{s.fatherName || s.guardianName || "—"}</td>
                <td>{s.motherName || "—"}</td>
                <td>
                  {s.parentPhone || s.guardianPhone || "—"}
                  {s.parentPhoneAlt && (
                    <div className="text-xs text-muted">{s.parentPhoneAlt}</div>
                  )}
                </td>
                <td className="max-w-[10rem] truncate text-sm">{s.address}</td>
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
                    className="text-sm font-semibold text-brand"
                    onClick={() => openEdit(s)}
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-muted">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={editingId ? "Edit student" : "Add student"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Student full name *">
            <input
              className="input"
              required
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Class *">
            <select
              className="input"
              required
              value={form.classLevel || "Play Group"}
              onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
            >
              {STUDENT_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gender">
            <select
              className="input"
              value={form.gender || "other"}
              onChange={(e) =>
                setForm({
                  ...form,
                  gender: e.target.value as Student["gender"],
                })
              }
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Date of birth">
            <input
              className="input"
              type="date"
              value={form.dateOfBirth || ""}
              onChange={(e) =>
                setForm({ ...form, dateOfBirth: e.target.value })
              }
            />
          </Field>
          <Field label="Father's name *">
            <input
              className="input"
              required
              value={form.fatherName || ""}
              onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
            />
          </Field>
          <Field label="Mother's name">
            <input
              className="input"
              value={form.motherName || ""}
              onChange={(e) => setForm({ ...form, motherName: e.target.value })}
            />
          </Field>
          <Field label="Parent phone *">
            <input
              className="input"
              required
              placeholder="98XXXXXXXX"
              value={form.parentPhone || ""}
              onChange={(e) =>
                setForm({ ...form, parentPhone: e.target.value })
              }
            />
          </Field>
          <Field label="Alt. phone (optional)">
            <input
              className="input"
              placeholder="Second contact number"
              value={form.parentPhoneAlt || ""}
              onChange={(e) =>
                setForm({ ...form, parentPhoneAlt: e.target.value })
              }
            />
          </Field>
          <Field label="Address">
            <input
              className="input"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Enrollment date">
            <input
              className="input"
              type="date"
              value={form.enrollmentDate || ""}
              onChange={(e) =>
                setForm({ ...form, enrollmentDate: e.target.value })
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
                  status: e.target.value as Student["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated / Transitioned</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                className="input"
                rows={3}
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-dark w-full">
              Save student
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
