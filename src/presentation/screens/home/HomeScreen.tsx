import React, { useEffect, useState } from "react";
import { ScrollView, StatusBar, View, Text, ActivityIndicator, Pressable, Image } from "react-native";
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

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getFeaturedThriftStoresUseCase, getNearbyThriftStoresUseCase, getGuideContentUseCase } =
    useDependencies();
  const [featured, setFeatured] = useState<ThriftStore[]>([]);
  const [nearby, setNearby] = useState<ThriftStore[]>([]);
  const [guides, setGuides] = useState<GuideContent[]>([]);
  const [activeFilter, setActiveFilter] = useState("Próximo a mim");
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState("São Paulo, SP");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [featuredStores, nearbyStores, guideItems] = await Promise.all([
        getFeaturedThriftStoresUseCase.execute(),
        getNearbyThriftStoresUseCase.execute(),
        getGuideContentUseCase.execute()
      ]);
      if (isMounted) {
        setFeatured(featuredStores);
        setNearby(nearbyStores);
        setGuides(guideItems);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getFeaturedThriftStoresUseCase, getNearbyThriftStoresUseCase, getGuideContentUseCase]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || !active) return;
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        if (!active) return;
        const [place] = await Location.reverseGeocodeAsync(position.coords);
        if (active && place) {
          const city = place.subregion ?? place.city ?? place.region ?? "Sua região";
          const country = place.isoCountryCode ?? "";
          setLocationLabel(country ? `${city}, ${country}` : city);
        }
      } catch {
        // keep default label
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      {/* Header matching reference */}
      <View className="bg-white/90 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-2xl font-extrabold text-[#374151]">Guia Brechó</Text>
              <View className="ml-2">
                <Text className="text-[#B55D05] text-lg">📍</Text>
              </View>
            </View>
            <Text className="text-sm text-[#6B7280] mt-0.5">{locationLabel}</Text>
          </View>
          <Pressable className="w-8 h-8 items-center justify-center" onPress={() => {}}>
            <Ionicons name="search" size={22} color={theme.colors.highlight} />
          </Pressable>
        </View>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center bg-[#F3F4F6]">
          <ActivityIndicator size="large" color={theme.colors.highlight} />
        </View>
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
          {/* Hero card closer to reference */}
          <View className="relative rounded-xl overflow-hidden">
            <NearbyMapCard
              imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBSugh5Wg37gnoj6GkKkSiS8awJbFlS80QERNJycKgn68NF7oXxiwdsiEEo58M8fByFbIwXzreAIouFbxQR4E7vXlnFdvYSzoshsmN1iHWV2ji6iYl2awjYiBJnN3e-UpF_app3jtWsq7lVod9vG57HH_d6pjIzdWFNwQ6aTTUZnOxvNUEpuYq3ny9OSzx1Hz6W0f3DuJ2uxyhVgq1lhVQnHEMmXcEmyIN-WBUTV5K9e8lMJ8HpqH6_TbZC7CNVMuy3snEnVSGvP7g"
              onLocate={() => {}}
            />
            <View className="absolute inset-0 rounded-xl">
                <View className="absolute bottom-0 left-0 right-0 p-4 pb-4">
                  <View className="flex-row items-end justify-between">
                    <View>
                      <Text className="text-lg font-bold text-white">Brechós próximos</Text>
                      <Text className="text-sm text-white/90 mb-3">Encontre brechós perto de você</Text>
                    </View>
                    <Pressable className="bg-[#B55D05] px-4 py-2 rounded-full shadow-lg mb-3">
                      <Text className="text-sm font-bold text-white">Ver lista</Text>
                    </Pressable>
                  </View>
                </View>
            </View>
            </View>

            {/* Filter chips with icon on first */}
            <View className="pt-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                className="overflow-visible"
              >
                <View className="flex-row gap-2">
                  {["Próximo a mim", "Vila Madalena", "Pinheiros", "Centro", "Augusta"].map((label) => {
                    const active = label === activeFilter;
                    return (
                      <Pressable
                        key={label}
                        className={`flex-row items-center gap-1.5 py-2 px-3 rounded-full ${
                          active ? "bg-[#B55D05]" : "bg-gray-200"
                        }`}
                        onPress={() => setActiveFilter(label)}
                      >
                        {active ? (
                          <Ionicons name="navigate" size={16} color="white" />
                        ) : (
                          <></>
                        )}
                        <Text
                          className={`text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View className="space-y-3 mt-4">
              {nearby.slice(0, 2).map((store) => (
                <NearbyThriftListItem
                  key={store.id}
                  store={store}
                  onPress={() => navigation.navigate("thriftDetail", { id: store.id })}
                />
              ))}
            </View>
            <View className="mt-4 items-center">
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
