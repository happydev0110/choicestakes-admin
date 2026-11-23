import { NextRequest, NextResponse } from "next/server";
import { proxyAdmin } from "@/lib/admin-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  if (path[0] === "loyalty") {
    const playerId = /^[a-f0-9-]{36}$/i.test(path[2] ?? "");
    const methods =
      path.length === 2 && path[1] === "settings"
        ? ["GET", "PATCH"]
        : path.length === 2 && path[1] === "players"
          ? ["GET"]
          : path.length === 3 && path[1] === "players" && playerId
            ? ["GET"]
            : path.length === 4 &&
                path[1] === "players" &&
                playerId &&
                path[3] === "adjustments"
              ? ["POST"]
              : null;
    if (!methods)
      return NextResponse.json(
        { success: false, error: { message: "Endpoint not found." } },
        { status: 404 }
      );
    return proxyAdmin(request, "/api/admin/" + path.join("/"), methods);
  }
  if (
    !["players", "games", "partner-offers"].includes(path[0] ?? "") ||
    path.length > 2 ||
    (path.length === 2 &&
      !/^[a-f0-9-]{36}$/i.test(path[1]) &&
      !(path[0] === "partner-offers" && path[1] === "check"))
  )
    return NextResponse.json(
      { success: false, error: { message: "Endpoint not found." } },
      { status: 404 }
    );
  return proxyAdmin(
    request,
    "/api/admin/" + path.join("/"),
    path[0] === "partner-offers" && path[1] === "check"
      ? ["POST"]
      : path.length === 2
        ? ["GET", "PATCH"]
        : path[0] === "partner-offers"
          ? ["GET", "POST"]
          : ["GET"]
  );
}
export const GET = handle;
export const PATCH = handle;
export const POST = handle;
