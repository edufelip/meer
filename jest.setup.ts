import "@testing-library/jest-native/extend-expect";
import "react-native-gesture-handler/jestSetup";
import { resetAllStores } from "./src/presentation/state/resetAllStores";
import { useNetworkStatusStore } from "./src/presentation/state/networkStatusStore";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("react-native-css-interop/src/runtime/native/appearance-observables", () => ({
  getColorScheme: () => "light",
  addChangeListener: () => ({ remove: jest.fn() }),
  resetAppearanceListeners: () => undefined
}));

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}), { virtual: true });

// Avoid lazy getter errors for Expo's import.meta registry in Jest.
if (!(global as any).__ExpoImportMetaRegistry) {
  (global as any).__ExpoImportMetaRegistry = { url: null };
}

afterEach(() => {
  resetAllStores();
  useNetworkStatusStore.getState().reset();
});
