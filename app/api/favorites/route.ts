import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/client";

// Todas las rutas esperan un header Authorization: Bearer <access_token>
// del usuario autenticado (Supabase Auth), para saber de quién son los favoritos.

async function getUserId(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = getServerSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorites: data });
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { newsId, title, link, medium, category } = body;
  if (!newsId || !title || !link) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("favorites")
    .upsert(
      { user_id: userId, news_id: newsId, title, link, medium, category },
      { onConflict: "user_id,news_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const newsId = searchParams.get("newsId");
  if (!newsId) return NextResponse.json({ error: "Falta newsId" }, { status: 400 });

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("news_id", newsId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
