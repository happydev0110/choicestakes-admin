import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminBackendUrl, adminCookieHeader } from "./admin-backend";
export async function proxyAdmin(
  request: NextRequest,
  path: string,
  methods: string[]
) {
  if (!methods.includes(request.method))
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: methods.join(", ") },
    });
  try {
    const headers = new Headers({ accept: "application/json" });
    for (const name of [
      "origin",
      "content-type",
      "x-requested-with",
      "sec-fetch-site",
    ]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set("cookie", await adminCookieHeader());
    let body: string | undefined;
    if (!["GET", "HEAD"].includes(request.method)) {
      const reader = request.body?.getReader(),
        chunks: Uint8Array[] = [];
      let length = 0;
      if (reader)
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > 8192) {
            await reader.cancel();
            return NextResponse.json(
              { success: false, error: { message: "Request too large." } },
              { status: 413 }
            );
          }
          chunks.push(value);
        }
      body = Buffer.concat(chunks).toString("utf8");
    }
    const upstream = await fetch(
      adminBackendUrl() + path + request.nextUrl.search,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
      }
    );
    const outputHeaders = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    for (const cookie of upstream.headers.getSetCookie())
      outputHeaders.append("Set-Cookie", cookie);
    for (const name of ["retry-after", "x-request-id"]) {
      const value = upstream.headers.get(name);
      if (value) outputHeaders.set(name, value);
    }
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: outputHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message:
            "The admin service is temporarily unavailable. Please try again.",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
