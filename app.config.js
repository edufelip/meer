export default ({ config }) => ({
  ...config,
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
  ],
  android: {
    package: "com.edufelip.meer",
    // Place google-services.json at ./config/google-services.json
    googleServicesFile: "./config/google-services.json"
  }
});
