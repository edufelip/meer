import type { PushNotificationData } from "../domain/entities/PushNotification";

export function parsePushNotificationData(
  data?: Record<string, string>
): PushNotificationData | null {
  if (!data) return null;
  const type = data.type;
  const id = data.id;
  if (!id) return null;
  if (type !== "guide_content" && type !== "store") return null;
  return { type, id };
}
