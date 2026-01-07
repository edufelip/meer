import type { PushEnvironment, PushPlatform } from "../../shared/pushEnvironment";

export interface PushNotificationsRemoteDataSource {
  registerToken(payload: {
    fcmToken: string;
    deviceId: string;
    platform: PushPlatform;
    environment: PushEnvironment;
    appVersion: string;
  }): Promise<void>;
  unregisterToken(deviceId: string, environment: PushEnvironment): Promise<void>;
}
