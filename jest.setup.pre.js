// Ensure Expo global polyfills don't install lazy getters during Jest setup.
if (typeof global.__ExpoImportMetaRegistry === "undefined") {
  Object.defineProperty(global, "__ExpoImportMetaRegistry", {
    value: { url: null },
    configurable: true,
    enumerable: false,
    writable: true
  });
}

if (typeof global.structuredClone === "undefined") {
  Object.defineProperty(global, "structuredClone", {
    value: (value) => JSON.parse(JSON.stringify(value)),
    configurable: true,
    enumerable: false,
    writable: true
  });
}

if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.test";
}

if (!process.env.EXPO_PUBLIC_API_DEV_BASE_URL) {
  process.env.EXPO_PUBLIC_API_DEV_BASE_URL = "https://api.dev.test";
}
