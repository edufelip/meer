import * as Linking from "expo-linking";
import type { ThriftStoreId } from "../domain/entities/ThriftStore";
import type { GuideContentId } from "../domain/entities/GuideContent";
import urls from "../../constants/urls.json";

const WEB_BASE_URL = urls.webBaseUrl;

function normalizeBaseUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return raw.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getWebBaseUrl(): string | null {
  return normalizeBaseUrl(WEB_BASE_URL);
}

export function getWwwBaseUrl(): string | null {
  const baseUrl = getWebBaseUrl();
  if (!baseUrl) return null;

  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname.toLowerCase();
    if (!hostname || hostname.startsWith("www.")) return null;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") return null;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return null;
    url.hostname = `www.${url.hostname}`;
    return normalizeBaseUrl(url.toString());
  } catch {
    return null;
  }
}

export function buildThriftStorePath(id: ThriftStoreId): string {
  return `store/${encodeURIComponent(id)}`;
}

export function buildContentPath(id: GuideContentId): string {
  return `content/${encodeURIComponent(id)}`;
}

export function buildThriftStoreShareUrl(id: ThriftStoreId): string {
  const baseUrl = getWebBaseUrl();
  const path = buildThriftStorePath(id);

  if (baseUrl) {
    return `${baseUrl}/${path}`;
  }

  return Linking.createURL(path);
}

export function buildContentShareUrl(id: GuideContentId): string {
  const baseUrl = getWebBaseUrl();
  const path = buildContentPath(id);

  if (baseUrl) {
    return `${baseUrl}/${path}`;
  }

  return Linking.createURL(path);
}
