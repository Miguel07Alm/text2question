import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { SessionProvider } from "next-auth/react"; // Import SessionProvider
import { auth } from "@/auth";
import { AuthButton } from "@/components/auth-button";

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

export default async function RootLayout({ // Make the layout async
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth(); // Fetch session on the server

  return (
      <SessionProvider session={session}>
          {" "}
          {/* Pass session to provider */}
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
                      <header className="px-8 lg:mx-auto max-w-2xl w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                          <div className="flex h-14 max-w-screen-2xl items-center justify-between">
                              {/* Left side: Icon and App Title */}
                              <div className="flex items-center gap-2">
                                  {" "}
                                  {/* Group icon and text */}
                                  <a href="/">
                                      <img
                                          src="/icon.png"
                                          alt="Text2Question Logo"
                                          width={28}
                                          height={28}
                                          className="object-contain"
                                      />
                                  </a>
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
