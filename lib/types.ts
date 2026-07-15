export type Category =
  | "Argentina" | "Economía" | "Política" | "Sociedad" | "Tecnología"
  | "Inteligencia Artificial" | "Negocios" | "Deportes" | "Internacionales"
  | "Mercados" | "Dólar" | "Criptomonedas" | "Clima" | "Partido de la Costa";

export type Importance = "Alta" | "Media" | "Baja";

/** Un ítem tal como sale del parser RSS, antes de pasar por la IA. */
export interface RawNewsItem {
  sourceId: string;       // ej: "infobae"
  medium: string;         // ej: "Infobae"
  title: string;
  link: string;
  imageUrl: string | null;
  publishedAt: string;    // ISO 8601
  contentSnippet: string; // bajada / copete original del feed, usado SOLO como insumo para el resumen de IA
}

/** Impacto detectado por la IA para el contexto argentino. */
export interface EconomicImpact {
  negocios: boolean;
  inflacion: boolean;
  dolar: boolean;
  consumo: boolean;
  inversiones: boolean;
}

/** Un ítem ya procesado por el pipeline de IA, listo para el frontend. */
export interface ProcessedNewsItem {
  id: string;              // hash estable del cluster
  category: Category;
  importance: Importance;
  medium: string;          // medio "principal" del cluster (el de mayor jerarquía o el primero en publicar)
  otherSources: string[];  // otros medios que cubrieron la misma noticia (deduplicados)
  title: string;
  imageUrl: string | null;
  time: string;            // HH:mm hora Argentina
  publishedAt: string;     // ISO 8601
  link: string;            // enlace al artículo original del medio principal
  summary: string;         // 3-6 líneas, generado por IA, nunca copiado textual
  extendedSummary: string | null; // "resumen ampliado", generado por IA
  tags: string[];
  aiNote: string | null;   // impacto/explicación para Argentina
  impact: EconomicImpact;
}

export interface DailyDigest {
  top10: ProcessedNewsItem[];
  whatChanged: string;   // qué cambió respecto de ayer
  dominantTopics: string;
  generatedAt: string;
}
