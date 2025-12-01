import { api } from "../../../api/client";
import type { SupportMessagePayload, SupportRemoteDataSource } from "../SupportRemoteDataSource";

export class HttpSupportRemoteDataSource implements SupportRemoteDataSource {
  async sendMessage(payload: SupportMessagePayload): Promise<void> {
    await api.post("/support/contact", payload);
  }
}
