export type PushNotificationType = "guide_content" | "store";

export interface PushNotificationData {
  type: PushNotificationType;
  id: string;
}
