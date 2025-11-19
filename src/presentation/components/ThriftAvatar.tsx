import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { ThriftStore } from "../../domain/entities/ThriftStore";

interface ThriftAvatarProps {
  store: ThriftStore;
  onPress?: (store: ThriftStore) => void;
}

export function ThriftAvatar({ store, onPress }: ThriftAvatarProps) {
  const isHighlighted = !!store.badgeLabel;
  return (
    <Pressable className="flex flex-col items-center space-y-2 w-20" onPress={() => onPress?.(store)}>
      <View className="relative">
        <Image
          source={{ uri: store.imageUrl }}
          className={`w-16 h-16 rounded-full border-2 ${isHighlighted ? "border-pink-500" : "border-gray-300"}`}
        />
      </View>
      <Text className="text-xs font-medium text-[#374151] text-center truncate w-full">{store.name}</Text>
    </Pressable>
  );
}
