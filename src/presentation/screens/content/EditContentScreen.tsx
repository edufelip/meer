import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StatusBar, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { theme } from "../../../shared/theme";

export function EditContentScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "editContent">>();
  const { getGuideContentUseCase } = useDependencies();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!route.params.articleId) return; // creating new
      const articles = await getGuideContentUseCase.execute();
      const article = articles.find((a) => a.id === route.params.articleId);
      if (article) {
        setTitle(article.title);
        setBody(article.description ?? "");
        setMedia([article.imageUrl]);
      }
    })();
  }, [getGuideContentUseCase, route.params.articleId]);

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <View className="flex-row items-center p-4">
          <Pressable className="p-2 rounded-full" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-[#1F2937]">Editar Conteúdo</Text>
          <Pressable className="p-2 rounded-full" accessibilityLabel="Excluir Conteúdo">
            <Ionicons name="trash" size={20} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="mb-6">
          <Text className="text-sm font-medium text-[#374151] mb-1">Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white"
            placeholder="Título do conteúdo"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-[#374151] mb-1">Corpo do Texto</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white"
            placeholder="Descreva seu conteúdo..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold mb-2 text-[#1F2937]">Mídia</Text>
          <View className="grid grid-cols-2 gap-4">
            {media.map((url) => (
              <View key={url} className="relative">
                <Image source={{ uri: url }} className="w-full h-40 rounded-lg" resizeMode="cover" />
                <Pressable className="absolute top-1 right-1 bg-black/50 p-1 rounded-full">
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable className="items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg">
              <View className="items-center">
                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                <Text className="text-sm text-gray-500 mt-1">Adicionar mídia</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View className="pt-2 space-y-3">
          <Pressable className="w-full bg-[#B55D05] rounded-lg py-3 px-4 items-center shadow">
            <Text className="text-white font-bold">Salvar Modificações</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
