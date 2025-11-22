import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import { theme } from "../../../shared/theme";

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
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState(initial.social?.instagram ?? "");
  const [categories, setCategories] = useState<string[]>(initial.categories ?? []);

  const toggleCategory = (label: string) => {
    setCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const categoryOptions = ["Feminino", "Masculino", "Infantil", "Casa", "Plus Size", "Luxo"];

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]" edges={["top", "left", "right"]}>
      <View className="bg-white/90 border-b border-gray-200">
        <View className="flex-row items-center justify-between p-4">
          <Pressable className="w-8 h-8 items-center justify-center" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
          </Pressable>
          <Text className="text-xl font-bold text-[#374151]">{thriftStore ? "Meu Brechó" : "Cadastrar Brechó"}</Text>
          <View className="w-8 h-8" />
        </View>
      </View>

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
          <Text className="text-lg font-bold mb-4">Fotos do Local</Text>
          <View className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center">
            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            <Text className="text-sm text-gray-600 mt-2">Arraste e solte ou</Text>
            <Pressable className="mt-2">
              <Text className="font-semibold text-[#B55D05]">Clique para adicionar fotos</Text>
            </Pressable>
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <Text className="text-lg font-bold mb-4">Endereço e Contato</Text>
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Endereço</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Rua, Número, Bairro"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
              />
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
          <Pressable className="w-full bg-[#B55D05] rounded-full py-3 px-4 shadow-lg items-center">
            <Text className="font-bold text-white">
              {thriftStore ? "Salvar alterações" : "Criar Brechó"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
