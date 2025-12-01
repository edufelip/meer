import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, LayoutAnimation, Platform, StatusBar, Text, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import type { Category } from "../../../domain/entities/Category";
import { CategoryCard, getCategoryDisplayName } from "../../components/CategoryCard";

export function CategoriesScreen() {
  const { getCategoriesUseCase, getCachedCategoriesUseCase } = useDependencies();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Enable layout animation on Android
  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const areDifferent = (a: Category[] = [], b: Category[] = []) => {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      const ca = a[i];
      const cb = b[i];
      if (!cb || ca.id !== cb.id || ca.nameStringId !== cb.nameStringId || ca.imageResId !== cb.imageResId) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      // 1) load cached first for instant UI
      const cached = await getCachedCategoriesUseCase.execute();
      if (isMounted && cached) {
        setCategories(cached);
        setLoading(false);
      }
      // 2) fetch remote in background
      try {
        const remote = await getCategoriesUseCase.execute();
        if (isMounted && areDifferent(remote, cached ?? [])) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setCategories(remote);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getCachedCategoriesUseCase, getCategoriesUseCase]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-center text-lg font-bold text-[#1F2937]">Categorias</Text>
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
                  title: getCategoryDisplayName(item.nameStringId)
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
