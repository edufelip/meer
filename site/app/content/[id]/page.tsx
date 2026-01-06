import Link from "next/link";
import type { Metadata } from "next";
import { webBaseUrl } from "../../../src/urls";
import ContentRedirect from "./ContentRedirect";

type ContentPageProps = {
  params: { id: string };
};

export function generateMetadata({ params }: ContentPageProps): Metadata {
  const contentId = decodeURIComponent(params.id);
  return {
    title: `Guia Brechó - Conteúdo ${contentId}`,
    description: "Abra o Guia Brechó para ver este conteúdo."
  };
}

export default function ContentPage({ params }: ContentPageProps) {
  const contentId = decodeURIComponent(params.id);
  const encodedId = encodeURIComponent(contentId);
  const prettyBaseUrl = webBaseUrl.replace(/^https?:\/\//, "");

  return (
    <main className="page">
      <ContentRedirect />
      <section className="hero">
        <span className="eyebrow">Conteúdo</span>
        <h1>{contentId}</h1>
        <p>Este link abre direto no app. Se ele nao abrir, use o botao abaixo.</p>
        <div className="hero-actions">
          <a className="button" href={`meer://content/${encodedId}`}>
            Abrir no app
          </a>
          <Link className="button secondary" href="/">
            Voltar para o inicio
          </Link>
        </div>
      </section>

      <section className="cards">
        <div className="card">
          <h3>Explore mais</h3>
          <p>Descubra dicas e tendencias dos brechos da sua cidade.</p>
        </div>
        <div className="card">
          <h3>Compartilhe</h3>
          <p>Envie este conteudo para quem ama garimpar.</p>
        </div>
      </section>

      <footer className="footer">Guia Brechó • {prettyBaseUrl}</footer>
    </main>
  );
}
