import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss/fetchFeeds";
import { processNews, generateDailyDigest } from "@/lib/ai/summarize";
import type { ProcessedNewsItem } from "@/lib/types";

// Revalida esta ruta como máximo cada NEWS_CACHE_TTL_SECONDS (default 300s = 5 min).
// Esto evita llamar a la IA en cada request y respeta el "cada 5-10 minutos" del brief.
export const revalidate = Number(process.env.NEWS_CACHE_TTL_SECONDS ?? 300);
export const dynamic = "force-dynamic";

// Cache en memoria del proceso (se resetea en cada deploy/cold start de Vercel;
// para persistencia real entre instancias, guardar el resultado en Supabase).
let cache: { data: ProcessedNewsItem[]; digest: any; generatedAt: number } | null = null;
let yesterdayTopTitles: string[] = [];

export async function GET() {
  const ttlMs = (Number(process.env.NEWS_CACHE_TTL_SECONDS ?? 300)) * 1000;
  const isFresh = cache && Date.now() - cache.generatedAt < ttlMs;

  if (!isFresh) {
    try {
      const raw = await fetchAllFeeds();
      const processed = await processNews(raw);
      const digest = await generateDailyDigest(processed, yesterdayTopTitles);

      if (new Date().getHours() === 23) {
        yesterdayTopTitles = processed.slice(0, 10).map((n) => n.title);
      }

      cache = { data: processed, digest, generatedAt: Date.now() };
    } catch (err) {
      console.error("[api/news] Error generando noticias:", (err as Error).message);
      // Si falla (por ejemplo, falta configurar ANTHROPIC_API_KEY todavía),
      // devolvemos una respuesta vacía en vez de romper toda la página.
      if (!cache) {
        cache = {
          data: [],
          digest: { top10: [], whatChanged: "", dominantTopics: "", generatedAt: new Date().toISOString() },
          generatedAt: Date.now(),
        };
      }
    }
  }

  return NextResponse.json({
    news: cache!.data,
    digest: cache!.digest,
    generatedAt: new Date(cache!.generatedAt).toISOString(),
  });
}
