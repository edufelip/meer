import type { PushEnvironment, PushPlatform } from "../../shared/pushEnvironment";
import type { PushNotificationData } from "../entities/PushNotification";

export interface PushNotificationsRepository {
  requestPermission(): Promise<boolean>;
  getToken(): Promise<string>;
  registerToken(payload: {
    fcmToken: string;
    platform: PushPlatform;
    environment: PushEnvironment;
    appVersion: string;
  }): Promise<void>;
  unregisterToken(environment: PushEnvironment): Promise<void>;
  getLastEnvironment(): Promise<PushEnvironment | null>;
  syncTopicSubscriptions(payload: { notifyPromos: boolean; notifyNewStores: boolean; environment: PushEnvironment }): Promise<void>;
  onTokenRefresh(handler: (token: string) => void): () => void;
  onNotificationOpen(handler: (data: PushNotificationData) => void): () => void;
  getInitialNotification(): Promise<PushNotificationData | null>;
}
