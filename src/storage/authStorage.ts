import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth.token";
const REFRESH_KEY = "auth.refreshToken";

export async function saveTokens(token: string, refreshToken?: string) {
  const ops = [AsyncStorage.setItem(TOKEN_KEY, token)];
  if (refreshToken) ops.push(AsyncStorage.setItem(REFRESH_KEY, refreshToken));
  await Promise.all(ops);
}

export async function getTokens() {
  const [token, refreshToken] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(REFRESH_KEY)
  ]);
  return { token: token ?? undefined, refreshToken: refreshToken ?? undefined };
}

export async function clearTokens() {
  await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(REFRESH_KEY)]);
}
