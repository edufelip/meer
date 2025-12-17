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

  const imageUri = store.coverImageUrl || store.imageUrl || store.galleryUrls?.[0];
  const initials = store.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const badgeLabel = store.badgeLabel ?? undefined;

  return (
    <Pressable
      className="bg-white rounded-xl shadow-sm p-3 flex-row items-center relative"
      onPress={onPress}
      accessibilityRole="button"
      style={style}
    >
      {badgeLabel ? (
        <View className="absolute bottom-2 right-2 bg-[#EC4899] px-2 py-1 rounded-full">
          <Text className="text-[10px] font-extrabold text-white tracking-tight uppercase">{badgeLabel}</Text>
        </View>
      ) : null}
      {imageUri ? (
        <Image source={{ uri: imageUri }} className="w-16 h-16 rounded-lg mr-2" />
      ) : (
        <View
          className="w-16 h-16 rounded-lg mr-2 items-center justify-center"
          style={{ backgroundColor: `${theme.colors.highlight}22` }}
        >
          <Text className="font-bold text-[#374151]">{initials}</Text>
        </View>
      )}
      <View className="flex-1">
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
