import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import SchoolInfoManager from "@/components/admin/SchoolInfoManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "School Info" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="School information">
      <SchoolInfoManager />
    </AdminShell>
  );
}
