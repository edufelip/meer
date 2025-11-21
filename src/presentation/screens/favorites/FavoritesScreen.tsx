import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { FavoriteThriftCard } from "../../components/FavoriteThriftCard";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";

export function FavoritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getFavoriteThriftStoresUseCase } = useDependencies();
  const [favorites, setFavorites] = useState<ThriftStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const stores = await getFavoriteThriftStoresUseCase.execute();
      if (isMounted) {
        setFavorites(stores);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getFavoriteThriftStoresUseCase]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-[#1F2937]">Favoritos</Text>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center bg-[#F3F4F6]">
          <ActivityIndicator size="large" color="#B55D05" />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
          renderItem={({ item }) => (
            <FavoriteThriftCard
              store={item}
              onPress={(store) => navigation.navigate("thriftDetail", { id: store.id })}
            />
          )}
          showsVerticalScrollIndicator={false}
          className="bg-[#F3F4F6]"
        />
      )}
    </SafeAreaView>
  );
}
