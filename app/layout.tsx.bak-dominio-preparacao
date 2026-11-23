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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.clientemarcado.com.br"),
  title: "MiniPage Pro | Página profissional para links, vídeos, catálogo e agenda",
  description:
    "Crie sua MiniPage profissional com links, vídeos, catálogo, destaques, agenda online e painel de desempenho. Uma solução ClienteMarcado para criadores, lojas, profissionais e negócios.",
  alternates: {
    canonical: "https://www.clientemarcado.com.br",
  },
  keywords: [
    "MiniPage Pro",
    "página profissional para bio",
    "link na bio",
    "catálogo online",
    "agenda online",
    "painel de desempenho",
    "ClienteMarcado",
  ],
  openGraph: {
    title: "MiniPage Pro | Sua página profissional na bio",
    description:
      "Organize links, vídeos, catálogo, divulgações, agenda e contatos em uma MiniPage moderna para Instagram, WhatsApp, TikTok e muito mais.",
    url: "https://www.clientemarcado.com.br",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
