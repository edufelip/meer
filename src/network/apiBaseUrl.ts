import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./config";
import { IS_DEBUG_MODE } from "../shared/env";

const DEBUG_API_BASE_URL_KEY = "debug_api_base_url_override";

let debugBaseUrlOverride: string | null = null;
let debugBaseUrlLoaded = false;
let debugBaseUrlLoadPromise: Promise<void> | null = null;

function normalizeApiBaseUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

export async function ensureDebugApiBaseUrlLoaded() {
  if (!IS_DEBUG_MODE) return;
  if (debugBaseUrlLoaded) return;
  if (debugBaseUrlLoadPromise) return debugBaseUrlLoadPromise;

  debugBaseUrlLoadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(DEBUG_API_BASE_URL_KEY);
      const normalized = raw ? normalizeApiBaseUrl(raw) : null;
      debugBaseUrlOverride = normalized;
    } catch {
      debugBaseUrlOverride = null;
    } finally {
      debugBaseUrlLoaded = true;
      debugBaseUrlLoadPromise = null;
    }
  })();

  return debugBaseUrlLoadPromise;
}

export function getApiBaseUrlSync(): string {
  return debugBaseUrlOverride ?? API_BASE_URL;
}

export async function getApiBaseUrl(): Promise<string> {
  await ensureDebugApiBaseUrlLoaded();
  return getApiBaseUrlSync();
}

export async function setDebugApiBaseUrlOverride(nextRaw: string): Promise<{ changed: boolean; next: string }> {
  await ensureDebugApiBaseUrlLoaded();

  const normalized = normalizeApiBaseUrl(nextRaw);
  if (!normalized) {
    throw new Error("invalid_url");
  }

  const prev = getApiBaseUrlSync();
  const changed = prev !== normalized;

  debugBaseUrlOverride = normalized;
  await AsyncStorage.setItem(DEBUG_API_BASE_URL_KEY, normalized);

  return { changed, next: normalized };
}
