import React from "react";
import { ScrollView, View } from "react-native";
import type { ThriftStore } from "../../domain/entities/ThriftStore";
import { ThriftAvatar } from "./ThriftAvatar";

interface FeaturedThriftCarouselProps {
  stores: ThriftStore[];
  onPressItem?: (store: ThriftStore) => void;
}

export function FeaturedThriftCarousel({ stores, onPressItem }: FeaturedThriftCarouselProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
      className="overflow-visible"
    >
      <View className="flex-row space-x-4">
        {stores.map((store) => (
          <ThriftAvatar key={store.id} store={store} onPress={onPressItem} />
        ))}
      </View>
    </ScrollView>
  );
}
