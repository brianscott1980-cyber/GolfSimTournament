import type { Metadata } from "next";
import "./globals.css";
import { TournamentProvider } from "@/components/tournament-provider";
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
    <html lang="en">
      <body>
        <TournamentProvider>{children}</TournamentProvider>
      </body>
    </html>
  );
}
