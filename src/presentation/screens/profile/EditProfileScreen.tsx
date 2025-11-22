import React, { useEffect, useState } from "react";
import {
  StatusBar,
  View,
  Text,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TouchableWithoutFeedback
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { theme } from "../../../shared/theme";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "editProfile">>();
  const { getProfileUseCase, updateProfileUseCase } = useDependencies();
  const goBackSafe = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("tabs" as never);
    }
  };

  const preloaded = route.params?.profile;
  const [name, setName] = useState(preloaded?.name ?? "");
  const [bio, setBio] = useState(preloaded?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(preloaded?.avatarUrl);
  const [stagedAvatarUri, setStagedAvatarUri] = useState<string | undefined>(undefined);
  const [notifyNewStores, setNotifyNewStores] = useState(preloaded?.notifyNewStores ?? true);
  const [notifyPromos, setNotifyPromos] = useState(preloaded?.notifyPromos ?? false);
  const [, setEmail] = useState<string | undefined>(undefined);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);

  const STORAGE_NOTIFY_STORES = "preferences.notifyNewStores";
  const STORAGE_NOTIFY_PROMOS = "preferences.notifyPromos";
  // Keeping max bio as a constant for validations
  const MAX_BIO = 200;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (preloaded) {
        setEmail(preloaded.email);
        return;
      }
      const profile = await getProfileUseCase.execute();
      if (!mounted) return;
      setName(profile.name);
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatarUrl);
      setNotifyNewStores(profile.notifyNewStores);
      setNotifyPromos(profile.notifyPromos);
      setEmail(profile.email);
    };
    const loadPrefs = async () => {
      const [storedStores, storedPromos] = await Promise.all([
        AsyncStorage.getItem(STORAGE_NOTIFY_STORES),
        AsyncStorage.getItem(STORAGE_NOTIFY_PROMOS)
      ]);
      if (!mounted) return;
      if (storedStores !== null) setNotifyNewStores(storedStores === "true");
      if (storedPromos !== null) setNotifyPromos(storedPromos === "true");
    };
    load();
    loadPrefs();
    return () => {
      mounted = false;
    };
  }, [STORAGE_NOTIFY_PROMOS, STORAGE_NOTIFY_STORES, getProfileUseCase, preloaded]);

  const remainingBio = MAX_BIO - bio.length;
  const canSave = name.trim().length > 0 && remainingBio >= 0;

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert("Verifique os campos", "Nome é obrigatório e bio deve ter no máximo 200 caracteres.");
      return;
    }
    await Promise.all([
      AsyncStorage.setItem(STORAGE_NOTIFY_STORES, String(notifyNewStores)),
      AsyncStorage.setItem(STORAGE_NOTIFY_PROMOS, String(notifyPromos))
    ]);
    await updateProfileUseCase.execute({
      name: name.trim(),
      bio: bio.trim(),
      notifyNewStores,
      notifyPromos
    });
    goBackSafe();
  };

  const placeholderCamera =
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80";
  const placeholderGallery =
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=60";

  const pickImageFromCamera = async () => {
    // TODO: swap with expo-image-picker when backend/storage is ready.
    Alert.alert("Câmera simulada", "Usaremos a câmera real quando o backend estiver pronto.");
    setStagedAvatarUri(placeholderCamera);
    setShowAvatarSheet(false);
  };

  const pickImageFromLibrary = async () => {
    // TODO: swap with expo-image-picker when backend/storage is ready.
    Alert.alert("Galeria simulada", "Usaremos a galeria real quando o backend estiver pronto.");
    setStagedAvatarUri(placeholderGallery);
    setShowAvatarSheet(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="bg-white/80 backdrop-blur-sm">
        <View className="flex-row items-center p-4">
          <Pressable
            className="p-2 rounded-full"
            onPress={goBackSafe}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold pr-10 text-[#1F2937]">Editar Perfil</Text>
        </View>
      </View>

      <ScrollView className="flex-1 bg-[#F3F4F6]" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-white">
          <View className="flex-col items-center p-6 space-y-4">
            <View className="relative">
              {stagedAvatarUri || avatarUrl ? (
                <Image
                  source={{ uri: stagedAvatarUri ?? avatarUrl }}
                  className="w-32 h-32 rounded-full"
                  style={{ borderWidth: 4, borderColor: "#EC4899" }}
                />
              ) : (
                <View
                  className="w-32 h-32 rounded-full bg-gray-200"
                  style={{ borderWidth: 4, borderColor: "#EC4899" }}
                />
              )}
              <Pressable
                className="absolute bottom-0 right-0 bg-[#B55D05] p-2 rounded-full shadow-lg"
                onPress={() => setShowAvatarSheet(true)}
              >
                <Ionicons name="pencil" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="px-4 py-4 space-y-6">
          <View>
            <Text className="text-sm font-bold text-[#1F2937] mb-1">Nome de Usuário</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg"
              placeholder="Seu nome"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="mt-2">
            <Text className="text-sm font-bold text-[#1F2937] mb-1">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={(text) => setBio(text.slice(0, MAX_BIO))}
              multiline
              numberOfLines={6}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg"
              placeholder="Adicione uma breve biografia..."
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
            <Text className="text-xs text-gray-500 text-right mt-1">{remainingBio} caracteres restantes</Text>
          </View>

          <View className="mt-2">
            <Text className="text-lg font-bold mb-2 text-[#1F2937]">Preferências de Notificação</Text>
            <View className="bg-white rounded-lg shadow-sm">
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Text className="text-[#374151]">Novos brechós</Text>
                <Switch
                  value={notifyNewStores}
                  onValueChange={setNotifyNewStores}
                  trackColor={{ true: theme.colors.highlight, false: "#E5E7EB" }}
                  thumbColor="white"
                />
              </View>
              <View className="flex-row items-center justify-between p-4">
                <Text className="text-[#374151]">Promoções</Text>
                <Switch
                  value={notifyPromos}
                  onValueChange={setNotifyPromos}
                  trackColor={{ true: theme.colors.highlight, false: "#E5E7EB" }}
                  thumbColor="white"
                />
              </View>
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-lg font-bold mb-2 text-[#1F2937]">Contas Vinculadas</Text>
            <View className="bg-white rounded-lg shadow-sm">
              <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <View className="flex-row items-center gap-3">
                  <Image
                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCs4ofAICgKzRatz2-6yuNmujIw2mCUhw9GNrmVY4_Uju1JCgXYzC1C9ECxGssQJxlurPdEjwnaEeMr4Nda4c8zkamodwW6uTao5eQDiUvsr30Es780Z7ZdG0ohZWSsrIE8yPI4rRKy4ByWVmx-W1P4KNgPRb--SXVjRD3y0VFwYjrgKbr_cCyQxBhDryMiRLtvZPJOPZL7z1Im_u0zAZte144oNCoqYZqDmJbwY_vX_meKUTqbNnd-feOo1HZt2JiTvc4ui2bENGY" }}
                    className="w-6 h-6"
                  />
                  <Text className="text-[#374151]">Instagram</Text>
                </View>
                <Text className="text-sm text-[#B55D05]">Conectar</Text>
              </Pressable>
              <Pressable className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                  <Image
                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGed5Z4pxAPJlUqOVgX5iAMqujCDvqIzPUy1SpYm-7DVhvOb5NnNcF9Uoa7RphRC-Bpim_kWKIwtxKchRqV4qWV7hCH0AcCkEfXyATgADCIOjk-rCov53EFb447NdQpBYhDieKRbztjFPf35COQA3Gs8YC2XW7vDzXpKacf4KbhRPboKJ6jIrnn3-3OJYXJB0BtkZwoGtGyhi2xlKYpPI_GJwRY-dwGdhml95o1C7CyqagNEqv6HQDtGRzZtuKvdCjWXybSWEifzc" }}
                    className="w-6 h-6"
                  />
                  <Text className="text-[#374151]">Facebook</Text>
                </View>
                <Text className="text-sm text-gray-500">Conectado</Text>
              </Pressable>
            </View>
          </View>

          <View className="flex flex-col gap-4 pt-4">
            <Pressable
              disabled={!canSave}
              className={`rounded-lg py-3 px-4 items-center ${canSave ? "bg-[#B55D05]" : "bg-gray-300"}`}
              onPress={handleSave}
            >
              <Text className={`font-bold ${canSave ? "text-white" : "text-gray-500"}`}>Salvar Alterações</Text>
            </Pressable>
            <Pressable className="items-center justify-center p-4">
              <Text className="font-bold text-red-500">Sair</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showAvatarSheet} transparent animationType="fade" onRequestClose={() => setShowAvatarSheet(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAvatarSheet(false)}>
          <View className="flex-1 bg-black/40" />
        </TouchableWithoutFeedback>
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 space-y-3 shadow-2xl">
          <Text className="text-center text-sm font-semibold text-[#6B7280] mb-1">Atualizar foto</Text>
          <Pressable
            className="flex-row items-center gap-3 py-3"
            onPress={pickImageFromCamera}
            accessibilityRole="button"
          >
            <Ionicons name="camera" size={20} color={theme.colors.highlight} />
            <Text className="text-base font-semibold text-[#1F2937]">Tirar foto</Text>
          </Pressable>
          <Pressable
            className="flex-row items-center gap-3 py-3"
            onPress={pickImageFromLibrary}
            accessibilityRole="button"
          >
            <Ionicons name="image" size={20} color={theme.colors.highlight} />
            <Text className="text-base font-semibold text-[#1F2937]">Escolher da galeria</Text>
          </Pressable>
          <Pressable className="items-center py-2" onPress={() => setShowAvatarSheet(false)}>
            <Text className="text-sm text-[#6B7280]">Cancelar</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
