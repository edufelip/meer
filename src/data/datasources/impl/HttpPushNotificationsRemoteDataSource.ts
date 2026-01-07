import { registerPushToken, unregisterPushToken } from "../../../api/pushTokens";
import type { PushNotificationsRemoteDataSource } from "../PushNotificationsRemoteDataSource";

export class HttpPushNotificationsRemoteDataSource implements PushNotificationsRemoteDataSource {
  registerToken(payload: {
    token: string;
    deviceId: string;
    platform: "ios" | "android";
    environment: "dev" | "staging" | "prod";
    appVersion: string;
  }): Promise<void> {
    return registerPushToken(payload);
  }

  unregisterToken(deviceId: string): Promise<void> {
    return unregisterPushToken(deviceId);
  }
}
