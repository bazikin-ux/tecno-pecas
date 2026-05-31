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
  title: "Tecno Peças | Loja de Hardware Gamer e Computadores",
  description: "Peças de computador, setups gamer, processadores, placas de vídeo e periféricos com o melhor preço e envio rápido. Monte seu setup na Tecno Peças!",
  openGraph: {
    title: "Tecno Peças | Loja de Hardware Gamer e Computadores",
    description: "Peças de computador, setups gamer, processadores, placas de vídeo e periféricos com o melhor preço.",
    url: "https://www.tecnopecaspc.com.br",
    siteName: "Tecno Peças",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://www.tecnopecaspc.com.br/tecno-pecas-profile.png",
        width: 800,
        height: 800,
        alt: "Logo Tecno Peças",
      }
    ]
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
