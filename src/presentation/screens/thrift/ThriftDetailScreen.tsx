import React, { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  View,
  Pressable,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { ThriftStore, ThriftStoreId } from "../../../domain/entities/ThriftStore";
import { theme } from "../../../shared/theme";

interface ThriftDetailScreenProps {
  route?: { params?: { id?: ThriftStoreId } };
}

export function ThriftDetailScreen({ route }: ThriftDetailScreenProps) {
  const {
    getThriftStoreByIdUseCase,
    getFeaturedThriftStoresUseCase,
    toggleFavoriteThriftStoreUseCase,
    isFavoriteThriftStoreUseCase
  } = useDependencies();
  const navigation = useNavigation();
  const [store, setStore] = useState<ThriftStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const id = route?.params?.id ?? "vintage-vibes";
      const match = await getThriftStoreByIdUseCase.execute(id);
      if (isMounted) {
        if (match) {
          setStore(match);
        } else {
          const fallback = (await getFeaturedThriftStoresUseCase.execute())[0] ?? null;
          setStore(fallback);
        }
        const target = match ?? null;
        if (target) {
          const fav = await isFavoriteThriftStoreUseCase.execute(target.id);
          if (isMounted) setFavorite(fav);
        }
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [getThriftStoreByIdUseCase, getFeaturedThriftStoresUseCase, isFavoriteThriftStoreUseCase, route?.params?.id]);

  if (loading || !store) {
    return (
      <SafeAreaView className="flex-1 bg-[#F3F4F6]">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.highlight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]">
      <StatusBar barStyle="light-content" translucent />
      <View className="relative flex-1 bg-[#F3F4F6]">
        <ImageBackground
          source={{ uri: store.imageUrl }}
          className="h-64"
          resizeMode="cover"
          imageStyle={{ opacity: 0.95 }}
        >
          <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <View className="absolute top-4 left-4 right-4 flex-row justify-between">
            <Pressable
              className="p-2 rounded-full bg-white/80"
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("tabs" as never);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.textDark} />
            </Pressable>
            <Pressable
              className="p-2 rounded-full bg-white/80"
              onPress={async () => {
                if (!store) return;
                const next = await toggleFavoriteThriftStoreUseCase.execute(store);
                setFavorite(next);
              }}
              accessibilityRole="button"
              accessibilityLabel="Favoritar"
            >
              <Ionicons name={favorite ? "heart" : "heart-outline"} size={22} color={theme.colors.accent} />
            </Pressable>
          </View>
          <View className="absolute bottom-4 left-4">
            <Text className="text-2xl font-bold text-white">{store.name}</Text>
            <Text className="text-sm text-white/90">{store.description}</Text>
          </View>
        </ImageBackground>

        <ScrollView
          className="-mt-4 bg-transparent"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white rounded-t-2xl p-4 space-y-4">
            <View className="flex-row items-center gap-4">
              <View className="p-3 rounded-lg" style={{ backgroundColor: `${theme.colors.highlight}1a` }}>
                <Ionicons name="location" size={20} color={theme.colors.highlight} />
              </View>
              <View>
                <Text className="font-bold text-[#374151]">Localização</Text>
                <Text className="text-sm text-gray-500">
                  {store.addressLine ?? "Endereço em atualização"}
                </Text>
              </View>
            </View>

            <View className="h-40 rounded-lg bg-gray-200 overflow-hidden">
              <Image
                source={{
                  uri:
                    store.mapImageUrl ??
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuATD7G9oKF2W1aQjxAqHpYvVPamBIvCIZ6Q7I74RHrH7zwrJHn7iFRGMdMEHWLTMlP9DQ7oquk7Frb_j9QaIiT7ZSYMjZJhvTjFAJU7U-X73PmboiSxOHwS4QZ9mIBO-fJWAbwbdWu5yfwTrXn0c6HHGRpI5fDlZ_HckG3G5-IAsF_Vsh98T6DdyXbPl0bdG-iC9J2bjl6tqGgQIoeItBfJUqcnWgrKl9Y05nEY0VjB15UkZf5t6v0xiO0VVOuXFpoAn1Z7WNfG-dc"
                }}
                className="w-full h-full"
              />
            </View>

            <View className="flex-row items-center gap-4">
              <View className="p-3 rounded-lg" style={{ backgroundColor: `${theme.colors.highlight}1a` }}>
                <Ionicons name="time" size={20} color={theme.colors.highlight} />
              </View>
              <View>
                <Text className="font-bold text-[#374151]">Horário de Funcionamento</Text>
                <Text className="text-sm text-gray-500">
                  {store.openingHours ?? "Seg a Sáb: 10:00 - 19:00"}
                </Text>
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderColor: "#E5E7EB", paddingTop: 16 }}>
              <Text className="font-bold text-[#374151] mb-2">Galeria de Fotos</Text>
              <View className="flex-row flex-wrap gap-2">
                {(store.galleryUrls ?? []).slice(0, 6).map((url) => (
                  <Image key={url} source={{ uri: url }} className="w-[30%] h-24 rounded-lg" />
                ))}
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderColor: "#E5E7EB", paddingTop: 16 }}>
              <Text className="font-bold text-[#374151] mb-2">Redes Sociais</Text>
              <View className="flex-row items-center gap-2">
                <Ionicons name="logo-instagram" size={18} color={theme.colors.highlight} />
                <Text className="text-sm text-gray-500">{store.socialHandle ?? "@seuBrecho"}</Text>
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderColor: "#E5E7EB", paddingTop: 16 }}>
              <Text className="font-bold text-[#374151] mb-2">Categorias</Text>
              <View className="flex-row flex-wrap gap-2">
                {(store.categories ?? ["Feminino", "Vintage", "Acessórios"]).map((c) => (
                  <View
                    key={c}
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${theme.colors.highlight}22` }}
                  >
                    <Text className="text-xs font-semibold text-[#E6A800]">{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
