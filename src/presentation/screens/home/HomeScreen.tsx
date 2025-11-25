import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StatusBar,
  View,
  Text,
  Pressable,
  Image,
  Animated,
  Easing,
  Alert,
  Linking,
  AppState
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionTitle } from "../../components/SectionTitle";
import { FeaturedThriftCarousel } from "../../components/FeaturedThriftCarousel";
import { NearbyMapCard } from "../../components/NearbyMapCard";
import { NearbyThriftListItem } from "../../components/NearbyThriftListItem";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import type { GuideContent } from "../../../domain/entities/GuideContent";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { theme } from "../../../shared/theme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import NetInfo from "@react-native-community/netinfo";
import { getAccessTokenSync } from "../../../storage/authStorage";

const DEFAULT_COORDS = { lat: -23.5561782, lng: -46.6375468 };

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getHomeUseCase } = useDependencies();
  const [featured, setFeatured] = useState<ThriftStore[]>([]);
  const [nearby, setNearby] = useState<ThriftStore[]>([]);
  const [allStores, setAllStores] = useState<ThriftStore[]>([]);
  const [guides, setGuides] = useState<GuideContent[]>([]);
  const [activeFilter, setActiveFilter] = useState("Próximo a mim");
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState("São Paulo, SP");
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [offline, setOffline] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const coordsRef = useRef<{ lat: number; lng: number }>(DEFAULT_COORDS);
  const appState = useRef(AppState.currentState);
  const locationResolved = useRef(false);
  const isFetching = useRef(false);
  const authErrored = useRef(false);

  const handleAppStateChange = useCallback(
    (nextState: string) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        requestLocation(false);
      }
      appState.current = nextState;
    },
    []
  );

  const shimmer = useRef(new Animated.Value(0)).current;

  const startShimmer = useCallback(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, [shimmer]);

  useEffect(() => {
    startShimmer();
  }, [startShimmer]);

  const shimmerStyle = {
    opacity: shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] })
  };

  const fetchData = useCallback(async () => {
    // Avoid hammering the API if the user is logged out or already fetching
    if (!locationResolved.current || !getAccessTokenSync() || isFetching.current || authErrored.current) return;
    isFetching.current = true;
    try {
      const currentCoords = coordsRef.current ?? DEFAULT_COORDS;
      const { featured: featuredStores = [], nearby: nearbyStores = [], content: guideItems = [] } =
        await getHomeUseCase.execute(currentCoords);

      setFeatured(featuredStores ?? []);
      setNearby((nearbyStores ?? []).slice(0, 10));
      setAllStores([...(featuredStores ?? []), ...(nearbyStores ?? [])]);
      setGuides(guideItems ?? []);
      const hoods = new Set<string>();
      [...featuredStores, ...nearbyStores].forEach((s) => {
        if (s.neighborhood) {
          hoods.add(s.neighborhood);
        }
      });
      setNeighborhoods(["Próximo a mim", ...Array.from(hoods)]);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      if (e?.response?.status === 401) {
        authErrored.current = true;
        await clearTokens();
        if (navigation.isFocused()) navigation.navigate("login");
      }
    } finally {
      isFetching.current = false;
    }
  }, [getHomeUseCase, coords, navigation]);

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected;
      setOffline(!connected);
      if (connected && locationResolved.current) {
        fetchData();
      }
    });

    const unsubscribeAppState = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      unsubscribeNet();
      unsubscribeAppState.remove();
    };
  }, [fetchData, handleAppStateChange]);

  const requestLocation = useCallback(
    async (askPermission: boolean) => {
      try {
        const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
        let finalStatus = status;
        if (status !== "granted" && askPermission) {
          const req = await Location.requestForegroundPermissionsAsync();
          finalStatus = req.status;
        }
        if (finalStatus !== "granted") {
          if (!canAskAgain && askPermission) {
            Alert.alert(
              "Permita acesso à localização",
              "Vá em Ajustes e permita o acesso à localização para mostrar brechós próximos.",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Abrir Ajustes",
                  onPress: () => Linking.openSettings()
                }
              ]
            );
          }
          coordsRef.current = DEFAULT_COORDS;
          setCoords(DEFAULT_COORDS);
          locationResolved.current = true;
          fetchData();
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        const [place] = await Location.reverseGeocodeAsync(position.coords);
          if (place) {
            const city = place.subregion ?? place.city ?? place.region ?? "Sua região";
            const country = place.isoCountryCode ?? "";
            setLocationLabel(country ? `${city}, ${country}` : city);
          }
          const c = { lat: position.coords.latitude, lng: position.coords.longitude };
          coordsRef.current = c;
          setCoords(c);
          locationResolved.current = true;
          fetchData(); // refetch with new coords
        } catch {
          coordsRef.current = DEFAULT_COORDS;
          setCoords(DEFAULT_COORDS);
          locationResolved.current = true;
          fetchData();
        }
      },
      [fetchData]
  );

  useEffect(() => {
    requestLocation(false);
    // intentionally no deps to avoid re-request loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderShimmer = () => (
    <ScrollView className="flex-1 bg-[#F3F4F6]" contentContainerStyle={{ padding: 16 }}>
      <Animated.View
        style={[
          { height: 180, borderRadius: 12, backgroundColor: "#E5E7EB", marginBottom: 16 },
          shimmerStyle
        ]}
      />
      <Animated.View
        style={[
          { height: 200, borderRadius: 12, backgroundColor: "#E5E7EB", marginBottom: 16 },
          shimmerStyle
        ]}
      />
      <View className="flex-row gap-8 mb-16">
        {[1, 2, 3].map((k) => (
          <Animated.View
            key={k}
            style={[
              { height: 28, width: 90, borderRadius: 999, backgroundColor: "#E5E7EB" },
              shimmerStyle
            ]}
          />
        ))}
      </View>
      {[1, 2, 3].map((k) => (
        <Animated.View
          key={k}
          style={[
            { height: 80, borderRadius: 12, backgroundColor: "#E5E7EB", marginBottom: 12 },
            shimmerStyle
          ]}
        />
      ))}
      <Animated.View
        style={[
          { height: 140, borderRadius: 12, backgroundColor: "#E5E7EB", marginTop: 8 },
          shimmerStyle
        ]}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white/90 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-2xl font-extrabold text-[#374151]">Guia Brechó</Text>
              <View className="ml-2">
                <Text className="text-[#B55D05] text-lg">📍</Text>
              </View>
            </View>
            <Pressable
              className="flex-row items-center"
              onPress={() => requestLocation(true)}
              accessibilityRole="button"
              accessibilityLabel="Atualizar localização"
            >
              <Text className="text-sm text-[#6B7280] mt-0.5 underline">{locationLabel}</Text>
            </Pressable>
          </View>
          <Pressable className="w-8 h-8 items-center justify-center" onPress={() => navigation.navigate("search")}>
            <Ionicons name="search" size={22} color={theme.colors.highlight} />
          </Pressable>
        </View>
        {offline && (
          <View className="mt-3 bg-[#FDE68A] rounded-lg px-3 py-2">
            <Text className="text-xs font-semibold text-[#92400E]">
              Sem conexão. Mostrando dados locais. Tentando reconectar...
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        renderShimmer()
      ) : (
        <ScrollView
          className="flex-1 bg-[#F3F4F6]"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="bg-white py-4">
            <SectionTitle title="Brechós em destaque" />
            <FeaturedThriftCarousel
              stores={featured}
              onPressItem={(store) => navigation.navigate("thriftDetail", { id: store.id })}
            />
          </View>

          <View className="px-4 py-6">
            <SectionTitle title="Descubra brechós perto de você" className="px-0" />
            <View className="relative rounded-xl overflow-hidden">
              <NearbyMapCard
                imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBSugh5Wg37gnoj6GkKkSiS8awJbFlS80QERNJycKgn68NF7oXxiwdsiEEo58M8fByFbIwXzreAIouFbxQR4E7vXlnFdvYSzoshsmN1iHWV2ji6iYl2awjYiBJnN3e-UpF_app3jtWsq7lVod9vG57HH_d6pjIzdWFNwQ6aTTUZnOxvNUEpuYq3ny9OSzx1Hz6W0f3DuJ2uxyhVgq1lhVQnHEMmXcEmyIN-WBUTV5K9e8lMJ8HpqH6_TbZC7CNVMuy3snEnVSGvP7g"
                onLocate={() => requestLocation(true)}
              />
              <View className="absolute inset-0 rounded-xl">
                <View className="absolute bottom-0 left-0 right-0 p-4 pb-4">
                  <View className="flex-row items-end justify-between">
                    <View>
                      <Text className="text-lg font-bold text-white">Brechós próximos</Text>
                      <Text className="text-sm text-white/90 mb-3">Encontre brechós perto de você</Text>
                    </View>
                    <Pressable
                      className="bg-[#B55D05] px-4 py-2 rounded-full shadow-lg mb-3"
                      onPress={() =>
                        navigation.navigate("categoryStores", {
                          type: "nearby",
                          title: "Brechós próximos",
                          lat: (coords ?? DEFAULT_COORDS).lat,
                          lng: (coords ?? DEFAULT_COORDS).lng
                        })
                      }
                    >
                      <Text className="text-sm font-bold text-white">Ver lista</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            <View className="pt-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                className="overflow-visible"
              >
                <View className="flex-row gap-2">
                  {neighborhoods.map((label, idx) => {
                    const active = label === activeFilter;
                    const isFirst = idx === 0;
                    return (
                      <Pressable
                        key={label}
                        className={`flex-row items-center gap-1.5 py-2 px-3 rounded-full ${
                          active ? "bg-[#B55D05]" : "bg-gray-200"
                        }`}
                        onPress={() => setActiveFilter(label)}
                      >
                        {isFirst ? (
                          <Ionicons name="navigate" size={16} color={active ? "white" : "#374151"} />
                        ) : null}
                        <Text className={`text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View className="mt-4">
              {(activeFilter === "Próximo a mim"
                ? nearby
                : allStores.filter((s) => s.neighborhood === activeFilter)
              ).map((store, idx, arr) => (
                <View key={`${store.id}-${idx}`} style={{ marginBottom: idx === arr.length - 1 ? 0 : 8 }}>
                  <NearbyThriftListItem
                    store={store}
                    onPress={() => navigation.navigate("thriftDetail", { id: store.id })}
                  />
                </View>
              ))}
            </View>
            <View className="mt-6 items-center">
              <Pressable className="bg-[#B55D05] rounded-full px-6 py-3 shadow-lg">
                <Text className="text-sm font-bold text-white">Ver todos os brechós</Text>
              </Pressable>
            </View>
          </View>

          <View className="px-4 py-6 bg-[#F3F4F6]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-[#374151]">Conteúdos e Dicas</Text>
              <Text className="text-sm font-semibold text-[#B55D05]">Ver todos</Text>
            </View>
            {guides[0] ? (
              <View className="bg-white rounded-xl shadow-sm overflow-hidden">
                <View className="flex-row">
                  <Image source={{ uri: guides[0].imageUrl }} className="w-1/3 h-full aspect-[4/5]" />
                  <View className="p-4 flex-1">
                    <Text className="font-bold text-[#374151] mb-1" numberOfLines={2}>
                      {guides[0].title}
                    </Text>
                    <Text className="text-sm text-[#6B7280] mb-2" numberOfLines={2}>
                      {guides[0].description}
                    </Text>
                    <View className="bg-[#B55D05] self-start rounded-full px-2 py-1">
                      <Text className="text-xs font-semibold text-white uppercase">
                        {guides[0].categoryLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
