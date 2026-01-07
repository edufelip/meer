import type { PushNotificationsRepository } from "../repositories/PushNotificationsRepository";

export class UnregisterPushTokenUseCase {
  constructor(private readonly repo: PushNotificationsRepository) {}

  execute(): Promise<void> {
    return this.repo.unregisterToken();
  }
}
