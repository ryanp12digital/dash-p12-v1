import type { Metadata } from "next";
import { Alexandria, Poppins, DM_Mono } from "next/font/google";
import "./globals.css";

const alexandria = Alexandria({
  subsets: ["latin"],
  variable: "--font-alexandria",
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "P12 Digital Dashboard",
  description: "Premium Marketing Performance Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${alexandria.variable} ${poppins.variable} ${dmMono.variable} theme-pulse antialiased`}>
        {children}
      </body>
    </html>
  );
}
