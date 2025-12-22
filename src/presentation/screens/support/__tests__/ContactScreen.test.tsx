import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { ContactScreen } from "../ContactScreen";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack })
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    sendSupportMessageUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
    getCachedProfileUseCase: { execute: jest.fn().mockResolvedValue({ name: "Ana", email: "ana@test.com" }) }
  })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000" } }
}));

describe("ContactScreen", () => {
  it("prefills cached profile data", async () => {
    const { getByDisplayValue } = render(<ContactScreen />);
    await waitFor(() => expect(getByDisplayValue("Ana")).toBeTruthy());
    expect(getByDisplayValue("ana@test.com")).toBeTruthy();
  });
});
