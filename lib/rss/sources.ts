import type { Category } from "@/lib/types";

export interface FeedSource {
  id: string;
  medium: string;
  country: "AR" | "INT";
  url: string;
  defaultCategory: Category;
}

function googleNewsSiteFeed(domain: string): string {
  return `https://news.google.com/rss/search?q=site:${domain}&hl=es-419&gl=AR&ceid=AR:es-419`;
}

export const FEED_SOURCES: FeedSource[] = [
  { id: "infobae", medium: "Infobae", country: "AR", url: googleNewsSiteFeed("infobae.com"), defaultCategory: "Argentina" },
  { id: "clarin", medium: "Clarín", country: "AR", url: googleNewsSiteFeed("clarin.com"), defaultCategory: "Argentina" },
  { id: "lanacion", medium: "La Nación", country: "AR", url: googleNewsSiteFeed("lanacion.com.ar"), defaultCategory: "Argentina" },
  { id: "ambito", medium: "Ámbito", country: "AR", url: googleNewsSiteFeed("ambito.com"), defaultCategory: "Economía" },
  { id: "cronista", medium: "El Cronista", country: "AR", url: googleNewsSiteFeed("cronista.com"), defaultCategory: "Economía" },
  { id: "tn", medium: "TN", country: "AR", url: googleNewsSiteFeed("tn.com.ar"), defaultCategory: "Argentina" },
  { id: "perfil", medium: "Perfil", country: "AR", url: googleNewsSiteFeed("perfil.com"), defaultCategory: "Argentina" },
  { id: "pagina12", medium: "Página/12", country: "AR", url: googleNewsSiteFeed("pagina12.com.ar"), defaultCategory: "Argentina" },
  { id: "diariopopular", medium: "Diario Popular", country: "AR", url: googleNewsSiteFeed("diariopopular.com.ar"), defaultCategory: "Argentina" },
  { id: "bbc", medium: "BBC", country: "INT", url: googleNewsSiteFeed("bbc.com"), defaultCategory: "Internacionales" },
  { id: "reuters", medium: "Reuters", country: "INT", url: googleNewsSiteFeed("reuters.com"), defaultCategory: "Internacionales" },
  { id: "apnews", medium: "AP News", country: "INT", url: googleNewsSiteFeed("apnews.com"), defaultCategory: "Internacionales" },
  { id: "bloomberg", medium: "Bloomberg", country: "INT", url: googleNewsSiteFeed("bloomberg.com"), defaultCategory: "Mercados" },
  { id: "cnbc", medium: "CNBC", country: "INT", url: googleNewsSiteFeed("cnbc.com"), defaultCategory: "Mercados" },
  { id: "cnn", medium: "CNN", country: "INT", url: googleNewsSiteFeed("cnn.com"), defaultCategory: "Internacionales" },
  { id: "guardian", medium: "The Guardian", country: "INT", url: googleNewsSiteFeed("theguardian.com"), defaultCategory: "Internacionales" },
];
