import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import WeeklyReportsManager from "@/components/admin/WeeklyReportsManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Weekly Report" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="Weekly meeting report">
      <WeeklyReportsManager />
    </AdminShell>
  );
}
