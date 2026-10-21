import type { Metadata } from "next";
import Clubhouse from "@/components/clubhouse";
export const metadata: Metadata = {
  title: "Tournaments — Fourball",
  alternates: { canonical: "/" },
};
export default function Home() {
  return (
    <Clubhouse
      route={{
        kind: "dashboard",
        tournamentId: null,
        tab: "Overview",
        canonical: "/",
      }}
    />
  );
}
