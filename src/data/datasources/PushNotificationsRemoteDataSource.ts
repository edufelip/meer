export interface PushNotificationsRemoteDataSource {
  registerToken(payload: {
    token: string;
    deviceId: string;
    platform: "ios" | "android";
    environment: "dev" | "staging" | "prod";
    appVersion: string;
  }): Promise<void>;
  unregisterToken(deviceId: string): Promise<void>;
}
