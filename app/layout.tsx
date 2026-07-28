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
  metadataBase: new URL("https://clientemarcado.com.br"),
  title: "ClienteMarcado | Agenda online para beleza e estética",
  description:
    "Agenda online e gestão simples para salões, clínicas de estética, nail designers, lash designers, profissionais da beleza e studios.",
  keywords: [
    "agenda online",
    "sistema para salão de beleza",
    "sistema para estética",
    "agendamento online",
    "gestão para beleza",
    "agenda para nail designer",
    "agenda para lash designer",
    "ClienteMarcado",
  ],
  openGraph: {
    title: "ClienteMarcado | Agenda online para beleza e estética",
    description:
      "Sua cliente agenda online. Você organiza agenda, clientes, equipe, cobranças e financeiro em um só painel.",
    url: "https://clientemarcado.com.br",
    siteName: "ClienteMarcado",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClienteMarcado - Agenda online para beleza e estética",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClienteMarcado | Agenda online para beleza e estética",
    description:
      "Agenda online e gestão simples para salões, clínicas de estética, nail designers, lash designers e profissionais da beleza.",
    images: ["/og-image.png"],
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
