import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StatusBar, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../../shared/theme";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { NearbyThriftListItem } from "../../components/NearbyThriftListItem";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const suggestionChips = ["Vestidos", "Roupas de festa", "Acessórios", "Vintage"];

const SEARCH_HISTORY_KEY = "search.history";

export function SearchScreen() {
  const navigation = useNavigation();
  const { searchThriftStoresUseCase } = useDependencies();
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [results, setResults] = useState([] as Awaited<ReturnType<typeof searchThriftStoresUseCase.execute>>);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (!active) return;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as string[];
          if (Array.isArray(parsed)) setRecents(parsed.slice(0, 5));
        } catch {
          // ignore parse errors
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected;
      setOffline(!connected);
    });
    return () => unsub();
  }, []);

  const persistRecents = async (items: string[]) => {
    setRecents(items);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items.slice(0, 5)));
  };

  const runSearch = async (text: string) => {
    const term = text.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const list = await searchThriftStoresUseCase.execute(term);
      setResults(list);
      if (!recents.includes(term)) {
        const next = [term, ...recents].slice(0, 5);
        await persistRecents(next);
      }
    } catch {
      setResults([]);
      setError("Não foi possível buscar agora. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const filteredRecents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recents;
    return recents.filter((item) => item.toLowerCase().includes(q));
  }, [query, recents]);

  const clearHistory = useCallback(async () => {
    setRecents([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

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
        {offline && (
          <View className="mt-3 bg-[#FDE68A] rounded-lg px-3 py-2">
            <Text className="text-xs font-semibold text-[#92400E]">
              Sem conexão. As buscas podem falhar até a conexão voltar.
            </Text>
          </View>
        )}
      </View>

      <FlatList
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            {!hasSearched && (
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
            )}

            {recents.length > 0 && (
              <View className="py-4 px-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-lg font-bold text-[#374151]">Pesquisas Recentes</Text>
                  <Pressable
                    onPress={async () => {
                      await clearHistory();
                      setResults([]);
                      setQuery("");
                    }}
                  >
                    <Text className="text-sm font-semibold text-[#B55D05]">Limpar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        }
        data={filteredRecents}
        keyExtractor={(item, idx) => `${item}-${idx}`}
        renderItem={({ item }) => (
          <View className="px-4">
            <Pressable
              className="flex-row items-center justify-between p-2 rounded-lg"
              onPress={() => runSearch(item)}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text className="text-[#374151]">{item}</Text>
              </View>
              <Pressable
                onPress={async (e) => {
                  e.stopPropagation();
                  const next = recents.filter((r) => r !== item);
                  await persistRecents(next);
                }}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </Pressable>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={null}
        ListFooterComponent={
          <View className="px-4 pt-6 gap-3">
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 items-center justify-center">
                <Text className="text-red-700 text-sm text-center">{error}</Text>
              </View>
            ) : null}
            {loading ? (
              <View className="gap-3">
                {[0, 1, 2].map((idx) => (
                  <View key={idx} className="flex-row items-center bg-white rounded-xl shadow-sm p-3" style={{ opacity: 0.7 }}>
                    <View className="w-16 h-16 bg-gray-200 rounded-lg mr-3" />
                    <View className="flex-1 gap-2">
                      <View className="h-4 bg-gray-200 rounded-full w-3/4" />
                      <View className="h-3 bg-gray-200 rounded-full w-1/2" />
                    </View>
                  </View>
                ))}
              </View>
            ) : results.length > 0 ? (
              results.map((store) => (
                <NearbyThriftListItem
                  key={store.id}
                  store={store}
                  onPress={() => navigation.navigate("thriftDetail" as never, { id: store.id } as never)}
                  style={{ marginBottom: 8 }}
                />
              ))
            ) : hasSearched && !error ? (
              <Text className="text-[#6B7280]">Nenhum resultado para "{query}".</Text>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}
