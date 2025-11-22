import React, { useMemo } from "react";
import { FlatList, Image, Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { theme } from "../../../shared/theme";

export function MyContentsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "myContents">>();
  const { getGuideContentUseCase } = useDependencies();

  const [articles, setArticles] = React.useState(() => [] as Awaited<ReturnType<typeof getGuideContentUseCase.execute>>);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const list = await getGuideContentUseCase.execute();
      if (!active) return;
      setArticles(list.filter((a) => a.storeId === route.params.storeId));
    })();
    return () => {
      active = false;
    };
  }, [getGuideContentUseCase, route.params.storeId]);

  const gridData = useMemo(() => articles, [articles]);

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white/90 border-b border-gray-200">
        <View className="flex-row items-center justify-between p-4">
          <Pressable className="w-8 h-8 items-center justify-center" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="text-xl font-bold text-[#374151]">Meus Conteúdos</Text>
          <View className="w-8 h-8" />
        </View>
      </View>

      <View className="p-4 space-y-6 flex-1">
        <Pressable className="w-full bg-[#B55D05] rounded-full shadow-lg py-3 px-4 flex-row items-center justify-center gap-2">
          <Ionicons name="add-circle" size={20} color="white" />
          <Text className="text-white font-bold text-base">Criar Novo Conteúdo</Text>
        </Pressable>

        <FlatList
          data={gridData}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 12 }}
          renderItem={({ item }) => (
            <Pressable className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ width: "48%" }}>
              <View style={{ aspectRatio: 1 }}>
                <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
              </View>
              <View className="p-3">
                <Text className="font-bold text-sm text-gray-800" numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-[#6B7280]">Nenhum conteúdo ainda.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
