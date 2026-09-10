"use client";

import { FormEvent, useEffect, useState } from "react";
import { Field, apiJson } from "@/components/admin/ui";
import type { SchoolInfo } from "@/lib/types";

export default function SchoolInfoManager() {
  const [form, setForm] = useState<Partial<SchoolInfo> | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiJson<{ school: SchoolInfo }>("/api/school")
      .then((d) => setForm(d.school))
      .catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setMessage("");
    setError("");
    try {
      await apiJson("/api/school", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setMessage("School information saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (!form) {
    return <p className="text-muted">Loading…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-3 rounded-xl border border-stone bg-white p-5">
      <Field label="School name">
        <input
          className="input"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label="Short name">
        <input
          className="input"
          value={form.shortName || ""}
          onChange={(e) => setForm({ ...form, shortName: e.target.value })}
        />
      </Field>
      <Field label="Location / village">
        <input
          className="input"
          value={form.location || ""}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </Field>
      <Field label="Ward">
        <input
          className="input"
          value={form.ward || ""}
          onChange={(e) => setForm({ ...form, ward: e.target.value })}
        />
      </Field>
      <Field label="Municipality">
        <input
          className="input"
          value={form.municipality || ""}
          onChange={(e) => setForm({ ...form, municipality: e.target.value })}
        />
      </Field>
      <Field label="District">
        <input
          className="input"
          value={form.district || ""}
          onChange={(e) => setForm({ ...form, district: e.target.value })}
        />
      </Field>
      <Field label="Established">
        <input
          className="input"
          value={form.established || ""}
          onChange={(e) => setForm({ ...form, established: e.target.value })}
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
      <Field label="About">
        <textarea
          className="input"
          rows={4}
          value={form.about || ""}
          onChange={(e) => setForm({ ...form, about: e.target.value })}
        />
      </Field>
      <Field label="Mission">
        <textarea
          className="input"
          rows={3}
          value={form.mission || ""}
          onChange={(e) => setForm({ ...form, mission: e.target.value })}
        />
      </Field>
      {message && <p className="text-sm text-green-800">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn btn-dark">
        Save school info
      </button>
    </form>
  );
}
