import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss/fetchFeeds";
import { processNews, generateDailyDigest } from "@/lib/ai/summarize";
import type { ProcessedNewsItem } from "@/lib/types";

// Revalida esta ruta como máximo cada NEWS_CACHE_TTL_SECONDS (default 300s = 5 min).
// Esto evita llamar a la IA en cada request y respeta el "cada 5-10 minutos" del brief.
export const revalidate = Number(process.env.NEWS_CACHE_TTL_SECONDS ?? 300);

// Cache en memoria del proceso (se resetea en cada deploy/cold start de Vercel;
// para persistencia real entre instancias, guardar el resultado en Supabase).
let cache: { data: ProcessedNewsItem[]; digest: any; generatedAt: number } | null = null;
let yesterdayTopTitles: string[] = [];

export async function GET() {
  const ttlMs = (Number(process.env.NEWS_CACHE_TTL_SECONDS ?? 300)) * 1000;
  const isFresh = cache && Date.now() - cache.generatedAt < ttlMs;

  if (!isFresh) {
    const raw = await fetchAllFeeds();
    const processed = await processNews(raw);
    const digest = await generateDailyDigest(processed, yesterdayTopTitles);

    // Guardamos los títulos de hoy para poder comparar "qué cambió" mañana.
    // En producción esto debería persistirse en Supabase, no en memoria.
    if (new Date().getHours() === 23) {
      yesterdayTopTitles = processed.slice(0, 10).map((n) => n.title);
    }

    cache = { data: processed, digest, generatedAt: Date.now() };
  }

  return NextResponse.json({
    news: cache!.data,
    digest: cache!.digest,
    generatedAt: new Date(cache!.generatedAt).toISOString(),
  });
}
