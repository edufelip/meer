import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StatusBar, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../../shared/theme";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { NearbyThriftListItem } from "../../components/NearbyThriftListItem";

const suggestionChips = ["Vestidos", "Roupas de festa", "Acessórios", "Vintage"];

const initialRecents = [
  "Brechó na Vila Madalena",
  "Jaquetas de couro",
  "Sapatos femininos"
];

export function SearchScreen() {
  const navigation = useNavigation();
  const { searchThriftStoresUseCase } = useDependencies();
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState(initialRecents);
  const [results, setResults] = useState([] as Awaited<ReturnType<typeof searchThriftStoresUseCase.execute>>);
  const [loading, setLoading] = useState(false);

  const runSearch = async (text: string) => {
    const term = text.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setLoading(true);
    const list = await searchThriftStoresUseCase.execute(term);
    setResults(list);
    setLoading(false);
    if (!recents.includes(term)) {
      setRecents((prev) => [term, ...prev].slice(0, 10));
    }
  };

  const filteredRecents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recents;
    return recents.filter((item) => item.toLowerCase().includes(q));
  }, [query, recents]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm p-4 border-b border-gray-200">
        <View className="flex-row items-center gap-2">
          <Pressable
            className="w-8 h-8 items-center justify-center"
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={22} color="#6B7280" />
          </Pressable>
          <View className="relative flex-1">
            <View className="absolute inset-y-0 left-0 pl-3 flex-row items-center pointer-events-none">
              <Ionicons name="search" size={18} color="#6B7280" />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por brechó, item..."
              className="w-full bg-gray-100 border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-[#374151]"
              placeholderTextColor="#9CA3AF"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => runSearch(query)}
            />
          </View>
        </View>
      </View>

      <FlatList
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            <View className="px-4 pb-3">
              <View className="flex-row items-center gap-2 overflow-x-auto pb-2 -mb-2">
                {["Categoria", "Distância", "Tipo de Produto"].map((label) => (
                  <Pressable
                    key={label}
                    className="flex-row items-center gap-2 rounded-full bg-[#B55D05] px-4 py-2"
                    onPress={() => {
                      setQuery(label);
                      runSearch(label);
                    }}
                  >
                    <Text className="text-sm font-medium text-white">{label}</Text>
                    <Ionicons name="chevron-down" size={14} color="white" />
                  </Pressable>
                ))}
              </View>
            </View>
            <View className="py-4 px-4">
              <Text className="text-lg font-bold mb-3 text-[#374151]">Sugestões de busca</Text>
              <View className="flex-row flex-wrap gap-2">
                {suggestionChips.map((label) => (
                  <Pressable
                    key={label}
                    className="py-2 px-4 rounded-full bg-gray-200"
                    onPress={() => {
                      setQuery(label);
                      runSearch(label);
                    }}
                  >
                    <Text className="text-sm font-semibold text-gray-700">{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="py-4 px-4">
              <Text className="text-lg font-bold mb-4 text-[#374151]">Filtrar por</Text>
              <View className="flex-row flex-wrap gap-4">
                {[ 
                  { icon: "pricetag-outline", label: "Categorias" },
                  { icon: "storefront-outline", label: "Nome do Brechó" },
                  { icon: "location-outline", label: "Localização" },
                  { icon: "time-outline", label: "Aberto Agora" }
                ].map((item) => (
                  <Pressable
                    key={item.label}
                    className="flex-1 min-w-[44%] items-center justify-center p-4 bg-white rounded-xl shadow-sm"
                  >
                    <Ionicons name={item.icon as any} size={28} color={theme.colors.highlight} />
                    <Text className="font-semibold text-sm text-[#374151] mt-2 text-center">
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="py-4 px-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-[#374151]">Pesquisas Recentes</Text>
                <Pressable onPress={() => setRecents([])}>
                  <Text className="text-sm font-semibold text-[#B55D05]">Limpar</Text>
                </Pressable>
              </View>
            </View>
          </>
        }
        data={filteredRecents}
        keyExtractor={(item, idx) => `${item}-${idx}`}
        renderItem={({ item }) => (
          <View className="px-4">
            <View className="flex-row items-center justify-between p-2 rounded-lg">
              <View className="flex-row items-center gap-3">
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text className="text-[#374151]">{item}</Text>
              </View>
              <Pressable onPress={() => setRecents((prev) => prev.filter((r) => r !== item))}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="px-4">
            <Text className="text-[#6B7280]">Nenhuma busca recente.</Text>
          </View>
        }
        ListFooterComponent={
          <View className="px-4 pt-6 gap-3">
            {loading ? (
              <ActivityIndicator color={theme.colors.highlight} />
            ) : results.length > 0 ? (
              results.map((store) => (
                <NearbyThriftListItem
                  key={store.id}
                  store={store}
                  onPress={() => navigation.navigate("thriftDetail" as never, { id: store.id } as never)}
                  style={{ marginBottom: 8 }}
                />
              ))
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}
