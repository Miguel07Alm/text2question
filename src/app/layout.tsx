import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Text2Question - Generate Quiz Exams from Text or PDFs",
  description: "Generate multiple-choice, short-answer or true-false quiz exams from text descriptions or PDF documents using AI",
  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
          <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
              <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
              >
                  {children}
              </ThemeProvider>
              <Toaster />
          </body>
          <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
      </html>
  );
}
