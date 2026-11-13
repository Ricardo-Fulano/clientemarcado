import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DOMINIO_OFICIAL = process.env.MINIPAGE_DOMINIO_UNICO_ENABLED === 'true'
  ? 'https://minipage.pro'
  : 'https://www.clientemarcado.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(DOMINIO_OFICIAL),
  title: "MiniPage Pro | Página profissional para links, vídeos, catálogo e agenda",
  description:
    "Crie sua MiniPage profissional com links, vídeos, catálogo, destaques, agenda online e painel de desempenho. Para criadores, lojas, profissionais e negócios.",
  alternates: {
    canonical: DOMINIO_OFICIAL,
  },
  keywords: [
    "MiniPage Pro",
    "página profissional para bio",
    "link na bio",
    "catálogo online",
    "agenda online",
    "painel de desempenho",
  ],
  openGraph: {
    title: "MiniPage Pro | Sua página profissional na bio",
    description:
      "Organize links, vídeos, catálogo, divulgações, agenda e contatos em uma MiniPage moderna para Instagram, WhatsApp, TikTok e muito mais.",
    url: DOMINIO_OFICIAL,
    siteName: "MiniPage Pro",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "MiniPage Pro - Sua página profissional",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MiniPage Pro | Página profissional para links, vídeos e catálogo",
    description:
      "Crie sua MiniPage com links, vídeos, catálogo, agenda e painel de desempenho. Ideal para criadores, lojas, profissionais e negócios.",
    images: ["/og-image.png?v=2"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
