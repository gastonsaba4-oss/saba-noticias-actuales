"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Sun, Moon, Bookmark, BookmarkCheck, ExternalLink, TrendingUp, Bell, ChevronDown, ChevronUp, Radio, LogIn, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { ProcessedNewsItem, DailyDigest, Category } from "@/lib/types";

const CATEGORIES: (Category | "Todas")[] = [
  "Todas", "Argentina", "Economía", "Política", "Sociedad", "Tecnología",
  "Inteligencia Artificial", "Negocios", "Deportes", "Internacionales",
  "Mercados", "Dólar", "Criptomonedas", "Clima", "Partido de la Costa",
];

const IMPORTANCE_STYLES: Record<string, string> = {
  Alta: "bg-[#B3492B] text-[#FBF4EC]",
  Media: "bg-[#C9962E] text-[#231F1A]",
  Baja: "bg-[#5B6B63] text-[#FBF4EC]",
};

const ALERT_TOPICS = ["dólar", "inflación", "economía argentina", "IA", "Partido de la Costa", "alimentos", "energía", "comercio"];

const REFRESH_MS = 5 * 60 * 1000; // 5 minutos — alinear con NEWS_CACHE_TTL_SECONDS

function ImpactBadges({ impact }: { impact: ProcessedNewsItem["impact"] }) {
  const labels: Record<string, string> = { negocios: "Negocios", inflacion: "Inflación", dolar: "Dólar", consumo: "Consumo", inversiones: "Inversiones" };
  const active = Object.entries(impact).filter(([, v]) => v);
  if (!active.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {active.map(([k]) => (
        <span key={k} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-sm border border-current/30 text-[#B3492B] dark:text-[#E38B6F]">
          ⚡ {labels[k]}
        </span>
      ))}
    </div>
  );
}

function NewsCard({ item, isFav, onToggleFav }: { item: ProcessedNewsItem; isFav: boolean; onToggleFav: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="group relative border border-[#DDD5C7] dark:border-[#3A362F] bg-[#FEFCF8] dark:bg-[#231F1A] rounded-md overflow-hidden flex flex-col transition-shadow hover:shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
      <div className="h-1 w-full bg-gradient-to-r from-[#B3492B] to-[#C9962E]" />
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="w-full h-36 object-cover" loading="lazy" />
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#7A7365] dark:text-[#9A9384]">
          <span>
            {item.medium}{item.otherSources.length > 0 && ` +${item.otherSources.length}`} · {item.time}
          </span>
          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${IMPORTANCE_STYLES[item.importance]}`}>
            {item.importance}
          </span>
        </div>

        <h3 className="font-serif text-lg leading-snug text-[#231F1A] dark:text-[#F2EEE4]">{item.title}</h3>

        <span className="text-[11px] font-mono text-[#B3492B] dark:text-[#E38B6F] uppercase tracking-wide">{item.category}</span>

        <p className="text-sm text-[#4A453C] dark:text-[#C7C1B4] leading-relaxed">{item.summary}</p>

        {expanded && (item.extendedSummary || item.aiNote) && (
          <div className="mt-1 border-l-2 border-[#C9962E] pl-3 py-1 text-sm text-[#4A453C] dark:text-[#C7C1B4] bg-[#F4EEE0] dark:bg-[#2B271F] space-y-2">
            {item.extendedSummary && <p>{item.extendedSummary}</p>}
            {item.aiNote && (
              <p><span className="font-semibold text-[#231F1A] dark:text-[#F2EEE4]">Impacto para Argentina: </span>{item.aiNote}</p>
            )}
          </div>
        )}

        <ImpactBadges impact={item.impact} />

        <div className="flex flex-wrap gap-1.5 mt-1">
          {item.tags.map((t) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#EDE6D6] dark:bg-[#332E26] text-[#5B554A] dark:text-[#B3AB9B]">#{t}</span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#EDE6D6] dark:border-[#332E26]">
          <div className="flex gap-3">
            <button onClick={() => setExpanded((e) => !e)} className="text-xs font-medium flex items-center gap-1 text-[#5B554A] dark:text-[#B3AB9B] hover:text-[#B3492B] dark:hover:text-[#E38B6F] transition-colors">
              Resumen ampliado {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs font-medium flex items-center gap-1 text-[#5B554A] dark:text-[#B3AB9B] hover:text-[#B3492B] dark:hover:text-[#E38B6F] transition-colors">
              Leer noticia completa <ExternalLink size={12} />
            </a>
          </div>
          <button onClick={() => onToggleFav(item.id)} aria-label="Guardar en favoritos">
            {isFav ? <BookmarkCheck size={17} className="text-[#B3492B] dark:text-[#E38B6F]" /> : <Bookmark size={17} className="text-[#9A9384] hover:text-[#B3492B] dark:hover:text-[#E38B6F] transition-colors" />}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function NewsDashboard() {
  const [dark, setDark] = useState(false);
  const [category, setCategory] = useState<Category | "Todas">("Todas");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  const [news, setNews] = useState<ProcessedNewsItem[]>([]);
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setFavorites(new Set());
    setShowUserMenu(false);
  };

  const loadNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error(`API respondió ${res.status}`);
      const data = await res.json();
      setNews(data.news);
      setDigest(data.digest);
      setGeneratedAt(data.generatedAt);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg("No se pudo actualizar las noticias. Reintentando en el próximo ciclo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadNews]);

  // Al iniciar sesión, traemos los favoritos ya guardados del usuario.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = getBrowserSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/favorites", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setFavorites(new Set((data.favorites ?? []).map((f: any) => f.news_id)));
    })();
  }, [user]);

  // Favoritos: requieren sesión iniciada; si no hay usuario, mandamos a /login.
  const toggleFav = useCallback(async (id: string) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

    const supabase = getBrowserSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    const item = news.find((n) => n.id === id);
    const alreadyFav = favorites.has(id);
    if (!item) return;

    if (alreadyFav) {
      await fetch(`/api/favorites?newsId=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    } else {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newsId: id, title: item.title, link: item.link, medium: item.medium, category: item.category }),
      });
    }
  }, [news, favorites, user]);

  const filtered = useMemo(() => {
    return news.filter((n) => {
      if (category !== "Todas" && n.category !== category) return false;
      if (showFavOnly && !favorites.has(n.id)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${n.title} ${n.summary} ${n.tags.join(" ")} ${n.medium}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [news, category, query, showFavOnly, favorites]);

  const minutesAgo = generatedAt ? Math.max(0, Math.round((Date.now() - new Date(generatedAt).getTime()) / 60000)) : null;

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-[#F4EEE0] dark:bg-[#1A1712] text-[#231F1A] dark:text-[#F2EEE4] font-sans transition-colors">
        <header className="sticky top-0 z-20 backdrop-blur bg-[#F4EEE0]/90 dark:bg-[#1A1712]/90 border-b border-[#DDD5C7] dark:border-[#3A362F]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Radio size={20} className="text-[#B3492B] dark:text-[#E38B6F]" />
              <h1 className="font-serif text-xl font-bold tracking-tight">Saba Noticias Actuales</h1>
            </div>

            <div className="flex-1 relative max-w-md ml-auto">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9384]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por palabra, empresa, persona, ciudad…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-[#FEFCF8] dark:bg-[#231F1A] border border-[#DDD5C7] dark:border-[#3A362F] outline-none focus:ring-2 focus:ring-[#C9962E]"
              />
            </div>

            <button onClick={() => setShowFavOnly((f) => !f)} className={`p-2 rounded-md border transition-colors ${showFavOnly ? "bg-[#B3492B] text-[#FBF4EC] border-[#B3492B]" : "border-[#DDD5C7] dark:border-[#3A362F] hover:border-[#C9962E]"}`} aria-label="Ver favoritos">
              <Bookmark size={16} />
            </button>
            <button onClick={() => setDark((d) => !d)} className="p-2 rounded-md border border-[#DDD5C7] dark:border-[#3A362F] hover:border-[#C9962E] transition-colors" aria-label="Cambiar tema">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((m) => !m)}
                  className="w-8 h-8 rounded-full bg-[#B3492B] text-[#FBF4EC] text-xs font-semibold flex items-center justify-center"
                  aria-label="Cuenta"
                >
                  {(user.email ?? "??").slice(0, 2).toUpperCase()}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#FEFCF8] dark:bg-[#231F1A] border border-[#DDD5C7] dark:border-[#3A362F] rounded-md shadow-lg p-2 text-sm z-30">
                    <p className="px-2 py-1 text-xs text-[#9A9384] truncate">{user.email}</p>
                    <button onClick={handleLogout} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#EDE6D6] dark:hover:bg-[#332E26] flex items-center gap-2">
                      <LogOut size={14} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a href="/login" className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#231F1A] text-[#F4EEE0] dark:bg-[#F2EEE4] dark:text-[#1A1712] text-xs font-medium hover:opacity-90 transition-opacity">
                <LogIn size={14} /> Ingresar
              </a>
            )}
          </div>

          <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  category === cat
                    ? "bg-[#231F1A] text-[#F4EEE0] border-[#231F1A] dark:bg-[#F2EEE4] dark:text-[#1A1712] dark:border-[#F2EEE4]"
                    : "border-[#DDD5C7] dark:border-[#3A362F] text-[#5B554A] dark:text-[#B3AB9B] hover:border-[#C9962E]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="space-y-6">
            <div className="border border-[#DDD5C7] dark:border-[#3A362F] rounded-md bg-[#FEFCF8] dark:bg-[#231F1A]">
              <button onClick={() => setShowSummary((s) => !s)} className="w-full flex items-center justify-between px-4 py-3 border-b border-[#EDE6D6] dark:border-[#332E26]">
                <span className="flex items-center gap-2 font-serif font-semibold text-sm">
                  <TrendingUp size={15} className="text-[#B3492B] dark:text-[#E38B6F]" /> Resumen del día
                </span>
                {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showSummary && digest && (
                <div className="p-4 text-sm space-y-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wide text-[#9A9384] mb-1">Top del día</p>
                    <ol className="space-y-1.5 list-decimal list-inside">
                      {digest.top10.slice(0, 5).map((n) => (
                        <li key={n.id} className="text-[#4A453C] dark:text-[#C7C1B4] leading-snug">{n.title}</li>
                      ))}
                    </ol>
                  </div>
                  {digest.whatChanged && (
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wide text-[#9A9384] mb-1">Qué cambió vs. ayer</p>
                      <p className="text-[#4A453C] dark:text-[#C7C1B4] leading-snug">{digest.whatChanged}</p>
                    </div>
                  )}
                  {digest.dominantTopics && (
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wide text-[#9A9384] mb-1">Agenda dominante</p>
                      <p className="text-[#4A453C] dark:text-[#C7C1B4] leading-snug">{digest.dominantTopics}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border border-[#DDD5C7] dark:border-[#3A362F] rounded-md bg-[#FEFCF8] dark:bg-[#231F1A] p-4">
              <p className="flex items-center gap-2 font-serif font-semibold text-sm mb-3">
                <Bell size={15} className="text-[#B3492B] dark:text-[#E38B6F]" /> Alertas activas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALERT_TOPICS.map((t) => (
                  <span key={t} className="text-[11px] px-2 py-1 rounded-full bg-[#EDE6D6] dark:bg-[#332E26] text-[#5B554A] dark:text-[#B3AB9B]">{t}</span>
                ))}
              </div>
              <p className="text-[11px] text-[#9A9384] mt-3 leading-snug">
                {user ? "Se te notificará cuando aparezcan noticias de alta importancia sobre estos temas." : "Iniciá sesión para configurar y recibir estas alertas."}
              </p>
            </div>
          </aside>

          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[#5B554A] dark:text-[#B3AB9B]">
                {filtered.length} noticia{filtered.length !== 1 ? "s" : ""}
                {category !== "Todas" && <> en <strong>{category}</strong></>}
                {showFavOnly && <> · favoritos</>}
              </p>
              <p className="text-[11px] font-mono text-[#9A9384] flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-[#C9962E] animate-pulse" : "bg-[#5B8A5B]"}`} />
                {loading ? "actualizando…" : minutesAgo !== null ? `actualizado hace ${minutesAgo} min` : ""}
              </p>
            </div>

            {errorMsg && <p className="text-sm text-[#B3492B] mb-4">{errorMsg}</p>}

            {!loading && filtered.length === 0 ? (
              <div className="text-center py-20 text-[#9A9384]">
                <p className="font-serif text-lg mb-1">Sin resultados</p>
                <p className="text-sm">Probá con otra categoría o término de búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <NewsCard key={item.id} item={item} isFav={favorites.has(item.id)} onToggleFav={toggleFav} />
                ))}
              </div>
            )}
          </section>
        </main>

        <footer className="max-w-7xl mx-auto px-4 py-8 text-[11px] text-[#9A9384] border-t border-[#DDD5C7] dark:border-[#3A362F] mt-6">
          Los resúmenes son generados por IA a partir de metadatos públicos. Cada noticia enlaza a la fuente original — este panel no reproduce artículos completos.
        </footer>
      </div>
    </div>
  );
}
