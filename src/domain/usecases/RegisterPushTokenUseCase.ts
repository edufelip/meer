import type { PushNotificationsRepository } from "../repositories/PushNotificationsRepository";

export class RegisterPushTokenUseCase {
  constructor(private readonly repo: PushNotificationsRepository) {}

  execute(payload: {
    token: string;
    platform: "ios" | "android";
    environment: "dev" | "staging" | "prod";
    appVersion: string;
  }): Promise<void> {
    return this.repo.registerToken(payload);
  }
}
