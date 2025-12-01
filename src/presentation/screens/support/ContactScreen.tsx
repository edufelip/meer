import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StatusBar, Text, TextInput, View, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../../shared/theme";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";

export function ContactScreen() {
  const navigation = useNavigation();
  const { sendSupportMessageUseCase, getCachedProfileUseCase } = useDependencies();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasPrefilled = useRef(false);

  useEffect(() => {
    if (hasPrefilled.current) return;
    (async () => {
      try {
        const profile = await getCachedProfileUseCase.execute();
        if (profile) {
          setName((prev) => prev || profile.name || "");
          setEmail((prev) => prev || profile.email || "");
          hasPrefilled.current = true;
        }
      } catch {
        // ignore preload failures
      }
    })();
  }, [getCachedProfileUseCase]);

  const validate = () => {
    if (!name.trim()) return "Informe seu nome.";
    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) return "Digite um e-mail válido.";
    if (message.trim().length < 10) return "Mensagem precisa ter pelo menos 10 caracteres.";
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await sendSupportMessageUseCase.execute({
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
      });
      setMessage("");
      Alert.alert("Enviado", "Recebemos sua mensagem. Retornaremos em breve!");
    } catch {
      setError("Não foi possível enviar sua mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 bg-[#F3F4F6]">
        <View className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <View className="flex-row items-center p-4">
            <Pressable
              className="p-2 rounded-full"
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.highlight} />
            </Pressable>
            <Text className="flex-1 text-center text-lg font-bold pr-10 text-[#1F2937]">Fale Conosco</Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-[#1F2937]">Precisa de ajuda?</Text>
            <Text className="mt-2 text-gray-600 text-center">
              Estamos aqui para te ajudar. Escolha uma das opções abaixo para entrar em contato conosco.
            </Text>
          </View>

          <View className="space-y-4 mb-6">
            {[
              { icon: "mail", title: "E-mail", desc: "Envie sua dúvida para nosso time de suporte." },
              { icon: "chatbubble-ellipses", title: "Chat ao vivo", desc: "Converse com um de nossos atendentes." },
              { icon: "help-circle", title: "FAQ", desc: "Encontre respostas para as perguntas mais comuns." }
            ].map((item, index) => (
              <Pressable
                key={item.title}
                className={`flex-row items-center gap-4 p-4 bg-white rounded-xl shadow-sm ${index < 2 ? "mb-4" : ""}`}
              >
                <View className="bg-[#B55D05]1a p-3 rounded-full" style={{ backgroundColor: `${theme.colors.highlight}1a` }}>
                  <Ionicons name={item.icon as any} size={20} color={theme.colors.highlight} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-[#1F2937]">{item.title}</Text>
                  <Text className="text-sm text-gray-500">{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>

          <View className="bg-white rounded-xl shadow-sm p-6">
            <Text className="text-lg font-bold text-[#1F2937] mb-4">Ou nos envie uma mensagem</Text>
            <View className="space-y-4">
              <View className="mt-2">
                <Text className="block text-sm font-medium text-gray-700 mb-1">Seu nome</Text>
                <TextInput
                  placeholder="Digite seu nome"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
              <View className="mt-2">
                <Text className="block text-sm font-medium text-gray-700 mb-1">Seu e-mail</Text>
                <TextInput
                  placeholder="email@exemplo.com"
                  keyboardType="email-address"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View className="mt-2">
                <Text className="block text-sm font-medium text-gray-700 mb-1">Sua mensagem</Text>
                <TextInput
                  placeholder="Descreva seu problema ou dúvida aqui..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                  placeholderTextColor="#9CA3AF"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>
              {error ? <Text className="text-red-600 text-sm">{error}</Text> : null}
              <Pressable
                className={`w-full rounded-lg py-3 px-4 items-center mt-4 ${
                  loading ? "bg-[#B55D05]/60" : "bg-[#B55D05]"
                }`}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Enviar Mensagem</Text>}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
