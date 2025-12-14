import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Guia Brechó Admin",
  description: "Administração do Guia Brechó"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#F3F4F6] text-[#374151]">{children}</body>
    </html>
  );
}
