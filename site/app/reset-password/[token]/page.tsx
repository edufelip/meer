import ResetPasswordForm from "./ResetPasswordForm";
import { webBaseUrl } from "../../../src/urls";

export default function ResetPasswordPage({
  params
}: {
  params: { token: string };
}) {
  const token = decodeURIComponent(params.token);
  const prettyBaseUrl = webBaseUrl.replace(/^https?:\/\//, "");

  return (
    <main className="page">
      <section className="hero">
        <span className="eyebrow">Redefinir senha</span>
        <h1>Crie uma nova senha para sua conta.</h1>
        <p>Ela precisa ter pelo menos 6 caracteres, 1 letra maiuscula, 1 numero e 1 caractere especial.</p>
      </section>

      <ResetPasswordForm token={token} />

      <footer className="footer">Guia Brecho • {prettyBaseUrl}</footer>
    </main>
  );
}
