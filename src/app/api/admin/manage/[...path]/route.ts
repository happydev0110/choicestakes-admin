import { NextRequest, NextResponse } from "next/server";
import { proxyAdmin } from "@/lib/admin-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  if (
    !["players", "games"].includes(path[0] ?? "") ||
    path.length > 2 ||
    (path.length === 2 && !/^[a-f0-9-]{36}$/i.test(path[1]))
  )
    return NextResponse.json(
      { success: false, error: { message: "Endpoint not found." } },
      { status: 404 }
    );
  return proxyAdmin(
    request,
    "/api/admin/" + path.join("/"),
    path.length === 2 ? ["GET", "PATCH"] : ["GET"]
  );
}
export const GET = handle;
export const PATCH = handle;
