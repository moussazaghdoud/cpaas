import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import "./globals.css";

async function getSiteConfig() {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const config = await payload.findGlobal({ slug: "site-config" });
    if (config?.siteName) {
      return {
        siteName: config.siteName as string,
        siteUrl: (config.siteUrl as string) || SITE_URL,
        description: (config.description as string) || SITE_DESCRIPTION,
      };
    }
  } catch {
    // Payload not available
  }
  return { siteName: SITE_NAME, siteUrl: SITE_URL, description: SITE_DESCRIPTION };
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();

  return {
    title: {
      default: `${config.siteName} — Developer Portal`,
      template: `%s | ${config.siteName}`,
    },
    description: config.description,
    metadataBase: new URL(config.siteUrl),
    openGraph: {
      type: "website",
      siteName: config.siteName,
      title: `${config.siteName} — Developer Portal`,
      description: config.description,
    },
    twitter: {
      card: "summary_large_image",
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
