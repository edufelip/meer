import React from "react";
import { Image, ScrollView, StatusBar, Text, View, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { theme } from "../../../shared/theme";

export function ContentDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "contentDetail">>();
  const content = route.params.content;

  const createdAtLabel = content.createdAt
    ? new Date(content.createdAt).toLocaleDateString()
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white/90 border-b border-gray-200" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center p-4">
          <Pressable
            className="p-2 rounded-full"
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-[#1F2937]">Conteúdo</Text>
          <View style={{ width: 32, height: 32 }} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32, alignItems: "center" }}>
        <Text className="text-2xl font-extrabold text-[#1F2937] text-center" numberOfLines={2}>
          {content.title}
        </Text>
        {content.thriftStoreName ? (
          <Text className="text-sm text-[#6B7280] mt-2 text-center">{content.thriftStoreName}</Text>
        ) : null}
        {createdAtLabel ? (
          <Text className="text-xs text-[#9CA3AF] mt-1 text-center">Publicado em {createdAtLabel}</Text>
        ) : null}
        <View className="mt-4 mb-4">
          <Image
            source={{ uri: content.imageUrl }}
            className="w-full rounded-xl"
            style={{ aspectRatio: 4 / 3, backgroundColor: "#E5E7EB" }}
            resizeMode="cover"
          />
        </View>
        <Text className="text-base leading-6 text-[#374151] text-center">{content.description}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
