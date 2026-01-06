import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Share, StatusBar, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { GuideContent } from "../../../domain/entities/GuideContent";
import { buildContentShareUrl } from "../../../shared/deepLinks";
import { theme } from "../../../shared/theme";

export function ContentDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "contentDetail">>();
  const { getGuideContentByIdUseCase } = useDependencies();

  const params = route.params as { content?: GuideContent; contentId?: string } | undefined;
  const initialContent = params?.content ?? null;
  const contentId = params?.contentId;

  const [content, setContent] = useState<GuideContent | null>(initialContent);
  const [loading, setLoading] = useState(!initialContent && !!contentId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (initialContent || !contentId) return () => {};

    setLoading(true);
    setError(null);

    getGuideContentByIdUseCase
      .execute(contentId)
      .then((result) => {
        if (!active) return;
        if (result) {
          setContent(result);
        } else {
          setError("Conteúdo não encontrado.");
        }
      })
      .catch(() => {
        if (!active) return;
        setError("Não foi possível carregar este conteúdo.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [contentId, getGuideContentByIdUseCase, initialContent]);

  const createdAtLabel = useMemo(() => {
    if (!content?.createdAt) return undefined;
    return new Date(content.createdAt).toLocaleDateString();
  }, [content?.createdAt]);

  const handleShare = async () => {
    if (!content) return;
    const url = buildContentShareUrl(content.id);

    try {
      await Share.share({
        title: content.title,
        message: `${content.title}\n${url}`,
        url
      });
    } catch {
      Alert.alert("Erro", "Não foi possível compartilhar este conteúdo.");
    }
  };

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
          {content ? (
            <Pressable
              className="p-2 rounded-full"
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Compartilhar conteúdo"
            >
              <Ionicons name="share-outline" size={22} color={theme.colors.highlight} />
            </Pressable>
          ) : (
            <View style={{ width: 32, height: 32 }} />
          )}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32, alignItems: "center" }}>
        {loading ? (
          <View className="items-center mt-12">
            <ActivityIndicator size="large" color={theme.colors.highlight} />
            <Text className="text-sm text-[#6B7280] mt-4">Carregando conteúdo...</Text>
          </View>
        ) : content ? (
          <>
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
          </>
        ) : (
          <View className="items-center mt-12">
            <Text className="text-base font-semibold text-[#1F2937] text-center">
              {error ?? "Conteúdo indisponível."}
            </Text>
            <Text className="text-sm text-[#6B7280] mt-2 text-center">
              Verifique o link ou tente novamente mais tarde.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
