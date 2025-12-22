import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StatusBar, Text, TextInput, View, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { theme } from "../../../shared/theme";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadAsync } from "expo-file-system/legacy";
import type { GuideContent } from "../../../domain/entities/GuideContent";

export function EditContentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "editContent">>();
  const {
    getGuideContentUseCase,
    createContentUseCase,
    updateContentUseCase,
    requestContentImageUploadUseCase,
    deleteContentUseCase
  } = useDependencies();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [originalMedia, setOriginalMedia] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialState, setInitialState] = useState<{ title: string; body: string; media: string[] }>({
    title: "",
    body: "",
    media: []
  });
  const isEditing = Boolean(route.params.articleId);
  const passedArticle = route.params.article as GuideContent | undefined;

  // Reset state on mount for create flow
  useEffect(() => {
    if (!route.params.articleId) {
      setTitle("");
      setBody("");
      setMedia([]);
      setOriginalMedia(null);
      setSelectedMedia(null);
      setInitialState({ title: "", body: "", media: [] });
    }
  }, [route.params.articleId]);

  useEffect(() => {
    (async () => {
      if (!route.params.articleId) return; // creating new

      // Prefer article passed via navigation to avoid refetch
      if (passedArticle) {
        setTitle(passedArticle.title);
        setBody(passedArticle.description ?? "");
        setMedia([passedArticle.imageUrl]);
        setOriginalMedia(passedArticle.imageUrl);
        setSelectedMedia(null);
        setInitialState({
          title: passedArticle.title ?? "",
          body: passedArticle.description ?? "",
          media: [passedArticle.imageUrl]
        });
        return;
      }

      const res = await getGuideContentUseCase.execute({
        storeId: route.params.storeId,
        page: 0,
        pageSize: 50
      });
      const article = res.items.find((a) => a.id === route.params.articleId);
      if (article) {
        setTitle(article.title);
        setBody(article.description ?? "");
        setMedia([article.imageUrl]);
        setOriginalMedia(article.imageUrl);
        setSelectedMedia(null);
        setInitialState({
          title: article.title ?? "",
          body: article.description ?? "",
          media: [article.imageUrl]
        });
      }
    })();
  }, [getGuideContentUseCase, passedArticle, route.params.articleId, route.params.storeId]);

  const mediaChanged = useMemo(() => {
    if (!media.length && !originalMedia) return false;
    if (media.length && !originalMedia) return true;
    return media[0] !== originalMedia;
  }, [media, originalMedia]);

  const isDirty = useMemo(() => {
    const currentMedia = media[0] ?? "";
    const initialMedia = initialState.media[0] ?? "";
    return (
      title.trim() !== (initialState.title ?? "").trim() ||
      body !== (initialState.body ?? "") ||
      currentMedia !== initialMedia
    );
  }, [body, initialState.body, initialState.media, initialState.title, media, title]);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!isDirty || saving) return;
      e.preventDefault();
      Alert.alert("Descartar alterações?", "Se voltar, você perderá as mudanças feitas.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action)
        }
      ]);
    });
    return unsub;
  }, [navigation, isDirty, saving]);

  const confirmBack = () => {
    if (!isDirty || saving) {
      navigation.goBack();
      return;
    }
    Alert.alert("Descartar alterações?", "Se voltar, você perderá as mudanças feitas.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: () => navigation.goBack() }
    ]);
  };

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      selectionLimit: 1,
      allowsMultipleSelection: false,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85
    });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setMedia([uri]);
      setSelectedMedia(null);
    }
  };

  const compressImage = async (uri: string) => {
    // Resize to ~1600px max width, quality 0.7 similar to store flow
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1600 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Título obrigatório", "Informe um título para o conteúdo.");
      return;
    }
    if (!body.trim()) {
      Alert.alert("Descrição obrigatória", "Adicione uma descrição para o conteúdo.");
      return;
    }
    if (!media.length) {
      Alert.alert("Imagem obrigatória", "Adicione uma imagem para o conteúdo.");
      return;
    }
    setSaving(true);
    try {
      // Step 1: ensure content exists
      let contentId = route.params.articleId;
      if (!contentId) {
        const created = await createContentUseCase.execute({
          title: title.trim(),
          description: body.trim(),
          storeId: route.params.storeId
        });
        contentId = created.id;
      }

      let imageUrlToSend = originalMedia;
      if (mediaChanged && media[0]) {
        // Step 2: request upload slot
        const filename = media[0].split("/").pop() ?? "image.jpg";
        const ext = (filename.split(".").pop() ?? "jpg").toLowerCase();
        const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        const slot = await requestContentImageUploadUseCase.execute(contentId!, contentType);
        const compressedUri = await compressImage(media[0]);
        await uploadAsync(slot.uploadUrl, compressedUri, {
          httpMethod: "PUT",
          headers: { "Content-Type": slot.contentType || contentType }
        });
        imageUrlToSend = slot.uploadUrl.split("?")[0];
      }

      // Step 3: update content with text + imageUrl
      await updateContentUseCase.execute(contentId!, {
        title: title.trim(),
        description: body.trim(),
        imageUrl: imageUrlToSend ?? undefined
      });

      Alert.alert("Sucesso", "Conteúdo salvo com sucesso.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o conteúdo. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!route.params.articleId) return;
    Alert.alert(
      "Excluir conteúdo",
      "Tem certeza que deseja excluir este conteúdo? Essa ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await deleteContentUseCase.execute(route.params.articleId!);
              navigation.goBack();
            } catch {
              Alert.alert("Erro", "Não foi possível excluir o conteúdo. Tente novamente.");
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white/80 backdrop-blur-sm border-b border-gray-200" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center p-4">
          <Pressable className="p-2 rounded-full" onPress={confirmBack}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-[#1F2937]">
            {isEditing ? "Editar Conteúdo" : "Criar Conteúdo"}
          </Text>
          {isEditing ? (
            <Pressable className="p-2 rounded-full" accessibilityLabel="Excluir Conteúdo" onPress={handleDelete}>
              <Ionicons name="trash" size={20} color="#DC2626" />
            </Pressable>
          ) : (
            <View style={{ width: 32, height: 32 }} />
          )}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="mb-6">
          <Text className="text-sm font-medium text-[#374151] mb-1">Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white"
            placeholder="Título do conteúdo"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-[#374151] mb-1">Corpo do Texto</Text>
          <TextInput
            value={body}
            onChangeText={(text) => setBody(text.slice(0, 1000))}
            multiline
            numberOfLines={12}
            textAlignVertical="top"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white"
            style={{ minHeight: 6 * 40 }}
            placeholder="Descreva seu conteúdo..."
            placeholderTextColor="#9CA3AF"
            maxLength={1000}
          />
          <Text className="text-xs text-gray-500 mt-1 text-right">{`${body.length}/1000`}</Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold mb-2 text-[#1F2937]">Mídia</Text>
          <View className="grid grid-cols-2 gap-4">
            {media.map((url, index) => (
              <Pressable
                key={url}
                className="relative"
                onPress={() => setSelectedMedia((prev) => (prev === url ? null : url))}
                testID={`edit-content-media-${index}`}
              >
                <Image source={{ uri: url }} className="w-full h-40 rounded-lg" resizeMode="cover" />
                {selectedMedia === url ? (
                  <Pressable
                    className="absolute inset-0 bg-black/35 items-center justify-center rounded-lg"
                    onPress={() => {
                      setMedia([]);
                      setSelectedMedia(null);
                    }}
                    testID={`edit-content-media-delete-${index}`}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </Pressable>
                ) : null}
              </Pressable>
            ))}
            {media.length === 0 ? (
              <Pressable
                className="items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg"
                onPress={pickMedia}
              >
                <View className="items-center">
                  <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                  <Text className="text-sm text-gray-500 mt-1">Adicionar mídia</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View className="pt-2 space-y-3">
          <Pressable
            className={`w-full rounded-lg py-3 px-4 items-center shadow ${
              saving ? "bg-gray-300" : "bg-[#B55D05]"
            }`}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold">{isEditing ? "Salvar Modificações" : "Criar Conteúdo"}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
