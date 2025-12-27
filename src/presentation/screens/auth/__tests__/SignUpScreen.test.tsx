import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { SignUpScreen } from "../SignUpScreen";

const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockSignup = jest.fn();
const mockSaveTokens = jest.fn();
const mockCacheProfile = jest.fn();
const mockPrimeApiToken = jest.fn();
const mockGetProfile = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack, reset: mockReset })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000" } }
}));

jest.mock("../../../../hooks/useSignup", () => ({
  useSignup: () => ({ mutateAsync: (...args: any[]) => mockSignup(...args), status: "idle" })
}));

jest.mock("../../../../storage/authStorage", () => ({
  saveTokens: (...args: any[]) => mockSaveTokens(...args)
}));

jest.mock("../../../../api/client", () => ({
  primeApiToken: (...args: any[]) => mockPrimeApiToken(...args)
}));

jest.mock("../../../../storage/profileCache", () => ({
  cacheProfile: (...args: any[]) => mockCacheProfile(...args)
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getProfileUseCase: { execute: (...args: any[]) => mockGetProfile(...args) }
  })
}));

describe("SignUpScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignup.mockResolvedValue({ token: "token-1", refreshToken: "refresh-1", user: { id: "u1", name: "Ana", email: "ana@test.com" } });
    mockGetProfile.mockResolvedValue(null);
  });

  it("renders the signup header", () => {
    const { getByText } = render(<SignUpScreen />);
    expect(getByText("Crie sua conta")).toBeTruthy();
  });

  it("shows error when name is missing", () => {
    const { getByText } = render(<SignUpScreen />);
    fireEvent.press(getByText("Cadastrar"));
    expect(getByText("Informe seu nome completo.")).toBeTruthy();
  });

  it("shows error for invalid email", () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText("Seu nome completo"), "User Name");
    fireEvent.changeText(getByPlaceholderText("seuemail@dominio.com"), "bad-email");
    fireEvent.changeText(getByPlaceholderText("Crie uma senha"), "Senha1!");
    fireEvent.changeText(getByPlaceholderText("Repita a senha"), "Senha1!");
    fireEvent.press(getByText("Cadastrar"));
    expect(getByText("Digite um e-mail válido.")).toBeTruthy();
  });

  it("shows error when passwords mismatch", () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText("Seu nome completo"), "User Name");
    fireEvent.changeText(getByPlaceholderText("seuemail@dominio.com"), "user@example.com");
    fireEvent.changeText(getByPlaceholderText("Crie uma senha"), "Senha1!");
    fireEvent.changeText(getByPlaceholderText("Repita a senha"), "Senha2!");
    fireEvent.press(getByText("Cadastrar"));
    expect(getByText("As senhas não coincidem.")).toBeTruthy();
  });

  it("navigates back when pressing Voltar", () => {
    const { getByLabelText } = render(<SignUpScreen />);
    fireEvent.press(getByLabelText("Voltar"));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("submits signup and resets navigation on success", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);
    fireEvent.changeText(getByPlaceholderText("Seu nome completo"), "Ana Silva");
    fireEvent.changeText(getByPlaceholderText("seuemail@dominio.com"), "ana@example.com");
    fireEvent.changeText(getByPlaceholderText("Crie uma senha"), "Senha1!");
    fireEvent.changeText(getByPlaceholderText("Repita a senha"), "Senha1!");

    await act(async () => {
      fireEvent.press(getByText("Cadastrar"));
    });

    await waitFor(() =>
      expect(mockSignup).toHaveBeenCalledWith({
        name: "Ana Silva",
        email: "ana@example.com",
        password: "Senha1!"
      })
    );
    expect(mockSaveTokens).toHaveBeenCalledWith("token-1", "refresh-1");
    expect(mockCacheProfile).toHaveBeenCalledWith({ id: "u1", name: "Ana", email: "ana@test.com" });
    expect(mockPrimeApiToken).toHaveBeenCalledWith("token-1");
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "tabs" }] });
  });
});
