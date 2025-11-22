import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { theme } from "../../../shared/theme";
import { isValidEmail, validatePassword } from "../../../domain/validation/auth";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { firebaseAuth } from "../../../services/firebase/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signInWithEmailUseCase, signInWithGoogleUseCase } = useDependencies();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  WebBrowser.maybeCompleteAuthSession();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "YOUR_GOOGLE_CLIENT_ID",
    iosClientId: "YOUR_IOS_CLIENT_ID",
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
    scopes: ["profile", "email"]
  });

  useEffect(() => {
    const doGoogle = async () => {
      if (response?.type === "success" && response.params?.id_token) {
        const { id_token } = response.params;
        try {
          setLoading(true);
          await signInWithGoogleUseCase.execute(id_token);
          navigation.navigate("tabs");
        } catch {
          setError("Não foi possível entrar com Google. Tente novamente.");
        } finally {
          setLoading(false);
        }
      }
    };
    doGoogle();
  }, [navigation, response, signInWithGoogleUseCase]);

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
              Conheça seu novo{"\n"}Guia de Brechós!
            </Text>
            <Text className="text-lg text-center text-[#374151]/80 pt-2 pb-8">
              Explore achados únicos
            </Text>

            <View className="w-full space-y-4">
              <Pressable
                className="h-12 rounded-lg bg-[#F3F4F6] flex-row items-center justify-center gap-3 px-5"
                disabled={!request || loading}
                onPress={() => promptAsync()}
              >
                <AntDesign name="google" size={20} color="#4285F4" />
                <Text className="text-base font-bold text-[#374151]">Entrar com Google</Text>
              </Pressable>
              {Platform.OS === "ios" ? (
                <Pressable className="h-12 rounded-lg bg-[#F3F4F6] flex-row items-center justify-center gap-3 px-5">
                  <Ionicons name="logo-apple" size={20} color="#111" />
                  <Text className="text-base font-bold text-[#374151]">Entrar com Apple</Text>
                </Pressable>
              ) : null}
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
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seuemail@dominio.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="h-14 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 text-base text-[#374151]"
                />
              </View>

              <View className="mt-2">
                <View className="flex-row items-center justify-between pb-2">
                  <Text className="text-base font-medium text-[#374151]">Senha</Text>
                </View>
                <View className="relative w-full">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
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
                <Pressable className="items-end mt-2" onPress={() => setResetVisible(true)}>
                  <Text className="text-sm font-medium text-[#B55D05]">Esqueceu sua senha?</Text>
                </Pressable>
              </View>
            </View>

            {error ? <Text className="text-sm text-red-500 w-full text-left mt-2">{error}</Text> : null}

            <View className="w-full pt-6">
              <Pressable
                className={`h-14 rounded-lg items-center justify-center ${
                  loading ? "bg-[#B55D05]/60" : "bg-[#B55D05]"
                }`}
                disabled={loading}
                onPress={async () => {
                  setError(null);
                  if (!isValidEmail(email)) {
                    setError("Digite um e-mail válido.");
                    return;
                  }
                  const pass = validatePassword(password);
                  if (!pass.valid) {
                    setError(pass.error ?? "Senha inválida.");
                    return;
                  }
                  try {
                    setLoading(true);
                    await signInWithEmailUseCase.execute(email.trim(), password);
                    navigation.navigate("tabs");
                  } catch {
                    setError("Não foi possível entrar. Verifique suas credenciais.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text className="text-base font-bold text-white">{loading ? "Entrando..." : "Entrar"}</Text>
              </Pressable>
            </View>

            <View className="pt-8 flex-row">
              <Text className="text-base text-[#374151]/80">Não tem uma conta? </Text>
              <Pressable onPress={() => navigation.navigate("signup")}>
                <Text className="text-base font-bold text-[#B55D05]">Cadastre-se</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={resetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setResetVisible(false);
          setResetSuccess(false);
          setResetError(null);
          setResetEmail("");
        }}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="w-full max-w-md bg-white rounded-2xl p-6">
            {resetSuccess ? (
              <>
                <Text className="text-base text-[#374151] mb-6">
                  Você receberá um e-mail em breve, verifique sua caixa de entrada.
                </Text>
                <Pressable
                  className="h-12 rounded-lg bg-[#B55D05] items-center justify-center"
                  onPress={() => {
                    setResetVisible(false);
                    setResetSuccess(false);
                    setResetError(null);
                    setResetEmail("");
                  }}
                >
                  <Text className="text-white font-bold">OK</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text className="text-base text-[#374151] mb-4">
                  Nos informe seu e-mail para enviarmos o link de redefinição de senha
                </Text>
                <TextInput
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="seuemail@dominio.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="h-12 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 text-base text-[#374151]"
                />
                {resetError ? <Text className="text-sm text-red-500 mt-2">{resetError}</Text> : null}
                <Pressable
                  className={`h-12 rounded-lg items-center justify-center mt-4 ${
                    resetLoading ? "bg-[#B55D05]/60" : "bg-[#B55D05]"
                  }`}
                  disabled={resetLoading}
                  onPress={async () => {
                    setResetError(null);
                    if (!isValidEmail(resetEmail)) {
                      setResetError("Digite um e-mail válido.");
                      return;
                    }
                    try {
                      setResetLoading(true);
                      await sendPasswordResetEmail(firebaseAuth(), resetEmail.trim());
                      setResetSuccess(true);
                    } catch {
                      setResetError("Não foi possível enviar o e-mail. Tente novamente.");
                    } finally {
                      setResetLoading(false);
                    }
                  }}
                >
                  {resetLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold">Enviar</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
