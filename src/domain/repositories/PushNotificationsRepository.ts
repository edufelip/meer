import type { PushNotificationData } from "../entities/PushNotification";

export interface PushNotificationsRepository {
  requestPermission(): Promise<boolean>;
  getToken(): Promise<string>;
  registerToken(payload: {
    token: string;
    platform: "ios" | "android";
    environment: "dev" | "staging" | "prod";
    appVersion: string;
  }): Promise<void>;
  unregisterToken(): Promise<void>;
  onTokenRefresh(handler: (token: string) => void): () => void;
  onNotificationOpen(handler: (data: PushNotificationData) => void): () => void;
  getInitialNotification(): Promise<PushNotificationData | null>;
}
