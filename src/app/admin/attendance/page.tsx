import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import AttendanceManager from "@/components/admin/AttendanceManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Attendance" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="Staff & teacher attendance">
      <AttendanceManager />
    </AdminShell>
  );
}
