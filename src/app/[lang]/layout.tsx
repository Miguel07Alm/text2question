import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { SessionProvider } from "next-auth/react"; // Import SessionProvider
import { auth } from "@/auth";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";

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
  description:
    "Generate multiple-choice, short-answer or true-false quiz exams from text descriptions or PDF documents using AI",
  keywords: [
    "quiz generator",
    "ai quiz",
    "pdf to quiz",
    "text to quiz",
    "exam generator",
    "multiple choice",
    "short answer",
    "true false",
  ],
  authors: [{ name: "Miguel07Code" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://text2question.miguel07code.dev", // Replace with your actual domain
    title: "Text2Question - Generate Quiz Exams from Text or PDFs",
    description:
      "Generate multiple-choice, short-answer or true-false quiz exams from text descriptions or PDF documents using AI",
    images: [
      {
        url: "https://text2question.miguel07code.dev/icon.png", // Replace with your actual domain and image path
        width: 256,
        height: 256,
        alt: "Text2Question Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Text2Question - Generate Quiz Exams from Text or PDFs",
    description:
      "Generate multiple-choice, short-answer or true-false quiz exams from text descriptions or PDF documents using AI",
    images: ["https://text2question.com/icon.png"], // Replace with your actual domain and image path
    creator: "@miguel07code", // Replace with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth(); // Fetch session on the server

  return (
      <SessionProvider session={session}>
          <html lang="en" suppressHydrationWarning>
              <body
                  className={`${geistSans.variable} ${geistMono.variable} antialiased`}
              >
                  <ThemeProvider
                      attribute="class"
                      defaultTheme="system"
                      enableSystem
                  >
                      {/* Header */}
                      <header className="px-4 sm:px-8 mx-auto max-w-4xl border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                          <div className="flex h-14 max-w-screen-2xl items-center justify-between">
                              {/* Left side: Icon and App Title */}
                              <div className="flex items-center gap-2">
                                  {/* Group icon and text */}
                                  <Link href="/">
                                      <img
                                          src="/icon.png"
                                          alt="Text2Question Logo"
                                          width={28}
                                          height={28}
                                          className="object-contain"
                                      />
                                  </Link>
                                  <span className="font-semibold text-sm">
                                      Text2Question
                                  </span>
                              </div>

                              {/* Right side: Auth Button */}
                              <div className="flex items-center">
                                  <AuthButton />
                              </div>
                          </div>
                      </header>
                      {children}
                  </ThemeProvider>
                  <Toaster />
              </body>
              <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
          </html>
      </SessionProvider>
  );
}
