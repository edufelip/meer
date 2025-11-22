import React from "react";
import { ImageBackground, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NearbyMapCardProps {
  imageUrl: string;
  onLocate?: () => void;
}

export function NearbyMapCard({ imageUrl, onLocate }: NearbyMapCardProps) {
  return (
    <View className="relative rounded-xl overflow-hidden mb-4">
      <ImageBackground source={{ uri: imageUrl }} className="h-48 w-full" resizeMode="cover" />
      <View className="absolute inset-0 bg-black/20" />
      <Pressable
        className="absolute top-2 right-2 bg-white/85 px-3 py-2 rounded-full shadow-md mt-2 mr-2"
        onPress={onLocate}
        accessibilityRole="button"
        accessibilityLabel="Localizar"
      >
        <Ionicons name="locate" color="#374151" size={18} />
      </Pressable>
    </View>
  );
}
