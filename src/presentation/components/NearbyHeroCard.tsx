import React from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";
import type { ThriftStore } from "../../domain/entities/ThriftStore";

interface NearbyHeroCardProps {
  store: ThriftStore;
  onPressList?: () => void;
}

export function NearbyHeroCard({ store, onPressList }: NearbyHeroCardProps) {
  return (
    <View className="rounded-xl overflow-hidden">
      <ImageBackground
        source={{ uri: store.imageUrl }}
        resizeMode="cover"
        className="aspect-video"
        imageStyle={{ borderRadius: 16 }}
      >
        <View className="flex-1 rounded-xl bg-black/60 p-4 justify-end">
          <View className="flex-row justify-between items-end">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-bold text-white">{store.name}</Text>
              <Text className="text-sm text-white/90" numberOfLines={2}>
                {store.description}
              </Text>
            </View>
            <Pressable className="bg-[#B55D05] px-4 py-2 rounded-full shadow-lg" onPress={onPressList}>
              <Text className="text-sm font-bold text-white">Ver lista</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
