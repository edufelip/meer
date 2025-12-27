const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return emailRegex.test(value.trim().toLowerCase());
}

export function validatePassword(value: string): { valid: boolean; error?: string } {
  if (value.length < 6) {
    return { valid: false, error: "A senha deve ter pelo menos 6 caracteres." };
  }
  if (!/[A-Z]/.test(value)) {
    return { valid: false, error: "A senha deve ter pelo menos 1 letra maiuscula." };
  }
  if (!/[0-9]/.test(value)) {
    return { valid: false, error: "A senha deve ter pelo menos 1 numero." };
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return { valid: false, error: "A senha deve ter pelo menos 1 caractere especial." };
  }
  return { valid: true };
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}
