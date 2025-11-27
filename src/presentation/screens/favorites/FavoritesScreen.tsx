import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, FlatList, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { FavoriteThriftCard } from "../../components/FavoriteThriftCard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "favorites";

async function readCachedFavorites(): Promise<ThriftStore[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ThriftStore[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function areDifferent(a: ThriftStore[], b: ThriftStore[]): boolean {
  if (a.length !== b.length) return true;
  const idsA = a.map((s) => s.id).sort();
  const idsB = b.map((s) => s.id).sort();
  return idsA.some((id, idx) => id !== idsB[idx]);
}

export function FavoritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getFavoriteThriftStoresUseCase } = useDependencies();
  const [favorites, setFavorites] = useState<ThriftStore[]>([]);
  const [loading, setLoading] = useState(true);
  const shimmer = useRef(new Animated.Value(0)).current;
  const favoritesRef = useRef<ThriftStore[]>([]);

  const updateFavorites = (list: ThriftStore[]) => {
    favoritesRef.current = list;
    setFavorites(list);
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true
      })
    ).start();
  }, [shimmer]);

  const shimmerStyle = {
    opacity: shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] })
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        // 1) Try cached first for instant paint
        const cached = await readCachedFavorites();
        if (active && cached.length > 0) {
          updateFavorites(cached);
          setLoading(false);
        }

        // 2) Fetch remote in background and update only if different
        try {
          const remote = await getFavoriteThriftStoresUseCase.execute();
          if (active) {
            if (areDifferent(remote, favoritesRef.current)) {
              updateFavorites(remote);
            }
            setLoading(false);
          }
        } catch {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [getFavoriteThriftStoresUseCase])
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-[#1F2937]">Favoritos</Text>
      </View>
      {loading && favorites.length === 0 ? (
        <View className="flex-1 bg-[#F3F4F6] px-4 py-6">
          {[...Array(4)].map((_, idx) => (
            <View key={idx} className="bg-white rounded-2xl mb-4 overflow-hidden">
              <Animated.View style={[{ height: 160, backgroundColor: "#E5E7EB" }, shimmerStyle]} />
              <View className="p-4">
                <Animated.View style={[{ height: 18, backgroundColor: "#E5E7EB", borderRadius: 6 }, shimmerStyle]} />
                <Animated.View
                  style={[{ height: 14, backgroundColor: "#E5E7EB", borderRadius: 6, marginTop: 10 }, shimmerStyle]}
                />
              </View>
            </View>
          ))}
        </View>
      ) : favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center bg-[#F3F4F6] px-6">
          <View className="items-center">
            <View className="h-24 w-24 rounded-full bg-gray-200 items-center justify-center">
              <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
            </View>
            <Text className="text-xl font-bold text-[#374151] mt-4">Sua lista está vazia</Text>
            <Text className="text-base text-[#6B7280] text-center max-w-xs mt-2">
              Adicione os seus brechós preferidos aos favoritos e eles aparecerão aqui!
            </Text>
          </View>
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
