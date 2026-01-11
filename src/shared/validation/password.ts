export type PasswordRule = {
  label: string;
  error: string;
  test: (value: string) => boolean;
};

export const passwordRules: PasswordRule[] = [
  {
    label: "Minimo de 6 caracteres",
    error: "A senha deve ter pelo menos 6 caracteres.",
    test: (value) => value.length >= 6
  },
  {
    label: "1 letra maiuscula",
    error: "A senha deve ter pelo menos 1 letra maiuscula.",
    test: (value) => /[A-Z]/.test(value)
  },
  {
    label: "1 numero",
    error: "A senha deve ter pelo menos 1 numero.",
    test: (value) => /[0-9]/.test(value)
  },
  {
    label: "1 caractere especial",
    error: "A senha deve ter pelo menos 1 caractere especial.",
    test: (value) => /[^A-Za-z0-9]/.test(value)
  }
];

export function validatePassword(value: string): { valid: boolean; error?: string } {
  for (const rule of passwordRules) {
    if (!rule.test(value)) {
      return { valid: false, error: rule.error };
    }
  }
  return { valid: true };
}
