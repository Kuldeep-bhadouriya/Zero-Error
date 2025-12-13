import type React from "react";
import type { Metadata, Viewport } from "next";
import { Rajdhani } from "next/font/google";
import ClientLayout from "@/components/client-layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnimationProvider } from "@/contexts/AnimationContext";
import BackgroundEffects from "@/components/shared/BackgroundEffects";
import "./globals.css";

// Font configuration - Rajdhani is a good gaming font
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export const metadata: Metadata = {
  title: "Zero Error Esports | Professional Gaming Team",
  description:
    "Official website of Zero Error Esports - Professional gaming team competing across Valorant, Counter-Strike 2, and other major titles",
  keywords:
    "Zero Error, Esports, professional gaming, tournaments, gaming team, India",
  authors: [{ name: "Zero Error Esports" }],
  openGraph: {
    title: "Zero Error Esports | Professional Gaming Team",
    description:
      "Join the elite gaming team that accepts nothing less than victory",
    url: "https://zeroerroresports.com",
    siteName: "Zero Error Esports",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero Error Esports | Professional Gaming Team",
    description:
      "Join the elite gaming team that accepts nothing less than victory",
    creator: "@ZeroErrorESports",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="icon" href="/images/favicon.png" type="image/x-icon" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={rajdhani.className} style={{ colorScheme: 'dark' }}>
        <ErrorBoundary>
          <AnimationProvider>
            <BackgroundEffects />
            <ClientLayout>{children}</ClientLayout>
          </AnimationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
