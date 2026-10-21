import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { SkipLink } from "@/components/i18n/LanguageMenu";
import PageTracker from "@/components/analytics/PageTracker";
import { PortalSessionTracker } from "@/components/portal/PortalSessionTracker";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

import { getProfile } from "@/lib/data";

const defaultTitle = "Smart Medical AI Portfolio | 智慧醫療作品集";
const defaultDescription =
  "智慧醫療 AI 作品集，展示醫學影像、模型訓練、模擬分析、CV 與研究成果。";

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  }

  const renderUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderUrl) {
    return renderUrl.endsWith("/") ? renderUrl.slice(0, -1) : renderUrl;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function toAbsoluteUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalized}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const baseUrl = getBaseUrl();
  const title = profile ? `${profile.name} | ${profile.title}` : defaultTitle;
  const description = profile?.bio ?? defaultDescription;
  const imageUrl = toAbsoluteUrl(profile?.profileImage ?? "/myself.jpeg");

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: profile?.name ?? "Portfolio",
      locale: "en_US",
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: profile?.name ?? "Portfolio",
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Suspense fallback={null}>
          <PageTracker />
        </Suspense>
        <PortalSessionTracker />
        <LocaleProvider>
          <div className="flex min-h-screen flex-col">
            <SkipLink />
            <Header />
            <main id="main" className="flex-1">{children}</main>
            <Footer />
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
