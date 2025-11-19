import React, { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StatusBar, Text, View } from "react-native";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { FavoriteThriftCard } from "../../components/FavoriteThriftCard";

export function FavoritesScreen() {
  const { getFavoriteThriftStoresUseCase } = useDependencies();
  const [favorites, setFavorites] = useState<ThriftStore[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const stores = await getFavoriteThriftStoresUseCase.execute();
      if (isMounted) {
        setFavorites(stores);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getFavoriteThriftStoresUseCase]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-[#1F2937]">Favoritos</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
        renderItem={({ item }) => <FavoriteThriftCard store={item} />}
        showsVerticalScrollIndicator={false}
        className="bg-[#F3F4F6]"
      />
    </SafeAreaView>
  );
}
