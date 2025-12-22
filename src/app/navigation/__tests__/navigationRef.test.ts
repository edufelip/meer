import { navigationRef } from "../navigationRef";

jest.mock("@react-navigation/native", () => ({
  createNavigationContainerRef: () => ({
    isReady: () => false,
    navigate: jest.fn()
  })
}));

describe("navigationRef", () => {
  it("exports a navigation ref", () => {
    expect(navigationRef).toBeTruthy();
    expect(typeof navigationRef.isReady).toBe("function");
  });
});
