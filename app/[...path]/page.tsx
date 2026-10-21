import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Clubhouse from "@/components/clubhouse";
import { resolveRoute } from "@/lib/navigation";

type Props = { params: Promise<{ path?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = resolveRoute((await params).path);
  if (!route)
    return { title: "Page not found — Fourball", robots: { index: false } };
  const title =
    route.kind === "dashboard"
      ? "Tournaments"
      : route.kind === "tournament"
        ? `Tournament ${route.tab.toLowerCase()}`
        : route.tab;
  return {
    title: `${title} — Fourball`,
    alternates: { canonical: route.canonical },
  };
}

export default async function Page({ params }: Props) {
  const { path = [] } = await params;
  const route = resolveRoute(path);
  if (!route) notFound();
  const requested = `/${path.map(encodeURIComponent).join("/")}`;
  if (requested !== route.canonical) permanentRedirect(route.canonical);
  return <Clubhouse route={route} />;
}
