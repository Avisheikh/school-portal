import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import ProgressReportManager from "@/components/admin/ProgressReportManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Annual Progress Report" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="Annual progress report">
      <ProgressReportManager />
    </AdminShell>
  );
}
