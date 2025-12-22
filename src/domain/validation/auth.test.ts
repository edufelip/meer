import { isValidEmail, validatePassword, passwordsMatch } from "./auth";

describe("auth validation", () => {
  it("validates email with trimming and case normalization", () => {
    expect(isValidEmail("  USER@Example.com ")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
  });

  it("validates password length", () => {
    expect(validatePassword("12345")).toEqual({ valid: false, error: "A senha deve ter pelo menos 6 caracteres." });
    expect(validatePassword("123456")).toEqual({ valid: true });
  });

  it("checks password equality", () => {
    expect(passwordsMatch("secret", "secret")).toBe(true);
    expect(passwordsMatch("secret", "different")).toBe(false);
  });
});
