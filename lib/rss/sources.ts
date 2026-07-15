/**
 * Fuentes RSS por medio.
 *
 * IMPORTANTE: las URLs de RSS cambian con el tiempo y varios medios
 * (Bloomberg, FT, WSJ, NYT, algunos de Clarín/La Nación) restringen o
 * eliminan sus feeds públicos según su política editorial. Antes de
 * desplegar a producción:
 *   1. Verificá cada URL abriéndola en el navegador (debe devolver XML).
 *   2. Reemplazá o quitá los feeds que ya no respondan.
 *   3. Para los medios sin RSS público (ej. WSJ, FT, Bloomberg Terminal),
 *      evaluá contratar su API oficial en vez de scrapear el sitio.
 *
 * Cada fuente indica un `defaultCategory` orientativo; la categoría final
 * la determina el pipeline de IA en lib/ai/summarize.ts a partir del
 * contenido real de la noticia, no de este valor.
 */

import type { Category } from "@/lib/types";

export interface FeedSource {
  id: string;
  medium: string;
  country: "AR" | "INT";
  url: string;
  defaultCategory: Category;
}

export const FEED_SOURCES: FeedSource[] = [
  // ---- Medios argentinos ----
  { id: "infobae-portada", medium: "Infobae", country: "AR", url: "https://www.infobae.com/argentina-footer/infobae/rss/", defaultCategory: "Argentina" },
  { id: "clarin-portada", medium: "Clarín", country: "AR", url: "https://www.clarin.com/rss/", defaultCategory: "Argentina" },
  { id: "lanacion-portada", medium: "La Nación", country: "AR", url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/", defaultCategory: "Argentina" },
  { id: "ambito-economia", medium: "Ámbito", country: "AR", url: "https://www.ambito.com/rss/economia.xml", defaultCategory: "Economía" },
  { id: "cronista-economia", medium: "El Cronista", country: "AR", url: "https://www.cronista.com/files/rss/economia.xml", defaultCategory: "Economía" },
  { id: "tn-portada", medium: "TN", country: "AR", url: "https://tn.com.ar/feed/", defaultCategory: "Argentina" },
  { id: "perfil-portada", medium: "Perfil", country: "AR", url: "https://www.perfil.com/feed", defaultCategory: "Argentina" },
  { id: "pagina12-portada", medium: "Página/12", country: "AR", url: "https://www.pagina12.com.ar/rss/portada", defaultCategory: "Argentina" },
  { id: "noticiasarg", medium: "Noticias Argentinas", country: "AR", url: "https://www.noticiasargentinas.com/rss", defaultCategory: "Argentina" },
  { id: "diariopopular", medium: "Diario Popular", country: "AR", url: "https://www.diariopopular.com.ar/rss.xml", defaultCategory: "Argentina" },

  // ---- Medios internacionales ----
  { id: "bbc-mundo", medium: "BBC", country: "INT", url: "https://feeds.bbci.co.uk/mundo/rss.xml", defaultCategory: "Internacionales" },
  { id: "reuters-world", medium: "Reuters", country: "INT", url: "https://www.reutersagency.com/feed/?best-topics=world", defaultCategory: "Internacionales" },
  { id: "cnbc-markets", medium: "CNBC", country: "INT", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", defaultCategory: "Mercados" },
  { id: "cnn-top", medium: "CNN", country: "INT", url: "http://rss.cnn.com/rss/edition.rss", defaultCategory: "Internacionales" },
  { id: "guardian-world", medium: "The Guardian", country: "INT", url: "https://www.theguardian.com/world/rss", defaultCategory: "Internacionales" },
  // Sin RSS público confiable al momento de escribir esto — requieren
  // API paga o scraping autorizado. Dejar comentados hasta resolverlo:
  // { id: "ap-news", medium: "AP News", country: "INT", url: "", defaultCategory: "Internacionales" },
  // { id: "bloomberg", medium: "Bloomberg", country: "INT", url: "", defaultCategory: "Mercados" },
  // { id: "ft", medium: "Financial Times", country: "INT", url: "", defaultCategory: "Mercados" },
  // { id: "nyt", medium: "New York Times", country: "INT", url: "", defaultCategory: "Internacionales" },
  // { id: "wsj", medium: "The Wall Street Journal", country: "INT", url: "", defaultCategory: "Mercados" },
];
