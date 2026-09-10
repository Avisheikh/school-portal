import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import StaffManager from "@/components/admin/StaffManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Staff" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="Staff">
      <StaffManager />
    </AdminShell>
  );
}
