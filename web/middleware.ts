import { NextRequest, NextResponse } from "next/server";

function isDevHost(host?: string | null): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return h.includes(".dev");
}

function pickBackendBase(host?: string | null): string {
  const base =
    (isDevHost(host) ? process.env.NEXT_PUBLIC_DEV_API_BASE_URL : process.env.NEXT_PUBLIC_API_BASE_URL) ||
    "http://localhost:8080";
  return base;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.nextUrl.hostname;

  // Proxy API calls to the appropriate backend based on the current domain
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const backendBase = pickBackendBase(host);
    const path = req.nextUrl.pathname;

    // Special-case: admin store detail hits the public store endpoint
    if (path.startsWith("/api/dashboard/stores/")) {
      const target = new URL(path.replace("/api/dashboard/stores/", "/stores/"), backendBase);
      target.search = req.nextUrl.search;
      return NextResponse.rewrite(target);
    }

    const target = new URL(path.replace(/^\/api/, ""), backendBase);
    target.search = req.nextUrl.search;
    return NextResponse.rewrite(target);
  }

  // Otherwise, continue to route as normal
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|auth).*)"]
};
