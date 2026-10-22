import type { Metadata } from "next";
import "./globals.css";
import { TournamentProvider } from "@/components/tournament-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: "Fourball — A little friendly competition",
  description:
    "Your four. Your courses. Your tournament. Manage simulator golf tournaments with rotating teams, scorecards and closest to the pin.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var saved = localStorage.getItem('fourball-theme');
                var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = saved === 'light' || saved === 'dark' ? saved : (systemDark ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.style.colorScheme = theme;
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <TournamentProvider>{children}</TournamentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
