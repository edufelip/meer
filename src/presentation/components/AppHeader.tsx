import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../shared/theme";

interface AppHeaderProps {
  title: string;
  onPressSearch?: () => void;
}

export function AppHeader({ title, onPressSearch }: AppHeaderProps) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
      <View className="w-8" />
      <Text className="flex-1 text-center text-lg font-bold text-[#374151]">{title}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPressSearch}
        className="w-8 h-8 items-center justify-center"
      >
        <Ionicons name="search" size={22} color={theme.colors.highlight} />
      </Pressable>
    </View>
  );
}
