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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const list = await getGuideContentUseCase.execute();
      if (!active) return;
      setArticles(list.filter((a) => a.storeId === route.params.storeId));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [getGuideContentUseCase, route.params.storeId]);

  const listData = useMemo(() => articles, [articles]);

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

      <View className="p-4 space-y-4 flex-1">
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              className="flex-row items-center bg-white rounded-lg shadow-sm overflow-hidden"
              style={{ marginBottom: 12 }}
              onPress={() => navigation.navigate("editContent" as never, { articleId: item.id, storeId: route.params.storeId } as never)}
            >
              <View style={{ width: 96, height: 96 }}>
                <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
              </View>
              <View className="flex-1 p-3">
                <Text className="font-bold text-base text-[#1F2937]" numberOfLines={2}>
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{item.categoryLabel}</Text>
              </View>
              <View className="px-2">
                <Ionicons name="pencil" size={18} color="#9CA3AF" />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            loading ? (
              <View className="gap-3" style={{ marginTop: 8 }}>
                {[0, 1, 2].map((idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center bg-white rounded-lg shadow-sm overflow-hidden"
                    style={{ height: 100, padding: 12, opacity: 0.7 }}
                  >
                    <View className="w-24 h-24 bg-gray-200 rounded-lg mr-3" />
                    <View className="flex-1 gap-2">
                      <View className="h-4 bg-gray-200 rounded-full w-3/4" />
                      <View className="h-3 bg-gray-200 rounded-full w-1/2" />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-12">
                <Text className="text-[#6B7280] text-center">
                  Nenhum conteúdo do seu brechó ainda.
                  {"\n"}Toque em Criar Conteúdo para publicar o primeiro.
                </Text>
              </View>
            )
          }
          ListHeaderComponent={
            <Pressable
              className="w-full bg-[#B55D05] rounded-lg py-3 px-4 items-center shadow mb-3"
              onPress={() => navigation.navigate("editContent" as never, { storeId: route.params.storeId } as never)}
            >
              <Text className="text-white font-bold">Criar Conteúdo</Text>
            </Pressable>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
