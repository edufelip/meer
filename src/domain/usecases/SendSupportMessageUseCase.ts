import type { SupportMessage, SupportRepository } from "../repositories/SupportRepository";

export class SendSupportMessageUseCase {
  constructor(private readonly repository: SupportRepository) {}

  execute(payload: SupportMessage): Promise<void> {
    return this.repository.sendMessage(payload);
  }
}
