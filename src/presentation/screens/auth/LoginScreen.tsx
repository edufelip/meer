import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { theme } from "../../../shared/theme";

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, alignItems: "center", flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-md items-center">
            <View className="flex-row items-center gap-2 pb-8">
              <MaterialIcons name="storefront" size={32} color={theme.colors.accent} />
              <Text className="text-2xl font-bold text-[#374151]">Guia Brechó</Text>
            </View>

            <Text className="text-[32px] font-bold text-center text-[#374151] leading-tight">
              Conheça seu novo Guia de Brechós!
            </Text>
            <Text className="text-base text-center text-[#374151]/80 pt-1 pb-8">
              Explore achados únicos
            </Text>

            <View className="w-full space-y-3">
              <Pressable className="h-12 rounded-lg bg-[#F3F4F6] flex-row items-center justify-center gap-3 px-5">
                <AntDesign name="google" size={18} color="#4285F4" />
                <Text className="text-base font-bold text-[#374151]">Entrar com Google</Text>
              </Pressable>
              <Pressable className="h-12 rounded-lg bg-[#F3F4F6] flex-row items-center justify-center gap-3 px-5">
                <AntDesign name="apple1" size={18} color="#111" />
                <Text className="text-base font-bold text-[#374151]">Entrar com Apple</Text>
              </Pressable>
            </View>

            <View className="flex-row items-center w-full gap-4 py-6">
              <View className="flex-1 h-px bg-[#E5E7EB]" />
              <Text className="text-sm text-[#374151]/60">ou</Text>
              <View className="flex-1 h-px bg-[#E5E7EB]" />
            </View>

            <View className="w-full space-y-4">
              <View>
                <Text className="text-base font-medium text-[#374151] pb-2">E-mail</Text>
                <TextInput
                  placeholder="seuemail@dominio.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="h-14 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 text-base text-[#374151]"
                />
              </View>

              <View>
                <View className="flex-row items-center justify-between pb-2">
                  <Text className="text-base font-medium text-[#374151]">Senha</Text>
                </View>
                <View className="relative w-full">
                  <TextInput
                    placeholder="Sua senha"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!passwordVisible}
                    className="h-14 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 pr-12 text-base text-[#374151]"
                  />
                  <Pressable
                    className="absolute inset-y-0 right-0 px-4 flex-row items-center"
                    onPress={() => setPasswordVisible((v) => !v)}
                  >
                    <Ionicons
                      name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
                <Pressable className="items-end mt-2">
                  <Text className="text-sm font-medium text-[#B55D05]">Esqueceu sua senha?</Text>
                </Pressable>
              </View>
            </View>

            <View className="w-full pt-6">
              <Pressable
                className="h-14 rounded-lg bg-[#B55D05] items-center justify-center"
                onPress={() => navigation.navigate("tabs")}
              >
                <Text className="text-base font-bold text-white">Entrar</Text>
              </Pressable>
            </View>

            <View className="pt-8 flex-row">
              <Text className="text-base text-[#374151]/80">Não tem uma conta? </Text>
              <Pressable>
                <Text className="text-base font-bold text-[#B55D05]">Cadastre-se</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
