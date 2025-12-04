import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { User } from "../../../domain/entities/User";
import { theme } from "../../../shared/theme";
import { getTokens } from "../../../storage/authStorage";
import { Buffer } from "buffer";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getCachedProfileUseCase, getProfileUseCase } = useDependencies();
  const [user, setUser] = useState<(User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean }) | null>(
    null
  );
  const [hasArticles, setHasArticles] = useState(false);

  const decodeJwtPayload = (token: string | null | undefined) => {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      return payload;
    } catch {
      return null;
    }
  };

  const loadCachedProfile = useCallback(async () => {
    const cached = await getCachedProfileUseCase.execute();
    if (cached) {
      setUser(cached);
      setHasArticles(Boolean(cached.ownedThriftStore && (cached as any).articlesCount > 0));
      // If critical fields are missing (owned store or avatar), fetch a fresh profile to hydrate them.
      if (!cached.ownedThriftStore || !cached.avatarUrl) {
        try {
          const fresh = await getProfileUseCase.execute();
          setUser(fresh);
          setHasArticles(Boolean(fresh.ownedThriftStore && (fresh as any).articlesCount > 0));
        } catch {
          // ignore network error; keep cached
        }
      }
      return;
    }

    // Fallback: derive minimal profile from JWT payload if cache is missing
    const { token } = await getTokens();
    const payload = decodeJwtPayload(token);
    if (payload?.sub && payload?.name && payload?.email) {
      const fallbackProfile = {
        id: String(payload.sub),
        name: payload.name,
        email: payload.email,
        avatarUrl: payload.avatarUrl,
        ownedThriftStore: payload.ownedThriftStore ?? null,
        bio: payload.bio,
        notifyNewStores: payload.notifyNewStores ?? false,
        notifyPromos: payload.notifyPromos ?? false
      };
      setUser(fallbackProfile);
    } else {
      setUser(null);
      setHasArticles(false);
    }
  }, [getCachedProfileUseCase, getProfileUseCase]);

  // Load once on mount
  useEffect(() => {
    loadCachedProfile();
  }, [loadCachedProfile]);

  // Refresh cached data when screen regains focus (no network call, just storage)
  useFocusEffect(
    useCallback(() => {
      loadCachedProfile();
      return () => {};
    }, [loadCachedProfile])
  );

  const displayUser = user;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-center text-lg font-bold text-[#1F2937]">Perfil</Text>
      </View>

      <ScrollView
        className="flex-1 bg-[#F3F4F6]"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="bg-white">
          <View className="flex-col items-center p-6 space-y-4">
            <View className="relative">
              {displayUser?.avatarUrl ? (
                <Image
                  source={{ uri: displayUser.avatarUrl }}
                  className="w-32 h-32 rounded-full"
                  style={{ borderWidth: 4, borderColor: "#EC4899" }}
                />
              ) : (
                <View
                  className="w-32 h-32 rounded-full bg-gray-200"
                  style={{ borderWidth: 4, borderColor: "#EC4899" }}
                />
              )}
            </View>
            <View className="items-center mt-2">
              <Text className="text-2xl font-bold text-[#1F2937]">{displayUser?.name ?? ""}</Text>
              <Text className="text-gray-500">{displayUser?.email ?? ""}</Text>
            </View>
          </View>
        </View>

        <View className="px-4 py-4">
          <Text className="text-lg font-bold mb-2 text-[#1F2937]">Conta</Text>
          <View className="bg-white rounded-lg shadow-sm">
            <Pressable
              className="flex-row items-center justify-between p-4 border-b border-gray-200"
              onPress={() =>
                navigation.navigate("editProfile", {
                  profile: {
                    ...(user ?? displayUser),
                    bio: user?.bio,
                    notifyNewStores: user?.notifyNewStores ?? false,
                    notifyPromos: user?.notifyPromos ?? false,
                    avatarUrl: user?.avatarUrl
                  }
                })
              }
            >
              <Text className="text-[#374151]">Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
            </Pressable>
            <Pressable
              className="flex-row items-center justify-between p-4 border-t border-gray-200"
              onPress={() => navigation.navigate("contact")}
            >
              <Text className="text-[#374151]">Fale Conosco</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
            </Pressable>
          </View>
        </View>

        {user?.ownedThriftStore ? (
          <View className="px-4 pt-0 pb-4">
            <Text className="text-lg font-bold mb-2 text-[#1F2937]">Brechó</Text>
            <View className="bg-white rounded-lg shadow-sm">
              <Pressable
                className="flex-row items-center justify-between p-4 border-b border-gray-200"
                onPress={() =>
                  navigation.navigate("brechoForm", {
                    thriftStore: user?.ownedThriftStore ?? null
                  })
                }
              >
                <Text className="text-[#374151]">Meu brechó</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
              </Pressable>
              <Pressable
                className="flex-row items-center justify-between p-4 border-b border-gray-200"
                onPress={() => navigation.navigate("myContents", { storeId: user.ownedThriftStore.id })}
              >
                <Text className="text-[#374151]">Criar Conteúdo</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
              </Pressable>
              {hasArticles ? (
                <Pressable
                  className="flex-row items-center justify-between p-4"
                  onPress={() => navigation.navigate("myContents", { storeId: user.ownedThriftStore.id })}
                >
                  <Text className="text-[#374151]">Meus Conteúdos</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : (
          <View className="px-4 pt-0 pb-4">
            <Text className="text-lg font-bold mb-2 text-[#1F2937]">Brechó</Text>
            <View className="bg-white rounded-lg shadow-sm">
              <Pressable
                className="flex-row items-center justify-between p-4"
                onPress={() =>
                  navigation.navigate("brechoForm", {
                    thriftStore: null
                  })
                }
              >
                <Text className="text-[#374151]">Criar brechó</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
