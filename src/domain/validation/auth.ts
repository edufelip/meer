const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return emailRegex.test(value.trim().toLowerCase());
}

export function validatePassword(value: string): { valid: boolean; error?: string } {
  if (value.length < 6) {
    return { valid: false, error: "A senha deve ter pelo menos 6 caracteres." };
  }
  return { valid: true };
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}
