import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PushNotificationsLocalDataSource } from "../PushNotificationsLocalDataSource";

const DEVICE_ID_KEY = "push.deviceId";
const LAST_TOKEN_KEY = "push.lastToken";
const LAST_ENV_KEY = "push.lastEnv";

export class AsyncStoragePushNotificationsLocalDataSource implements PushNotificationsLocalDataSource {
  getDeviceId(): Promise<string | null> {
    return AsyncStorage.getItem(DEVICE_ID_KEY);
  }

  setDeviceId(id: string): Promise<void> {
    return AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }

  getLastToken(): Promise<string | null> {
    return AsyncStorage.getItem(LAST_TOKEN_KEY);
  }

  setLastToken(token: string | null): Promise<void> {
    if (!token) {
      return AsyncStorage.removeItem(LAST_TOKEN_KEY);
    }
    return AsyncStorage.setItem(LAST_TOKEN_KEY, token);
  }

  getLastEnvironment(): Promise<string | null> {
    return AsyncStorage.getItem(LAST_ENV_KEY);
  }

  setLastEnvironment(environment: string | null): Promise<void> {
    if (!environment) {
      return AsyncStorage.removeItem(LAST_ENV_KEY);
    }
    return AsyncStorage.setItem(LAST_ENV_KEY, environment);
  }
}
