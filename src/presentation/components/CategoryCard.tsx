import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { Category } from "../../domain/entities/Category";
import { theme } from "../../shared/theme";

const categoryImages: Record<string, any> = {
  "brecho-categories-house": require("../../../assets/images/brecho-categories-house.jpg"),
  "categories-masculino": require("../../../assets/images/categories-masculino.jpg"),
  "categories-feminino": require("../../../assets/images/categories-feminino.jpg"),
  "categories-infantil": require("../../../assets/images/categories-infantil.jpg"),
  "categories-luxo": require("../../../assets/images/categories-luxo.jpg"),
  "categories-designer": require("../../../assets/images/categories-designer.jpg"),
  "categories-desapego": require("../../../assets/images/categories-desapego.jpg"),
  "categories-geral": require("../../../assets/images/categories-geral.jpg")
};

interface CategoryCardProps {
  category: Category;
  onPress?: (category: Category) => void;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const imageSource = categoryImages[category.imageResId];

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
        {imageSource ? (
          <Image source={imageSource} className="h-10 w-10" resizeMode="cover" />
        ) : (
          <View className="h-10 w-10 rounded bg-white" />
        )}
      </View>
      <Text className="text-center font-bold text-[#1F2937]">{category.nameStringId}</Text>
    </Pressable>
  );
}
