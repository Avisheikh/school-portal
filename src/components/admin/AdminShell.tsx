"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/finance", label: "Finance / Audit" },
  { href: "/admin/activities", label: "Activities" },
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/weekly-report", label: "Weekly Report" },
  { href: "/admin/progress-report", label: "Progress Report" },
  { href: "/admin/school", label: "School Info" },
];

export function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-mist">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="bg-brand-ink text-white lg:w-60 lg:shrink-0">
          <div className="border-b border-white/10 px-5 py-5">
            <Link href="/" className="font-display text-lg leading-snug">
              SOSD Bodgaun
            </Link>
            <p className="mt-1 text-xs text-white/60">Staff & school data</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 py-3 lg:flex-col">
            {nav.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden px-4 pb-5 lg:block">
            <button type="button" onClick={logout} className="btn btn-ghost w-full text-sm">
              Log out
            </button>
          </div>
        </aside>
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-stone bg-white px-5 py-4">
            <h1 className="font-display text-2xl text-brand-ink">{title}</h1>
            <button
              type="button"
              onClick={logout}
              className="btn btn-ghost text-sm text-brand-ink lg:hidden"
            >
              Log out
            </button>
          </header>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
