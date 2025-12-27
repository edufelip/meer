function normalizePlugins(plugins) {
  return Array.isArray(plugins) ? plugins : [];
}

function hasPlugin(plugins, pluginName) {
  return plugins.some((plugin) => (Array.isArray(plugin) ? plugin[0] === pluginName : plugin === pluginName));
}

function tryGetHostname(rawUrl) {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).host;
  } catch {
    return null;
  }
}

function isLocalHost(hostname) {
  if (!hostname) return false;
  const lower = hostname.toLowerCase();
  return (
    lower === "localhost" ||
    lower.startsWith("localhost:") ||
    lower === "127.0.0.1" ||
    lower.startsWith("127.0.0.1:") ||
    lower === "0.0.0.0" ||
    lower.startsWith("0.0.0.0:")
  );
}

function uniqStrings(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function ensureIntentFilter(intentFilters, { hostname, pathPrefix, path }) {
  if (!hostname) return intentFilters;
  const existing = Array.isArray(intentFilters) ? intentFilters : [];

  const alreadyHas = existing.some((filter) => {
    if (!filter || filter.action !== "VIEW") return false;
    const data = Array.isArray(filter.data) ? filter.data : [];
    return data.some((d) => {
      if (!d || d.scheme !== "https" || d.host !== hostname) return false;
      if (pathPrefix && d.pathPrefix !== pathPrefix) return false;
      if (path && d.path !== path) return false;
      return true;
    });
  });

  if (alreadyHas) return existing;

  const dataEntry = {
    scheme: "https",
    host: hostname,
    ...(pathPrefix ? { pathPrefix } : {}),
    ...(path ? { path } : {})
  };

  return [
    ...existing,
    {
      action: "VIEW",
      autoVerify: true,
      data: [dataEntry],
      category: ["BROWSABLE", "DEFAULT"]
    }
  ];
}

function ensureStoreIntentFilter(intentFilters, hostname) {
  return ensureIntentFilter(intentFilters, { hostname, pathPrefix: "/store" });
}

function ensureRootIntentFilter(intentFilters, hostname) {
  return ensureIntentFilter(intentFilters, { hostname, path: "/" });
}

function getWwwHostname(hostname) {
  if (!hostname) return null;
  const lower = hostname.toLowerCase();
  if (lower.startsWith("www.") || isLocalHost(lower) || lower.includes(":")) return null;
  return `www.${hostname}`;
}

const { webBaseUrl, prodApiBaseUrl, devApiBaseUrl } = require("./constants/urls.json");

module.exports = ({ config }) => {
  const hostname = tryGetHostname(webBaseUrl);
  const wwwHostname = getWwwHostname(hostname);
  const isProdBuild = process.env.NODE_ENV === "production" || process.env.EAS_BUILD_PROFILE === "production";
  const apiBaseUrl = isProdBuild ? prodApiBaseUrl : devApiBaseUrl || prodApiBaseUrl;
  const apiHost = tryGetHostname(apiBaseUrl);
  const allowLocalApi = process.env.EXPO_PUBLIC_ALLOW_LOCAL_API === "true";

  if (isProdBuild && !allowLocalApi && isLocalHost(apiHost)) {
    throw new Error(
      "prodApiBaseUrl in constants/urls.json points to a local host in a production build. Set a real API host or EXPO_PUBLIC_ALLOW_LOCAL_API=true."
    );
  }

  const plugins = normalizePlugins(config.plugins);
  const nextPlugins = [...plugins];

  if (!hasPlugin(nextPlugins, "@react-native-firebase/crashlytics")) {
    nextPlugins.push([
      "@react-native-firebase/crashlytics",
      {
        android: {
          // options: NONE | SYMBOL_TABLE | FULL
          nativeDebugSymbolLevel: "SYMBOL_TABLE"
        }
      }
    ]);
  }

  if (!hasPlugin(nextPlugins, "expo-build-properties")) {
    nextPlugins.push([
      "expo-build-properties",
      {
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true
        }
      }
    ]);
  }

  let intentFilters = config.android?.intentFilters;
  intentFilters = ensureStoreIntentFilter(intentFilters, hostname);
  intentFilters = ensureRootIntentFilter(intentFilters, hostname);
  intentFilters = ensureStoreIntentFilter(intentFilters, wwwHostname);
  intentFilters = ensureRootIntentFilter(intentFilters, wwwHostname);

  return {
    ...config,
    ios: {
      ...config.ios,
      associatedDomains: hostname
        ? uniqStrings([
            ...(config.ios?.associatedDomains ?? []),
            `applinks:${hostname}`,
            ...(wwwHostname ? [`applinks:${wwwHostname}`] : [])
          ])
        : config.ios?.associatedDomains
    },
    android: {
      ...config.android,
      package: "com.edufelip.meer",
      googleServicesFile: "./android/app/google-services.json",
      intentFilters
    },
    plugins: nextPlugins
  };
};
