const isDev = typeof __DEV__ !== "undefined" && __DEV__;

export const IS_DEBUG_MODE =
  isDev || process.env.EXPO_PUBLIC_ENABLE_DEBUG_TOOLS === "true";
