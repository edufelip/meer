import React from "react";
import { render } from "@testing-library/react-native";
import { EditProfileScreen } from "../EditProfileScreen";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
  useRoute: () => ({ params: { profile: { id: "u1", name: "Ana", email: "ana@test.com", notifyNewStores: false, notifyPromos: false } } })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("../../../../hooks/useLogout", () => ({
  useLogout: () => jest.fn()
}));

jest.mock("../../../../app/navigation/navigationRef", () => ({
  navigationRef: {
    isReady: () => false,
    reset: jest.fn(),
    navigate: jest.fn()
  }
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getProfileUseCase: { execute: jest.fn().mockResolvedValue(null) },
    updateProfileUseCase: { execute: jest.fn().mockResolvedValue(null) },
    deleteAccountUseCase: { execute: jest.fn().mockResolvedValue(null) },
    requestAvatarUploadSlotUseCase: { execute: jest.fn().mockResolvedValue({ uploadUrl: "u", fileUrl: "f" }) }
  })
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] })
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: "file://img.jpg" }),
  SaveFormat: { JPEG: "jpeg" }
}));

jest.mock("expo-file-system/legacy", () => ({
  uploadAsync: jest.fn().mockResolvedValue({ status: 200 })
}));

describe("EditProfileScreen", () => {
  it("renders edit profile header", () => {
    const { getByText } = render(<EditProfileScreen />);
    expect(getByText("Editar Perfil")).toBeTruthy();
  });
});
