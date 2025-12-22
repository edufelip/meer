import React from "react";
import { Alert } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { BrechoFormScreen } from "../BrechoFormScreen";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";

const mockUseRoute = jest.fn();
const mockExecuteUpdate = jest.fn();
const mockConfirmPhotos = jest.fn();
const mockGetCachedCategories = jest.fn();
const mockGetCategories = jest.fn();
const mockRequestStoreUploads = jest.fn();
let mockDragProps: any;

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
  useRoute: () => mockUseRoute()
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    createOrUpdateStoreUseCase: {
      executeCreate: jest.fn().mockResolvedValue({ id: "s1" }),
      executeUpdate: (...args: any[]) => mockExecuteUpdate(...args)
    },
    getProfileUseCase: { execute: jest.fn().mockResolvedValue(null) },
    requestStorePhotoUploadsUseCase: { execute: (...args: any[]) => mockRequestStoreUploads(...args) },
    confirmStorePhotosUseCase: { execute: (...args: any[]) => mockConfirmPhotos(...args) },
    getCachedCategoriesUseCase: { execute: (...args: any[]) => mockGetCachedCategories(...args) },
    getCategoriesUseCase: { execute: (...args: any[]) => mockGetCategories(...args) }
  })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: "images" }
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: "file://img.jpg" }),
  SaveFormat: { JPEG: "jpeg" }
}));

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  uploadAsync: jest.fn().mockResolvedValue({ status: 200 })
}));

jest.mock("expo-crypto", () => ({
  randomUUID: () => "uuid-1"
}));

jest.mock("expo-location", () => ({
  geocodeAsync: jest.fn().mockResolvedValue([]),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([])
}));

jest.mock("react-native-draggable-flatlist", () => ({
  __esModule: true,
  default: ({ data, renderItem, ListHeaderComponent, ListFooterComponent, onDragEnd }: any) => {
    const mockReact = jest.requireActual("react");
    mockDragProps = { data, onDragEnd };
    const header =
      typeof ListHeaderComponent === "function" ? <ListHeaderComponent /> : ListHeaderComponent ?? null;
    const footer =
      typeof ListFooterComponent === "function" ? <ListFooterComponent /> : ListFooterComponent ?? null;
    return (
      <>
        {header}
        {data.map((item: any, index: number) => (
          <mockReact.Fragment key={item?.id ?? item?.tempId ?? String(index)}>
            {renderItem({ item, index, drag: jest.fn() })}
          </mockReact.Fragment>
        ))}
        {footer}
      </>
    );
  }
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children }: any) => <>{children}</>
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000" } }
}));

jest.mock("../../../components/CategoryCard", () => ({
  getCategoryDisplayName: (name: string) => name
}));

describe("BrechoFormScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoute.mockReturnValue({ params: { thriftStore: null } });
    mockExecuteUpdate.mockResolvedValue(undefined);
    mockConfirmPhotos.mockResolvedValue({ coverImageUrl: "cover", galleryUrls: ["cover"] });
    const pending = new Promise(() => undefined);
    mockGetCachedCategories.mockReturnValue(pending);
    mockGetCategories.mockReturnValue(pending);
    mockRequestStoreUploads.mockResolvedValue([]);
  });

  const renderBrecho = async () => {
    const view = render(<BrechoFormScreen />);
    await act(async () => {});
    return view;
  };

  it("renders the create store header", () => {
    const { getByText } = render(<BrechoFormScreen />);
    expect(getByText("Cadastrar Brechó")).toBeTruthy();
  });

  it("validates required fields before submit", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const view = await renderBrecho();
    const { getByText } = view;

    fireEvent.press(getByText("Criar Brechó"));
    expect(alertSpy).toHaveBeenCalledWith("Nome obrigatório", "Informe o nome do brechó.");

    alertSpy.mockRestore();
  });

  it("submits update when editing an existing store", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockUseRoute.mockReturnValue({
      params: {
        thriftStore: {
          id: "s1",
          name: "Brecho X",
          description: "Desc",
          openingHours: "9-18",
          addressLine: "Rua A",
          phone: "11999999999",
          images: [{ id: "p1", url: "http://img" }]
        }
      }
    });

    const view = await renderBrecho();
    const { getByText } = view;
    fireEvent.press(getByText("Salvar alterações"));

    await waitFor(() => expect(mockConfirmPhotos).toHaveBeenCalled());
    expect(mockExecuteUpdate).toHaveBeenCalledWith(
      "s1",
      expect.objectContaining({ name: "Brecho X", addressLine: "Rua A" })
    );
    alertSpy.mockRestore();
  });

  it("blocks invalid instagram handles", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockUseRoute.mockReturnValue({
      params: {
        thriftStore: {
          id: "s1",
          name: "Brecho X",
          description: "Desc",
          openingHours: "9-18",
          addressLine: "Rua A",
          phone: "11999999999",
          images: [{ id: "p1", url: "http://img" }]
        }
      }
    });

    const view = await renderBrecho();
    const { getByPlaceholderText, getByText } = view;
    fireEvent.changeText(getByPlaceholderText("Ex: Brechó Estilo Único"), "Brecho X");
    fireEvent.changeText(getByPlaceholderText("Descreva o que torna seu brechó especial"), "Descricao");
    fireEvent.changeText(getByPlaceholderText("Ex: Seg-Sex 9h-18h, Sáb 10h-14h"), "9-18");
    fireEvent.changeText(getByPlaceholderText("(11) 99999-9999"), "11999999999");
    fireEvent.changeText(getByPlaceholderText("seu_brecho"), "invalido handle");

    fireEvent.press(getByText("Salvar alterações"));
    expect(alertSpy).toHaveBeenCalledWith(
      "Instagram inválido",
      "Digite apenas um nome de usuário (uma única palavra, sem espaços)."
    );

    alertSpy.mockRestore();
  });

  it("uploads new photos before confirming", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const gallery = buttons?.find((btn) => btn.text === "Galeria");
      gallery?.onPress?.();
    });
    mockRequestStoreUploads.mockResolvedValue([
      { uploadUrl: "https://upload.test/photo?token=1", fileKey: "file-1", contentType: "image/jpeg" }
    ]);
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://new-photo.jpg" }]
    });

    mockUseRoute.mockReturnValue({
      params: {
        thriftStore: {
          id: "s1",
          name: "Brecho X",
          description: "Desc",
          openingHours: "9-18",
          addressLine: "Rua A",
          phone: "11999999999",
          images: [{ id: "p1", url: "http://img" }]
        }
      }
    });

    const view = await renderBrecho();
    fireEvent.press(view.getByTestId("brecho-add-photo"));
    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled());
    fireEvent.press(view.getByText("Salvar alterações"));

    await waitFor(() => expect(mockRequestStoreUploads).toHaveBeenCalled());
    expect(FileSystem.uploadAsync).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("uses camera flow when selecting camera option", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const camera = buttons?.find((btn) => btn.text === "Câmera");
      camera?.onPress?.();
    });
    mockRequestStoreUploads.mockResolvedValue([
      { uploadUrl: "https://upload.test/photo?token=2", fileKey: "file-2", contentType: "image/jpeg" }
    ]);
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://camera-photo.jpg" }]
    });

    mockUseRoute.mockReturnValue({
      params: {
        thriftStore: {
          id: "s1",
          name: "Brecho X",
          description: "Desc",
          openingHours: "9-18",
          addressLine: "Rua A",
          phone: "11999999999",
          images: [{ id: "p1", url: "http://img" }]
        }
      }
    });

    const view = await renderBrecho();
    fireEvent.press(view.getByTestId("brecho-add-photo"));
    await waitFor(() => expect(ImagePicker.launchCameraAsync).toHaveBeenCalled());
    fireEvent.press(view.getByText("Salvar alterações"));

    await waitFor(() => expect(mockRequestStoreUploads).toHaveBeenCalled());
    expect(FileSystem.uploadAsync).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("accepts geocode suggestion and submits with coordinates", async () => {
    jest.useFakeTimers();
    try {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      (Location.geocodeAsync as jest.Mock).mockResolvedValueOnce([{ latitude: 10.1, longitude: 20.2 }]);
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValueOnce([
        {
          street: "Rua Teste",
          streetNumber: "123",
          city: "Sao Paulo",
          country: "Brasil",
          district: "Centro"
        }
      ]);

      mockUseRoute.mockReturnValue({
        params: {
          thriftStore: {
            id: "s1",
            name: "Brecho X",
            description: "Desc",
            openingHours: "9-18",
            addressLine: "Rua A",
            phone: "11999999999",
            images: [{ id: "p1", url: "http://img" }]
          }
        }
      });

    const view = await renderBrecho();
    fireEvent.changeText(view.getByPlaceholderText("Rua, Número, Bairro"), "Rua Teste");

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      fireEvent.press(view.getByText("Rua Teste, 123, Centro, Sao Paulo, Brasil"));
      fireEvent.press(view.getByText("Salvar alterações"));

      await waitFor(() => expect(mockExecuteUpdate).toHaveBeenCalled());
      expect(mockExecuteUpdate).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({ latitude: 10.1, longitude: 20.2 })
      );
      logSpy.mockRestore();
    } finally {
      jest.useRealTimers();
    }
  });

  it("reorders photos before confirm payload", async () => {
    mockUseRoute.mockReturnValue({
      params: {
        thriftStore: {
          id: "s1",
          name: "Brecho X",
          description: "Desc",
          openingHours: "9-18",
          addressLine: "Rua A",
          phone: "11999999999",
          images: [
            { id: "p1", url: "http://img1" },
            { id: "p2", url: "http://img2" }
          ]
        }
      }
    });

    const view = await renderBrecho();
    const [first, second] = mockDragProps.data;
    expect(mockDragProps.data.length).toBe(2);
    await act(async () => {
      mockDragProps.onDragEnd({ data: [second, first] });
    });
    await waitFor(() => expect(mockDragProps.data[0].photoId).toBe("p2"));

    await act(async () => {
      fireEvent.press(view.getByText("Salvar alterações"));
    });

    await waitFor(() => expect(mockConfirmPhotos).toHaveBeenCalled());
    const payload = mockConfirmPhotos.mock.calls[0][0];
    expect(payload.photos[0]).toEqual({ photoId: "p2", position: 0 });
    expect(payload.photos[1]).toEqual({ photoId: "p1", position: 1 });
  });

  it("marks deleted photos for removal", async () => {
    mockUseRoute.mockReturnValue({
      params: {
        thriftStore: {
          id: "s1",
          name: "Brecho X",
          description: "Desc",
          openingHours: "9-18",
          addressLine: "Rua A",
          phone: "11999999999",
          images: [
            { id: "p1", url: "http://img1" },
            { id: "p2", url: "http://img2" }
          ]
        }
      }
    });

    const view = await renderBrecho();
    await act(async () => {
      fireEvent.press(view.getByTestId("brecho-photo-p1"));
    });
    const deleteOverlay = await waitFor(() => view.getByTestId("brecho-photo-delete-p1"));
    await act(async () => {
      fireEvent.press(deleteOverlay);
    });
    await waitFor(() => expect(mockDragProps.data).toHaveLength(1));
    await act(async () => {
      fireEvent.press(view.getByText("Salvar alterações"));
    });

    await waitFor(() => expect(mockConfirmPhotos).toHaveBeenCalled());
    const payload = mockConfirmPhotos.mock.calls[0][0];
    expect(payload.deletePhotoIds).toContain("p1");
  });

  it("blocks submit when photo count exceeds limit", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockUseRoute.mockReturnValue({
      params: {
        thriftStore: {
          id: "s1",
          name: "Brecho X",
          description: "Desc",
          openingHours: "9-18",
          addressLine: "Rua A",
          phone: "11999999999",
          images: Array.from({ length: 11 }).map((_, idx) => ({
            id: `p${idx + 1}`,
            url: `http://img${idx + 1}`
          }))
        }
      }
    });

    const view = await renderBrecho();
    await act(async () => {
      fireEvent.press(view.getByText("Salvar alterações"));
    });

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Limite de fotos", "Envie no máximo 10 fotos."));
    alertSpy.mockRestore();
  });
});
