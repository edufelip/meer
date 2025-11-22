import React from "react";
import { Image, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import type { ThriftStore } from "../../domain/entities/ThriftStore";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../shared/theme";

interface NearbyThriftListItemProps {
  store: ThriftStore;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function NearbyThriftListItem({ store, onPress, style }: NearbyThriftListItemProps) {
  const distanceLabel =
    store.distanceKm !== undefined && store.walkTimeMinutes
      ? `${store.distanceKm.toFixed(1)} km · ${store.walkTimeMinutes} min`
      : store.distanceKm !== undefined
      ? `${store.distanceKm.toFixed(1)} km`
      : undefined;

  return (
    <Pressable
      className="bg-white rounded-xl shadow-sm p-3 flex-row items-center"
      onPress={onPress}
      accessibilityRole="button"
      style={style}
    >
      <Image source={{ uri: store.imageUrl }} className="w-16 h-16 rounded-lg mr-2" />
      <View className="flex-1 ml-2">
        <Text className="font-bold text-[#374151]">{store.name}</Text>
        <Text className="text-sm text-[#6B7280]" numberOfLines={1}>
          {store.addressLine ?? store.description}
        </Text>
        {distanceLabel ? (
          <View className="flex-row items-center mt-1">
            <Ionicons name="walk" size={14} color={theme.colors.highlight} style={{ marginRight: 4 }} />
            <Text className="text-sm text-[#6B7280]">{distanceLabel}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.highlight} />
    </Pressable>
  );
}
