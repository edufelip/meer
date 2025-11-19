import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { Category } from "../../domain/entities/Category";
import { theme } from "../../shared/theme";

interface CategoryCardProps {
  category: Category;
  onPress?: (category: Category) => void;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <Pressable
      className="flex-1 items-center gap-3 rounded-lg border p-4"
      style={{ borderColor: `${theme.colors.highlight}33` }}
      onPress={() => onPress?.(category)}
    >
      <View
        className="h-16 w-16 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${theme.colors.highlight}1a` }}
      >
        <Image source={{ uri: category.imageUrl }} className="h-10 w-10" />
      </View>
      <Text className="text-center font-bold text-[#1F2937]">{category.name}</Text>
    </Pressable>
  );
}
