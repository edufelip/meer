import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../../../domain/entities/User";
import type { UserLocalDataSource } from "../UserLocalDataSource";

const CURRENT_USER_KEY = "CURRENT_USER_KEY";

export class AsyncStorageUserLocalDataSource implements UserLocalDataSource {
  async getCurrentUser(): Promise<User | null> {
    const stored = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as User;
  }
}
