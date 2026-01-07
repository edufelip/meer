import type { PushNotificationsRepository } from "../repositories/PushNotificationsRepository";

export class ObservePushTokenRefreshUseCase {
  constructor(private readonly repo: PushNotificationsRepository) {}

  execute(handler: (token: string) => void): () => void {
    return this.repo.onTokenRefresh(handler);
  }
}
