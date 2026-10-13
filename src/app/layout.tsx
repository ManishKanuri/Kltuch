import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Archivo, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Same three families as www.klutchsportsedu.com.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KLUTCH SportsEd — Internal ERP",
  description:
    "KLUTCH SportsEd operations platform — coach attendance, sessions, sports analytics, student report cards, equipment, and school reports.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read from a cookie so the server renders the saved theme up front. An inline
  // pre-paint <script> in <head> gets mismatched with scripts that browser
  // extensions inject there, which breaks hydration.
  const theme = (await cookies()).get("klutch-theme")?.value;

  return (
    <html lang="en" className={theme === "light" ? undefined : "dark"} suppressHydrationWarning>
      <body
        className={`${archivo.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
