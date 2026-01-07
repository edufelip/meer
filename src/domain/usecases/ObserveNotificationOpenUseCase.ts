import type { PushNotificationData } from "../entities/PushNotification";
import type { PushNotificationsRepository } from "../repositories/PushNotificationsRepository";

export class ObserveNotificationOpenUseCase {
  constructor(private readonly repo: PushNotificationsRepository) {}

  execute(handler: (data: PushNotificationData) => void): () => void {
    return this.repo.onNotificationOpen(handler);
  }
}
