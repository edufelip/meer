import React from "react";
import { Platform } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { LoginScreen } from "../LoginScreen";

const mockConfigure = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockGetProfile = jest.fn();
const mockLogin = jest.fn();
const mockGoogleLogin = jest.fn();
const mockAppleLogin = jest.fn();
const mockForgotPassword = jest.fn();
const mockSaveTokens = jest.fn();
const mockCacheProfile = jest.fn();
const mockPrimeApiToken = jest.fn();
const mockHasPlayServices = jest.fn();
const mockGoogleSignIn = jest.fn();
const mockAppleSignIn = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ reset: mockReset, navigate: mockNavigate })
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: (...args: any[]) => mockConfigure(...args),
    hasPlayServices: (...args: any[]) => mockHasPlayServices(...args),
    signIn: (...args: any[]) => mockGoogleSignIn(...args)
  }
}));

jest.mock("expo-apple-authentication", () => ({
  signInAsync: (...args: any[]) => mockAppleSignIn(...args),
  AppleAuthenticationScope: { FULL_NAME: "full", EMAIL: "email" }
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
  AntDesign: () => null
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getProfileUseCase: { execute: (...args: any[]) => mockGetProfile(...args) }
  })
}));

jest.mock("../../../../hooks/useLogin", () => ({
  useLogin: () => ({ mutateAsync: (...args: any[]) => mockLogin(...args), status: "idle" })
}));

jest.mock("../../../../hooks/useLoginWithGoogle", () => ({
  useLoginWithGoogle: () => ({ mutateAsync: (...args: any[]) => mockGoogleLogin(...args), status: "idle" })
}));

jest.mock("../../../../hooks/useLoginWithApple", () => ({
  useLoginWithApple: () => ({ mutateAsync: (...args: any[]) => mockAppleLogin(...args), status: "idle" })
}));

jest.mock("../../../../hooks/useForgotPassword", () => ({
  useForgotPassword: () => ({ mutateAsync: (...args: any[]) => mockForgotPassword(...args), status: "idle" })
}));

jest.mock("../../../../api/client", () => ({
  getApiBaseUrl: jest.fn().mockResolvedValue("https://api"),
  primeApiToken: (...args: any[]) => mockPrimeApiToken(...args),
  setDebugApiBaseUrlOverride: jest.fn()
}));

jest.mock("../../../../storage/authStorage", () => ({
  saveTokens: (...args: any[]) => mockSaveTokens(...args)
}));

jest.mock("../../../../storage/profileCache", () => ({
  cacheProfile: (...args: any[]) => mockCacheProfile(...args)
}));

describe("LoginScreen", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfile.mockResolvedValue(null);
    mockLogin.mockResolvedValue({ token: "token-1", refreshToken: "refresh-1", user: { id: "u1", name: "Ana", email: "ana@test.com" } });
    mockGoogleLogin.mockResolvedValue({ token: "token-2", refreshToken: "refresh-2", user: { id: "u2", name: "Bea", email: "bea@test.com" } });
    mockAppleLogin.mockResolvedValue({ token: "token-3", refreshToken: "refresh-3", user: { id: "u3", name: "Caio", email: "caio@test.com" } });
    mockForgotPassword.mockResolvedValue(undefined);
    mockHasPlayServices.mockResolvedValue(undefined);
    mockGoogleSignIn.mockResolvedValue({ data: { idToken: "google-token" } });
    mockAppleSignIn.mockResolvedValue({ identityToken: "apple-token", authorizationCode: "auth-code" });
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalPlatform, configurable: true, writable: true });
  });

  it("renders login screen and configures Google Signin", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText(/Guia Brechó/i)).toBeTruthy();
    expect(mockConfigure).toHaveBeenCalled();
  });

  it("shows error for invalid email", () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText("seuemail@dominio.com"), "bad-email");
    fireEvent.changeText(getByPlaceholderText("Sua senha"), "Senha1!");
    fireEvent.press(getByText("Entrar"));
    expect(getByText("Digite um e-mail válido.")).toBeTruthy();
  });

  it("allows short password without client validation", async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText("seuemail@dominio.com"), "user@example.com");
    fireEvent.changeText(getByPlaceholderText("Sua senha"), "123");

    await act(async () => {
      fireEvent.press(getByText("Entrar"));
    });

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({ email: "user@example.com", password: "123" }));
    expect(queryByText("A senha deve ter pelo menos 6 caracteres.")).toBeNull();
  });

  it("navigates to signup from CTA", () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText("Cadastre-se"));
    expect(mockNavigate).toHaveBeenCalledWith("signup");
  });

  it("logs in and resets navigation on success", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText("seuemail@dominio.com"), "user@example.com");
    fireEvent.changeText(getByPlaceholderText("Sua senha"), "Senha1!");

    await act(async () => {
      fireEvent.press(getByText("Entrar"));
    });

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({ email: "user@example.com", password: "Senha1!" }));
    expect(mockSaveTokens).toHaveBeenCalledWith("token-1", "refresh-1");
    expect(mockCacheProfile).toHaveBeenCalledWith({ id: "u1", name: "Ana", email: "ana@test.com" });
    expect(mockPrimeApiToken).toHaveBeenCalledWith("token-1");
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "tabs" }] });
  });

  it("opens forgot password modal and submits", async () => {
    const { getByText, getAllByPlaceholderText } = render(<LoginScreen />);
    fireEvent.press(getByText("Esqueceu sua senha?"));
    expect(getByText("Nos informe seu e-mail para enviarmos o link de redefinição de senha")).toBeTruthy();

    const resetInputs = getAllByPlaceholderText("seuemail@dominio.com");
    fireEvent.changeText(resetInputs[resetInputs.length - 1], "reset@example.com");
    await act(async () => {
      fireEvent.press(getByText("Enviar"));
    });

    await waitFor(() => expect(mockForgotPassword).toHaveBeenCalledWith({ email: "reset@example.com" }));
    expect(getByText("Você receberá um e-mail em breve, verifique sua caixa de entrada.")).toBeTruthy();
  });

  it("shows reset email validation error", () => {
    const { getByText, getAllByPlaceholderText } = render(<LoginScreen />);
    fireEvent.press(getByText("Esqueceu sua senha?"));
    const resetInputs = getAllByPlaceholderText("seuemail@dominio.com");
    fireEvent.changeText(resetInputs[resetInputs.length - 1], "bad-email");
    fireEvent.press(getByText("Enviar"));
    expect(getByText("Digite um e-mail válido.")).toBeTruthy();
  });

  it("calls Google login hook on press", async () => {
    Object.defineProperty(Platform, "OS", { value: "android", configurable: true, writable: true });
    const { getByText } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText("Entrar com Google"));
    });

    await waitFor(() => expect(mockGoogleLogin).toHaveBeenCalledWith({
      provider: "google",
      idToken: "google-token",
      client: "android"
    }));
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "tabs" }] });
  });

  it("calls Apple login hook on press", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true, writable: true });
    const { getByText } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText("Entrar com Apple"));
    });

    await waitFor(() => expect(mockAppleLogin).toHaveBeenCalledWith({
      provider: "apple",
      idToken: "apple-token",
      authorizationCode: "auth-code",
      client: "ios"
    }));
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "tabs" }] });
  });
});
