import type { PushNotificationsRepository } from "../repositories/PushNotificationsRepository";

export class RequestPushPermissionUseCase {
  constructor(private readonly repo: PushNotificationsRepository) {}

  execute(): Promise<boolean> {
    return this.repo.requestPermission();
  }
}
