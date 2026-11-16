import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin-backend";
import { AdminAuthProvider } from "@/contexts/admin-auth-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let admin;
  try {
    admin = await currentAdmin();
  } catch {
    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-6"
      >
        <h1 className="text-xl font-semibold">Admin service is unavailable</h1>
        <p className="text-muted-foreground">
          Your session could not be verified. Please try again shortly.
        </p>
        <a href="/dashboard" className="text-primary underline">
          Try again
        </a>
        <a href="/login" className="text-primary underline">
          Back to sign in
        </a>
      </div>
    );
  }
  if (!admin) redirect("/login");
  return (
    <AdminAuthProvider admin={admin}>
      <DashboardShell>{children}</DashboardShell>
    </AdminAuthProvider>
  );
}
