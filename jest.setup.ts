import "@testing-library/jest-native/extend-expect";
import "react-native-gesture-handler/jestSetup";
import { act } from "@testing-library/react-native";
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

jest.mock("@react-native-firebase/app", () => ({
  __esModule: true,
  default: {
    app: jest.fn(() => ({
      options: {}
    })),
    initializeApp: jest.fn()
  }
}));

jest.mock("@react-native-firebase/crashlytics", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    log: jest.fn(),
    recordError: jest.fn(),
    setAttributes: jest.fn()
  }))
}));

jest.mock("@react-native-firebase/messaging", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getToken: jest.fn(() => Promise.resolve("mock-fcm-token")),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    onTokenRefresh: jest.fn(() => jest.fn()),
    subscribeToTopic: jest.fn(() => Promise.resolve()),
    unsubscribeFromTopic: jest.fn(() => Promise.resolve()),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null))
  })),
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn((_m) => Promise.resolve("mock-fcm-token")),
  requestPermission: jest.fn((_m) => Promise.resolve(1)),
  onTokenRefresh: jest.fn((_m, _h) => jest.fn()),
  subscribeToTopic: jest.fn((_m, _t) => Promise.resolve()),
  unsubscribeFromTopic: jest.fn((_m, _t) => Promise.resolve()),
  onNotificationOpenedApp: jest.fn((_m, _h) => jest.fn()),
  getInitialNotification: jest.fn((_m) => Promise.resolve(null)),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 }
}));

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    displayNotification: jest.fn(),
    createChannel: jest.fn(),
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    onForegroundEvent: jest.fn(),
    onBackgroundEvent: jest.fn(),
    cancelNotification: jest.fn(),
    cancelAllNotifications: jest.fn(),
    setBadgeCount: jest.fn()
  },
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
  EventType: {
    DISMISSED: 0,
    PRESS: 1,
    ACTION_PRESS: 2,
    DELIVERED: 3,
    APP_BLOCKED: 4,
    CHANNEL_BLOCKED: 5,
    CHANNEL_GROUP_BLOCKED: 6,
    TRIGGER_NOTIFICATION_CREATED: 7
  }
}));

// Avoid lazy getter errors for Expo's import.meta registry in Jest.
if (!(global as any).__ExpoImportMetaRegistry) {
  (global as any).__ExpoImportMetaRegistry = { url: null };
}

afterEach(() => {
  act(() => {
    resetAllStores();
    useNetworkStatusStore.getState().reset();
  });
});
