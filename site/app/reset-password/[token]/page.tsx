import { passwordRules } from "../../../../src/shared/validation/password";
import ResetPasswordForm from "./ResetPasswordForm";
import { webBaseUrl } from "../../../src/urls";

export default function ResetPasswordPage({
  params
}: {
  params: { token: string };
}) {
  const token = decodeURIComponent(params.token);
  const prettyBaseUrl = webBaseUrl.replace(/^https?:\/\//, "");
  const rulesHint = passwordRules.map((rule) => rule.label).join(", ");

  return (
    <main className="page">
      <section className="hero">
        <span className="eyebrow">Redefinir senha</span>
        <h1>Crie uma nova senha para sua conta.</h1>
        <p>Ela precisa ter {rulesHint}.</p>
      </section>

      <ResetPasswordForm token={token} />

      <footer className="footer">Guia Brechó • {prettyBaseUrl}</footer>
    </main>
  );
}
