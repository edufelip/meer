import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StatusBar,
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  Alert,
  Linking,
  AppState,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  type AppStateStatus
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createAnimatedComponent, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SectionTitle } from "../../components/SectionTitle";
import { FeaturedThriftCarousel } from "../../components/FeaturedThriftCarousel";
import { NearbyMapCard } from "../../components/NearbyMapCard";
import { NearbyThriftListItem } from "../../components/NearbyThriftListItem";
import { GuideContentCard } from "../../components/GuideContentCard";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import type { GuideContent } from "../../../domain/entities/GuideContent";
import type { Category } from "../../../domain/entities/Category";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { theme } from "../../../shared/theme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import NetInfo from "@react-native-community/netinfo";
import { getTokens } from "../../../storage/authStorage";
import {
  loadHomeCache,
  saveHomeCache,
  type HomeCache
} from "../../../data/datasources/impl/AsyncStorageHomeCache";

const DEFAULT_COORDS = { lat: -23.5561782, lng: -46.6375468 };
const HOME_TTL = 24 * 60 * 60 * 1000; // 24h strict
const HOME_GUIDES_PAGE_SIZE = 20;

const AnimatedPressable = createAnimatedComponent(Pressable);
const AnimatedText = createAnimatedComponent(Text);

const bucketFor = (coords: { lat: number; lng: number }) => {
  const r = (v: number) => Math.round(v * 100) / 100;
  return `loc_${r(coords.lat)}_${r(coords.lng)}`;
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    getFeaturedThriftStoresUseCase,
    getNearbyPaginatedUseCase,
    getGuideContentUseCase,
    getCategoriesUseCase
  } =
    useDependencies();
  const [featured, setFeatured] = useState<ThriftStore[]>([]);
  const [nearby, setNearby] = useState<ThriftStore[]>([]);
  const [allStores, setAllStores] = useState<ThriftStore[]>([]);
  const [guides, setGuides] = useState<GuideContent[]>([]);
  const [guidesHasNext, setGuidesHasNext] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [guidesLoading, setGuidesLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Próximo a mim");
  const [filteredList, setFilteredList] = useState<ThriftStore[]>([]);
  const [locationLabel, setLocationLabel] = useState("São Paulo, SP");
  const [neighborhoods, setNeighborhoods] = useState<string[]>(["Próximo a mim"]);
  const [offline, setOffline] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const coordsRef = useRef<{ lat: number; lng: number }>(DEFAULT_COORDS);
  const lastFetchRef = useRef(0);
  const permissionGrantedRef = useRef(false);
  const appState = useRef(AppState.currentState);
  const locationResolved = useRef(false);
  const loadCacheInFlight = useRef(false);
  const isFetching = useRef(false);
  const hasFetchedOnce = useRef(false);
  const featuredDoneRef = useRef(false);
  const nearbyDoneRef = useRef(false);
  const categoriesRef = useRef<Category[]>([]);

  const shimmer = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(1)).current;

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

  const NeighborhoodChip = ({
    label,
    active,
    isFirst,
    onPress
  }: {
    label: string;
    active: boolean;
    isFirst: boolean;
    onPress: () => void;
  }) => {
    const activeSv = useSharedValue(active ? 1 : 0);

    useEffect(() => {
      activeSv.value = withTiming(active ? 1 : 0, { duration: 180 });
    }, [active, activeSv]);

    const containerStyle = useAnimatedStyle(() => {
      const bg = interpolateColor(activeSv.value, [0, 1], ["#E5E7EB", "#B55D05"]);
      return {
        backgroundColor: bg
      };
    });

    const textStyle = useAnimatedStyle(() => {
      return {
        color: interpolateColor(activeSv.value, [0, 1], ["#374151", "#FFFFFF"])
      };
    });

    const iconColor = active ? "#FFFFFF" : "#374151";

    return (
      <AnimatedPressable
        key={label}
        style={containerStyle}
        className="flex-row items-center gap-1.5 py-2 px-3 rounded-full"
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onPress();
        }}
      >
        {isFirst ? <Ionicons name="navigate" size={16} color={iconColor} /> : null}
        <AnimatedText style={textStyle} className="text-sm font-semibold">
          {label}
        </AnimatedText>
      </AnimatedPressable>
    );
  };

  const updateCombined = useCallback((featuredList: ThriftStore[], nearbyList: ThriftStore[]) => {
    const unique = new Map<string, ThriftStore>();
    [...featuredList, ...nearbyList].forEach((s) => {
      if (s?.id) unique.set(s.id, s);
    });
    const combined = Array.from(unique.values());
    setAllStores(combined);
    const hoods = new Set<string>();
    combined.forEach((s) => {
      if (s.neighborhood) hoods.add(s.neighborhood);
    });
    setNeighborhoods(["Próximo a mim", ...Array.from(hoods)]);
  }, []);

  const applyCache = useCallback((cache: HomeCache) => {
    const f = cache.featured ?? [];
    const n = cache.nearby ?? [];
    const c = cache.contents ?? [];
    setFeatured(f);
    setNearby(n);
    setGuides(c);
    // Cache doesn't store pagination metadata; assume there's more when we have at least some items.
    setGuidesHasNext(c.length > 0);
    updateCombined(f, n);
    lastFetchRef.current = cache.fetchedAt;
    setFeaturedLoading(false);
    setNearbyLoading(false);
    setGuidesLoading(false);
    setHasFetched(true);
    hasFetchedOnce.current = true;
  }, [updateCombined]);

  const fetchData = useCallback(
    async (opts?: { force?: boolean; forceFeatured?: boolean; silent?: boolean }) => {
      // Hydrate token cache in case the app cold-started and in-memory cache is empty.
      await getTokens();
      const now = Date.now();
      // Even for forced fetches, avoid concurrent duplicate runs.
      if (isFetching.current) return;
      if (!opts?.force && now - lastFetchRef.current < 2500) return; // throttle repeated triggers

      isFetching.current = true;
      if (!opts?.silent) {
        setFeaturedLoading(true);
        setNearbyLoading(true);
        setGuidesLoading(true);
      }

      const currentCoords = coordsRef.current ?? DEFAULT_COORDS;
      const bucket = bucketFor(currentCoords);
      const featuredRef: ThriftStore[] = [];
      const nearbyRef: ThriftStore[] = [];
      let guidesData: GuideContent[] = [];
      let featuredOk = false;
      let nearbyOk = false;
      let guidesOk = false;
      featuredDoneRef.current = false;
      nearbyDoneRef.current = false;

      const recompute = () => {
        if (featuredDoneRef.current && nearbyDoneRef.current) {
          updateCombined(featuredRef, nearbyRef);
        }
      };

      const applyFeatured = (data: ThriftStore[], animate = false) => {
        featuredRef.splice(0, featuredRef.length, ...(data ?? []));
        if (animate) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setFeatured(data ?? []);
        featuredDoneRef.current = true;
        recompute();
      };

      const featuredPromise = getFeaturedThriftStoresUseCase
        .execute({
          ...currentCoords,
          forceRefresh: opts?.forceFeatured,
          onUpdated: (fresh) => applyFeatured(fresh ?? [], true)
        })
        .then((data) => {
          featuredOk = true;
          applyFeatured(data ?? []);
          setFeaturedLoading(false);
        })
        .catch(() => {
          setFeatured([]);
          setFeaturedLoading(false);
          featuredDoneRef.current = true;
          recompute();
        });

      const nearbyPromise = getNearbyPaginatedUseCase
        .execute({ page: 1, pageSize: 10, lat: currentCoords.lat, lng: currentCoords.lng })
        .then((res) => {
          const items = res.items ?? [];
          nearbyRef.splice(0, nearbyRef.length, ...items);
          setNearby(items.slice(0, 10));
          setNearbyLoading(false);
          nearbyOk = true;
          nearbyDoneRef.current = true;
          recompute();
        })
        .catch(() => {
          setNearby([]);
          setNearbyLoading(false);
          nearbyDoneRef.current = true;
          recompute();
        });

      const guidesPromise = getGuideContentUseCase
        .execute({ page: 0, pageSize: HOME_GUIDES_PAGE_SIZE })
        .then((res) => {
          guidesData = res?.items ?? [];
          guidesOk = true;
          setGuides(guidesData);
          setGuidesHasNext(!!res?.hasNext);
        })
        .catch(() => {
          setGuides([]);
          setGuidesHasNext(false);
        })
        .finally(() => setGuidesLoading(false));

      const categoriesPromise = getCategoriesUseCase
        .execute()
        .then((data) => {
          categoriesRef.current = data ?? [];
        })
        .catch(() => {
          // keep previous categoriesRef
        });

      await Promise.allSettled([featuredPromise, nearbyPromise, guidesPromise, categoriesPromise]);

      if (featuredOk && nearbyOk && guidesOk) {
        void saveHomeCache(bucket, {
          featured: featuredRef,
          nearby: nearbyRef,
          contents: guidesData,
          fetchedAt: Date.now()
        });
      }
      hasFetchedOnce.current = true;
      setHasFetched(true);
      lastFetchRef.current = Date.now();
      isFetching.current = false;
    },
    [getFeaturedThriftStoresUseCase, getNearbyPaginatedUseCase, getGuideContentUseCase, getCategoriesUseCase, updateCombined]
  );

  const loadCacheAndFetch = useCallback(
    async (options?: { force?: boolean }) => {
      if (loadCacheInFlight.current) return;
      loadCacheInFlight.current = true;
      const bucket = bucketFor(coordsRef.current ?? DEFAULT_COORDS);
      const cached = await loadHomeCache(bucket);
      const now = Date.now();
      const stale = !cached || now - cached.fetchedAt > HOME_TTL;
      const hasCachedContent =
        (cached?.featured?.length ?? 0) > 0 ||
        (cached?.nearby?.length ?? 0) > 0 ||
        (cached?.contents?.length ?? 0) > 0;

      if (cached) {
        applyCache(cached);
      }

      try {
        if (!hasCachedContent) {
          // Nothing to show locally -> run a foreground fetch to avoid an empty screen.
          await fetchData({ force: true, forceFeatured: true, silent: false });
        } else if (stale || options?.force) {
          await fetchData({ force: true, forceFeatured: true, silent: !!cached });
        } else {
          // Even when cache is fresh, run a silent background refresh so /featured, /nearby and /contents still fire.
          void fetchData({ force: true, forceFeatured: false, silent: true });
        }
      } finally {
        loadCacheInFlight.current = false;
      }
    },
    [applyCache, fetchData]
  );

  const requestLocation = useCallback(
    async (askPermission: boolean) => {
      try {
        const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
        let finalStatus = status;
        if (status !== "granted" && askPermission) {
          const req = await Location.requestForegroundPermissionsAsync();
          finalStatus = req.status;
        }
        permissionGrantedRef.current = finalStatus === "granted";
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
          await loadCacheAndFetch();
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
        await loadCacheAndFetch();
      } catch {
        coordsRef.current = DEFAULT_COORDS;
        setCoords(DEFAULT_COORDS);
        locationResolved.current = true;
        await loadCacheAndFetch();
      }
    },
    [loadCacheAndFetch]
  );

  const handleAppStateChange = useCallback(
    (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        requestLocation(false);
      }
      appState.current = nextState;
    },
    [requestLocation]
  );

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected;
      setOffline(!connected);
      if (connected && locationResolved.current) {
        const now = Date.now();
        if (!hasFetchedOnce.current) {
          void loadCacheAndFetch();
        } else if (now - lastFetchRef.current > HOME_TTL) {
          void fetchData({ force: true, silent: true });
        }
      }
    });

    const unsubscribeAppState = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      unsubscribeNet();
      unsubscribeAppState.remove();
    };
  }, [fetchData, handleAppStateChange, loadCacheAndFetch]);

  useEffect(() => {
    requestLocation(false);
    // intentionally no deps to avoid re-request loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCacheAndFetch({ force: true });
    setRefreshing(false);
  }, [loadCacheAndFetch]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const list =
      activeFilter === "Próximo a mim"
        ? nearby
        : allStores.filter((s) => s.neighborhood === activeFilter);
    setFilteredList(list);
    filterAnim.setValue(0);
    Animated.timing(filterAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }).start();
  }, [activeFilter, nearby, allStores, filterAnim]);

  useEffect(() => {
    if (!neighborhoods.includes(activeFilter)) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActiveFilter("Próximo a mim");
    }
  }, [neighborhoods, activeFilter]);

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

  const initialLoading = !hasFetched && (featuredLoading || nearbyLoading || guidesLoading);

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
              onPress={() => {
                if (permissionGrantedRef.current) return;
                requestLocation(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Atualizar localização"
            >
              <Text className="text-sm text-[#6B7280] mt-0.5 underline">{locationLabel}</Text>
            </Pressable>
          </View>
          <Pressable
            className="w-8 h-8 items-center justify-center"
            testID="home-search-button"
            onPress={() => navigation.navigate("search")}
          >
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

      {initialLoading ? (
        renderShimmer()
      ) : (
        <ScrollView
          className="flex-1 bg-[#F3F4F6]"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="bg-white py-4">
            <SectionTitle title="Brechós em destaque" />
            {featuredLoading ? (
              <Animated.View
                style={[
                  { height: 200, borderRadius: 12, backgroundColor: "#E5E7EB", marginHorizontal: 16 },
                  shimmerStyle
                ]}
              />
            ) : (
              <FeaturedThriftCarousel
                stores={featured}
                onPressItem={(store) => navigation.navigate("thriftDetail", { id: store.id })}
              />
            )}
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
                  {neighborhoods.map((label, idx) => (
                    <NeighborhoodChip
                      key={`${label}-${idx}`}
                      label={label}
                      active={label === activeFilter}
                      isFirst={idx === 0}
                      onPress={() => setActiveFilter(label)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="mt-4">
              {nearbyLoading ? (
                [1, 2, 3].map((k) => (
                  <Animated.View
                    key={`nearby-skel-${k}`}
                    style={[
                      { height: 82, borderRadius: 12, backgroundColor: "#E5E7EB", marginBottom: k === 3 ? 0 : 8 },
                      shimmerStyle
                    ]}
                  />
                ))
              ) : (
                <Animated.View
                  style={{
                    opacity: filterAnim,
                    transform: [{ translateY: filterAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }]
                  }}
                >
                  {filteredList.length === 0 ? (
                    <Text className="text-sm text-gray-500 mt-2">Nenhum brechó encontrado para este filtro.</Text>
                  ) : (
                    filteredList.map((store, idx, arr) => (
                      <View key={`${store.id}-${idx}`} style={{ marginBottom: idx === arr.length - 1 ? 0 : 8 }}>
                        <NearbyThriftListItem
                          store={store}
                          onPress={() => navigation.navigate("thriftDetail", { id: store.id })}
                          testID={`home-nearby-${store.id}`}
                        />
                      </View>
                    ))
                  )}
                </Animated.View>
              )}
            </View>
            <View className="mt-6 items-center">
              <Pressable
                testID="home-view-all-stores"
                className="bg-[#B55D05] rounded-full px-6 py-3 shadow-lg"
                onPress={() =>
                  navigation.navigate("categoryStores", {
                    type: "nearby",
                    title: "Brechós próximos",
                    lat: (coords ?? DEFAULT_COORDS).lat,
                    lng: (coords ?? DEFAULT_COORDS).lng
                  })
                }
              >
                <Text className="text-sm font-bold text-white">Ver todos os brechós</Text>
              </Pressable>
            </View>
          </View>

          {(guidesLoading || guides.length > 0) && (
            <View className="px-4 py-6 bg-[#F3F4F6]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-[#374151]">Conteúdos e Dicas</Text>
                <Pressable
                  onPress={() =>
                    navigation.navigate("contents", {
                      initialItems: guides,
                      initialPage: 0,
                      initialHasNext: guidesHasNext,
                      initialPageSize: guides.length || HOME_GUIDES_PAGE_SIZE
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Ver todos os conteúdos"
                >
                  <Text className="text-sm font-semibold text-[#B55D05]">Ver todos</Text>
                </Pressable>
              </View>
              {guidesLoading ? (
                <Animated.View
                  style={[
                    { height: 140, borderRadius: 12, backgroundColor: "#E5E7EB" },
                    shimmerStyle
                  ]}
                />
              ) : (
                guides[0] && (
                  <GuideContentCard
                    content={guides[0]}
                    onPress={() => navigation.navigate("contentDetail", { content: guides[0] })}
                  />
                )
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
