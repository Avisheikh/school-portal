import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import FinanceManager from "@/components/admin/FinanceManager";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Financial Reports" };

export default async function Page() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <AdminShell title="Financial reports & ledger">
      <FinanceManager />
    </AdminShell>
  );
}
