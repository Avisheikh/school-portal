import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import ActivitiesManager from "@/components/admin/ActivitiesManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Activities" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="School activities">
      <ActivitiesManager />
    </AdminShell>
  );
}
