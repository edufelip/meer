import { api } from "./client";
import { endpoints } from "../network/endpoints";
import { toApiEnvironment, toApiPlatform, type PushEnvironment, type PushPlatform } from "../shared/pushEnvironment";

export interface PushTokenPayload {
  fcmToken: string;
  deviceId: string;
  platform: PushPlatform;
  environment: PushEnvironment;
  appVersion: string;
}

export async function registerPushToken(payload: PushTokenPayload): Promise<void> {
  await api.post(endpoints.pushTokens.register(), {
    ...payload,
    platform: toApiPlatform(payload.platform),
    environment: toApiEnvironment(payload.environment)
  });
}

export async function unregisterPushToken(deviceId: string, environment: PushEnvironment): Promise<void> {
  const env = toApiEnvironment(environment);
  await api.delete(`${endpoints.pushTokens.unregister(deviceId)}?environment=${env}`);
}
