import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { theme } from "../../../shared/theme";
import { getTokens } from "../../../storage/authStorage";
import { Buffer } from "buffer";
import { useProfileSummaryStore } from "../../state/profileSummaryStore";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getCachedProfileUseCase, getProfileUseCase } = useDependencies();
  const profile = useProfileSummaryStore((state) => state.profile);
  const setProfile = useProfileSummaryStore((state) => state.setProfile);
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
      setProfile(cached);
      setHasArticles(Boolean(cached.ownedThriftStore && (cached as any).articlesCount > 0));
      // If critical fields are missing (owned store or avatar), fetch a fresh profile to hydrate them.
      if (!cached.ownedThriftStore || !cached.avatarUrl) {
        try {
          const fresh = await getProfileUseCase.execute();
          setProfile(fresh);
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
      setProfile(fallbackProfile);
    } else {
      setProfile(null);
      setHasArticles(false);
    }
  }, [getCachedProfileUseCase, getProfileUseCase, setProfile]);

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

  const displayUser = profile;

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
              onPress={() => {
                if (!displayUser) return;
                navigation.navigate("editProfile", {
                  profile: {
                    ...displayUser,
                    bio: profile?.bio,
                    notifyNewStores: profile?.notifyNewStores ?? false,
                    notifyPromos: profile?.notifyPromos ?? false,
                    avatarUrl: profile?.avatarUrl
                  }
                });
              }}
              testID="profile-edit-button"
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

        {(() => {
          const ownedStore = profile?.ownedThriftStore ?? null;
          if (!ownedStore) return null;
          return (
          <View className="px-4 pt-0 pb-4">
            <Text className="text-lg font-bold mb-2 text-[#1F2937]">Brechó</Text>
            <View className="bg-white rounded-lg shadow-sm">
              <Pressable
                className="flex-row items-center justify-between p-4 border-b border-gray-200"
                onPress={() =>
                  navigation.navigate("brechoForm", {
                    thriftStore: ownedStore
                  })
                }
              >
                <Text className="text-[#374151]">Meu brechó</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
              </Pressable>
              <Pressable
                className="flex-row items-center justify-between p-4 border-b border-gray-200"
                onPress={() => navigation.navigate("myContents", { storeId: ownedStore.id })}
                testID="profile-create-content-button"
              >
                <Text className="text-[#374151]">Criar Conteúdo</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
              </Pressable>
              {hasArticles ? (
                <Pressable
                  className="flex-row items-center justify-between p-4"
                  onPress={() => navigation.navigate("myContents", { storeId: ownedStore.id })}
                >
                  <Text className="text-[#374151]">Meus Conteúdos</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
                </Pressable>
              ) : null}
            </View>
          </View>
        );
        })() ?? (
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
