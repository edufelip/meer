import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, View, Text } from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { SectionTitle } from "../../components/SectionTitle";
import { FeaturedThriftCarousel } from "../../components/FeaturedThriftCarousel";
import { NearbyMapCard } from "../../components/NearbyMapCard";
import { FilterChips } from "../../components/FilterChips";
import { NearbyThriftListItem } from "../../components/NearbyThriftListItem";
import { GuideContentCard } from "../../components/GuideContentCard";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import type { GuideContent } from "../../../domain/entities/GuideContent";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getFeaturedThriftStoresUseCase, getNearbyThriftStoresUseCase, getGuideContentUseCase } =
    useDependencies();
  const [featured, setFeatured] = useState<ThriftStore[]>([]);
  const [nearby, setNearby] = useState<ThriftStore[]>([]);
  const [guides, setGuides] = useState<GuideContent[]>([]);
  const [activeFilter, setActiveFilter] = useState("Próximos a mim");

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
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getFeaturedThriftStoresUseCase, getNearbyThriftStoresUseCase, getGuideContentUseCase]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <AppHeader title="Guia Brechó" />
      <ScrollView
        className="flex-1 bg-[#F3F4F6]"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="bg-white py-6">
          <SectionTitle title="Brechós em destaque" />
          <FeaturedThriftCarousel
            stores={featured}
            onPressItem={(store) => navigation.navigate("thriftDetail", { id: store.id })}
          />
        </View>

        <View className="px-4 py-6">
          <SectionTitle title="Descubra brechós perto de você" className="px-0" />
          <NearbyMapCard
            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBSugh5Wg37gnoj6GkKkSiS8awJbFlS80QERNJycKgn68NF7oXxiwdsiEEo58M8fByFbIwXzreAIouFbxQR4E7vXlnFdvYSzoshsmN1iHWV2ji6iYl2awjYiBJnN3e-UpF_app3jtWsq7lVod9vG57HH_d6pjIzdWFNwQ6aTTUZnOxvNUEpuYq3ny9OSzx1Hz6W0f3DuJ2uxyhVgq1lhVQnHEMmXcEmyIN-WBUTV5K9e8lMJ8HpqH6_TbZC7CNVMuy3snEnVSGvP7g"
            onLocate={() => {}}
          />
          <FilterChips
            options={["Próximos a mim", "Zona Sul", "Zona Norte", "Centro"]}
            active={activeFilter}
            onChange={setActiveFilter}
          />
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
            <View className="bg-[#B55D05] rounded-full px-6 py-3 shadow-lg">
              <Text className="text-sm font-bold text-white">Ver todos os brechós</Text>
            </View>
          </View>
        </View>

        <View className="px-4 py-6 bg-[#F3F4F6]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-[#374151]">Conteúdos e Dicas</Text>
            <Text className="text-sm font-semibold text-[#B55D05]">Ver todos</Text>
          </View>
          {guides[0] ? <GuideContentCard content={guides[0]} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
