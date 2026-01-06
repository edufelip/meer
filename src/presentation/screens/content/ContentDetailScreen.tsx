import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  StatusBar,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from "react-native-reanimated";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { GuideContent } from "../../../domain/entities/GuideContent";
import type { ContentComment } from "../../../domain/entities/ContentComment";
import { COMMENT_MAX_LENGTH } from "../../../domain/validation/comments";
import { buildContentShareUrl } from "../../../shared/deepLinks";
import { theme } from "../../../shared/theme";
import { getAccessTokenSync, getTokens } from "../../../storage/authStorage";
import { useProfileSummaryStore } from "../../state/profileSummaryStore";

const COMMENT_PAGE_SIZE = 20;
const AUTH_NOTICE_DURATION_MS = 2400;
const HEADER_BG = "#FFFFFF";
const SHARE_SHIMMER_DURATION = 420;
const LIKE_POP_DURATION = 120;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const formatRelativeTime = (raw?: string) => {
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `${diffMinutes}m atrás`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d atrás`;
  return parsed.toLocaleDateString("pt-BR");
};

export function ContentDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "contentDetail">>();
  const {
    getGuideContentByIdUseCase,
    getContentCommentsUseCase,
    createContentCommentUseCase,
    likeContentUseCase,
    unlikeContentUseCase
  } = useDependencies();
  const profile = useProfileSummaryStore((state) => state.profile);

  const params = route.params as { content?: GuideContent; contentId?: string } | undefined;
  const initialContent = params?.content ?? null;
  const routeContentId = params?.contentId;

  const [content, setContent] = useState<GuideContent | null>(initialContent);
  const [loading, setLoading] = useState(!initialContent && !!routeContentId);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<ContentComment[]>([]);
  const [commentsPage, setCommentsPage] = useState(0);
  const [commentsHasNext, setCommentsHasNext] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const [commentsRefreshing, setCommentsRefreshing] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const [likedByMe, setLikedByMe] = useState(!!initialContent?.likedByMe);
  const [likeCount, setLikeCount] = useState(initialContent?.likeCount ?? 0);
  const [commentCount, setCommentCount] = useState(initialContent?.commentCount ?? 0);
  const [shareWidth, setShareWidth] = useState(0);

  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const authTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<ContentComment>>(null);
  const [composerHeight, setComposerHeight] = useState(0);
  const hasServerCommentCountRef = useRef(false);
  const likeScale = useSharedValue(1);
  const shareShimmer = useSharedValue(0);

  const contentId = content?.id ?? routeContentId;

  useEffect(() => {
    if (!content) return;
    if (typeof content.likedByMe === "boolean") setLikedByMe(content.likedByMe);
    if (typeof content.likeCount === "number") setLikeCount(content.likeCount);
    if (typeof content.commentCount === "number") {
      setCommentCount(content.commentCount);
      hasServerCommentCountRef.current = true;
    }
  }, [content]);

  useEffect(() => {
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, []);

  const showAuthNotice = useCallback((message: string) => {
    setAuthNotice(message);
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
    }
    authTimeoutRef.current = setTimeout(() => setAuthNotice(null), AUTH_NOTICE_DURATION_MS);
  }, []);

  const ensureAuthenticated = useCallback(
    async (message: string) => {
      if (getAccessTokenSync()) return true;
      const { token } = await getTokens();
      if (token) return true;
      showAuthNotice(message);
      return false;
    },
    [showAuthNotice]
  );

  useEffect(() => {
    let active = true;
    if (initialContent || !routeContentId) return () => {};

    setLoading(true);
    setError(null);

    getGuideContentByIdUseCase
      .execute(routeContentId)
      .then((result) => {
        if (!active) return;
        if (result) {
          setContent(result);
        } else {
          setError("Conteúdo não encontrado.");
        }
      })
      .catch(() => {
        if (!active) return;
        setError("Não foi possível carregar este conteúdo.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [getGuideContentByIdUseCase, initialContent, routeContentId]);

  const loadComments = useCallback(
    async (opts?: { page?: number; mode?: "replace" | "append" }) => {
      if (!contentId) return;
      const page = opts?.page ?? 0;
      const mode = opts?.mode ?? "replace";

      if (mode === "replace") {
        setCommentsLoading(true);
      } else {
        setCommentsLoadingMore(true);
      }
      setCommentsError(null);

      try {
        const res = await getContentCommentsUseCase.execute({
          contentId,
          page,
          pageSize: COMMENT_PAGE_SIZE
        });
        const ordered = [...(res?.items ?? [])].sort((a, b) => {
          const aDate = new Date(a.createdAt).getTime();
          const bDate = new Date(b.createdAt).getTime();
          return bDate - aDate;
        });
        setComments((prev) => {
          const merged = new Map<string, ContentComment>();
          prev.forEach((comment) => merged.set(comment.id, comment));
          ordered.forEach((comment) => merged.set(comment.id, comment));
          return Array.from(merged.values()).sort((a, b) => {
            const aDate = new Date(a.createdAt).getTime();
            const bDate = new Date(b.createdAt).getTime();
            return bDate - aDate;
          });
        });
        setCommentsPage(res?.page ?? page);
        setCommentsHasNext(!!res?.hasNext);
        if (mode === "replace" && !hasServerCommentCountRef.current) {
          setCommentCount(ordered.length);
        }
      } catch {
        if (mode === "replace") setComments([]);
        setCommentsError("Não foi possível carregar os comentários.");
      } finally {
        setCommentsLoading(false);
        setCommentsLoadingMore(false);
        setCommentsRefreshing(false);
      }
    },
    [contentId, getContentCommentsUseCase]
  );

  useEffect(() => {
    if (!contentId) return;
    void loadComments({ page: 0, mode: "replace" });
  }, [contentId, loadComments]);

  const handleShare = useCallback(async () => {
    if (!contentId || !content) return;
    const url = buildContentShareUrl(contentId);

    try {
      await Share.share({
        title: content.title,
        message: url,
        url
      });
    } catch {
      Alert.alert("Erro", "Não foi possível compartilhar este conteúdo.");
    }
  }, [content, contentId]);

  const triggerShareShimmer = useCallback(() => {
    shareShimmer.value = 0;
    shareShimmer.value = withTiming(1, { duration: SHARE_SHIMMER_DURATION }, () => {
      shareShimmer.value = 0;
    });
  }, [shareShimmer]);

  const handleToggleLike = useCallback(async () => {
    if (!content || !contentId || likeSubmitting) return;
    const hasToken = !!getAccessTokenSync();
    if (!hasToken) {
      const canProceed = await ensureAuthenticated("Faça login para curtir.");
      if (!canProceed) return;
    }

    const previousLiked = likedByMe;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;
    const nextCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));

    likeScale.value = withSequence(
      withTiming(1.18, { duration: LIKE_POP_DURATION }),
      withTiming(1, { duration: LIKE_POP_DURATION })
    );
    setLikedByMe(nextLiked);
    setLikeCount(nextCount);
    setLikeSubmitting(true);
    try {
      if (nextLiked) {
        await likeContentUseCase.execute(contentId);
      } else {
        await unlikeContentUseCase.execute(contentId);
      }
    } catch {
      setLikedByMe(previousLiked);
      setLikeCount(previousCount);
      Alert.alert("Erro", "Não foi possível atualizar o like.");
    } finally {
      setLikeSubmitting(false);
    }
  }, [
    content,
    contentId,
    ensureAuthenticated,
    likeContentUseCase,
    unlikeContentUseCase,
    likeSubmitting,
    likedByMe,
    likeCount,
    likeScale
  ]);

  const handleSubmitComment = useCallback(async () => {
    if (!contentId || commentSubmitting) return;
    const hasToken = !!getAccessTokenSync();
    if (!hasToken) {
      const canProceed = await ensureAuthenticated("Faça login para comentar.");
      if (!canProceed) return;
    }

    setCommentSubmitting(true);
    try {
      const created = await createContentCommentUseCase.execute({
        contentId,
        body: commentText
      });
      setCommentText("");
      setComments((prev) => [created, ...prev]);
      setCommentCount((prev) => prev + 1);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (err: any) {
      const message = err?.message ?? "Não foi possível enviar seu comentário.";
      Alert.alert("Erro", message);
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentSubmitting, commentText, contentId, createContentCommentUseCase, ensureAuthenticated]);

  const handleCommentFocus = useCallback(() => {
    void ensureAuthenticated("Faça login para comentar.").then((ok) => {
      if (!ok) inputRef.current?.blur();
    });
  }, [ensureAuthenticated]);

  const onRefresh = useCallback(() => {
    if (!contentId) return;
    setCommentsRefreshing(true);
    void loadComments({ page: 0, mode: "replace" });
  }, [contentId, loadComments]);

  const loadMore = useCallback(() => {
    if (!commentsHasNext || commentsLoadingMore) return;
    void loadComments({ page: commentsPage + 1, mode: "append" });
  }, [commentsHasNext, commentsLoadingMore, commentsPage, loadComments]);

  const createdAtLabel = useMemo(() => formatRelativeTime(content?.createdAt), [content?.createdAt]);
  const authorName = content?.thriftStoreName?.trim() || "Guia Brechó";
  const authorAvatar = content?.thriftStoreCoverImageUrl ?? null;
  const commentCountLabel = commentCount === 1 ? "1 comentário" : `${commentCount} comentários`;
  const remainingChars = COMMENT_MAX_LENGTH - commentText.length;
  const canSendComment = commentText.trim().length > 0 && !commentSubmitting;

  const listExtraData = useMemo(
    () => ({ likeCount, likedByMe, commentCount, shareWidth }),
    [likeCount, likedByMe, commentCount, shareWidth]
  );

  const likeIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }]
  }));

  const shimmerWidth = Math.max(shareWidth * 0.6, 60);

  const shareShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shareShimmer.value,
      [0, 1],
      [-shimmerWidth, shareWidth + shimmerWidth],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      shareShimmer.value,
      [0, 0.1, 0.9, 1],
      [0, 1, 1, 0],
      Extrapolate.CLAMP
    );
    return { opacity, transform: [{ translateX }] };
  }, [shareWidth, shimmerWidth]);

  const contentImageSource = useMemo(() => {
    if (!content?.imageUrl) return undefined;
    return { uri: content.imageUrl };
  }, [content?.imageUrl]);

  const authorAvatarSource = useMemo(() => {
    if (!authorAvatar) return undefined;
    return { uri: authorAvatar };
  }, [authorAvatar]);

  const profileAvatarSource = useMemo(() => {
    if (!profile?.avatarUrl) return undefined;
    return { uri: profile.avatarUrl };
  }, [profile?.avatarUrl]);

  const renderComment = ({ item }: { item: ContentComment }) => {
    const timeLabel = formatRelativeTime(item.createdAt);
    return (
      <View className="px-4">
        <View className="flex-row items-start gap-3">
          {item.userPhotoUrl ? (
            <Image source={{ uri: item.userPhotoUrl }} className="w-8 h-8 rounded-full mt-1" />
          ) : (
            <View className="w-8 h-8 rounded-full bg-gray-200 mt-1 items-center justify-center">
              <Ionicons name="person-circle-outline" size={20} color="#9CA3AF" />
            </View>
          )}
          <View className="flex-1">
            <View className="bg-[#F0F0F0] rounded-xl p-3">
              <Text className="font-bold text-sm text-[#1F1F1F]">{item.userDisplayName}</Text>
              <Text className="text-sm mt-1 text-[#374151]">{item.body}</Text>
              {item.edited ? (
                <Text className="text-[11px] text-[#6B7280] mt-1">Editado</Text>
              ) : null}
            </View>
            {timeLabel ? (
              <View className="mt-1 pl-2">
                <Text className="text-xs text-[#9CA3AF]">{timeLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const listHeader = useMemo(() => {
    if (!content) return null;
    return (
      <View className="bg-white">
        <View className="p-4">
          <View className="flex-row items-center gap-3">
            {authorAvatarSource ? (
              <Image source={authorAvatarSource} className="w-10 h-10 rounded-full" />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                <Ionicons name="storefront-outline" size={18} color="#9CA3AF" />
              </View>
            )}
            <View>
              <Text className="font-bold text-[#1F1F1F]">{authorName}</Text>
              {createdAtLabel ? (
                <Text className="text-xs text-[#6B7280]">{createdAtLabel}</Text>
              ) : null}
            </View>
          </View>
          {content.title ? (
            <Text className="mt-4 text-base font-bold text-[#1F1F1F]">{content.title}</Text>
          ) : null}
          <Text className="mt-2 text-sm text-[#374151]">{content.description}</Text>
        </View>
        <Image
          source={contentImageSource}
          className="w-full"
          style={{ aspectRatio: 4 / 3, backgroundColor: "#E5E7EB" }}
          resizeMode="cover"
          fadeDuration={0}
        />
        <View className="p-4">
          <View className="flex-row items-center justify-between text-[#6B7280]">
            <View className="flex-row items-center gap-2">
              <Ionicons name="heart" size={16} color={theme.colors.highlight} />
              <Text testID="content-like-count" className="text-sm font-medium">
                {likeCount}
              </Text>
            </View>
            <Text className="text-sm">{commentCountLabel}</Text>
          </View>
          <View className="mt-4 pt-4 border-t border-gray-200 flex-row items-center justify-between gap-2">
            <Pressable
              className="flex-row items-center gap-2"
              accessibilityRole="button"
              accessibilityLabel="Curtir conteúdo"
              testID="content-like-button"
              onPress={handleToggleLike}
              disabled={likeSubmitting}
            >
              <Animated.View style={likeIconStyle}>
                <Ionicons
                  name={likedByMe ? "heart" : "heart-outline"}
                  size={20}
                  color={likedByMe ? "#B55D05" : "#6B7280"}
                />
              </Animated.View>
              <Text className="text-sm font-semibold text-[#4B5563]">Curtir</Text>
            </Pressable>
            <View
              className="relative overflow-hidden rounded-full"
              onLayout={(event) => setShareWidth(event.nativeEvent.layout.width)}
            >
              <Pressable
                className="flex-row items-center gap-2 px-2 py-1"
                accessibilityRole="button"
                accessibilityLabel="Compartilhar conteúdo"
                onPress={() => {
                  triggerShareShimmer();
                  void handleShare();
                }}
              >
                <Ionicons name="share-social-outline" size={20} color="#6B7280" />
                <Text className="text-sm font-semibold text-[#4B5563]">Compartilhar</Text>
              </Pressable>
              <AnimatedLinearGradient
                pointerEvents="none"
                colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[
                  {
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: shimmerWidth
                  },
                  shareShimmerStyle
                ]}
              />
            </View>
          </View>
        </View>
        <View className="px-4 pb-2">
          <Text className="text-base font-bold text-[#1F1F1F]">Comentários</Text>
          {commentsError ? (
            <Text className="text-xs text-red-500 mt-1">{commentsError}</Text>
          ) : null}
        </View>
        {commentsLoading && comments.length === 0 ? (
          <View className="py-4 items-center">
            <ActivityIndicator color={theme.colors.highlight} />
          </View>
        ) : null}
      </View>
    );
  }, [
    authorAvatarSource,
    authorName,
    commentCountLabel,
    comments.length,
    commentsError,
    commentsLoading,
    content,
    contentImageSource,
    createdAtLabel,
    handleShare,
    handleToggleLike,
    likeCount,
    likeIconStyle,
    likeSubmitting,
    likedByMe,
    shareShimmerStyle,
    shimmerWidth,
    triggerShareShimmer
  ]);

  if (loading && !content) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor={HEADER_BG} />
        <View className="border-b border-gray-200" style={{ backgroundColor: HEADER_BG }}>
          <View className="flex-row items-center justify-between p-4">
            <Pressable
              className="p-2 rounded-full"
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
            </Pressable>
            <Text className="text-lg font-bold text-[#1F1F1F]">Publicação</Text>
            <View style={{ width: 32, height: 32 }} />
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.highlight} />
          <Text className="text-sm text-[#6B7280] mt-4">Carregando conteúdo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor={HEADER_BG} />
        <View className="border-b border-gray-200" style={{ backgroundColor: HEADER_BG }}>
          <View className="flex-row items-center justify-between p-4">
            <Pressable
              className="p-2 rounded-full"
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
            </Pressable>
            <Text className="text-lg font-bold text-[#1F1F1F]">Publicação</Text>
            <View style={{ width: 32, height: 32 }} />
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base font-semibold text-[#1F1F1F] text-center">
            {error ?? "Conteúdo indisponível."}
          </Text>
          <Text className="text-sm text-[#6B7280] mt-2 text-center">
            Verifique o link ou tente novamente mais tarde.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={HEADER_BG} />
      <View className="border-b border-gray-200" style={{ backgroundColor: HEADER_BG }}>
        <View className="flex-row items-center justify-between p-4">
          <Pressable
            className="p-2 rounded-full"
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="text-lg font-bold text-[#1F1F1F]">Publicação</Text>
          <View style={{ width: 32, height: 32 }} />
        </View>
      </View>

      {authNotice ? (
        <View className="absolute" style={{ top: 16, left: 16, right: 16, zIndex: 50 }}>
          <View className="bg-[#111827] px-4 py-3 rounded-xl shadow-lg">
            <Text className="text-white font-semibold text-center">{authNotice}</Text>
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View className="flex-1">
          <FlatList
            ref={listRef}
            data={comments}
            extraData={listExtraData}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={{
              paddingBottom: composerHeight + insets.bottom + 16,
              gap: 16
            }}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              !commentsLoading ? (
                <View className="px-4 pb-6">
                  <Text className="text-sm text-[#6B7280]">Nenhum comentário ainda.</Text>
                </View>
              ) : null
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            refreshing={commentsRefreshing}
            onRefresh={onRefresh}
            ListFooterComponent={
              commentsLoadingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator color={theme.colors.highlight} />
                </View>
              ) : (
                <View />
              )
            }
            keyboardShouldPersistTaps="handled"
          />

          <View
            className="bg-white border-t border-gray-200 px-4 py-3"
            style={{ paddingBottom: insets.bottom + 8 }}
            onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}
          >
            <View className="flex-row items-center gap-3">
              {profileAvatarSource ? (
                <Image source={profileAvatarSource} className="w-8 h-8 rounded-full" />
              ) : (
                <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
                  <Ionicons name="person-circle-outline" size={20} color="#9CA3AF" />
                </View>
              )}
              <View className="flex-1">
                <TextInput
                  ref={inputRef}
                  testID="comment-input"
                  value={commentText}
                  onChangeText={setCommentText}
                  onFocus={handleCommentFocus}
                  placeholder="Escreva um comentário..."
                  className="bg-[#F0F0F0] border border-gray-300 rounded-full px-4 py-2 text-sm"
                  maxLength={COMMENT_MAX_LENGTH}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (canSendComment) {
                      void handleSubmitComment();
                    }
                  }}
                />
              </View>
              <Pressable
                testID="comment-send"
                accessibilityRole="button"
                accessibilityLabel="Enviar comentário"
                onPress={handleSubmitComment}
                disabled={!canSendComment}
              >
                <Ionicons
                  name="send"
                  size={22}
                  color={canSendComment ? theme.colors.highlight : "#9CA3AF"}
                />
              </Pressable>
            </View>
            <Text className="text-[11px] text-[#9CA3AF] mt-1 pl-11">
              {remainingChars} caracteres restantes
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
