import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kiwi Job Cash | AI Revenue Recovery for NZ Small Business",
    template: "%s | Kiwi Job Cash",
  },
  description:
    "Find missed leads, forgotten quotes and overdue invoices with Kiwi Job Cash — the AI revenue recovery platform for New Zealand small businesses.",
  openGraph: {
    title: "Kiwi Job Cash | AI Revenue Recovery for NZ Small Business",
    description:
      "Find missed leads, forgotten quotes and overdue invoices with Kiwi Job Cash — the AI revenue recovery platform for New Zealand small businesses.",
    url: SITE_URL,
    siteName: "Kiwi Job Cash",
    locale: "en_NZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kiwi Job Cash | Find the money you're losing.",
    description:
      "AI revenue recovery for New Zealand small businesses — missed leads, forgotten quotes, overdue invoices.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-NZ"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
