export interface SupportMessagePayload {
  name: string;
  email: string;
  message: string;
}

export interface SupportRemoteDataSource {
  sendMessage(payload: SupportMessagePayload): Promise<void>;
}
