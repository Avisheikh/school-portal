import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { isAuthenticated } from "@/lib/auth";

export const metadata = { title: "Admin Login" };

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="terrain flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-sm uppercase tracking-widest text-muted">Staff portal</p>
        <h1 className="font-display mt-2 text-3xl text-pine">
          The School of Social Development
        </h1>
        <p className="mt-1 text-sm text-muted">Bodgaun · Indrawati-11</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
