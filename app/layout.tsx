import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sem Erro - Sistema de Gestão",
  description: "Sistema completo de gestão de checklists e operações",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}