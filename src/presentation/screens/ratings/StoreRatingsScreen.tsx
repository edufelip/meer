import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { StoreRating } from "../../../domain/entities/StoreRating";
import { theme } from "../../../shared/theme";
import { useStoreSummaryStore } from "../../state/storeSummaryStore";

const PAGE_SIZE = 10;

type RouteParams = {
  storeId?: string;
  storeName?: string;
  reviewCount?: number;
};

export function StoreRatingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as RouteParams;
  const storeId = params.storeId;
  const storeName = params.storeName ?? "";
  const summary = useStoreSummaryStore((state) => (storeId ? state.summaries[storeId] : undefined));
  const reviewCount = summary?.reviewCount ?? params.reviewCount ?? 0;
  const { getStoreRatingsUseCase } = useDependencies();

  const cacheKey = useMemo(() => ["store-ratings", storeId ?? "unknown"], [storeId]);

  const query = useInfiniteQuery<
    { items: StoreRating[]; page: number; hasNext: boolean },
    Error,
    InfiniteData<{ items: StoreRating[]; page: number; hasNext: boolean }>,
    (string | undefined)[],
    number
  >({
    queryKey: cacheKey,
    queryFn: async ({ pageParam = 1 }) =>
      getStoreRatingsUseCase.execute({ storeId: storeId!, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled: !!storeId,
    refetchOnMount: "always",
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 3 * 60 * 1000,
    gcTime: 0
  });

  const ratings = query.data?.pages.flatMap((p) => p.items) ?? [];
  const isLoading = query.isLoading;
  const isError = query.isError;
  const hasNext = query.hasNextPage;
  const isFetchingNextPage = query.isFetchingNextPage;

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions?.({ tabBarStyle: { display: "none" } });
      return () => {
        parent?.setOptions?.({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("tabs" as never);
    }
  }, [navigation]);

  const renderStars = (value: number, size = 16) => (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((idx) => (
        <Ionicons
          key={idx}
          name={value >= idx ? "star" : "star-outline"}
          size={size}
          color="#E6A800"
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );

  const formatDate = (raw?: string) => {
    if (!raw) return undefined;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toLocaleDateString("pt-BR");
  };

  const renderItem = ({ item }: { item: StoreRating }) => {
    const dateLabel = formatDate(item.createdAt);
    return (
      <View className="bg-white rounded-xl border border-gray-100 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-semibold text-[#374151]">
              {item.authorName ?? "Anônimo"}
            </Text>
            {dateLabel ? <Text className="text-xs text-[#9CA3AF]">{dateLabel}</Text> : null}
          </View>
          {renderStars(item.score, 18)}
        </View>
        <Text className="text-sm text-[#4B5563] mt-2">{item.body}</Text>
      </View>
    );
  };

  const ListFooter = () => (
    <View className="py-4 items-center">
      {isFetchingNextPage ? <ActivityIndicator color={theme.colors.highlight} /> : null}
    </View>
  );

  const ListEmpty = () => (
    <View className="items-center py-12">
      <Text className="text-sm text-[#6B7280]">Nenhuma avaliação ainda.</Text>
    </View>
  );

  if (!storeId) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" />
        <View className="px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <Pressable className="h-10 w-10 items-center justify-center" onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
            </Pressable>
            <Text className="flex-1 text-center text-xl font-bold text-[#374151] pr-10">Avaliações</Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-[#6B7280] text-center">
            Nenhum brechó selecionado para exibir avaliações.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable className="h-10 w-10 items-center justify-center" onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <View className="flex-1 pr-10">
            <Text className="text-xl font-bold text-[#374151] text-center">Avaliações</Text>
            {storeName ? (
              <Text className="text-xs text-[#9CA3AF] text-center" numberOfLines={1}>
                {storeName}
              </Text>
            ) : null}
            {reviewCount > 0 ? (
              <Text className="text-xs text-[#9CA3AF] text-center">
                {reviewCount} avaliações
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-[#6B7280] text-center">
            Não foi possível carregar as avaliações.
          </Text>
        </View>
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
          onEndReached={() => hasNext && query.fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={hasNext ? <ListFooter /> : null}
          ListEmptyComponent={!isLoading ? <ListEmpty /> : null}
          ListHeaderComponent={isLoading ? <ActivityIndicator color={theme.colors.highlight} /> : null}
        />
      )}
    </SafeAreaView>
  );
}
