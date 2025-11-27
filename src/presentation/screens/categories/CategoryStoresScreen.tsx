import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
  Animated,
  Easing
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { theme } from "../../../shared/theme";
import { ToggleFavoriteThriftStoreUseCase } from "../../../domain/usecases/ToggleFavoriteThriftStoreUseCase";
import { useDependencies as useDeps } from "../../../app/providers/AppProvidersWithDI";

const PAGE_SIZE = 10;

type RouteParams = {
  categoryId?: string;
  title: string;
  type?: "nearby" | "category";
  lat?: number;
  lng?: number;
};

export function CategoryStoresScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { categoryId, title, type, lat, lng } = route.params as RouteParams;
  const { getStoresByCategoryUseCase, getNearbyPaginatedUseCase, toggleFavoriteThriftStoreUseCase } =
    useDependencies();

  const query = useInfiniteQuery({
    queryKey: ["category-stores", categoryId ?? "nearby"],
    queryFn: async ({ pageParam = 1 }) =>
      type === "nearby"
        ? getNearbyPaginatedUseCase.execute({ page: pageParam, pageSize: PAGE_SIZE, lat, lng })
        : getStoresByCategoryUseCase.execute({ categoryId: categoryId!, page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined)
  });

  const stores = query.data?.pages.flatMap((p) => p.items) ?? [];
  const isLoading = query.isLoading;
  const isError = query.isError;
  const hasNext = query.hasNextPage;
  const isFetchingNextPage = query.isFetchingNextPage;

  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, [shimmer]);

  const shimmerStyle = {
    opacity: shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] })
  };

  const handleToggleFavorite = useCallback(
    async (store: ThriftStore) => {
      try {
        await toggleFavoriteThriftStoreUseCase.execute(store);
        query.refetch();
      } catch (e) {
        console.log("favorite toggle error", e);
      }
    },
    [toggleFavoriteThriftStoreUseCase, query]
  );

  const renderItem = ({ item }: { item: ThriftStore }) => (
    <Pressable
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-row items-stretch"
      onPress={() => navigation.navigate("thriftDetail", { id: item.id, store: item })}
    >
      <View style={{ width: 112, alignSelf: "stretch" }}>
        {item.coverImageUrl || item.galleryUrls?.[0] ? (
          <Image
            source={{ uri: item.coverImageUrl ?? item.galleryUrls?.[0] }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={["#E5E7EB", "#D1D5DB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </View>
      <View className="p-4 flex-1">
        <View className="flex-row justify-between items-start">
          <Text className="font-bold text-[#374151] text-lg" numberOfLines={1}>
            {item.name}
          </Text>
          <Pressable onPress={() => handleToggleFavorite(item)}>
            <Ionicons
              name={item.isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={item.isFavorite ? theme.colors.highlight : "#9CA3AF"}
            />
          </Pressable>
        </View>
        <Text className="text-sm text-[#4B5563] mt-1" numberOfLines={1}>
          {item.addressLine ?? ""}
        </Text>
        <View className="flex-row items-center gap-1 mt-2">
          <Ionicons name="star" size={16} color={theme.colors.complementary} />
          <Text className="font-bold text-sm text-[#374151]">{item.rating?.toFixed(1) ?? "4.5"}</Text>
          {item.reviewCount ? (
            <Text className="text-sm text-[#6B7280]">({item.reviewCount} avaliações)</Text>
          ) : null}
        </View>
        <View className="flex-row flex-wrap gap-2 mt-3">
          {(item.categories ?? []).slice(0, 3).map((cat) => (
            <Text
              key={cat}
              className="text-xs bg-[#B55D051A] text-primary font-medium px-2 py-1 rounded-full"
            >
              {cat}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );

  const ListFooter = () => (
    <View className="py-4 items-center">
      {isFetchingNextPage ? <ActivityIndicator color={theme.colors.highlight} /> : null}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" />
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <Pressable className="h-10 w-10 items-center justify-center" onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
            </Pressable>
            <Text className="flex-1 text-center text-xl font-bold text-[#374151] pr-10">{title}</Text>
          </View>
        </View>
        <View className="flex-1 bg-[#F3F4F6] px-4 py-4 gap-12">
          {[1, 2, 3, 4].map((key) => (
            <Animated.View
              key={key}
              style={[
                {
                  height: 110,
                  borderRadius: 12,
                  backgroundColor: "#E5E7EB",
                  opacity: 0.9
                },
                shimmerStyle
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 items-center justify-center bg-[#F3F4F6] px-6">
          <Text className="text-lg font-bold text-[#374151] mb-2">Algo deu errado</Text>
          <Text className="text-base text-[#6B7280] text-center mb-4">
            Não foi possível carregar os brechós. Tente novamente.
          </Text>
          <Pressable
            className="bg-[#B55D05] px-4 py-3 rounded-full"
            onPress={() => query.refetch()}
          >
            <Text className="text-white font-bold">Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (stores.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" />
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-[#1F2937]">{title}</Text>
        </View>
        <View className="flex-1 items-center justify-center bg-[#F3F4F6] px-6">
          <Text className="text-lg font-bold text-[#374151] mb-2">Nada por aqui</Text>
          <Text className="text-base text-[#6B7280] text-center">
            Não encontramos brechós nesta categoria ainda.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable className="h-10 w-10 items-center justify-center" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="flex-1 text-center text-xl font-bold text-[#374151] pr-10">{title}</Text>
        </View>
      </View>
      <View className="flex-1 bg-[#F3F4F6]">
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={renderItem}
          onEndReached={() => hasNext && query.fetchNextPage()}
          onEndReachedThreshold={0.6}
          ListFooterComponent={hasNext ? <ListFooter /> : null}
          showsVerticalScrollIndicator={false}
          className="bg-[#F3F4F6]"
        />
      </View>
    </SafeAreaView>
  );
}
