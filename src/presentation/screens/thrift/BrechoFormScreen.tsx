import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  FlatList,
  Image,
  Alert,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { theme } from "../../../shared/theme";
import * as ImagePicker from "expo-image-picker";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { ActivityIndicator } from "react-native";
import * as Location from "expo-location";

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
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{ label: string; latitude?: number; longitude?: number }>
  >([]);
  const [addressCoords, setAddressCoords] = useState<{ latitude?: number; longitude?: number } | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState(initial.social?.instagram ?? "");
  const [categories, setCategories] = useState<string[]>(initial.categories ?? []);
  const [photos, setPhotos] = useState<Array<{ id?: string; uri: string; isNew?: boolean }>>(
    (initial.images ?? []).map((img) => ({ id: img.id ?? img.url, uri: img.url }))
  );

  const MAX_PHOTOS = 10;
  const { createOrUpdateStoreUseCase } = useDependencies();
  const [saving, setSaving] = useState(false);

  const toggleCategory = (label: string) => {
    setCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const categoryOptions = ["Feminino", "Masculino", "Infantil", "Casa", "Plus Size", "Luxo"];

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos da permissão para acessar suas fotos.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
          selectionLimit: 1
        });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotos((prev) => {
        if (prev.length >= MAX_PHOTOS) return prev;
        const next = [...prev, { uri: asset.uri, isNew: true }];
        return next;
      });
    }
  };

  const handleDeletePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));
  };

  useEffect(() => {
    const trimmed = address.trim();
    if (trimmed.length < 4) {
      setAddressSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await Location.geocodeAsync(trimmed);
        const suggestions = results.slice(0, 3).map((r) => {
          const parts = [r.street ?? r.name, r.streetNumber, r.subregion ?? r.district, r.region, r.country].filter(
            Boolean
          );
          return {
            label: parts.join(", ") || trimmed,
            latitude: r.latitude,
            longitude: r.longitude
          };
        });
        setAddressSuggestions(suggestions);
      } catch {
        setAddressSuggestions([]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [address]);

  const renderPhotoItem = ({ item, drag, isActive, index }: RenderItemParams<{ id?: string; uri: string; isNew?: boolean }>) => {
    const isCover = index === 0;
    return (
      <TouchableOpacity
        onLongPress={drag}
        delayLongPress={120}
        disabled={isActive}
        activeOpacity={0.9}
        style={{ marginRight: 12 }}
      >
        <View className="relative">
          {isCover && (
            <View className="absolute top-1 left-1 z-10 bg-[#B55D05] px-2 py-0.5 rounded-full">
              <Text className="text-xs font-semibold text-white">Capa</Text>
            </View>
          )}
          <Image source={{ uri: item.uri }} className="h-24 w-24 rounded-lg" resizeMode="cover" />
          <TouchableOpacity
            onPress={() => handleDeletePhoto(item.uri)}
            className="absolute inset-0 bg-black/35 items-center justify-center rounded-lg"
          >
            <Ionicons name="close" size={22} color="white" />
          </TouchableOpacity>
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
    if (phone.trim()) textChanges.phone = phone.trim();
    if (email.trim()) textChanges.email = email.trim();
    if (social.trim()) textChanges.social = { instagram: social.trim() };
    if (categories.length) textChanges.categories = categories;

    // Geocode address to get lat/lng when provided
    if (addressCoords?.latitude && addressCoords?.longitude) {
      textChanges.latitude = addressCoords.latitude;
      textChanges.longitude = addressCoords.longitude;
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

    const existing = photos.filter((p) => !p.isNew && p.id);
    const newOnes = photos.filter((p) => p.isNew);

    const deletePhotoIds = (initial.images ?? [])
      .map((img) => img.id ?? img.url)
      .filter((id) => !photos.some((p) => p.id === id));

    const order = photos.map((p) => p.id ?? p.uri);

    return { textChanges, existing, newOnes, deletePhotoIds, order };
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome do brechó.");
      return;
    }

    const { textChanges, newOnes, deletePhotoIds, order } = await buildPayload();

    if (
      !thriftStore &&
      Object.keys(textChanges).length === 0 &&
      newOnes.length === 0 &&
      deletePhotoIds.length === 0
    ) {
      Alert.alert("Nada para salvar", "Adicione informações antes de enviar.");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      Object.entries(textChanges).forEach(([k, v]) => {
        if (v === undefined) return;
        form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      });

      if (deletePhotoIds.length) form.append("deletePhotoIds", JSON.stringify(deletePhotoIds));
      if (order.length) form.append("photoOrder", JSON.stringify(order));

      newOnes.forEach((photo, idx) => {
        form.append("newPhotos", {
          uri: photo.uri,
          name: `photo-${idx}.jpg`,
          type: "image/jpeg"
        } as any);
      });

      if (thriftStore?.id) {
        await createOrUpdateStoreUseCase.executeUpdate(thriftStore.id, form);
      } else {
        await createOrUpdateStoreUseCase.executeCreate(form);
      }

      navigation.goBack();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <View className="bg-white/90 border-b border-gray-200">
        <View className="flex-row items-center justify-between p-4">
          <Pressable className="w-8 h-8 items-center justify-center" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="text-xl font-bold text-[#374151]">{thriftStore ? "Meu Brechó" : "Cadastrar Brechó"}</Text>
          <View className="w-8 h-8" />
        </View>
      </View>

      <View className="flex-1 bg-[#F3F4F6]">
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-lg font-bold mb-4">Informações Gerais</Text>
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Nome do Brechó</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Brechó Estilo Único"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Descrição</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Descreva o que torna seu brechó especial"
                multiline
                numberOfLines={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
                textAlignVertical="top"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Horário de Funcionamento</Text>
              <TextInput
                value={hours}
                onChangeText={setHours}
                placeholder="Ex: Seg-Sex 9h-18h, Sáb 10h-14h"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
              />
            </View>
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-lg font-bold mb-4">Fotos do Brechó</Text>
          <DraggableFlatList
            data={photos}
            horizontal
            keyExtractor={(item, index) => item.id ?? item.uri ?? `photo-${index}`}
            onDragEnd={({ data }) => setPhotos([...data])}
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
              <Text className="text-sm font-medium text-gray-700 mb-1">Endereço</Text>
              <TextInput
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  setAddressCoords(null);
                }}
                placeholder="Rua, Número, Bairro"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
              />
              {addressSuggestions.length > 0 && (
                <View className="mt-2 bg-white border border-gray-200 rounded-lg">
                  {addressSuggestions.map((s) => (
                    <Pressable
                      key={s.label + s.latitude}
                      className="px-3 py-2"
                      onPress={() => {
                        setAddress(s.label);
                        setAddressCoords({ latitude: s.latitude, longitude: s.longitude });
                        setAddressSuggestions([]);
                      }}
                    >
                      <Text className="text-sm text-[#374151]">{s.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="(11) 99999-9999"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="contato@brecho.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Redes Sociais</Text>
              <TextInput
                value={social}
                onChangeText={setSocial}
                placeholder="@seu_brecho"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
              />
            </View>
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-lg font-bold mb-4">Categorias</Text>
          <View className="flex-row flex-wrap gap-2">
            {categoryOptions.map((label) => {
              const active = categories.includes(label);
              return (
                <Pressable
                  key={label}
                  className={`py-2 px-4 rounded-full text-sm font-semibold ${
                    active ? "bg-[#B55D05] text-white" : "bg-gray-200 text-gray-700"
                  }`}
                  onPress={() => toggleCategory(label)}
                >
                  <Text className={`text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
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
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
