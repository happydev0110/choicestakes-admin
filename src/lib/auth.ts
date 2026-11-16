export interface Admin {
  id: string;
  email: string;
  name: string;
  role: "admin";
}
export function isAdmin(value: unknown): value is Admin {
  if (!value || typeof value !== "object") return false;
  const admin = value as Record<string, unknown>;
  return (
    typeof admin.id === "string" &&
    typeof admin.email === "string" &&
    typeof admin.name === "string" &&
    admin.role === "admin"
  );
}
export class AuthRequestError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
async function request(action: string, body?: unknown) {
  let response: Response;
  try {
    response = await fetch("/api/admin/auth/" + action, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers:
        body === undefined
          ? undefined
          : {
              "Content-Type": "application/json",
              "X-Requested-With": "choicestakes-admin",
            },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new AuthRequestError(
      "Unable to reach admin sign-in. Please try again.",
      503
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success)
    throw new AuthRequestError(
      result?.error?.message || "Admin sign-in is temporarily unavailable.",
      response.status
    );
  return result.data;
}
export const adminAuth = {
  async login(email: string, password: string): Promise<Admin> {
    const data = await request("login", { email, password });
    if (!isAdmin(data?.admin))
      throw new AuthRequestError("Invalid sign-in response.", 503);
    return data.admin;
  },
  async me(): Promise<Admin> {
    const data = await request("me");
    if (!isAdmin(data?.admin))
      throw new AuthRequestError("Unable to verify your session.", 503);
    return data.admin;
  },
  async logout() {
    await request("logout", {});
  },
};
