import type { Metadata } from "next";
import { Big_Shoulders, Instrument_Sans } from "next/font/google";
import { Providers } from "@/app/providers";
import "@/styles/globals.css";

const shoulders = Big_Shoulders({
  variable: "--font-shoulders",
  subsets: ["latin"],
  weight: ["800", "900"],
  adjustFontFallback: false,
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Afiado", template: "%s · Afiado" },
  description: "Barbearia Afiado: agende seu horário e conheça o Clube.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${shoulders.variable} ${instrument.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
