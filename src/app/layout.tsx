import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rango.exemplo.com.br"),
  title: { default: "Clube Rango | Comida de verdade em Junqueirópolis", template: "%s | Clube Rango" },
  description: "Veja o cardápio do dia, peça sua marmita e ganhe recompensas no Rango Restaurante e Petiscaria.",
  applicationName: "Clube Rango",
  keywords: ["marmita", "Junqueirópolis", "restaurante", "delivery", "feijoada", "petiscaria"],
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Clube Rango", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Clube Rango — seu almoço de verdade",
    description: "Cardápio do dia, promoções, pontos e delivery próprio em Junqueirópolis.",
    locale: "pt_BR",
    type: "website",
    images: ["https://images.pexels.com/photos/17710506/pexels-photo-17710506.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200"],
  },
};

export const viewport: Viewport = { themeColor: "#173f32", colorScheme: "light" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
