import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, FlatList, RefreshControl, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { FavoriteThriftCard } from "../../components/FavoriteThriftCard";
import type { RootStackParamList } from "../../../app/navigation/RootStack";

const STORAGE_KEY = "favorites";
const STORAGE_META_KEY = "favorites_meta";
const STALE_MS = 15 * 60 * 1000; // 15 minutes

type CachedFavorites = { items: ThriftStore[]; fetchedAt: number | null };

async function readCachedFavorites(): Promise<CachedFavorites> {
  try {
    const [rawItems, rawMeta] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(STORAGE_META_KEY)
    ]);
    const items = rawItems ? (JSON.parse(rawItems) as ThriftStore[]) : [];
    const fetchedAt = rawMeta ? JSON.parse(rawMeta) : null;
    return {
      items: Array.isArray(items) ? items : [],
      fetchedAt: typeof fetchedAt === "number" ? fetchedAt : null
    };
  } catch {
    return { items: [], fetchedAt: null };
  }
}

async function writeCachedFavorites(items: ThriftStore[], fetchedAt: number) {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)),
      AsyncStorage.setItem(STORAGE_META_KEY, JSON.stringify(fetchedAt))
    ]);
  } catch {
    // ignore cache write failures
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
  const [refreshing, setRefreshing] = useState(false);

  const shimmer = useRef(new Animated.Value(0)).current;
  const favoritesRef = useRef<ThriftStore[]>([]);
  const fetchedAtRef = useRef<number | null>(null);
  const fetchingRef = useRef(false);

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

  const fetchRemote = useCallback(
    async (force = false) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (force) setRefreshing(true);
      try {
        const remote = await getFavoriteThriftStoresUseCase.execute();
        if (areDifferent(remote, favoritesRef.current)) {
          updateFavorites(remote);
        }
        const now = Date.now();
        fetchedAtRef.current = now;
        await writeCachedFavorites(remote, now);
      } catch {
        // keep showing cached data
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getFavoriteThriftStoresUseCase]
  );

  const onRefresh = useCallback(() => {
    fetchRemote(true);
  }, [fetchRemote]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const cached = await readCachedFavorites();
        if (!active) return;

        if (cached.items.length > 0) {
          updateFavorites(cached.items);
          fetchedAtRef.current = cached.fetchedAt;
          setLoading(false);
        }

        const isStale =
          cached.items.length === 0 ||
          !cached.fetchedAt ||
          Date.now() - cached.fetchedAt > STALE_MS;

        if (isStale) {
          fetchRemote();
        } else {
          setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [fetchRemote])
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-center text-lg font-bold text-[#1F2937]">Favoritos</Text>
      </View>

      {loading && favorites.length === 0 ? (
        <View className="flex-1 bg-[#F3F4F6] px-4 py-6">
          {[...Array(4)].map((_, idx) => (
            <View key={idx} className="bg-white rounded-2xl mb-4 overflow-hidden">
              <Animated.View style={[{ height: 160, backgroundColor: "#E5E7EB" }, shimmerStyle]} />
              <View className="p-4">
                <Animated.View style={[{ height: 18, backgroundColor: "#E5E7EB", borderRadius: 6 }, shimmerStyle]} />
                <Animated.View
                  style={[
                    { height: 14, backgroundColor: "#E5E7EB", borderRadius: 6, marginTop: 10 },
                    shimmerStyle
                  ]}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}
