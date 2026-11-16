"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { adminAuth, AuthRequestError, type Admin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
const AdminContext = createContext<Admin | null>(null);
export function AdminAuthProvider({
  admin,
  children,
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState(admin);
  const [unavailable, setUnavailable] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    // Old mock-login values are never used as proof of authentication.
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
    } catch {}
    let active = true;
    let pending = false;
    async function verify() {
      if (pending) return;
      pending = true;
      try {
        const verified = await adminAuth.me();
        if (active) {
          setCurrent(verified);
          setUnavailable(false);
        }
      } catch (error) {
        if (!active) return;
        if (error instanceof AuthRequestError && error.status === 401)
          window.location.replace("/login");
        else setUnavailable(true);
      } finally {
        pending = false;
      }
    }
    void verify();
    window.addEventListener("focus", verify);
    const onPageShow = () => void verify();
    window.addEventListener("pageshow", onPageShow);
    return () => {
      active = false;
      window.removeEventListener("focus", verify);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pathname]);
  if (unavailable)
    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-6"
      >
        <h1 className="text-xl font-semibold">
          Unable to verify your admin session
        </h1>
        <p className="text-muted-foreground">
          Please try again when the admin service is available.
        </p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    );
  return (
    <AdminContext.Provider value={current}>{children}</AdminContext.Provider>
  );
}
export function useAdmin() {
  const admin = useContext(AdminContext);
  if (!admin)
    throw new Error("useAdmin must be used inside AdminAuthProvider.");
  return admin;
}
