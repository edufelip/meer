import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StatusBar, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { User } from "../../../domain/entities/User";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { theme } from "../../../shared/theme";

export function ProfileScreen() {
  const { getCurrentUserUseCase, getFavoriteThriftStoresUseCase } = useDependencies();
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<ThriftStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [maybeUser, favs] = await Promise.all([
        getCurrentUserUseCase.execute(),
        getFavoriteThriftStoresUseCase.execute()
      ]);
      if (isMounted) {
        setUser(maybeUser);
        setFavorites(favs);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getCurrentUserUseCase, getFavoriteThriftStoresUseCase]);

  const displayUser = useMemo<User>(
    () =>
      user ?? {
        id: "placeholder",
        name: "Sophia",
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDGrbbSjpb-IU9VQCZt_O84OMey95QcA2Wfu9tio0CPk5BMqL4ACHte-bSQP5aFMaAQ2pUWHWfNgFlNu8E9tukKEMD8rXJs07_0l4a-apj6H0cCaD8ct7DuJbmwluannXuLWhIOjFiu49M3Y3stl-f2r9iAI0eqmc7FoYw_8DkwTDRfCoC__DRgLVS84OVBKmNLCAwSg_QhjdMimAa77l1ZQbNccSgYf2naYfQ3no8s_JCFTa7gK8aXTopp4wcHfrImuSe0Co2cAbo",
        email: "sophia.silva@email.com"
      },
    [user]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-center text-lg font-bold text-[#1F2937]">Perfil</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center bg-[#F3F4F6]">
          <ActivityIndicator size="large" color={theme.colors.highlight} />
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-[#F3F4F6]"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
        <View className="bg-white">
          <View className="flex-col items-center p-6 space-y-4">
            <View className="relative">
              <Image
                source={{ uri: displayUser.avatarUrl ?? "" }}
                className="w-32 h-32 rounded-full"
                style={{ borderWidth: 4, borderColor: "#EC4899" }}
              />
              <Pressable className="absolute bottom-0 right-0 bg-[#B55D05] p-2 rounded-full shadow-lg">
                <Ionicons name="pencil" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-[#1F2937]">{displayUser.name}</Text>
              <Text className="text-gray-500">{displayUser.email ?? "contato@brecho.app"}</Text>
            </View>
          </View>
        </View>

        <View className="px-4 py-4">
          <Text className="text-lg font-bold mb-2 text-[#1F2937]">Conta</Text>
          <View className="bg-white rounded-lg shadow-sm">
            <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-[#374151]">Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
            </Pressable>
            <Pressable className="flex-row items-center justify-between p-4">
              <Text className="text-red-500">Sair</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
            </Pressable>
          </View>
        </View>

        <View className="px-4 pb-4">
          <Text className="text-lg font-bold mb-2 text-[#1F2937]">Favoritos</Text>
          <View className="flex-row flex-wrap gap-4">
            {favorites.slice(0, 4).map((store) => (
              <View key={store.id} className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ width: "48%" }}>
                <Image source={{ uri: store.imageUrl }} className="w-full h-24" />
                <View className="p-2">
                  <Text className="font-semibold text-[#374151]" numberOfLines={1}>
                    {store.name}
                  </Text>
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {store.addressLine ?? store.neighborhood ?? store.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
