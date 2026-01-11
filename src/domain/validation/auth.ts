import { passwordRules, type PasswordRule, validatePassword as validatePasswordRules } from "../../shared/validation/password";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export { passwordRules };
export type { PasswordRule };

export function isValidEmail(value: string): boolean {
  return emailRegex.test(value.trim().toLowerCase());
}

export function validatePassword(value: string): { valid: boolean; error?: string } {
  return validatePasswordRules(value);
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}
