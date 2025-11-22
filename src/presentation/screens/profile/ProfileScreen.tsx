import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { User } from "../../../domain/entities/User";
import { theme } from "../../../shared/theme";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getProfileUseCase } = useDependencies();
  const [user, setUser] = useState<(User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean }) | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const maybeUser = await getProfileUseCase.execute();
      if (isMounted) {
        setUser(maybeUser);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getProfileUseCase]);

  const displayUser = user;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
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
              className="flex-row items-center justify-between p-4"
              onPress={() =>
                navigation.navigate("brechoForm", {
                  thriftStore: user?.ownedThriftStore ?? null
                })
              }
            >
              <Text className="text-[#374151]">
                {user?.ownedThriftStore ? "Meu Brechó" : "Cadastrar Brechó"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
            </Pressable>
            <Pressable className="flex-row items-center justify-between p-4">
              <Text className="text-red-500">Sair</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.highlight} />
            </Pressable>
          </View>
        </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
