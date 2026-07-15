import crypto from "crypto";
import type { RawNewsItem, ProcessedNewsItem, Category, Importance, EconomicImpact } from "@/lib/types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(systemPrompt: string, userContent: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
}

const CATEGORIES: Category[] = [
  "Argentina", "Economía", "Política", "Sociedad", "Tecnología",
  "Inteligencia Artificial", "Negocios", "Deportes", "Internacionales",
  "Mercados", "Dólar", "Criptomonedas", "Clima", "Partido de la Costa",
];

function keywordCluster(items: RawNewsItem[]): RawNewsItem[][] {
  const stopwords = new Set(["de", "la", "el", "en", "y", "a", "los", "las", "un", "una", "por", "que", "con", "para", "del"]);
  const sig = (title: string) =>
    title.toLowerCase()
      .replace(/[^\wáéíóúñ\s]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopwords.has(w))
      .slice(0, 6)
      .sort()
      .join("|");

  const buckets = new Map<string, RawNewsItem[]>();
  for (const item of items) {
    const key = sig(item.title);
    const bucket = buckets.get(key) ?? [];
    bucket.push(item);
    buckets.set(key, bucket);
  }
  return Array.from(buckets.values());
}

const SYSTEM_PROMPT = `Sos el editor de IA de un dashboard de noticias para un lector argentino.
Para cada grupo de artículos que te paso (pueden ser 1 o varios medios cubriendo lo mismo), devolvé un único objeto JSON con esta forma exacta, sin texto adicional, sin markdown:

{
  "category": una de ${JSON.stringify(CATEGORIES)},
  "importance": "Alta" | "Media" | "Baja",
  "summary": string (3 a 6 líneas, resumen objetivo y ORIGINAL, nunca copiado textual de los artículos),
  "extendedSummary": string | null (versión más detallada, 8-12 líneas, solo si el tema lo amerita),
  "tags": string[] (3 a 6 etiquetas cortas en minúscula),
  "aiNote": string | null (1-2 líneas: impacto concreto para Argentina, o explicación de un concepto económico si aparece uno técnico; null si no aplica),
  "impact": { "negocios": bool, "inflacion": bool, "dolar": bool, "consumo": bool, "inversiones": bool },
  "primarySourceIndex": number (índice, dentro del array de artículos que te paso, del que consideres la cobertura más completa/autorizada)
}

Reglas:
- "Alta" solo para noticias con impacto real e inmediato (mercados, política nacional, seguridad, economía). No todo es "Alta".
- Nunca copies oraciones textuales de los artículos originales: parafraseá siempre.
- Si el grupo mezcla noticias que en realidad NO son la misma historia, quedate con la interpretación del artículo más reciente.`;

interface AiEnrichment {
  category: Category;
  importance: Importance;
  summary: string;
  extendedSummary: string | null;
  tags: string[];
  aiNote: string | null;
  impact: EconomicImpact;
  primarySourceIndex: number;
}

async function enrichCluster(cluster: RawNewsItem[]): Promise<AiEnrichment> {
  const articlesForPrompt = cluster.map((c, i) => ({
    index: i,
    medium: c.medium,
    title: c.title,
    copete: c.contentSnippet,
    publishedAt: c.publishedAt,
  }));

  const raw = await callGemini(SYSTEM_PROMPT, JSON.stringify(articlesForPrompt));
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned) as AiEnrichment;
  } catch {
    return {
      category: "Argentina",
      importance: "Baja",
      summary: cluster[0].contentSnippet || cluster[0].title,
      extendedSummary: null,
      tags: [],
      aiNote: null,
      impact: { negocios: false, inflacion: false, dolar: false, consumo: false, inversiones: false },
      primarySourceIndex: 0,
    };
  }
}

function stableId(cluster: RawNewsItem[]): string {
  const base = cluster.map((c) => c.link).sort().join("|");
  return crypto.createHash("sha1").update(base).digest("hex").slice(0, 12);
}

function toArgentinaTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export async function processNews(rawItems: RawNewsItem[]): Promise<ProcessedNewsItem[]> {
  const clusters = keywordCluster(rawItems);

  const enriched = await Promise.all(
    clusters.map(async (cluster) => {
      const ai = await enrichCluster(cluster);
      const primary = cluster[ai.primarySourceIndex] ?? cluster[0];
      const others = cluster
        .map((c) => c.medium)
        .filter((m, i, arr) => m !== primary.medium && arr.indexOf(m) === i);

      const processed: ProcessedNewsItem = {
        id: stableId(cluster),
        category: ai.category,
        importance: ai.importance,
        medium: primary.medium,
        otherSources: others,
        title: primary.title,
        imageUrl: primary.imageUrl,
        time: toArgentinaTime(primary.publishedAt),
        publishedAt: primary.publishedAt,
        link: primary.link,
        summary: ai.summary,
        extendedSummary: ai.extendedSummary,
        tags: ai.tags,
        aiNote: ai.aiNote,
        impact: ai.impact,
      };
      return processed;
    })
  );

  const importanceRank: Record<Importance, number> = { Alta: 0, Media: 1, Baja: 2 };
  return enriched.sort((a, b) => {
    if (importanceRank[a.importance] !== importanceRank[b.importance]) {
      return importanceRank[a.importance] - importanceRank[b.importance];
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export async function generateDailyDigest(
  today: ProcessedNewsItem[],
  yesterdayTopTitles: string[]
) {
  const systemPrompt = `Devolvé SOLO un JSON con esta forma, sin texto adicional:
{ "whatChanged": string (2-3 líneas), "dominantTopics": string (1-2 líneas) }
Basate en las noticias de hoy comparadas contra los titulares principales de ayer.`;

  const raw = await callGemini(
    systemPrompt,
    JSON.stringify({
      hoy: today.slice(0, 15).map((n) => n.title),
      ayer: yesterdayTopTitles,
    })
  );

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return {
      top10: today.slice(0, 10),
      whatChanged: parsed.whatChanged ?? "",
      dominantTopics: parsed.dominantTopics ?? "",
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      top10: today.slice(0, 10),
      whatChanged: "",
      dominantTopics: "",
      generatedAt: new Date().toISOString(),
    };
  }
}
