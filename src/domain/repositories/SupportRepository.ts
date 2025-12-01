export interface SupportMessage {
  name: string;
  email: string;
  message: string;
}

export interface SupportRepository {
  sendMessage(payload: SupportMessage): Promise<void>;
}
