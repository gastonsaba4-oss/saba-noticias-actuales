import Parser from "rss-parser";
import { FEED_SOURCES, type FeedSource } from "./sources";
import type { RawNewsItem } from "@/lib/types";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "DashboardNoticiasBot/1.0 (+uso personal)" },
});

function extractImage(item: any): string | null {
  // rss-parser expone distintos campos según el feed (enclosure, media:content, etc.)
  if (item.enclosure?.url) return item.enclosure.url;
  if (item["media:content"]?.$?.url) return item["media:content"].$.url;
  if (item["media:thumbnail"]?.$?.url) return item["media:thumbnail"].$.url;
  // Último recurso: buscar una <img> en el HTML del contenido, si vino.
  const html: string | undefined = item.content || item["content:encoded"];
  const match = html?.match(/<img[^>]+src="([^">]+)"/i);
  return match?.[1] ?? null;
}

async function fetchOneFeed(source: FeedSource): Promise<RawNewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items ?? []).slice(0, 20).map((item) => ({
      sourceId: source.id,
      medium: source.medium,
      title: item.title?.trim() ?? "(sin título)",
      link: item.link ?? "",
      imageUrl: extractImage(item),
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      // Solo se usa como insumo para que la IA genere un resumen propio;
      // nunca se muestra ni se persiste tal cual en el frontend.
      contentSnippet: (item.contentSnippet ?? item.summary ?? "").slice(0, 600),
    }));
  } catch (err) {
    // Un feed caído no debe tirar abajo el resto del agregador.
    console.error(`[rss] Falló ${source.medium} (${source.url}):`, (err as Error).message);
    return [];
  }
}

/** Trae y normaliza todos los feeds configurados en paralelo. */
export async function fetchAllFeeds(): Promise<RawNewsItem[]> {
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchOneFeed));
  return results
    .filter((r): r is PromiseFulfilledResult<RawNewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
}
