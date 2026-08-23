import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InstallPrompt } from "@/lib/pwa/InstallPrompt";
import { ServiceWorkerRegistration } from "@/lib/pwa/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KiwiFlow",
  description: "The operational layer for New Zealand kiwifruit — growers, contractors, crews and transport in one place.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    // iOS Safari has no beforeinstallprompt/install-banner API — this is
    // what makes "Add to Home Screen" launch as a standalone app (using
    // app/apple-icon.png, already generated) instead of opening Safari.
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KiwiFlow",
  },
};

export const viewport: Viewport = {
  themeColor: "#16532f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}
