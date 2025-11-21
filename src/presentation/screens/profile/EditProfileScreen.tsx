import React, { useMemo, useState } from "react";
import { StatusBar, View, Text, Pressable, Image, TextInput, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { User } from "../../../domain/entities/User";
import { theme } from "../../../shared/theme";

export function EditProfileScreen() {
  const navigation = useNavigation();
  const defaultUser: User & { bio?: string } = useMemo(
    () => ({
      id: "placeholder",
      name: "Thalyta",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuABzXIsPH5d7X_WqZhoqJYW9ofhaL-vi2zGcLXHtTDMYuSv2jzEHwVXOGjZt6cAx8hUaDxNal5Huvb-7J6c2sslZqfe1qY59NYv9Qe_b1OAI99SxUmYzBIlBnAET2nmzONoplYwa2SNA1WRlzHPAZ7jzRsPJ1cGX36johwLCs01vrqzgqiWpDVCTYxHuRlyfyNiUdPAKKbJrLP_rPYdwcdksyL_fJlmZnWJU6eBsf2mmvb0S3wje-tOWTAchV-wRy2uUP55qjEqYFI",
      email: "thalyta@email.com",
      bio: ""
    }),
    []
  );

  const [name, setName] = useState(defaultUser.name);
  const [bio, setBio] = useState(defaultUser.bio ?? "");
  const [notifyNewStores, setNotifyNewStores] = useState(true);
  const [notifyPromos, setNotifyPromos] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white/80 backdrop-blur-sm">
        <View className="flex-row items-center p-4">
          <Pressable
            className="p-2 rounded-full"
            onPress={() => navigation.goBack()}
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
              <Image
                source={{ uri: defaultUser.avatarUrl }}
                className="w-32 h-32 rounded-full"
                style={{ borderWidth: 4, borderColor: "#EC4899" }}
              />
              <Pressable className="absolute bottom-0 right-0 bg-[#B55D05] p-2 rounded-full shadow-lg">
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

          <View>
            <Text className="text-sm font-bold text-[#1F2937] mb-1">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg"
              placeholder="Adicione uma breve biografia..."
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
          </View>

          <View>
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

          <View>
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
            <Pressable className="bg-[#B55D05] text-white rounded-lg py-3 px-4 items-center">
              <Text className="font-bold text-white">Salvar Alterações</Text>
            </Pressable>
            <Pressable className="items-center justify-center p-4">
              <Text className="font-bold text-red-500">Sair</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
