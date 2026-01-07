import type { PushEnvironment, PushPlatform } from "../../shared/pushEnvironment";
import type { PushNotificationsRepository } from "../repositories/PushNotificationsRepository";

export class RegisterPushTokenUseCase {
  constructor(private readonly repo: PushNotificationsRepository) {}

  execute(payload: {
    fcmToken: string;
    platform: PushPlatform;
    environment: PushEnvironment;
    appVersion: string;
  }): Promise<void> {
    return this.repo.registerToken(payload);
  }
}
