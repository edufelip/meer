import { registerPushToken, unregisterPushToken } from "../../../api/pushTokens";
import type { PushNotificationsRemoteDataSource } from "../PushNotificationsRemoteDataSource";
import type { PushEnvironment, PushPlatform } from "../../../shared/pushEnvironment";

export class HttpPushNotificationsRemoteDataSource implements PushNotificationsRemoteDataSource {
  registerToken(payload: {
    fcmToken: string;
    deviceId: string;
    platform: PushPlatform;
    environment: PushEnvironment;
    appVersion: string;
  }): Promise<void> {
    return registerPushToken(payload);
  }

  unregisterToken(deviceId: string, environment: PushEnvironment): Promise<void> {
    return unregisterPushToken(deviceId, environment);
  }
}
