import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import StudentsManager from "@/components/admin/StudentsManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Students" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="Students">
      <StudentsManager />
    </AdminShell>
  );
}
