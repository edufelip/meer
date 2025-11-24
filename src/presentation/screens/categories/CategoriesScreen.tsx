import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import type { Category } from "../../../domain/entities/Category";
import { CategoryCard } from "../../components/CategoryCard";
import { theme } from "../../../shared/theme";

export function CategoriesScreen() {
  const { getCategoriesUseCase } = useDependencies();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const data = await getCategoriesUseCase.execute();
      if (isMounted) {
        setCategories(data);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getCategoriesUseCase]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white">
        <View className="flex-row items-center p-4">
          <Pressable className="h-10 w-10 items-center justify-center" onPress={() => {}}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="flex-1 text-center text-xl font-bold text-black pr-10">Categorias</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center bg-[#F3F4F6]">
          <ActivityIndicator size="large" color={theme.colors.highlight} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              onPress={() =>
                navigation.navigate("categoryStores", {
                  categoryId: item.id,
                  title: item.nameStringId
                })
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          className="bg-[#F3F4F6]"
        />
      )}
    </SafeAreaView>
  );
}
