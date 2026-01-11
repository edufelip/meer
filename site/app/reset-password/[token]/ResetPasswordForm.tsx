"use client";

import { useMemo, useState } from "react";
import { passwordRules, validatePassword } from "../../../../src/shared/validation/password";
import { selectApiBase } from "../../../src/apiBase";

type ResetPasswordFormProps = {
  token: string;
};

type StrengthLevel = {
  label: string;
  score: number;
  tone: "weak" | "ok" | "strong";
};

function getStrength(password: string): StrengthLevel {
  const score = passwordRules.filter((rule) => rule.test(password)).length;
  if (score === 0) return { label: "", score: 0, tone: "weak" };
  if (score <= 2) return { label: "Fraca", score, tone: "weak" };
  if (score === 3) return { label: "Boa", score, tone: "ok" };
  return { label: "Forte", score, tone: "strong" };
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => getStrength(password), [password]);
  const rulesHint = `${passwordRules.map((rule) => rule.label).join(", ")}.`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || success) return;
    setError(null);
    setSuccess(null);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error ?? "Senha invalida.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas nao coincidem.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${selectApiBase()}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = typeof payload?.message === "string" ? payload.message : "Nao foi possivel redefinir a senha.";
        setError(message);
        return;
      }

      setSuccess("Senha atualizada. Voce ja pode entrar no app.");
      setPassword("");
      setConfirm("");
    } catch {
      setError("Nao foi possivel redefinir a senha.");
    } finally {
      setSubmitting(false);
    }
  };

  const formLocked = submitting || !!success;

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="form-field">
        <label className="label" htmlFor="password">
          Nova senha
        </label>
        <div className="input-row">
          <input
            id="password"
            className="input"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite a nova senha"
            autoComplete="new-password"
            required
            disabled={formLocked}
          />
          <button
            type="button"
            className="toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={formLocked}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <div className={`strength strength-${strength.tone}`}>
          <span
            className="strength-bar"
            style={{ width: `${(strength.score / passwordRules.length) * 100}%` }}
          />
        </div>
        <div className="helper">
          {strength.label ? `Forca: ${strength.label}. ${rulesHint}` : rulesHint}
        </div>
      </div>

      <div className="form-field">
        <label className="label" htmlFor="confirm">
          Confirme a senha
        </label>
        <div className="input-row">
          <input
            id="confirm"
            className="input"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Repita a senha"
            autoComplete="new-password"
            required
            disabled={formLocked}
          />
          <button
            type="button"
            className="toggle"
            onClick={() => setShowConfirm((prev) => !prev)}
            disabled={formLocked}
          >
            {showConfirm ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {success ? <div className="form-success">{success}</div> : null}

      <button className="button" type="submit" disabled={formLocked}>
        {submitting ? "Salvando..." : success ? "Senha atualizada" : "Redefinir senha"}
      </button>
    </form>
  );
}
