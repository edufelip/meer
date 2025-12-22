import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { ProfileScreenWithUser } from "../ProfileScreenWithUser";

const mockExecute = jest.fn();

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getCurrentUserUseCase: { execute: mockExecute }
  })
}));

describe("ProfileScreenWithUser", () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it("shows user name when loaded", async () => {
    mockExecute.mockResolvedValue({ name: "Eduardo" });

    const { getByText, queryByText } = render(<ProfileScreenWithUser />);

    expect(queryByText("No user found")).toBeNull();

    await waitFor(() => expect(getByText("Eduardo")).toBeTruthy());
  });

  it("shows empty state when user not found", async () => {
    mockExecute.mockResolvedValue(null);

    const { getByText } = render(<ProfileScreenWithUser />);

    await waitFor(() => expect(getByText("No user found")).toBeTruthy());
  });
});
