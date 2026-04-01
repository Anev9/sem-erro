import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { LanguageProvider } from "../contexts/LanguageContext";

export const metadata: Metadata = {
  title: "Performe seu Mercado - Sistema de Gestão",
  description: "Sistema completo de gestão de checklists e operações",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Inicializa tema antes do render para evitar flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');})();` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Performe" />
        <link rel="apple-touch-icon" href="/logo-semerro.jpg" />
      </head>
      <body>
        <LanguageProvider>
          {children}
          <Toaster position="top-right" richColors />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(reg) {
                        console.log('[SW] Registrado:', reg.scope);
                      })
                      .catch(function(err) {
                        console.warn('[SW] Falha ao registrar:', err);
                      });
                  });
                }
              `,
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
