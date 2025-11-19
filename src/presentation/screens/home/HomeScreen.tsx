import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, View } from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { SectionTitle } from "../../components/SectionTitle";
import { FeaturedThriftCarousel } from "../../components/FeaturedThriftCarousel";
import { NearbyHeroCard } from "../../components/NearbyHeroCard";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";

export function HomeScreen() {
  const { getFeaturedThriftStoresUseCase, getNearbyThriftStoresUseCase } = useDependencies();
  const [featured, setFeatured] = useState<ThriftStore[]>([]);
  const [nearby, setNearby] = useState<ThriftStore[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [featuredStores, nearbyStores] = await Promise.all([
        getFeaturedThriftStoresUseCase.execute(),
        getNearbyThriftStoresUseCase.execute()
      ]);
      if (isMounted) {
        setFeatured(featuredStores);
        setNearby(nearbyStores);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getFeaturedThriftStoresUseCase, getNearbyThriftStoresUseCase]);

  const heroStore = nearby[0] ?? featured[0];

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
          <FeaturedThriftCarousel stores={featured} />
        </View>

        <View className="px-4 py-6">
          <SectionTitle title="Descubra brechós perto de você" className="px-0" />
          {heroStore ? (
            <NearbyHeroCard store={heroStore} onPressList={() => {}} />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
