import type { PushEnvironment } from "../../shared/pushEnvironment";
import type { PushNotificationsRepository } from "../repositories/PushNotificationsRepository";

export class SyncPushTopicsUseCase {
  constructor(private readonly repo: PushNotificationsRepository) {}

  execute(payload: { notifyPromos: boolean; notifyNewStores: boolean; environment: PushEnvironment }): Promise<void> {
    return this.repo.syncTopicSubscriptions(payload);
  }
}
