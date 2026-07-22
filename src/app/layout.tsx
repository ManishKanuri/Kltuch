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

// Set the theme class before paint to avoid a flash of the wrong mode.
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('klutch-theme');
    if (t === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
  } catch (e) { document.documentElement.classList.add('dark'); }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sora.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
