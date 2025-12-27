function isDevHost(hostname?: string | null): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  return host.includes(".dev");
}

function currentHostname(explicit?: string | null): string | undefined {
  if (explicit) return explicit;
  if (typeof window !== "undefined") return window.location.hostname;
  if (process.env.NEXT_PUBLIC_SITE_HOST) return process.env.NEXT_PUBLIC_SITE_HOST;
  return undefined;
}

export function selectBackendBase(hostname?: string | null): string {
  const host = currentHostname(hostname);
  const preferDev = isDevHost(host);

  const base =
    (preferDev ? process.env.NEXT_PUBLIC_DEV_API_BASE_URL : process.env.NEXT_PUBLIC_API_BASE_URL) ||
    "http://localhost:8080"; // fallback so build-time type check always has a string

  return base;
}

export function selectApiBase(hostname?: string | null): string {
  // Allow overriding with a proxy path (e.g. "/api") to keep same-origin calls.
  if (process.env.NEXT_PUBLIC_API_PROXY) return process.env.NEXT_PUBLIC_API_PROXY;
  return selectBackendBase(hostname) || "/api";
}

export function isDevDomain(hostname?: string | null): boolean {
  return isDevHost(hostname ?? currentHostname());
}
