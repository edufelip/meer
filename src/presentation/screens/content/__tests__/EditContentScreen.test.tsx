import React from "react";
import { Alert } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { EditContentScreen } from "../EditContentScreen";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

const mockUseRoute = jest.fn();
const mockUpdateContent = jest.fn();
const mockGetGuideContent = jest.fn();
const mockCreateContent = jest.fn();
const mockRequestContentUpload = jest.fn();
const mockDeleteContent = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn();
let mockBeforeRemoveHandler: any;
const mockDeps = {
  getGuideContentUseCase: { execute: (...args: any[]) => mockGetGuideContent(...args) },
  createContentUseCase: { execute: (...args: any[]) => mockCreateContent(...args) },
  updateContentUseCase: { execute: (...args: any[]) => mockUpdateContent(...args) },
  requestContentImageUploadUseCase: { execute: (...args: any[]) => mockRequestContentUpload(...args) },
  deleteContentUseCase: { execute: (...args: any[]) => mockDeleteContent(...args) }
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    addListener: (event: string, handler: any) => {
      if (event === "beforeRemove") mockBeforeRemoveHandler = handler;
      return mockAddListener(event, handler);
    }
  }),
  useRoute: () => mockUseRoute()
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => mockDeps
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: "images" }
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: "file://img.jpg" }),
  SaveFormat: { JPEG: "jpeg" }
}));

jest.mock("expo-file-system/legacy", () => ({
  uploadAsync: jest.fn().mockResolvedValue({ status: 200 })
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000" } }
}));

describe("EditContentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddListener.mockImplementation(() => jest.fn());
    mockUseRoute.mockReturnValue({ params: { articleId: "a1", storeId: "s1" } });
    mockGetGuideContent.mockResolvedValue({ items: [] });
    mockUpdateContent.mockResolvedValue(undefined);
    mockCreateContent.mockResolvedValue({ id: "a1" });
    mockRequestContentUpload.mockResolvedValue({ uploadUrl: "https://upload.test/photo?token=1", fileUrl: "f" });
    mockDeleteContent.mockResolvedValue(undefined);
    mockBeforeRemoveHandler = undefined;
  });

  it("renders edit content header", () => {
    const { getByText } = render(<EditContentScreen />);
    expect(getByText("Editar Conteúdo")).toBeTruthy();
  });

  it("validates missing fields on save", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByText } = render(<EditContentScreen />);

    fireEvent.press(getByText("Salvar Modificações"));
    expect(alertSpy).toHaveBeenCalledWith("Título obrigatório", "Informe um título para o conteúdo.");

    alertSpy.mockRestore();
  });

  it("updates content when fields are valid", async () => {
    mockUseRoute.mockReturnValue({
      params: {
        articleId: "a1",
        storeId: "s1",
        article: { id: "a1", title: "Old", description: "Desc", imageUrl: "file://old.jpg" }
      }
    });

    const { getByText } = render(<EditContentScreen />);

    await waitFor(() => expect(getByText("Salvar Modificações")).toBeTruthy());
    fireEvent.press(getByText("Salvar Modificações"));

    await waitFor(() => expect(mockUpdateContent).toHaveBeenCalled());
  });

  it("removes selected media when delete overlay is pressed", async () => {
    mockUseRoute.mockReturnValue({
      params: {
        articleId: "a1",
        storeId: "s1",
        article: { id: "a1", title: "Old", description: "Desc", imageUrl: "file://old.jpg" }
      }
    });

    const view = render(<EditContentScreen />);
    await act(async () => {
      fireEvent.press(view.getByTestId("edit-content-media-0"));
    });

    const deleteOverlay = await waitFor(() => view.getByTestId("edit-content-media-delete-0"));
    await act(async () => {
      fireEvent.press(deleteOverlay);
    });

    expect(view.getByText("Adicionar mídia")).toBeTruthy();
  });

  it("opens delete confirmation dialog", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByLabelText } = render(<EditContentScreen />);

    fireEvent.press(getByLabelText("Excluir Conteúdo"));
    expect(alertSpy).toHaveBeenCalledWith(
      "Excluir conteúdo",
      "Tem certeza que deseja excluir este conteúdo? Essa ação não pode ser desfeita.",
      expect.any(Array)
    );

    alertSpy.mockRestore();
  });

  it("confirms delete and navigates back", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const confirm = buttons?.find((btn) => btn.text === "Excluir");
      confirm?.onPress?.();
    });
    const { getByLabelText } = render(<EditContentScreen />);

    fireEvent.press(getByLabelText("Excluir Conteúdo"));

    await waitFor(() => expect(mockDeleteContent).toHaveBeenCalledWith("a1"));
    expect(mockGoBack).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("prompts to discard changes on back navigation when dirty", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByPlaceholderText } = render(<EditContentScreen />);

    fireEvent.changeText(getByPlaceholderText("Título do conteúdo"), "Novo");
    const event = { preventDefault: jest.fn(), data: { action: { type: "GO_BACK" } } };
    mockBeforeRemoveHandler?.(event);

    expect(alertSpy).toHaveBeenCalledWith(
      "Descartar alterações?",
      "Se voltar, você perderá as mudanças feitas.",
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });

  it("uploads media and saves when creating new content", async () => {
    mockUseRoute.mockReturnValue({ params: { storeId: "s1" } });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://new.jpg" }]
    });

    const { getByPlaceholderText, getAllByText } = render(<EditContentScreen />);
    await act(async () => {
      fireEvent.press(getAllByText("Adicionar mídia")[0]);
    });

    fireEvent.changeText(getByPlaceholderText("Título do conteúdo"), "Novo conteúdo");
    fireEvent.changeText(getByPlaceholderText("Descreva seu conteúdo..."), "Texto");
    const createButtons = getAllByText("Criar Conteúdo");
    fireEvent.press(createButtons[createButtons.length - 1]);

    await waitFor(() => expect(mockCreateContent).toHaveBeenCalled());
    expect(mockRequestContentUpload).toHaveBeenCalled();
    expect(FileSystem.uploadAsync).toHaveBeenCalled();
    expect(mockUpdateContent).toHaveBeenCalled();
  });
});
