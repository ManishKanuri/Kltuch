import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KLUTCH SportsEd — Internal ERP",
  description:
    "KLUTCH SportsEd operations platform — coach attendance, sessions, sports analytics, student report cards, equipment, and school reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${sora.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
