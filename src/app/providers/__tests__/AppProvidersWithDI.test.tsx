import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { DependenciesProvider, useDependencies } from "../AppProvidersWithDI";

function Consumer() {
  const deps = useDependencies();
  return <Text>{deps.getCurrentUserUseCase ? "ok" : "missing"}</Text>;
}

describe("AppProvidersWithDI", () => {
  it("throws when used outside provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow("useDependencies must be used within DependenciesProvider");
    spy.mockRestore();
  });

  it("provides dependencies when wrapped", () => {
    const { getByText } = render(
      <DependenciesProvider>
        <Consumer />
      </DependenciesProvider>
    );

    expect(getByText("ok")).toBeTruthy();
  });
});
