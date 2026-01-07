import { api } from "./client";
import { endpoints } from "../network/endpoints";

export interface PushTokenPayload {
  token: string;
  deviceId: string;
  platform: "ios" | "android";
  environment: "dev" | "staging" | "prod";
  appVersion: string;
}

export async function registerPushToken(payload: PushTokenPayload): Promise<void> {
  await api.post(endpoints.pushTokens.register(), payload);
}

export async function unregisterPushToken(deviceId: string): Promise<void> {
  await api.delete(endpoints.pushTokens.unregister(deviceId));
}
