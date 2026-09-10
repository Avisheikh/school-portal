import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import ProgramsManager from "@/components/admin/ProgramsManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Programs" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="Programs">
      <ProgramsManager />
    </AdminShell>
  );
}
