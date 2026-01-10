import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  View,
  Easing,
  Keyboard
} from "react-native";
import Reanimated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { ThriftStore, ThriftStoreId } from "../../../domain/entities/ThriftStore";
import { theme } from "../../../shared/theme";
import ImageViewing from "react-native-image-viewing";
import { buildThriftStoreShareUrl } from "../../../shared/deepLinks";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { useFavoritesStore } from "../../state/favoritesStore";
import { useStoreSummaryStore } from "../../state/storeSummaryStore";
import { useAuthModeStore } from "../../state/authModeStore";
import { useAuthGuard } from "../../hooks/useAuthGuard";

interface ThriftDetailScreenProps {
  route?: { params?: { id?: ThriftStoreId } };
}

const formatPhoneBrazil = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  return `(${area})${rest}`;
};

function RatingStarButton({
  score,
  active,
  onSelect,
  disabled,
  size = 28
}: {
  score: number;
  active: boolean;
  onSelect: (score: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      onPress={() => {
        scale.value = withSequence(withSpring(1.2), withSpring(1));
        onSelect(score);
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Dar nota ${score}`}
      disabled={disabled}
    >
      <Reanimated.View style={animatedStyle} collapsable={false}>
        <Ionicons name={active ? "star" : "star-outline"} size={size} color={active ? "#E6A800" : "#D1D5DB"} />
      </Reanimated.View>
    </Pressable>
  );
}

export function ThriftDetailScreen({ route }: ThriftDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    getThriftStoreByIdUseCase,
    getFeaturedThriftStoresUseCase,
    toggleFavoriteThriftStoreUseCase,
    isFavoriteThriftStoreUseCase,
    getMyFeedbackUseCase,
    upsertFeedbackUseCase,
    deleteMyFeedbackUseCase
  } = useDependencies();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const setFavoriteItem = useFavoritesStore((state) => state.setFavoriteItem);
  const storeSummaries = useStoreSummaryStore((state) => state.summaries);
  const ensureSummary = useStoreSummaryStore((state) => state.ensureSummary);
  const applyRatingChange = useStoreSummaryStore((state) => state.applyRatingChange);
  const applyRatingDeletion = useStoreSummaryStore((state) => state.applyRatingDeletion);
  const authMode = useAuthModeStore((state) => state.mode);
  const isAuthenticated = authMode === "authenticated";
  const authGuard = useAuthGuard();
  const [store, setStore] = useState<ThriftStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [hasExistingFeedback, setHasExistingFeedback] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(12);
  const toastHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const existingFeedbackRef = useRef<{ score: number; body: string } | null>(null);
  const shimmer = useRef(new Animated.Value(0)).current;

  const summary = store?.id ? storeSummaries[store.id] : undefined;
  const summaryRating = summary?.rating ?? store?.rating ?? 0;
  const summaryReviewCount = summary?.reviewCount ?? store?.reviewCount ?? 0;
  const isFavorite = store?.id ? !!favoriteIds[store.id] : false;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, [shimmer]);

  useEffect(() => {
    return () => {
      if (toastHideTimeoutRef.current) {
        clearTimeout(toastHideTimeoutRef.current);
        toastHideTimeoutRef.current = null;
      }
      if (toastClearTimeoutRef.current) {
        clearTimeout(toastClearTimeoutRef.current);
        toastClearTimeoutRef.current = null;
      }
    };
  }, []);

  const toastAnimatedStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }]
  }));

  const showToast = (message: string) => {
    setToastMessage(message);
    toastOpacity.value = withTiming(1, { duration: 180 });
    toastTranslateY.value = withTiming(0, { duration: 180 });

    if (toastHideTimeoutRef.current) {
      clearTimeout(toastHideTimeoutRef.current);
    }
    if (toastClearTimeoutRef.current) {
      clearTimeout(toastClearTimeoutRef.current);
    }
    toastHideTimeoutRef.current = setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 180 });
      toastTranslateY.value = withTiming(12, { duration: 180 });
      toastClearTimeoutRef.current = setTimeout(() => setToastMessage(null), 220);
    }, 2200);
  };

  const shimmerStyle = {
    opacity: shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] })
  };

  const openMaps = () => {
    if (!store?.latitude || !store?.longitude) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
    Linking.openURL(url);
  };

  const handleShare = async () => {
    if (!store) return;
    const url = buildThriftStoreShareUrl(store.id);

    try {
      await Share.share({
        title: store.name,
        message: `${store.name}\n${url}`,
        url
      });
    } catch {
      showToast("Não foi possível compartilhar esse brechó.");
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const id = route?.params?.id ?? "vintage-vibes";
      const match = await getThriftStoreByIdUseCase.execute(id);
      if (isMounted) {
        const fallback = match ? null : (await getFeaturedThriftStoresUseCase.execute())[0] ?? null;
        const resolved = match ?? fallback;

        if (resolved) {
          setStore(resolved);
          ensureSummary(resolved.id, resolved.rating ?? 0, resolved.reviewCount ?? 0);
          if (Object.prototype.hasOwnProperty.call(resolved as any, "myRating")) {
            setUserRating(typeof resolved.myRating === "number" ? resolved.myRating : 0);
          }
        } else {
          setStore(null);
        }

        if (resolved && isAuthenticated) {
          const fav = await isFavoriteThriftStoreUseCase.execute(resolved.id);
          if (isMounted) setFavoriteItem(resolved, fav);

          try {
            const mine = await getMyFeedbackUseCase.execute(resolved.id);
            if (isMounted && mine) {
              const resolvedScore = mine.score ?? 0;
              const resolvedBody = mine.body?.trim() ?? "";
              if (mine.score != null) {
                setUserRating(resolvedScore);
              }
              if (mine.body != null) {
                setUserComment(resolvedBody);
              }
              existingFeedbackRef.current = { score: resolvedScore, body: resolvedBody };
              setHasExistingFeedback(true);
            }
          } catch {
            // ignore feedback load errors
          }
        }
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [
    getThriftStoreByIdUseCase,
    getFeaturedThriftStoresUseCase,
    isFavoriteThriftStoreUseCase,
    getMyFeedbackUseCase,
    ensureSummary,
    setFavoriteItem,
    route?.params?.id,
    isAuthenticated
  ]);

  if (loading || !store) {
    return (
      <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={["left", "right", "bottom"]}>
        <StatusBar barStyle="light-content" translucent />
        <Animated.View className="h-64 bg-[#E5E7EB] mb-4" style={shimmerStyle} />
        <View className="bg-white rounded-t-2xl -mt-4 p-4">
          {[1, 2, 3, 4, 5].map((key) => (
            <Animated.View
              key={key}
              style={[
                {
                  height: key === 1 ? 20 : 14,
                  borderRadius: 8,
                  backgroundColor: "#E5E7EB",
                  width: key === 1 ? "70%" : key % 2 === 0 ? "85%" : "60%",
                  marginBottom: 10
                },
                shimmerStyle
              ]}
            />
          ))}
          {[1, 2, 3].map((key) => (
            <Animated.View
              key={`card-${key}`}
              style={[
                {
                  height: 72,
                  borderRadius: 12,
                  backgroundColor: "#E5E7EB",
                  marginTop: key === 1 ? 6 : 10
                },
                shimmerStyle
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const heroImage =
    store.coverImageUrl ??
    store.images?.find((img) => img.isCover)?.url ??
    store.images?.[0]?.url ??
    store.imageUrl;

  const galleryImages =
    (store.images ?? [])
      .filter((img) => !!img?.url)
      .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((img) => ({ uri: img.url })) || [];

  const resolvedGallery = galleryImages.length > 0 ? galleryImages.map((g) => g.uri) : heroImage ? [heroImage] : [];
  const galleryCount = galleryImages.length;

  const ViewerHeader = ({ imageIndex }: { imageIndex: number }) => {
    const canGoBack = imageIndex > 0;
    const canGoForward = imageIndex < galleryCount - 1;

    return (
      <View pointerEvents="box-none" style={{ position: "absolute", inset: 0 }}>
        <View
          className="flex-row items-center justify-between px-4"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Pressable
            className="h-10 w-10 rounded-full bg-black/60 items-center justify-center"
            onPress={() => setViewerVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar galeria"
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
          {galleryCount > 0 ? (
            <View className="px-3 py-1.5 rounded-full bg-black/60">
              <Text className="text-white text-xs font-semibold">{`${imageIndex + 1}/${galleryCount}`}</Text>
            </View>
          ) : (
            <View />
          )}
          <View className="w-10" />
        </View>

        {galleryCount > 1 ? (
          <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, top: "50%", marginTop: -24 }}>
            <View className="flex-row items-center justify-between px-3">
              <Pressable
                className="h-12 w-12 rounded-full bg-black/60 items-center justify-center"
                onPress={() => setViewerIndex((prev) => Math.max(0, prev - 1))}
                disabled={!canGoBack}
                style={{ opacity: canGoBack ? 1 : 0.35 }}
                accessibilityRole="button"
                accessibilityLabel="Imagem anterior"
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </Pressable>
              <Pressable
                className="h-12 w-12 rounded-full bg-black/60 items-center justify-center"
                onPress={() => setViewerIndex((prev) => Math.min(galleryCount - 1, prev + 1))}
                disabled={!canGoForward}
                style={{ opacity: canGoForward ? 1 : 0.35 }}
                accessibilityRole="button"
                accessibilityLabel="Próxima imagem"
                hitSlop={8}
              >
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderStars = (value: number, size = 18) => {
    const rounded = Math.round(value * 2) / 2; // keep halves if needed
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((idx) => {
          const filled = rounded >= idx;
          const half = !filled && rounded + 0.5 === idx;
          const icon = filled ? "star" : half ? "star-half" : "star-outline";
          return <Ionicons key={idx} name={icon as any} size={size} color="#E6A800" style={{ marginRight: 2 }} />;
        })}
      </View>
    );
  };

  const handleSubmitRating = async () => {
    if (!authGuard("Faça login para enviar sua avaliação.")) return;
    if (!userRating) {
      Alert.alert("Escolha uma nota", "Selecione de 1 a 5 estrelas antes de enviar.");
      return;
    }
    const trimmedComment = userComment.trim();
    if (trimmedComment.length < 20) {
      Alert.alert("Comentário muito curto", "Escreva pelo menos 20 caracteres para enviar.");
      return;
    }
    if (!store?.id) return;

    const existingFeedback = existingFeedbackRef.current;
    if (existingFeedback && existingFeedback.score === userRating && existingFeedback.body === trimmedComment) {
      showToast("Sucesso! Obrigado por avaliar 🧡");
      Keyboard.dismiss();
      setShowCommentBox(false);
      return;
    }

    try {
      setSubmittingFeedback(true);
      await upsertFeedbackUseCase.execute({
        storeId: store.id,
        score: userRating,
        body: trimmedComment
      });
      applyRatingChange({
        storeId: store.id,
        prevScore: existingFeedback?.score ?? null,
        nextScore: userRating,
        baseRating: summaryRating,
        baseReviewCount: summaryReviewCount
      });
      showToast("Sucesso! Obrigado por avaliar 🧡");
      Keyboard.dismiss();
      setShowCommentBox(false);
      existingFeedbackRef.current = { score: userRating, body: trimmedComment };
      setHasExistingFeedback(true);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        Alert.alert("Sessão expirada", "Faça login novamente para enviar sua avaliação.");
      } else if (status === 404) {
        Alert.alert("Brechó não encontrado", "Esse brechó não existe mais.");
      } else {
        Alert.alert("Erro ao enviar", "Não foi possível enviar sua avaliação. Tente novamente.");
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSelectRating = (selected: number) => {
    if (!authGuard("Faça login para avaliar este brechó.")) return;
    setUserRating(selected);
    if (!showCommentBox) {
      const existingFeedback = existingFeedbackRef.current;
      if (existingFeedback?.body && !userComment.trim()) {
        setUserComment(existingFeedback.body);
      }
      setShowCommentBox(true);
    }
  };

  const handleDeleteFeedback = () => {
    if (!authGuard("Faça login para gerenciar sua avaliação.")) return;
    if (!store?.id) return;
    Alert.alert(
      "Excluir avaliação",
      "Tem certeza que deseja apagar sua avaliação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMyFeedbackUseCase.execute(store.id);
              const prevScore = existingFeedbackRef.current?.score ?? userRating;
              applyRatingDeletion({
                storeId: store.id,
                prevScore,
                baseRating: summaryRating,
                baseReviewCount: summaryReviewCount
              });
              existingFeedbackRef.current = null;
              setHasExistingFeedback(false);
              setUserRating(0);
              setUserComment("");
              setShowCommentBox(false);
              showToast("Avaliação removida.");
            } catch {
              Alert.alert("Erro ao excluir", "Não foi possível excluir sua avaliação. Tente novamente.");
            }
          }
        }
      ]
    );
  };

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
                if (!authGuard("Faça login para favoritar este brechó.")) return;
                const next = await toggleFavoriteThriftStoreUseCase.execute(store);
                setFavoriteItem(store, next);
              }}
              accessibilityRole="button"
              accessibilityLabel="Favoritar"
            >
              <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={theme.colors.accent} />
            </Pressable>
          </View>
          <View className="absolute bottom-2 left-4 right-4">
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-white flex-1" numberOfLines={2}>
                {store.name}
              </Text>
              <Pressable
                className="p-2 rounded-full bg-white/20"
                onPress={handleShare}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Compartilhar brechó"
              >
                <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text className="text-sm text-white/90" style={{ marginTop: 4, marginBottom: 6 }}>
              {store.description}
            </Text>
          </View>
        </ImageBackground>

        <ScrollView
          className="-mt-4 bg-transparent"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white rounded-t-2xl p-4">
            <Reanimated.View
              layout={LinearTransition.duration(220)}
              collapsable={false}
              style={{ borderBottomWidth: 1, borderColor: "#E5E7EB", paddingBottom: 12 }}
            >
              <Text className="font-bold text-[#374151] text-lg mb-2">Avaliações</Text>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <Text className="text-3xl font-extrabold text-[#374151]">
                    {summaryRating.toFixed(1)}
                  </Text>
                  {renderStars(summaryRating, 20)}
                </View>
                {summaryReviewCount > 0 ? (
                  <Pressable
                    onPress={() => {
                      navigation.navigate("storeRatings", {
                        storeId: store.id,
                        storeName: store.name,
                        reviewCount: Math.floor(summaryReviewCount)
                      });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Ver avaliações"
                  >
                    <Text className="text-sm text-[#6B7280]">{`${Math.floor(
                      summaryReviewCount
                    )} avaliações`}</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={{ marginTop: 16 }} className="space-y-3">
                <Text className="font-semibold text-md text-[#374151]">Deixe sua avaliação</Text>
                {hasExistingFeedback ? (
                  <View className="items-center">
                    <Text className="text-xs text-[#6B7280]" style={{ marginBottom: 6 }}>
                      Sua avaliação atual
                    </Text>
                    <View className="flex-row justify-center gap-2" style={{ paddingVertical: 8 }}>
                      {[1, 2, 3, 4, 5].map((score) => {
                        const active = userRating >= score;
                        return (
                          <RatingStarButton
                            key={score}
                            score={score}
                            active={active}
                            size={22}
                            disabled={submittingFeedback}
                            onSelect={handleSelectRating}
                          />
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                {!hasExistingFeedback ? (
                  <View className="flex-row justify-center gap-2" style={{ paddingVertical: 16 }}>
                    {[1, 2, 3, 4, 5].map((score) => {
                      const active = userRating >= score;
                      return (
                        <RatingStarButton
                          key={score}
                          score={score}
                          active={active}
                          disabled={submittingFeedback}
                          onSelect={handleSelectRating}
                        />
                      );
                    })}
                  </View>
                ) : null}
                {hasExistingFeedback && !showCommentBox ? (
                  <Pressable
                    onPress={handleDeleteFeedback}
                    accessibilityRole="button"
                    style={{ marginTop: 8 }}
                  >
                    <Text className="text-xs text-[#DC2626] text-center">Apagar minha avaliação</Text>
                  </Pressable>
                ) : null}
                {showCommentBox ? (
                  <Reanimated.View
                    entering={FadeIn.duration(220)}
                    exiting={FadeOut.duration(180)}
                    layout={LinearTransition.duration(220)}
                    collapsable={false}
                  >
                    <TextInput
                      value={userComment}
                      onChangeText={setUserComment}
                      placeholder="Escreva seu comentário aqui..."
                      multiline
                      numberOfLines={12}
                      maxLength={2000}
                      className="w-full border border-gray-200 rounded-lg text-sm px-3 py-3"
                      placeholderTextColor="#9CA3AF"
                      style={{ textAlignVertical: "top", marginBottom: 16 }}
                    />
	                    <Pressable
	                      className="w-full py-3 rounded-lg"
	                      style={{ backgroundColor: "#B55D05", opacity: submittingFeedback ? 0.7 : 1, marginBottom: 8 }}
	                      onPress={handleSubmitRating}
	                      disabled={submittingFeedback}
	                      accessibilityRole="button"
	                      accessibilityLabel="Enviar avaliação"
	                    >
                      {submittingFeedback ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text className="text-white font-bold text-center">Enviar Avaliação</Text>
                      )}
                    </Pressable>
                  </Reanimated.View>
                ) : null}
              </View>
            </Reanimated.View>

            <Reanimated.View
              layout={LinearTransition.duration(220)}
              collapsable={false}
              className="space-y-4"
              style={{ paddingTop: 16 }}
            >
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

              <Pressable className="h-40 rounded-lg bg-gray-200 overflow-hidden mt-4 mb-4" onPress={openMaps}>
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
                      <Image source={{ uri: url }} className="h-24 rounded-lg" style={{ width: "100%" }} />
                    </Pressable>
                  ))}
                </View>
              </View>

              {(() => {
                const igRaw = (store.social?.instagram ?? store.socialHandle ?? "").trim();
                const igHandle = igRaw.replace(/^@/, "");
                const hasInstagram = igHandle.length > 0;
                const websiteRaw = (store.social?.website ?? "").trim();
                const hasWebsite = websiteRaw.length > 0;
                const websiteLabel = websiteRaw.replace(/^https?:\/\//, "");
                const websiteUrl = websiteRaw
                  ? websiteRaw.startsWith("http")
                    ? websiteRaw
                    : `https://${websiteRaw}`
                  : "";
                const hasAnySocial =
                  hasInstagram || hasWebsite || Boolean(store.social?.facebook || store.social?.whatsapp);
                if (!hasAnySocial) return null;

                return (
                  <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: "#E5E7EB", paddingTop: 16 }}>
                    <Text className="font-bold text-[#374151] mb-2">Redes Sociais</Text>
                    <View className="space-y-2">
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
                      {hasWebsite ? (
                        <Pressable
                          className="flex-row items-center gap-2"
                          onPress={() => Linking.openURL(websiteUrl)}
                          accessibilityRole="link"
                          accessibilityLabel="Abrir Website"
                        >
                          <Ionicons name="globe-outline" size={18} color={theme.colors.highlight} />
                          <Text className="text-sm text-gray-500 underline">{websiteLabel}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })()}

              {(() => {
                const rawPhone = (store.phone ?? store.social?.whatsapp ?? "").trim();
                const digits = rawPhone.replace(/\D/g, "");
                const displayPhone = formatPhoneBrazil(rawPhone) || rawPhone;
                const hasPhone = digits.length >= 10;
                const emailRaw = (store.email ?? "").trim();
                const hasEmail = emailRaw.length > 0;
                if (!hasPhone && !hasEmail) return null;
                const whatsappAppUrl = hasPhone ? `whatsapp://send?phone=55${digits}` : "";
                const telUrl = hasPhone ? `tel:${digits}` : "";

                return (
                  <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: "#E5E7EB", paddingTop: 16 }}>
                    <Text className="font-bold text-[#374151] mb-2">Contato</Text>
                    <View className="space-y-2">
                      {hasPhone ? (
                        <Pressable
                          className="flex-row items-center gap-2"
                          onPress={() => {
                            if (!whatsappAppUrl || !telUrl) return;
                            Linking.canOpenURL(whatsappAppUrl)
                              .then((canOpen) => {
                                if (canOpen) {
                                  Linking.openURL(whatsappAppUrl);
                                } else {
                                  Linking.openURL(telUrl);
                                }
                              })
                              .catch(() => Linking.openURL(telUrl));
                          }}
                          accessibilityRole="link"
                          accessibilityLabel="Abrir WhatsApp"
                        >
                          <Ionicons name="logo-whatsapp" size={18} color={theme.colors.highlight} />
                          <Text className="text-sm text-gray-500 underline">{displayPhone}</Text>
                        </Pressable>
                      ) : null}
                      {hasEmail ? (
                        <Pressable
                          className="flex-row items-center gap-2"
                          onPress={() => Linking.openURL(`mailto:${emailRaw}`)}
                          accessibilityRole="link"
                          accessibilityLabel="Enviar e-mail"
                        >
                          <Ionicons name="mail-outline" size={18} color={theme.colors.highlight} />
                          <Text className="text-sm text-gray-500 underline">{emailRaw}</Text>
                        </Pressable>
                      ) : null}
                    </View>
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
            </Reanimated.View>
          </View>
        </ScrollView>

	        {galleryImages.length > 0 ? (
	          <ImageViewing
	            images={galleryImages}
	            imageIndex={viewerIndex}
	            visible={viewerVisible}
	            onRequestClose={() => setViewerVisible(false)}
              onImageIndexChange={setViewerIndex}
              HeaderComponent={ViewerHeader}
	          />
	        ) : null}

	        {toastMessage ? (
	          <Reanimated.View
	            pointerEvents="none"
	            style={[
	              toastAnimatedStyle,
	              { position: "absolute", left: 16, right: 16, bottom: insets.bottom + 16 }
	            ]}
	          >
	            <View
	              style={{
	                backgroundColor: "rgba(17,24,39,0.92)",
	                paddingVertical: 12,
	                paddingHorizontal: 14,
	                borderRadius: 12
	              }}
	            >
	              <Text className="text-white font-semibold text-center">{toastMessage}</Text>
	            </View>
	          </Reanimated.View>
	        ) : null}
	      </View>
	    </SafeAreaView>
	  );
}
