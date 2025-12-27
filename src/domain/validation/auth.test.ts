import { isValidEmail, validatePassword, passwordsMatch } from "./auth";

describe("auth validation", () => {
  it("validates email with trimming and case normalization", () => {
    expect(isValidEmail("  USER@Example.com ")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
  });

  it("validates password strength rules", () => {
    expect(validatePassword("12345")).toEqual({ valid: false, error: "A senha deve ter pelo menos 6 caracteres." });
    expect(validatePassword("123456")).toEqual({ valid: false, error: "A senha deve ter pelo menos 1 letra maiuscula." });
    expect(validatePassword("Senhaaa")).toEqual({ valid: false, error: "A senha deve ter pelo menos 1 numero." });
    expect(validatePassword("Senha1a")).toEqual({
      valid: false,
      error: "A senha deve ter pelo menos 1 caractere especial."
    });
    expect(validatePassword("Senha1!")).toEqual({ valid: true });
  });

  it("checks password equality", () => {
    expect(passwordsMatch("secret", "secret")).toBe(true);
    expect(passwordsMatch("secret", "different")).toBe(false);
  });
});
