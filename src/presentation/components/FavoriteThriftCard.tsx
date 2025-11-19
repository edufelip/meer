import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { ThriftStore } from "../../domain/entities/ThriftStore";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../shared/theme";

interface FavoriteThriftCardProps {
  store: ThriftStore;
  onPress?: (store: ThriftStore) => void;
}

export function FavoriteThriftCard({ store, onPress }: FavoriteThriftCardProps) {
  return (
    <Pressable className="bg-white rounded-xl shadow-sm overflow-hidden" onPress={() => onPress?.(store)}>
      <Image source={{ uri: store.imageUrl }} className="w-full h-40" />
      <View className="p-4 space-y-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-[#1F2937]" numberOfLines={1}>
            {store.name}
          </Text>
          <Ionicons name="heart" size={18} color={theme.colors.highlight} />
        </View>
        <Text className="text-sm text-[#6B7280]" numberOfLines={2}>
          {store.description}
        </Text>
        <View className="flex-row items-center space-x-2">
          <Ionicons name="location" size={14} color={theme.colors.highlight} />
          <Text className="text-sm text-[#6B7280]" numberOfLines={1}>
            {store.addressLine ?? store.neighborhood ?? "Endereço disponível em breve"}
          </Text>
        </View>
        {store.distanceKm !== undefined && store.walkTimeMinutes !== undefined ? (
          <View className="flex-row items-center space-x-2">
            <Ionicons name="walk" size={14} color={theme.colors.highlight} />
            <Text className="text-sm text-[#6B7280]">
              {store.distanceKm.toFixed(1)} km · {store.walkTimeMinutes} min
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
