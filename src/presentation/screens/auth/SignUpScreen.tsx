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
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { theme } from "../../../shared/theme";
import { isValidEmail, validatePassword, passwordsMatch } from "../../../domain/validation/auth";
import { useSignup } from "../../../hooks/useSignup";
import { saveTokens } from "../../../storage/authStorage";

export function SignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const signupMutation = useSignup();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
            <View className="flex-row items-center w-full mb-6">
              <Pressable
                className="p-2 rounded-full"
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
              </Pressable>
              <View className="flex-1 items-center">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="storefront" size={28} color={theme.colors.accent} />
                  <Text className="text-xl font-bold text-[#374151]">Guia Brechó</Text>
                </View>
              </View>
              <View style={{ width: 38 }} />
            </View>

            <Text className="text-[32px] font-bold text-center text-[#374151] leading-tight">
              Crie sua conta
            </Text>
            <Text className="text-base text-center text-[#374151]/80 pt-1 pb-8">
              Comece a explorar achados incríveis!
            </Text>

            <View className="w-full space-y-4">
              <View>
                <Text className="text-base font-medium text-[#374151] pb-2">Nome Completo</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9CA3AF"
                  className="h-14 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 text-base text-[#374151]"
                />
              </View>

              <View className="mt-4">
                <Text className="text-base font-medium text-[#374151] pb-2">E-mail</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seuemail@dominio.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="h-14 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 text-base text-[#374151]"
                />
              </View>

              <View className="mt-4">
                <Text className="text-base font-medium text-[#374151] pb-2">Senha</Text>
                <View className="relative w-full">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Crie uma senha"
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
              </View>

              <View className="mt-4">
                <Text className="text-base font-medium text-[#374151] pb-2">Confirme sua Senha</Text>
                <View className="relative w-full">
                  <TextInput
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Repita a senha"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!confirmVisible}
                    className="h-14 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 pr-12 text-base text-[#374151]"
                  />
                  <Pressable
                    className="absolute inset-y-0 right-0 px-4 flex-row items-center"
                    onPress={() => setConfirmVisible((v) => !v)}
                  >
                    <Ionicons
                      name={confirmVisible ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            {error ? <Text className="text-sm text-red-500 w-full text-left mt-2">{error}</Text> : null}

            <View className="w-full pt-10">
              <Pressable
                className={`h-14 rounded-lg items-center justify-center ${
                  loading ? "bg-[#B55D05]/60" : "bg-[#B55D05]"
                }`}
                disabled={loading}
                onPress={async () => {
                  setError(null);
                  if (!fullName.trim()) {
                    setError("Informe seu nome completo.");
                    return;
                  }
                  if (!isValidEmail(email)) {
                    setError("Digite um e-mail válido.");
                    return;
                  }
                  const pass = validatePassword(password);
                  if (!pass.valid) {
                    setError(pass.error ?? "Senha inválida.");
                    return;
                  }
                  if (!passwordsMatch(password, confirm)) {
                    setError("As senhas não coincidem.");
                    return;
                  }
                  try {
                    setLoading(true);
                    const auth = await signupMutation.mutateAsync({
                      name: fullName.trim(),
                      email: email.trim(),
                      password
                    });
                    await saveTokens(auth.token, auth.refreshToken);
                    navigation.navigate("tabs");
                  } catch {
                    setError("Não foi possível criar a conta. Tente novamente.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text className="text-base font-bold text-white">{loading ? "Cadastrando..." : "Cadastrar"}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
