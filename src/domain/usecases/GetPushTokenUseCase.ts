import type { PushNotificationsRepository } from "../repositories/PushNotificationsRepository";

export class GetPushTokenUseCase {
  constructor(private readonly repo: PushNotificationsRepository) {}

  execute(): Promise<string> {
    return this.repo.getToken();
  }
}
