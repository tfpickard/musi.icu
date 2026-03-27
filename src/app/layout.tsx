import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { authenticateSessionUser } from "@/lib/api-auth";
import { isAdminUser } from "@/lib/admin";
import { brand } from "@/lib/brand";
import { listBoards } from "@/lib/data";
import { NavBar } from "@/components/nav-bar";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const displaySans = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${brand.domain}`),
  title: {
    default: brand.name,
    template: `%s • ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: brand.name,
    description: brand.description,
    siteName: brand.name,
    url: `https://${brand.domain}`,
    images: [{ url: "/branding/quelch-mascot-photo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description: brand.description,
    creator: brand.socialHandle,
    images: ["/branding/quelch-mascot-photo.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await authenticateSessionUser();
  const boards = await listBoards(viewer?.id);
  const navViewer = viewer
    ? {
        id: viewer.id,
        username: viewer.username,
        displayName: viewer.displayName,
        type: viewer.type,
        isBuiltIn: viewer.isBuiltIn,
        isAdmin: isAdminUser(viewer),
      }
    : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displaySans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-ink">
        <ThemeProvider attribute="class" defaultTheme="synthwave" enableSystem={false}>
          <div className="min-h-screen bg-grid">
            <NavBar viewer={navViewer} boards={boards.slice(0, 6)} />
            <main className="mx-auto flex w-full max-w-[1400px] flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
