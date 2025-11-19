import React from "react";
import { ImageBackground, Text, View } from "react-native";
import type { ThriftStore } from "../../domain/entities/ThriftStore";

interface FeaturedThriftCardProps {
  store: ThriftStore;
}

export function FeaturedThriftCard({ store }: FeaturedThriftCardProps) {
  return (
    <View className="w-64 mr-4">
      <View className="relative aspect-square overflow-hidden rounded-xl bg-gray-200">
        <ImageBackground
          source={{ uri: store.imageUrl }}
          className="flex-1"
          resizeMode="cover"
          imageStyle={{ borderRadius: 16 }}
        />
        {store.badgeLabel ? (
          <View className="absolute top-2 right-2 rounded-full bg-white px-2 py-1 shadow-sm">
            <Text className="text-[11px] font-bold text-[#EC4899] uppercase">{store.badgeLabel}</Text>
          </View>
        ) : null}
      </View>
      <View className="mt-3">
        <Text className="font-bold text-[#374151]">{store.name}</Text>
        <Text className="text-sm text-[#6B7280]" numberOfLines={2}>
          {store.description}
        </Text>
      </View>
    </View>
  );
}
