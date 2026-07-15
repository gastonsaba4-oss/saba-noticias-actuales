import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/client";

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
    .from("alert_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data });
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { topic, minImportance = "Alta" } = await req.json();
  if (!topic) return NextResponse.json({ error: "Falta topic" }, { status: 400 });

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("alert_subscriptions")
    .upsert(
      { user_id: userId, topic, min_importance: minImportance },
      { onConflict: "user_id,topic" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic");
  if (!topic) return NextResponse.json({ error: "Falta topic" }, { status: 400 });

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("alert_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("topic", topic);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
