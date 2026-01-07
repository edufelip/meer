import type { PushNotificationData } from "../entities/PushNotification";
import type { PushNotificationsRepository } from "../repositories/PushNotificationsRepository";

export class GetInitialNotificationUseCase {
  constructor(private readonly repo: PushNotificationsRepository) {}

  execute(): Promise<PushNotificationData | null> {
    return this.repo.getInitialNotification();
  }
}
