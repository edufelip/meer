export interface PushNotificationsLocalDataSource {
  getDeviceId(): Promise<string | null>;
  setDeviceId(id: string): Promise<void>;
  getLastToken(): Promise<string | null>;
  setLastToken(token: string | null): Promise<void>;
  getLastEnvironment(): Promise<string | null>;
  setLastEnvironment(environment: string | null): Promise<void>;
}
