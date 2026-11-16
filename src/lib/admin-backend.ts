import "server-only";
import { cookies } from "next/headers";
import { isAdmin, type Admin } from "./auth";

export function adminBackendUrl() {
  const value =
    process.env.ADMIN_BACKEND_INTERNAL_URL || "http://127.0.0.1:4001";
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("ADMIN_BACKEND_INTERNAL_URL must be an http(s) origin.");
  return url.origin;
}
export async function adminCookieHeader() {
  const jar = await cookies();
  return ["__Host-choicestakes_admin", "choicestakes_admin"]
    .map((name) => ({ name, value: jar.get(name)?.value }))
    .filter((item) => item.value && /^[A-Za-z0-9_-]{43}$/.test(item.value))
    .map((item) => item.name + "=" + item.value)
    .join("; ");
}
export async function currentAdmin(): Promise<Admin | null> {
  const cookie = await adminCookieHeader();
  if (!cookie) return null;
  const response = await fetch(adminBackendUrl() + "/api/admin/auth/me", {
    headers: { cookie },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Admin authentication is unavailable.");
  const result = await response.json();
  if (!result.success || !isAdmin(result.data?.admin))
    throw new Error("Invalid admin session response.");
  return result.data.admin;
}
