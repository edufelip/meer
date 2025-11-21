// Small helper to mimic a network client reading bundled JSON.
// Swapping to a real HTTP client later is a matter of replacing this module.
export async function loadFromJson<T>(payload: unknown, latencyMs = 120): Promise<T> {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(clone(payload) as T), latencyMs);
  });
}

// Fallback for environments without structuredClone (older RN runtimes).
function clone<T>(value: T): T {
  try {
    // @ts-ignore structuredClone may exist at runtime
    if (typeof structuredClone === "function") {
      // @ts-ignore
      return structuredClone(value);
    }
  } catch {
    // ignore
  }
  return JSON.parse(JSON.stringify(value));
}
