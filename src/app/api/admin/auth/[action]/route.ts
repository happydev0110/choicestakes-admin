import { NextRequest, NextResponse } from "next/server";
import { proxyAdmin } from "@/lib/admin-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: NextRequest,
  context: { params: Promise<{ action: string }> }
) {
  const { action } = await context.params;
  if (!["login", "logout", "me"].includes(action))
    return NextResponse.json(
      { success: false, error: { message: "Endpoint not found." } },
      { status: 404 }
    );
  return proxyAdmin(request, "/api/admin/auth/" + action, [
    action === "me" ? "GET" : "POST",
  ]);
}
export const GET = handle;
export const POST = handle;
