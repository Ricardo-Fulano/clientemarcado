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
  title: "MiniPage Pro | Sua página profissional com links, vídeos, agenda e gestão",
  description:
    "Transforme sua bio em uma página profissional com links, vídeos, divulgações, agenda e gestão em um só lugar.",
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
    title: "MiniPage Pro | Sua página profissional com links, vídeos, agenda e gestão",
    description:
      "Transforme sua bio em uma página profissional com links, vídeos, divulgações, agenda e gestão em um só lugar.",
    url: "https://clientemarcado.com.br",
    siteName: "MiniPage Pro",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MiniPage Pro - Sua página profissional",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MiniPage Pro | Sua página profissional com links, vídeos, agenda e gestão",
    description:
      "Transforme sua bio em uma página profissional com links, vídeos, divulgações, agenda e gestão em um só lugar.",
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
