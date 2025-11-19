import React from "react";
import { Text, View } from "react-native";

interface SectionTitleProps {
  title: string;
  className?: string;
}

export function SectionTitle({ title, className = "" }: SectionTitleProps) {
  return (
    <View className={`px-4 mb-4 ${className}`}>
      <Text className="text-xl font-bold text-[#374151]">{title}</Text>
    </View>
  );
}
