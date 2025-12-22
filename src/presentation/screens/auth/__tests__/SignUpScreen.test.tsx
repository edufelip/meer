import React from "react";
import { render } from "@testing-library/react-native";
import { SignUpScreen } from "../SignUpScreen";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn(), reset: jest.fn() })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000" } }
}));

jest.mock("../../../../hooks/useSignup", () => ({
  useSignup: () => ({ mutateAsync: jest.fn(), status: "idle" })
}));

jest.mock("../../../../storage/authStorage", () => ({
  saveTokens: jest.fn()
}));

jest.mock("../../../../api/client", () => ({
  primeApiToken: jest.fn()
}));

jest.mock("../../../../storage/profileCache", () => ({
  cacheProfile: jest.fn()
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getProfileUseCase: { execute: jest.fn().mockResolvedValue(null) }
  })
}));

describe("SignUpScreen", () => {
  it("renders the signup header", () => {
    const { getByText } = render(<SignUpScreen />);
    expect(getByText("Crie sua conta")).toBeTruthy();
  });
});
