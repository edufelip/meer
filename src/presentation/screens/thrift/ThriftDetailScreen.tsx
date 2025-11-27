import React, { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Linking
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { ThriftStore, ThriftStoreId } from "../../../domain/entities/ThriftStore";
import { theme } from "../../../shared/theme";
import ImageViewing from "react-native-image-viewing";

interface ThriftDetailScreenProps {
  route?: { params?: { id?: ThriftStoreId } };
}

export function ThriftDetailScreen({ route }: ThriftDetailScreenProps) {
  const insets = useSafeAreaInsets();
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
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openMaps = () => {
    if (!store?.latitude || !store?.longitude) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
    Linking.openURL(url);
  };

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

  const heroImage = store.coverImageUrl ?? store.imageUrl;
  const baseGallery = (store.galleryUrls?.filter(Boolean) ?? []) as string[];
  const resolvedGallery = baseGallery.length > 0 ? baseGallery : heroImage ? [heroImage] : [];
  const galleryImages = resolvedGallery.map((uri) => ({ uri }));

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="light-content" translucent />
      <View className="relative flex-1 bg-[#F3F4F6]">
        <ImageBackground
          source={{ uri: heroImage }}
          className="h-64"
          resizeMode="cover"
          imageStyle={{ opacity: 0.95 }}
        >
          <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <View
            className="absolute left-4 right-4 flex-row justify-between"
            style={{ top: insets.top + 8 }}
          >
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
            <Text className="text-sm text-white/90" style={{ marginTop: 4, marginBottom: 16 }}>
              {store.description}
            </Text>
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

            <Pressable
              className="h-40 rounded-lg bg-gray-200 overflow-hidden mt-4 mb-4"
              onPress={openMaps}
            >
              {store.latitude && store.longitude ? (
                <Image
                  source={{
                    uri: `https://maps.googleapis.com/maps/api/staticmap?center=${store.latitude},${store.longitude}&zoom=15&size=640x320&maptype=roadmap&markers=color:red%7C${store.latitude},${store.longitude}&scale=2&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY}`
                  }}
                  className="w-full h-full"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-[#6B7280]">Localização indisponível</Text>
                </View>
              )}
            </Pressable>

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

            <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: "#E5E7EB", paddingTop: 16 }}>
              <Text className="font-bold text-[#374151] mb-2">Galeria de Fotos</Text>
              <View className="flex-row flex-wrap gap-2">
                {resolvedGallery.slice(0, 6).map((url, index) => (
                  <Pressable
                    key={`${url}-${index}`}
                    onPress={() => {
                      setViewerIndex(index);
                      setViewerVisible(true);
                    }}
                    style={{ width: "30%" }}
                  >
                    <Image
                      source={{ uri: url }}
                      className="h-24 rounded-lg"
                      style={{ width: "100%" }}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {(() => {
              const igRaw = (store.social?.instagram ?? store.socialHandle ?? "").trim();
              const igHandle = igRaw.replace(/^@/, "");
              const hasInstagram = igHandle.length > 0;
              const hasAnySocial = hasInstagram || Boolean(store.social?.facebook || store.social?.whatsapp || store.social?.website);
              if (!hasAnySocial) return null;

              return (
                <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: "#E5E7EB", paddingTop: 16 }}>
                  <Text className="font-bold text-[#374151] mb-2">Redes Sociais</Text>
                  {hasInstagram ? (
                    <Pressable
                      className="flex-row items-center gap-2"
                      onPress={() => {
                        const appUrl = `instagram://user?username=${igHandle}`;
                        const webUrl = `https://www.instagram.com/${igHandle}`;
                        Linking.canOpenURL(appUrl)
                          .then((canOpen) => (canOpen ? Linking.openURL(appUrl) : Linking.openURL(webUrl)))
                          .catch(() => Linking.openURL(webUrl));
                      }}
                      accessibilityRole="link"
                      accessibilityLabel="Abrir Instagram"
                    >
                      <Ionicons name="logo-instagram" size={18} color={theme.colors.highlight} />
                      <Text className="text-sm text-gray-500 underline">@{igHandle}</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })()}

            <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: "#E5E7EB", paddingTop: 16 }}>
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

        {galleryImages.length > 0 ? (
          <ImageViewing
            images={galleryImages}
            imageIndex={viewerIndex}
            visible={viewerVisible}
            onRequestClose={() => setViewerVisible(false)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
