import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import { Locale } from "@/i18n.config";
import { getDictionary } from "./dictionaries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const awaitedParams = await params;
    const dictionary = await getDictionary(awaitedParams.lang);
    const seoTranslations = dictionary.seo; 

    return {
        title: seoTranslations.title,
        description: seoTranslations.description,
        keywords: seoTranslations.keywords,
        authors: [{ name: "Miguel07Code" }],
        openGraph: {
            type: "website",
            locale: awaitedParams.lang === "en" ? "en_US" : awaitedParams.lang,
            url: "https://text2question.miguel07code.dev",
            title: seoTranslations.title,
            description: seoTranslations.description,
            images: [
                {
                    url: "https://text2question.miguel07code.dev/og-image-1200x630.png",
                    width: 1200,
                    height: 630,
                    alt: seoTranslations.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: seoTranslations.title,
            description: seoTranslations.description,
            images: [
                "https://text2question.miguel07code.dev/og-image-1200x630.png",
            ],
            creator: "@miguel07code",
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
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>; 
}>) {
  const awaitedParams = await params;
  const session = await auth(); 
  const dictionary = await getDictionary(awaitedParams.lang); 

  return (
      <SessionProvider session={session}>
          <html lang={awaitedParams.lang} suppressHydrationWarning>
              <body
                  className={`${geistSans.variable} ${geistMono.variable} antialiased`}
              >
                  <ThemeProvider
                      attribute="class"
                      defaultTheme="system"
                      enableSystem
                  >
                      <header className="px-4 sm:px-8 mx-auto max-w-4xl border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                          <div className="flex h-14 max-w-screen-2xl items-center justify-between">
                              <div className="flex items-center gap-2">
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
                              <div className="flex items-center gap-4">
                                  <LanguageSwitcher dictionary={dictionary.languageSwitcher} currentLocale={awaitedParams.lang} />
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
