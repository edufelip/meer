export default ({ config }) => ({
  ...config,
  android: {
    package: "com.edufelip.meer",
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./config/google-services.json",
  },
  extra: {
    eas: {
      projectId: "ac66eaa0-2006-4371-8b97-10ce159f01d2"
    }
  },
  plugins: [
    // React Native Firebase Crashlytics config plugin (handles mapping/native symbol upload)
    ["@react-native-firebase/crashlytics", {
      android: {
        // options: NONE | SYMBOL_TABLE | FULL
        nativeDebugSymbolLevel: "SYMBOL_TABLE"
      }
    }],
    // Optional: keep Proguard/shrink for release
    ["expo-build-properties", {
      android: {
        enableProguardInReleaseBuilds: true,
        enableShrinkResourcesInReleaseBuilds: true
      }
    }]
  ]
});
