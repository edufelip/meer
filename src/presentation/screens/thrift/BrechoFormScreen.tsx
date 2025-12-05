import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getInfoAsync, uploadAsync } from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Easing,
  Image,
  Pressable,
  Animated as RNAnimated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { theme } from "../../../shared/theme";

type CategoryChipProps = {
  id: string;
  label: string;
  active: boolean;
  onToggle: () => void;
};

const CategoryChip: React.FC<CategoryChipProps> = ({ id, label, active, onToggle }) => {
  const anim = useRef(new RNAnimated.Value(active ? 1 : 0)).current; // color/size based on active
  const pressAnim = useRef(new RNAnimated.Value(0)).current; // tap bounce

  useEffect(() => {
    RNAnimated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false // color interpolation
    }).start();
  }, [active, anim]);

  const bgStyle = {
    backgroundColor: anim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#E5E7EB", "#B55D05"]
    })
  };

  const textStyle = {
    color: anim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#374151", "#FFFFFF"]
    })
  };

  const activeScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.08]
  });

  const pressScale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.07]
  });

  return (
    <Pressable
      key={id}
      onPress={() => {
        pressAnim.setValue(0);
        RNAnimated.sequence([
          RNAnimated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: false,
            speed: 22,
            bounciness: 7
          }),
          RNAnimated.timing(pressAnim, {
            toValue: 0,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false
          })
        ]).start();
        onToggle();
      }}
    >
      <RNAnimated.View
        style={[
          bgStyle,
          {
            transform: [
              {
                scale: RNAnimated.multiply(activeScale, pressScale)
              }
            ]
          }
        ]}
        className="py-2 px-4 rounded-full"
      >
        <RNAnimated.Text style={textStyle} className="text-sm font-semibold">
          {label}
        </RNAnimated.Text>
      </RNAnimated.View>
    </Pressable>
  );
};

export function BrechoFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "brechoForm">>();
  const thriftStore = route.params?.thriftStore ?? null;

  const initial = useMemo<Partial<ThriftStore>>(
    () => thriftStore ?? {},
    [thriftStore]
  );

  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? initial.tagline ?? "");
  const [hours, setHours] = useState(initial.openingHours ?? "");
  const [address, setAddress] = useState(initial.addressLine ?? "");
  const [addressSuggestions, setAddressSuggestions] = useState<{ label: string; latitude?: number; longitude?: number }[]>(
    []
  );
  const skipGeocodeRef = useRef(false);
  const [geocodeEnabled, setGeocodeEnabled] = useState(false);
  const [addressCoords, setAddressCoords] = useState<{ latitude?: number; longitude?: number } | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | undefined>(initial.neighborhood);
  const [addressConfirmed, setAddressConfirmed] = useState<boolean>(Boolean(thriftStore?.id && initial.addressLine));
  const [phone, setPhone] = useState((thriftStore as any)?.phone ?? (thriftStore as any)?.whatsapp ?? "");
  const [email, setEmail] = useState((thriftStore as any)?.email ?? "");
  const [instagram, setInstagram] = useState(
    initial.social?.instagram?.replace(/^@+/, "") ?? ""
  );
  const [categories, setCategories] = useState<string[]>(initial.categories ?? []);
  type UiPhoto =
    | {
        state: "existing";
        photoId: string;
        fileKey?: string;
        url: string;
        uiPosition: number;
        markedForDelete?: boolean;
      }
    | {
        state: "new";
        tempId: string;
        uri: string;
        contentType: string;
        uiPosition: number;
      };

  const [photos, setPhotos] = useState<UiPhoto[]>(
    (initial.images ?? []).map((img, idx) => ({
      state: "existing",
      photoId: img.id ?? img.url,
      fileKey: (img as any).fileKey, // if backend provides
      url: img.url,
      uiPosition: idx
    }))
  );

  const MAX_PHOTOS = 10;
  const {
    createOrUpdateStoreUseCase,
    getProfileUseCase,
    requestStorePhotoUploadsUseCase,
    confirmStorePhotosUseCase
  } = useDependencies();
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);

  const markDirty = () => setDirty(true);
  const genId = () => (Crypto.randomUUID ? Crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

  const isValidPhone = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  };

  const compressPhotos = async (items: { uri: string; tempId?: string }[]) => {
    const TARGET_BYTES = 1 * 1024 * 1024; // aim <1MB
    const MAX_BYTES = 1.5 * 1024 * 1024; // hard cap 1.5MB
    const qualitySteps = [0.6, 0.45, 0.35, 0.25, 0.18, 0.12, 0.08];

    return Promise.all(
      items.map(async (item) => {
        let currentUri = item.uri;
        let width = 1400;
        for (const q of qualitySteps) {
          const manipulated = await ImageManipulator.manipulateAsync(
            currentUri,
            [{ resize: { width } }],
            { compress: q, format: ImageManipulator.SaveFormat.JPEG }
          );

          const info = await getInfoAsync(manipulated.uri);
          if (info.exists && info.size != null && info.size <= TARGET_BYTES) {
            return { ...item, uri: manipulated.uri };
          }

          currentUri = manipulated.uri;
          width = Math.max(500, Math.floor(width * 0.75));
          if (info.exists && info.size != null && info.size <= MAX_BYTES) {
            return { ...item, uri: manipulated.uri };
          }
        }

        const finalInfo = await getInfoAsync(currentUri);
        if (finalInfo.exists && finalInfo.size != null && finalInfo.size <= MAX_BYTES) {
          return { ...item, uri: currentUri };
        }
        throw new Error("Foto acima de 2MB mesmo após compressão. Escolha uma imagem menor.");
      })
    );
  };

  const uploadPhotoToSlot = async (
    photo: { uri: string; tempId?: string },
    slot: { uploadUrl: string; contentType: string },
    index: number,
    total: number
  ) => {
    setProgressLabel(`Subindo Foto ${index + 1} de ${total}`);
    const result = await uploadAsync(slot.uploadUrl, photo.uri, {
      httpMethod: "PUT",
      headers: { "Content-Type": slot.contentType || "image/jpeg" }
    });
    if (result.status >= 400) {
      throw new Error(`Falha ao subir foto (${result.status})`);
    }
  };

  const toggleCategory = (label: string) => {
    setCategories((prev) => {
      const next = prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label];
      return next;
    });
    markDirty();
  };

  const categoryOptions = useMemo(
    () => [
      { id: "fem", label: "Feminino" },
      { id: "masc", label: "Masculino" },
      { id: "kids", label: "Infantil" },
      { id: "home", label: "Casa" },
      { id: "plus", label: "Plus Size" },
      { id: "luxo", label: "Luxo" }
    ],
    []
  );

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos da permissão para acessar suas fotos.");
      return;
    }

    if (fromCamera) {
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      setPhotos((prev) => {
        if (prev.filter((p) => !p.markedForDelete).length >= MAX_PHOTOS) return prev;
          const next: UiPhoto[] = [
            ...prev,
            {
              state: "new",
              tempId: genId(),
              uri: asset.uri,
              contentType: "image/jpeg",
              uiPosition: prev.length
            }
          ];
        markDirty();
        return next;
      });
      return;
    }

    // Gallery: allow multiple selections up to remaining slots (visible only).
    const currentVisible = photos.filter((p) => !p.markedForDelete).length;
    const remaining = Math.max(1, MAX_PHOTOS - currentVisible);
    const allowMulti = remaining > 1;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: allowMulti ? false : true, // editing forces single select
      aspect: allowMulti ? undefined : [1, 1],
      quality: 0.8,
      selectionLimit: remaining,
      allowsMultipleSelection: allowMulti
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotos((prev) => {
        const remainingSlots = Math.max(0, MAX_PHOTOS - prev.filter((p) => !p.markedForDelete).length);
        if (remainingSlots === 0) return prev;
        const newAssets = result.assets.slice(0, remainingSlots).map((asset) => ({
          state: "new" as const,
          tempId: genId(),
          uri: asset.uri,
          contentType: "image/jpeg",
          uiPosition: prev.filter((p) => !p.markedForDelete).length
        }));
        const next = [...prev, ...newAssets];
        if (newAssets.length) markDirty();
        return next;
      });
    }
  };

  const handleDeletePhoto = (photo: UiPhoto) => {
    setPhotos((prev) => {
      if (photo.state === "new") {
        const next = prev.filter((p) => !(p.state === "new" && p.tempId === photo.tempId));
        if (next.length !== prev.length) markDirty();
        return next;
      }
      const next = prev.map((p) =>
        p.state === "existing" && p.photoId === photo.photoId ? { ...p, markedForDelete: true } : p
      );
      markDirty();
      return next;
    });
  };

  useEffect(() => {
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }

    if (!geocodeEnabled) return;

    const trimmed = address.trim();
    if (trimmed.length < 4) {
      setAddressSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await Location.geocodeAsync(trimmed);
        console.log("[Geocode] results", results);

        const suggestionsRaw = await Promise.all(
          results.slice(0, 1).map(async (r) => {
            try {
              const [rev] = await Location.reverseGeocodeAsync({ latitude: r.latitude, longitude: r.longitude });
              const neighborhoodLabel = rev?.district ?? rev?.subregion;
              const parts = [
                rev?.street ?? rev?.name,
                rev?.streetNumber,
                neighborhoodLabel,
                rev?.city ?? rev?.region,
                rev?.country
              ].filter(Boolean);
              return {
                label: parts.join(", ") || trimmed,
                latitude: r.latitude,
                longitude: r.longitude,
                neighborhood: neighborhoodLabel
              };
            } catch (err) {
              console.log("[Geocode] reverse failed", err);
              return {
                label: trimmed,
                latitude: r.latitude,
                longitude: r.longitude,
                neighborhood: undefined
              };
            }
          })
        );

        const deduped = suggestionsRaw.filter(
          (s, idx, arr) => idx === arr.findIndex((o) => o.label === s.label && o.latitude === s.latitude && o.longitude === s.longitude)
        );

        setAddressSuggestions(deduped);
      } catch {
        setAddressSuggestions([]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [address, geocodeEnabled]);

  const [selectedPhotoKey, setSelectedPhotoKey] = useState<string | null>(null);

  const photoKey = (p: UiPhoto) => (p.state === "existing" ? p.photoId : p.tempId);

  const renderPhotoItem = ({ item, drag, isActive, index }: RenderItemParams<UiPhoto>) => {
    if (item.markedForDelete) return null;
    const isCover = index === 0;
    const key = photoKey(item);
    const isSelected = selectedPhotoKey === key;

    return (
      <TouchableOpacity
        onLongPress={drag}
        delayLongPress={120}
        disabled={isActive}
        activeOpacity={0.9}
        onPress={() => setSelectedPhotoKey((prev) => (prev === key ? null : key))}
        style={{ marginRight: 12 }}
      >
        <View className="relative">
          {isCover && (
            <View className="absolute top-1 left-1 z-10 bg-[#B55D05] px-2 py-0.5 rounded-full">
              <Text className="text-xs font-semibold text-white">Capa</Text>
            </View>
          )}
          <Image source={{ uri: item.state === "existing" ? item.url : item.uri }} className="h-24 w-24 rounded-lg" resizeMode="cover" />
          {isSelected ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                handleDeletePhoto(item);
                setSelectedPhotoKey(null);
              }}
              className="absolute inset-0 bg-black/35 items-center justify-center rounded-lg"
            >
              <Ionicons name="close" size={22} color="white" />
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const buildPayload = async () => {
    const textChanges: any = {};
    if (name.trim()) textChanges.name = name.trim();
    if (description.trim()) textChanges.description = description.trim();
    if (hours.trim()) textChanges.openingHours = hours.trim();
    if (address.trim()) textChanges.addressLine = address.trim();
    textChanges.phone = phone.trim();
    if (email.trim()) textChanges.email = email.trim();
    const instagramHandle = instagram.trim().replace(/^@+/, "");
    if (instagramHandle) textChanges.social = { instagram: `@${instagramHandle}` };
    if (categories.length) textChanges.categories = categories.map((c) => c.toLowerCase());

    // Geocode address to get lat/lng when provided
    if (addressCoords?.latitude && addressCoords?.longitude) {
      textChanges.latitude = addressCoords.latitude;
      textChanges.longitude = addressCoords.longitude;
      if (neighborhood) textChanges.neighborhood = neighborhood;
    } else if (address.trim()) {
      try {
        const geocode = await Location.geocodeAsync(address.trim());
        if (geocode.length) {
          textChanges.latitude = geocode[0].latitude;
          textChanges.longitude = geocode[0].longitude;
        }
      } catch {
        // silent fail; backend can still geocode
      }
    }

    const visible = photos.filter((p) => !p.markedForDelete).sort((a, b) => a.uiPosition - b.uiPosition);
    const newPhotos = visible.filter((p): p is UiPhoto & { state: "new" } => p.state === "new");
    const existingPhotos = visible.filter((p): p is UiPhoto & { state: "existing" } => p.state === "existing");
    return { textChanges, orderedVisible: visible, newPhotos, existingPhotos };
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome do brechó.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Descrição obrigatória", "Descreva seu brechó.");
      return;
    }
    if (!hours.trim()) {
      Alert.alert("Horário obrigatório", "Informe o horário de funcionamento.");
      return;
    }
    if (!address.trim() || !addressConfirmed || (!thriftStore && !addressCoords)) {
      Alert.alert("Endereço inválido", "Selecione um endereço da lista de sugestões.");
      return;
    }
    if (!phone.trim() || !isValidPhone(phone)) {
      Alert.alert("Telefone inválido", "Digite um número de telefone ou WhatsApp válido.");
      return;
    }
    if (photos.length === 0) {
      Alert.alert("Fotos obrigatórias", "Adicione ao menos uma foto do brechó.");
      return;
    }

    const { textChanges, orderedVisible, newPhotos, existingPhotos } = await buildPayload();

    if (!thriftStore && Object.keys(textChanges).length === 0 && newPhotos.length === 0 && existingPhotos.length === (initial.images ?? []).length) {
      Alert.alert("Nada para salvar", "Adicione informações antes de enviar.");
      return;
    }
    if (orderedVisible.length > MAX_PHOTOS) {
      Alert.alert("Limite de fotos", `Envie no máximo ${MAX_PHOTOS} fotos.`);
      return;
    }

    setSaving(true);
    setProgressLabel(thriftStore ? "Salvando" : "Criando Brechó");
    try {
      let storeId = thriftStore?.id;

      if (!thriftStore?.id) {
        // Step 1: create store metadata only
        const created = await createOrUpdateStoreUseCase.executeCreate({
          name: textChanges.name,
          addressLine: textChanges.addressLine,
          description: textChanges.description,
          phone: textChanges.phone,
          latitude: textChanges.latitude,
          longitude: textChanges.longitude,
          openingHours: textChanges.openingHours,
          email: textChanges.email,
          social: textChanges.social,
          categories: textChanges.categories
        });
        storeId = created.id;
      }

      // Step 2: upload new photos (if any) and confirm all photos (existing + new) to define order
      let newFileKeys: string[] = [];
      const visibleNew = orderedVisible.filter((p): p is UiPhoto & { state: "new" } => p.state === "new");
      const deletedExisting = photos
        .filter((p) => p.state === "existing" && p.markedForDelete)
        .map((p) => p.photoId);

      if (visibleNew.length) {
        const compressedNew = await compressPhotos(visibleNew.map((p) => ({ uri: p.uri, tempId: p.tempId })));

        setProgressLabel("Solicitando uploads");
        const slots = await requestStorePhotoUploadsUseCase.execute({
          storeId: storeId!,
          count: compressedNew.length,
          contentTypes: compressedNew.map(() => "image/jpeg")
        });

        if (slots.length < compressedNew.length) {
          throw new Error("Upload slots insuficientes");
        }

        for (let i = 0; i < compressedNew.length; i++) {
          await uploadPhotoToSlot(compressedNew[i], slots[i], i, compressedNew.length);
          newFileKeys.push(slots[i].fileKey);
        }
      }

      // Build final photos payload in UI order
      setProgressLabel("Salvando");
      let newKeyIndex = 0;
      const photosPayload = orderedVisible.map((p, idx) => {
        if (p.state === "existing") {
          return { photoId: p.photoId, position: idx };
        }
        const key = newFileKeys[newKeyIndex++];
        return { fileKey: key, position: idx };
      });

      const confirmed = await confirmStorePhotosUseCase.execute({
        storeId: storeId!,
        photos: photosPayload,
        deletePhotoIds: deletedExisting
      });

      // Step 3: update metadata (now include cover/gallery URLs from confirm) for updates
      if (thriftStore?.id) {
        await createOrUpdateStoreUseCase.executeUpdate(thriftStore.id, {
          name: textChanges.name,
          addressLine: textChanges.addressLine,
          description: textChanges.description,
          phone: textChanges.phone,
          latitude: textChanges.latitude,
          longitude: textChanges.longitude,
          neighborhood: textChanges.neighborhood,
          openingHours: textChanges.openingHours,
          email: textChanges.email,
          social: textChanges.social,
          categories: textChanges.categories,
          coverImageUrl: confirmed.coverImageUrl,
          galleryUrls: confirmed.galleryUrls
        });
      }

      try {
        // refresh profile cache so Profile screen reflects owned thrift store
        await getProfileUseCase.execute();
      } catch (err) {
        console.log("[BrechoForm] refresh profile failed", err);
      }

      navigation.goBack();
    } catch (err: any) {
      console.log("[BrechoForm] erro ao salvar", err?.response ?? err?.message ?? err);
      const msg =
        err?.response?.data?.message ??
        (err?.response?.status === 413
          ? "Imagem acima de 2MB mesmo após compressão. Escolha fotos menores."
          : err?.message ?? "Não foi possível salvar. Tente novamente.");
      Alert.alert("Erro", msg);
    } finally {
      setSaving(false);
      setProgressLabel(null);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <View className="bg-white/90 border-b border-gray-200">
        <View className="flex-row items-center justify-between p-4">
          <Pressable
            className="w-8 h-8 items-center justify-center"
            onPress={() => {
              if (dirty) {
                Alert.alert("Tem certeza?", "Se voce voltar vai perder todas as mudanças que fez", [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Voltar", style: "destructive", onPress: () => navigation.goBack() }
                ]);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="text-xl font-bold text-[#374151]">{thriftStore ? "Meu Brechó" : "Cadastrar Brechó"}</Text>
          <View className="w-8 h-8" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View className="flex-1 bg-[#F3F4F6]">
          <ScrollView
            className="flex-1 p-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-lg font-bold mb-4">Informações Gerais</Text>
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Nome do Brechó</Text>
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t.slice(0, 100));
                  markDirty();
                }}
                placeholder="Ex: Brechó Estilo Único"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 mb-2"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Descrição</Text>
              <TextInput
                value={description}
                onChangeText={(t) => {
                  setDescription(t.slice(0, 200));
                  markDirty();
                }}
                placeholder="Descreva o que torna seu brechó especial"
                multiline
                numberOfLines={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 mb-2"
                textAlignVertical="top"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Horário de Funcionamento</Text>
              <TextInput
                value={hours}
                onChangeText={(t) => {
                  setHours(t.slice(0, 100));
                  markDirty();
                }}
                placeholder="Ex: Seg-Sex 9h-18h, Sáb 10h-14h"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 mb-2"
              />
            </View>
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-lg font-bold mb-2">Fotos do Brechó</Text>
          <DraggableFlatList
            data={photos.filter((p) => !p.markedForDelete).sort((a, b) => a.uiPosition - b.uiPosition)}
            horizontal
            keyExtractor={(item, index) => (item.state === "existing" ? item.photoId : item.tempId) ?? `photo-${index}`}
            onDragEnd={({ data }) => {
              // reindex uiPosition
              const reordered = data.map((p, idx) => ({ ...p, uiPosition: idx }));
              setPhotos((prev) => {
                const others = prev.filter((p) => p.markedForDelete);
                return [...reordered, ...others];
              });
              markDirty();
            }}
            renderItem={renderPhotoItem}
            ListHeaderComponent={
              photos.length >= MAX_PHOTOS ? null : (
                <Pressable
                  className="h-24 w-24 mr-3 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center bg-gray-100"
                  onPress={() => {
                    Alert.alert("Adicionar foto", "Escolha a origem", [
                      { text: "Câmera", onPress: () => pickImage(true) },
                      { text: "Galeria", onPress: () => pickImage(false) },
                      { text: "Cancelar", style: "cancel" }
                    ]);
                  }}
                >
                  <Ionicons name="add" size={28} color="#9CA3AF" />
                </Pressable>
              )
            }
            activationDistance={12}
            contentContainerStyle={{ paddingRight: 12, paddingVertical: 2 }}
            showsHorizontalScrollIndicator={false}
          />
          <Text className="text-xs text-gray-500 mt-2">Segure para reordenar. A primeira foto é a capa.</Text>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-lg font-bold mb-4">Endereço e Contato</Text>
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Endereço</Text>
              <TextInput
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  setAddressCoords(null);
                  setAddressConfirmed(false);
                  setGeocodeEnabled(true);
                  markDirty();
                }}
                placeholder="Rua, Número, Bairro"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 mb-2"
              />
              {addressSuggestions.length > 0 && (
                <View className="mt-2 bg-white border border-gray-200 rounded-lg">
                  {addressSuggestions.map((s) => (
                    <Pressable
                      key={s.label + s.latitude}
                      className="px-3 py-2"
                      onPress={() => {
                        skipGeocodeRef.current = true;
                        setAddress(s.label);
                        setAddressCoords({ latitude: s.latitude, longitude: s.longitude });
                        setNeighborhood(s.neighborhood);
                        setAddressSuggestions([]);
                        setAddressConfirmed(true);
                        setGeocodeEnabled(false);
                        markDirty();
                      }}
                    >
                      <Text className="text-sm text-[#374151]">{s.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Telefone / WhatsApp</Text>
              <TextInput
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  markDirty();
                }}
                placeholder="(11) 99999-9999"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 mb-2"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">E-mail</Text>
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  markDirty();
                }}
                placeholder="contato@brecho.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 mb-2"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Instagram</Text>
              <View className="flex-row items-center rounded-lg border border-gray-300 bg-white px-3 py-3 mb-2">
                <Text className="text-gray-500 mr-2">@</Text>
                <TextInput
                  value={instagram}
                  onChangeText={(t) => {
                    setInstagram(t.replace(/^@+/, ""));
                    markDirty();
                  }}
                  placeholder="seu_brecho"
                  className="flex-1 text-base"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-lg font-bold mb-4">Categorias</Text>
          <View className="flex-row flex-wrap gap-2 mb-2">
            {categoryOptions.map((opt) => (
              <CategoryChip
                key={opt.id}
                id={opt.id}
                label={opt.label}
                active={categories.includes(opt.label)}
                onToggle={() => toggleCategory(opt.label)}
              />
            ))}
          </View>
        </View>

          <View className="pt-2 pb-4">
            <Pressable
              className={`w-full rounded-full py-3 px-4 shadow-lg items-center ${
                saving ? "bg-gray-300" : "bg-[#B55D05]"
              }`}
              disabled={saving}
              onPress={handleSubmit}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-bold text-white">{thriftStore ? "Salvar alterações" : "Criar Brechó"}</Text>
              )}
            </Pressable>
          </View>
          </ScrollView>
        </View>
        {saving && progressLabel ? (
          <View className="absolute inset-0 bg-black/25 items-center justify-center px-8">
            <View className="bg-white rounded-2xl px-6 py-5 items-center gap-3 shadow-lg w-full max-w-sm">
              <ActivityIndicator color={theme.colors.highlight} />
              <Text className="text-base font-semibold text-[#374151] text-center">{progressLabel}</Text>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
