import React from "react";
import { render } from "@testing-library/react-native";
import { RootStack } from "../RootStack";

const mockScreenNames: string[] = [];
const mockNavigatorProps: any[] = [];

jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ screenOptions, initialRouteName, children }: any) => {
      mockNavigatorProps.push({ screenOptions, initialRouteName });
      return <>{children}</>;
    },
    Screen: ({ name, component: Component }: any) => {
      mockScreenNames.push(name);
      return <Component />;
    }
  })
}));

jest.mock("../../../presentation/screens/auth/LoginScreen", () => ({ LoginScreen: () => null }));
jest.mock("../../../presentation/screens/auth/SignUpScreen", () => ({ SignUpScreen: () => null }));
jest.mock("../RootTabs", () => ({ RootTabs: () => null }));
jest.mock("../../../presentation/screens/thrift/ThriftDetailScreen", () => ({ ThriftDetailScreen: () => null }));
jest.mock("../../../presentation/screens/profile/EditProfileScreen", () => ({ EditProfileScreen: () => null }));
jest.mock("../../../presentation/screens/thrift/BrechoFormScreen", () => ({ BrechoFormScreen: () => null }));
jest.mock("../../../presentation/screens/content/MyContentsScreen", () => ({ MyContentsScreen: () => null }));
jest.mock("../../../presentation/screens/search/SearchScreen", () => ({ SearchScreen: () => null }));
jest.mock("../../../presentation/screens/support/ContactScreen", () => ({ ContactScreen: () => null }));
jest.mock("../../../presentation/screens/content/EditContentScreen", () => ({ EditContentScreen: () => null }));
jest.mock("../../../presentation/screens/content/ContentDetailScreen", () => ({ ContentDetailScreen: () => null }));
jest.mock("../../../presentation/screens/content/ContentsScreen", () => ({ ContentsScreen: () => null }));
jest.mock("../../../presentation/screens/categories/CategoryStoresScreen", () => ({ CategoryStoresScreen: () => null }));

describe("RootStack", () => {
  beforeEach(() => {
    mockScreenNames.length = 0;
    mockNavigatorProps.length = 0;
  });

  it("registers expected screens with config", () => {
    render(<RootStack />);

    expect(mockNavigatorProps[0]?.initialRouteName).toBe("login");
    expect(mockNavigatorProps[0]?.screenOptions).toEqual({ headerShown: false });

    expect(mockScreenNames).toEqual([
      "login",
      "signup",
      "tabs",
      "thriftDetail",
      "editProfile",
      "brechoForm",
      "myContents",
      "search",
      "contact",
      "editContent",
      "contentDetail",
      "contents",
      "categoryStores"
    ]);
  });
});
