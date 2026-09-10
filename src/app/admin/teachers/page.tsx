import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import TeachersManager from "@/components/admin/TeachersManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Teachers" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="Teachers">
      <TeachersManager />
    </AdminShell>
  );
}
