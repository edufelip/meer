import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { GuideContent } from "../../../domain/entities/GuideContent";
import { theme } from "../../../shared/theme";

const PAGE_SIZE = 20;
const GRID_GAP = 12;
const HEADER_PADDING = 16;
const HEADER_BUTTON_SIZE = 32;
const HEADER_GAP = 12;
const SEARCH_DEBOUNCE_MS = 350;

function ContentGridCard({
  content,
  onPress
}: {
  content: GuideContent;
  onPress: () => void;
}) {
  const author = content.thriftStoreName?.trim() || "Guia Brechó";
  const storeThumbUrl = content.thriftStoreCoverImageUrl?.trim() || null;
  return (
    <Pressable
      className="bg-white rounded-xl shadow-sm overflow-hidden"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={content.title}
    >
      <Image source={{ uri: content.imageUrl }} className="w-full h-40" resizeMode="cover" />
      <View className="p-3">
        <Text className="text-sm font-semibold text-[#1F2937]" numberOfLines={2}>
          {content.title}
        </Text>
        <View className="flex-row items-center gap-2 mt-2">
          <View className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden items-center justify-center">
            {storeThumbUrl ? (
              <Image source={{ uri: storeThumbUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Ionicons name="storefront-outline" size={14} color="#6B7280" />
            )}
          </View>
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {author}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function ContentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { getGuideContentUseCase } = useDependencies();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [items, setItems] = useState<GuideContent[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const requestIdRef = useRef(0);
  const lastIssuedQueryRef = useRef<string>("__init__");
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [searchAnim, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [searchOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setDebouncedQuery("");
      return;
    }
    const t = setTimeout(() => setDebouncedQuery(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const loadPage = useCallback(
    async (nextPage: number, mode: "replace" | "append", q?: string) => {
      const requestId = ++requestIdRef.current;
      if (mode === "replace") {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const res = await getGuideContentUseCase.execute({ q, page: nextPage, pageSize: PAGE_SIZE });
        if (requestId !== requestIdRef.current) return;
        const newItems = res?.items ?? [];
        setHasNext(!!res?.hasNext);
        setPage(res?.page ?? nextPage);
        setItems((prev) => (mode === "append" ? [...prev, ...newItems] : newItems));
      } catch {
        if (requestId !== requestIdRef.current) return;
        if (mode === "replace") setItems([]);
        setError("Não foi possível carregar os conteúdos agora.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [getGuideContentUseCase]
  );

  useEffect(() => {
    const normalized = debouncedQuery.trim();
    if (normalized === lastIssuedQueryRef.current) return;
    lastIssuedQueryRef.current = normalized;
    void loadPage(0, "replace", normalized || undefined);
  }, [debouncedQuery, loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPage(0, "replace", debouncedQuery.trim() || undefined);
    setRefreshing(false);
  }, [debouncedQuery, loadPage]);

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || !hasNext) return;
    void loadPage(page + 1, "append", debouncedQuery.trim() || undefined);
  }, [debouncedQuery, hasNext, loadPage, loading, loadingMore, page]);

  const emptyMessage = useMemo(() => {
    if (error) return error;
    if (debouncedQuery.trim()) return `Nenhum resultado para “${debouncedQuery.trim()}”.`;
    return "Nenhum conteúdo disponível no momento.";
  }, [debouncedQuery, error]);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => {
    inputRef.current?.blur();
    setSearchOpen(false);
    setQuery("");
    setDebouncedQuery("");
    lastIssuedQueryRef.current = "";
    void loadPage(0, "replace", undefined);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white/90 border-b border-gray-200" style={{ paddingTop: insets.top }}>
        <View className="relative p-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              className="w-8 h-8 items-center justify-center"
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
            </Pressable>

            <Text className="text-lg font-bold text-[#1F2937]">Conteúdo e Dicas</Text>

            <Pressable
              className="w-8 h-8 items-center justify-center"
              onPress={openSearch}
              accessibilityRole="button"
              accessibilityLabel="Buscar conteúdo"
            >
              <Ionicons name="search" size={22} color={theme.colors.highlight} />
            </Pressable>
          </View>

          <Animated.View
            pointerEvents={searchOpen ? "auto" : "none"}
            style={[
              {
                position: "absolute",
                left: HEADER_PADDING + HEADER_BUTTON_SIZE + HEADER_GAP,
                right: HEADER_PADDING,
                top: 0,
                bottom: 0,
                justifyContent: "center",
                opacity: searchAnim,
                transform: [
                  {
                    translateX: searchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <View className="flex-row items-center bg-gray-100 border border-gray-200 rounded-full px-3 h-10">
              <Ionicons name="search" size={18} color="#6B7280" />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar conteúdo..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 px-2 text-[#374151]"
                returnKeyType="search"
                onSubmitEditing={() => setDebouncedQuery(query.trim())}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query.trim().length > 0 ? (
                <Pressable
                  onPress={() => setQuery("")}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar busca"
                  hitSlop={10}
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
              ) : null}
              <Pressable
                onPress={closeSearch}
                accessibilityRole="button"
                accessibilityLabel="Fechar busca"
                hitSlop={10}
                className="ml-2"
              >
                <Ionicons name="close" size={18} color={theme.colors.highlight} />
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        renderItem={({ item, index }) => {
          const isLeft = index % 2 === 0;
          return (
            <View style={{ flex: 1, marginRight: isLeft ? GRID_GAP : 0, marginBottom: GRID_GAP }}>
              <ContentGridCard
                content={item}
                onPress={() => navigation.navigate("contentDetail" as never, { content: item } as never)}
              />
            </View>
          );
        }}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator color={theme.colors.highlight} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ marginTop: 8 }}>
              <View className="flex-row flex-wrap justify-between">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <View
                    key={idx}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                    style={{
                      width: "48%",
                      height: 220,
                      opacity: 0.7,
                      marginBottom: GRID_GAP
                    }}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-[#6B7280] text-center">{emptyMessage}</Text>
              {error ? (
                <Pressable
                  className="mt-4 bg-[#B55D05] rounded-full px-5 py-2"
                  onPress={() => loadPage(0, "replace", debouncedQuery.trim() || undefined)}
                  accessibilityRole="button"
                  accessibilityLabel="Tentar novamente"
                >
                  <Text className="text-white font-bold">Tentar novamente</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
