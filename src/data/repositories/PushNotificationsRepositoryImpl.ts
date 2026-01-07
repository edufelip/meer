import messaging from "@react-native-firebase/messaging";
import notifee, { AuthorizationStatus as NotifeeAuthorizationStatus } from "@notifee/react-native";
import { Platform } from "react-native";
import { randomUUID } from "expo-crypto";
import type { PushNotificationData } from "../../domain/entities/PushNotification";
import type { PushNotificationsRepository } from "../../domain/repositories/PushNotificationsRepository";
import type { PushNotificationsLocalDataSource } from "../datasources/PushNotificationsLocalDataSource";
import type { PushNotificationsRemoteDataSource } from "../datasources/PushNotificationsRemoteDataSource";
import { parsePushNotificationData } from "../../shared/pushNotifications";

export class PushNotificationsRepositoryImpl implements PushNotificationsRepository {
  constructor(
    private readonly remote: PushNotificationsRemoteDataSource,
    private readonly local: PushNotificationsLocalDataSource
  ) {}

  async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    const notifeeEnabled =
      settings.authorizationStatus === NotifeeAuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === NotifeeAuthorizationStatus.PROVISIONAL;

    if (Platform.OS !== "ios") {
      return notifeeEnabled;
    }

    const fcmStatus = await messaging().requestPermission();
    const fcmEnabled =
      fcmStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      fcmStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return notifeeEnabled && fcmEnabled;
  }

  async getToken(): Promise<string> {
    await messaging().registerDeviceForRemoteMessages();
    return messaging().getToken();
  }

  async registerToken(payload: {
    token: string;
    platform: "ios" | "android";
    environment: "dev" | "staging" | "prod";
    appVersion: string;
  }): Promise<void> {
    const deviceId = await this.ensureDeviceId();
    await this.remote.registerToken({ ...payload, deviceId });
    await this.local.setLastToken(payload.token);
  }

  async unregisterToken(): Promise<void> {
    const deviceId = await this.local.getDeviceId();
    if (!deviceId) return;
    await this.remote.unregisterToken(deviceId);
    await this.local.setLastToken(null);
  }

  onTokenRefresh(handler: (token: string) => void): () => void {
    return messaging().onTokenRefresh(handler);
  }

  onNotificationOpen(handler: (data: PushNotificationData) => void): () => void {
    return messaging().onNotificationOpenedApp((message) => {
      const parsed = parsePushNotificationData(message?.data);
      if (parsed) handler(parsed);
    });
  }

  async getInitialNotification(): Promise<PushNotificationData | null> {
    const message = await messaging().getInitialNotification();
    return parsePushNotificationData(message?.data);
  }

  private async ensureDeviceId(): Promise<string> {
    const existing = await this.local.getDeviceId();
    if (existing) return existing;
    let generated: string;
    try {
      generated = randomUUID();
    } catch {
      generated = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    await this.local.setDeviceId(generated);
    return generated;
  }
}
