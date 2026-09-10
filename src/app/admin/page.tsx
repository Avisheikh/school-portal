import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAuthenticated } from "@/lib/auth";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const db = await readDb();
  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = db.attendance.filter((a) => a.date === today);

  const cards = [
    {
      label: "Students",
      value: db.students.filter((s) => s.status === "active").length,
      href: "/admin/students",
    },
    {
      label: "Teachers",
      value: db.teachers.filter((t) => t.status === "active").length,
      href: "/admin/teachers",
    },
    {
      label: "Staff",
      value: db.staff.filter((s) => s.status === "active").length,
      href: "/admin/staff",
    },
    {
      label: "Finance / Audit",
      value: "Ledger",
      href: "/admin/finance",
    },
    {
      label: "Programs",
      value: db.programs.length,
      href: "/admin/programs",
    },
    {
      label: "Activities",
      value: db.activities.length,
      href: "/admin/activities",
    },
    {
      label: "Weekly Report",
      value: "Meeting",
      href: "/admin/weekly-report",
    },
    {
      label: "Progress Report",
      value: "PDF",
      href: "/admin/progress-report",
    },
    {
      label: "Today attendance",
      value: todayAtt.length,
      href: "/admin/attendance",
    },
  ];

  return (
    <AdminShell title="Dashboard">
      <p className="mb-6 text-muted">
        Manage full school data for Indrawati-11, Bodgaun.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-stone bg-white p-5 transition hover:border-sky"
          >
            <p className="text-sm text-muted">{c.label}</p>
            <p className="font-display mt-2 text-4xl text-brand-ink">{c.value}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
