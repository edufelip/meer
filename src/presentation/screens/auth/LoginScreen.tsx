import { AntDesign, Ionicons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  DevSettings,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiBaseUrl, primeApiToken, setDebugApiBaseUrlOverride } from "../../../api/client";
import type { RootStackParamList } from "../../../app/navigation/RootStack";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import { isValidEmail } from "../../../domain/validation/auth";
import { useForgotPassword } from "../../../hooks/useForgotPassword";
import { useLogin } from "../../../hooks/useLogin";
import { useLoginWithApple } from "../../../hooks/useLoginWithApple";
import { useLoginWithGoogle } from "../../../hooks/useLoginWithGoogle";
import { IS_DEBUG_API_BASE_URL } from "../../../network/config";
import { saveTokens } from "../../../storage/authStorage";
import { cacheProfile } from "../../../storage/profileCache";

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getProfileUseCase } = useDependencies();
  const loginMutation = useLogin();
  const googleMutation = useLoginWithGoogle();
  const appleMutation = useLoginWithApple();
  const forgotPasswordMutation = useForgotPassword();
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
  const [debugBaseUrlVisible, setDebugBaseUrlVisible] = useState(false);
  const [debugBaseUrlValue, setDebugBaseUrlValue] = useState("");

  useEffect(() => {
    if (!resetVisible) {
      // Reset state after the modal fully unmounts to avoid flicker on dismiss
      setResetSuccess(false);
      setResetError(null);
      setResetEmail("");
      setResetLoading(false);
    }
  }, [resetVisible]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_ID
    });
  }, []);

  const openDebugBaseUrlDialog = async () => {
    if (!IS_DEBUG_API_BASE_URL) return;
    try {
      const url = await getApiBaseUrl();
      setDebugBaseUrlValue(url);
      setDebugBaseUrlVisible(true);
    } catch {
      setDebugBaseUrlValue("");
      setDebugBaseUrlVisible(true);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken
      if (!idToken) {
        setError("Não foi possível entrar com Google. Tente novamente");
        return;
      }

      const platformClient = Platform.OS === "ios" ? "ios" : "android";
      const authResult = await googleMutation.mutateAsync({
        provider: "google",
        idToken,
        client: platformClient
      });
      await saveTokens(authResult.token, authResult.refreshToken);
      await cacheProfile({
        id: authResult.user.id,
        name: authResult.user.name,
        email: authResult.user.email
      });
      primeApiToken(authResult.token);
      try {
        const fullProfile = await getProfileUseCase.execute();
        await cacheProfile(fullProfile as any);
      } catch {
        // ignore
      }
      navigation.reset({ index: 0, routes: [{ name: "tabs" }] });
    } catch {
      setError("Não foi possível entrar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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
            <View className="items-center pb-4">
              <Image
                source={require("../../../../assets/images/app-icon.png")}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
            </View>

            {IS_DEBUG_API_BASE_URL ? (
              <Pressable
                onLongPress={openDebugBaseUrlDialog}
                delayLongPress={550}
                accessibilityRole="button"
                accessibilityLabel="Configurar URL da API (debug)"
              >
                <Text className="text-[32px] font-bold text-center text-[#374151] leading-tight">
                  Conheça seu novo{"\n"}Guia Brechó!
                </Text>
              </Pressable>
            ) : (
              <Text className="text-[32px] font-bold text-center text-[#374151] leading-tight">
                Conheça seu novo{"\n"}Guia Brechó!
              </Text>
            )}
            <Text className="text-xl text-center text-[#374151]/80 pt-2 pb-8">
              Explore achados únicos
            </Text>

            <View className="w-full space-y-12 gap-4">
              <Pressable
                className="h-12 rounded-lg bg-[#F3F4F6] flex-row items-center justify-center gap-3 px-5"
                disabled={loading}
                onPress={handleGoogleLogin}
                testID="login-google-button"
              >
                <AntDesign name="google" size={20} color="#4285F4" />
                <Text className="text-base font-bold text-[#374151]">Entrar com Google</Text>
              </Pressable>
              {Platform.OS === "ios" ? (
                <Pressable
                  className="h-12 rounded-lg bg-[#F3F4F6] flex-row items-center justify-center gap-3 px-10"
                  onPress={async () => {
                    try {
                      const credential = await AppleAuthentication.signInAsync({
                        requestedScopes: [
                          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                          AppleAuthentication.AppleAuthenticationScope.EMAIL
                        ]
                      });
                    if (credential.identityToken) {
                      setLoading(true);
                      const auth = await appleMutation.mutateAsync({
                        provider: "apple",
                        idToken: credential.identityToken,
                        authorizationCode: credential.authorizationCode ?? undefined,
                        client: "ios"
                      });
                      await saveTokens(auth.token, auth.refreshToken);
                      await cacheProfile({
                        id: auth.user.id,
                        name: auth.user.name,
                        email: auth.user.email
                      });
                      primeApiToken(auth.token);
                      try {
                        const fullProfile = await getProfileUseCase.execute();
                        await cacheProfile(fullProfile as any);
                      } catch {
                        // ignore fetch failure; cached minimal profile will be used
                      }
                      navigation.reset({ index: 0, routes: [{ name: "tabs" }] });
                    }
                  } catch (e: any) {
                      if (e?.code === "ERR_REQUEST_CANCELED") return;
                      setError("Não foi possível entrar com Apple.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  testID="login-apple-button"
                >
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
                  testID="login-email-input"
                />
              </View>

              <View className="mt-4">
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
                    testID="login-password-input"
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
                <Pressable className="items-end mt-2" onPress={() => setResetVisible(true)} testID="login-forgot-button">
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
                  try {
                    setLoading(true);
                    const auth = await loginMutation.mutateAsync({ email: email.trim(), password });
                    await saveTokens(auth.token, auth.refreshToken);
                    await cacheProfile({
                      id: auth.user.id,
                      name: auth.user.name,
                      email: auth.user.email
                    });
                    primeApiToken(auth.token);
                    try {
                      const fullProfile = await getProfileUseCase.execute();
                      await cacheProfile(fullProfile as any);
                    } catch {
                      // ignore
                    }
                    navigation.reset({ index: 0, routes: [{ name: "tabs" }] });
                  } catch (err: any) {
                    const isNetworkError =
                      (err?.isAxiosError && !err?.response) ||
                      (typeof err?.message === "string" && err.message.toLowerCase().includes("network"));
                    if (isNetworkError) {
                      Alert.alert("Sem conexão", "Não foi possível conectar. Verifique sua internet e tente novamente.");
                      setError("Sem conexão com a internet.");
                      return;
                    }
                    setError("Não foi possível entrar. Verifique suas credenciais.");
                  } finally {
                    setLoading(false);
                  }
                }}
                testID="login-submit-button"
              >
                <Text className="text-base font-bold text-white">{loading ? "Entrando..." : "Entrar"}</Text>
              </Pressable>
            </View>

            <View className="pt-8 flex-row">
              <Text className="text-base text-[#374151]/80">Não tem uma conta? </Text>
              <Pressable onPress={() => navigation.navigate("signup")} testID="login-signup-cta">
                <Text className="text-base font-bold text-[#B55D05]">Cadastre-se</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {IS_DEBUG_API_BASE_URL ? (
        <Modal
          visible={debugBaseUrlVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDebugBaseUrlVisible(false)}
        >
          <Pressable className="flex-1 bg-black/40" onPress={() => setDebugBaseUrlVisible(false)}>
            <View className="flex-1 items-center justify-center px-6">
              <Pressable
                className="w-full max-w-md bg-white rounded-2xl p-6"
                onPress={(e) => e.stopPropagation()}
              >
                <Text className="text-base font-bold text-[#374151] mb-2">Base URL da API (debug)</Text>
                <Text className="text-sm text-[#6B7280] mb-4">
                  Altere o endereço do backend usado pelo app. Ao salvar, o app recarrega apenas se a URL mudar.
                </Text>

                <TextInput
                  value={debugBaseUrlValue}
                  onChangeText={setDebugBaseUrlValue}
                  placeholder="https://seu-backend.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="h-12 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 text-base text-[#374151]"
                />

                <View className="flex-row gap-3 mt-4">
                  <Pressable
                    className="flex-1 h-12 rounded-lg bg-[#F3F4F6] items-center justify-center"
                    onPress={() => setDebugBaseUrlVisible(false)}
                  >
                    <Text className="font-bold text-[#374151]">Cancelar</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 h-12 rounded-lg bg-[#B55D05] items-center justify-center"
                    onPress={async () => {
                      try {
                        const res = await setDebugApiBaseUrlOverride(debugBaseUrlValue);
                        setDebugBaseUrlVisible(false);
                        if (res.changed) {
                          if (__DEV__) {
                            DevSettings.reload();
                          } else {
                            Alert.alert("Reinicie o app", "Feche e abra novamente para aplicar a nova URL.");
                          }
                        }
                      } catch {
                        Alert.alert("URL inválida", "Digite uma URL válida (http/https), sem espaços.");
                      }
                    }}
                  >
                    <Text className="text-white font-bold">Salvar</Text>
                  </Pressable>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      ) : null}
      <Modal
        visible={resetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetVisible(false)}
      >
        <Pressable className="flex-1 bg-black/40" onPress={() => setResetVisible(false)}>
          <View className="flex-1 items-center justify-center px-6">
            <Pressable
              className="w-full max-w-md bg-white rounded-2xl p-6"
              onPress={(e) => e.stopPropagation()}
            >
            {resetSuccess ? (
              <>
                <Text className="text-base text-[#374151] mb-6">
                  Você receberá um e-mail em breve, verifique sua caixa de entrada.
                </Text>
                <Pressable
                  className="h-12 rounded-lg bg-[#B55D05] items-center justify-center"
                  onPress={() => setResetVisible(false)}
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
                  testID="login-reset-email-input"
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
                      await forgotPasswordMutation.mutateAsync({ email: resetEmail.trim() });
                      setResetSuccess(true);
                    } catch {
                      setResetError("Não foi possível enviar o e-mail. Tente novamente.");
                    } finally {
                      setResetLoading(false);
                    }
                  }}
                  testID="login-reset-submit-button"
                >
                  {resetLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold">Enviar</Text>
                  )}
                </Pressable>
              </>
            )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      {loading ? (
        <View
          pointerEvents="auto"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50
          }}
        >
          <ActivityIndicator size="large" color="#B55D05" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
