import React from "react";
import { render } from "@testing-library/react-native";
import { AppRoot } from "../index";

const mockNavigationContainerProps: any[] = [];

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: ({ children }: any) => <>{children}</>
}));

jest.mock("@react-navigation/native", () => ({
  NavigationContainer: (props: any) => {
    mockNavigationContainerProps.push(props);
    return <>{props.children}</>;
  }
}));

jest.mock("../providers/AppProviders", () => ({
  AppProviders: ({ children }: any) => <>{children}</>
}));

jest.mock("../navigation/RootStack", () => ({
  RootStack: () => <></>
}));

jest.mock("../navigation/navigationRef", () => ({
  navigationRef: { isReady: () => false }
}));

jest.mock("../navigation/linking", () => ({
  linking: { prefixes: ["mock://"] }
}));

describe("AppRoot", () => {
  beforeEach(() => {
    mockNavigationContainerProps.length = 0;
  });

  it("renders navigation container with linking and ref", () => {
    render(<AppRoot />);
    expect(mockNavigationContainerProps[0]?.linking).toEqual({ prefixes: ["mock://"] });
    expect(mockNavigationContainerProps[0]?.ref).toEqual({ isReady: expect.any(Function) });
  });
});
