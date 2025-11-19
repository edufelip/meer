module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // NativeWind's Babel helper is a preset (it returns its own plugins)
      "nativewind/babel"
    ],
    // Keep Reanimated last per its setup docs
    plugins: ["react-native-reanimated/plugin"]
  };
};
