"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "@/components/admin/ui";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Staff,
  Teacher,
} from "@/lib/types";

type Person = {
  personType: "staff" | "teacher";
  personId: string;
  personName: string;
  role: string;
  status: AttendanceStatus;
};

export default function AttendanceManager() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [people, setPeople] = useState<Person[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  const presentCount = useMemo(
    () => people.filter((p) => p.status === "present" || p.status === "late").length,
    [people],
  );

  async function load() {
    setError("");
    const [teachers, staff, records] = await Promise.all([
      apiJson<Teacher[]>("/api/teachers"),
      apiJson<Staff[]>("/api/staff"),
      apiJson<AttendanceRecord[]>(`/api/attendance?date=${date}`),
    ]);

    const map = new Map(
      records.map((r) => [`${r.personType}:${r.personId}`, r.status]),
    );

    const list: Person[] = [
      ...teachers
        .filter((t) => t.status === "active")
        .map((t) => ({
          personType: "teacher" as const,
          personId: t.id,
          personName: t.name,
          role: t.role,
          status: (map.get(`teacher:${t.id}`) || "present") as AttendanceStatus,
        })),
      ...staff
        .filter((s) => s.status === "active")
        .map((s) => ({
          personType: "staff" as const,
          personId: s.id,
          personName: s.name,
          role: s.position,
          status: (map.get(`staff:${s.id}`) || "present") as AttendanceStatus,
        })),
    ];
    setPeople(list);
    setHistory(await apiJson<AttendanceRecord[]>("/api/attendance"));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function setStatus(personId: string, status: AttendanceStatus) {
    setPeople((prev) =>
      prev.map((p) => (p.personId === personId ? { ...p, status } : p)),
    );
  }

  async function save() {
    setMessage("");
    setError("");
    try {
      await apiJson("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          records: people.map((p) => ({
            personType: p.personType,
            personId: p.personId,
            personName: p.personName,
            status: p.status,
          })),
        }),
      });
      setMessage(`Attendance saved for ${date}`);
      setHistory(await apiJson<AttendanceRecord[]>("/api/attendance"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  const recentDates = Array.from(new Set(history.map((h) => h.date)))
    .sort()
    .reverse()
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-pine">Date</span>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button type="button" className="btn btn-dark" onClick={save}>
          Save attendance
        </button>
        <p className="text-sm text-muted">
          Present/late: {presentCount} / {people.length}
        </p>
      </div>
      {message && <p className="text-sm text-green-800">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={`${p.personType}-${p.personId}`}>
                <td>
                  <strong>{p.personName}</strong>
                </td>
                <td className="capitalize">{p.personType}</td>
                <td>{p.role}</td>
                <td>
                  <select
                    className="input max-w-[10rem]"
                    value={p.status}
                    onChange={(e) =>
                      setStatus(p.personId, e.target.value as AttendanceStatus)
                    }
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="leave">Leave</option>
                  </select>
                </td>
              </tr>
            ))}
            {people.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted">
                  Add active teachers/staff first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="font-display text-xl text-pine">Recent attendance days</h2>
        <ul className="mt-3 space-y-2">
          {recentDates.map((d) => {
            const day = history.filter((h) => h.date === d);
            const present = day.filter(
              (h) => h.status === "present" || h.status === "late",
            ).length;
            return (
              <li key={d} className="flex justify-between rounded-lg bg-white px-4 py-3 text-sm">
                <button
                  type="button"
                  className="font-semibold text-sky"
                  onClick={() => setDate(d)}
                >
                  {d}
                </button>
                <span className="text-muted">
                  {present}/{day.length} present or late
                </span>
              </li>
            );
          })}
          {recentDates.length === 0 && (
            <p className="text-sm text-muted">No saved attendance yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
