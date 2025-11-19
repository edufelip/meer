import React from "react";
import { ScrollView, View } from "react-native";
import type { ThriftStore } from "../../domain/entities/ThriftStore";
import { FeaturedThriftCard } from "./FeaturedThriftCard";

interface FeaturedThriftCarouselProps {
  stores: ThriftStore[];
}

export function FeaturedThriftCarousel({ stores }: FeaturedThriftCarouselProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
      className="overflow-visible"
    >
      <View className="flex-row">
        {stores.map((store) => (
          <FeaturedThriftCard key={store.id} store={store} />
        ))}
      </View>
    </ScrollView>
  );
}
