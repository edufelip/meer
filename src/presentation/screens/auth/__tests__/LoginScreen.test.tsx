import React from "react";
import { render } from "@testing-library/react-native";
import { LoginScreen } from "../LoginScreen";

const mockConfigure = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ reset: jest.fn(), navigate: jest.fn() })
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: { configure: (...args: any[]) => mockConfigure(...args), hasPlayServices: jest.fn(), signIn: jest.fn() }
}));

jest.mock("expo-apple-authentication", () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: "full", EMAIL: "email" }
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
  AntDesign: () => null
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getProfileUseCase: { execute: jest.fn().mockResolvedValue(null) }
  })
}));

jest.mock("../../../../hooks/useLogin", () => ({
  useLogin: () => ({ mutateAsync: jest.fn(), status: "idle" })
}));

jest.mock("../../../../hooks/useLoginWithGoogle", () => ({
  useLoginWithGoogle: () => ({ mutateAsync: jest.fn(), status: "idle" })
}));

jest.mock("../../../../hooks/useLoginWithApple", () => ({
  useLoginWithApple: () => ({ mutateAsync: jest.fn(), status: "idle" })
}));

jest.mock("../../../../hooks/useForgotPassword", () => ({
  useForgotPassword: () => ({ mutateAsync: jest.fn(), status: "idle" })
}));

jest.mock("../../../../api/client", () => ({
  getApiBaseUrl: jest.fn().mockResolvedValue("https://api"),
  primeApiToken: jest.fn(),
  setDebugApiBaseUrlOverride: jest.fn()
}));

jest.mock("../../../../storage/authStorage", () => ({
  saveTokens: jest.fn()
}));

jest.mock("../../../../storage/profileCache", () => ({
  cacheProfile: jest.fn()
}));

describe("LoginScreen", () => {
  it("renders login screen and configures Google Signin", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText(/Guia Brechó/i)).toBeTruthy();
    expect(mockConfigure).toHaveBeenCalled();
  });
});
