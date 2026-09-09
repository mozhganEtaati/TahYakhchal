import type { Metadata } from "next";
import SiteNav from "@/app/components/SiteNav";
import { fa } from "@/messages/fa";
import { SavedProvider } from "@/lib/saved";
import { SessionProvider } from "@/lib/session";
import { ThemeProvider, themeBootstrapScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: fa.appTitle,
  description: fa.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" data-theme="dark">
      <head>
        {/* Applies the stored theme before first paint so dark never flashes light. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <SavedProvider>
            <SessionProvider>
              <SiteNav />
              {children}
              <footer className="mx-auto max-w-4xl border-t border-hairline px-5 py-6 text-center text-sm text-mist">
                {fa.tagline}
              </footer>
            </SessionProvider>
          </SavedProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
