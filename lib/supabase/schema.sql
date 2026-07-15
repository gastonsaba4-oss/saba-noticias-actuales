-- Ejecutar en el SQL Editor de Supabase.
-- Usa Supabase Auth (auth.users) para identificar al usuario dueño de cada fila.

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  news_id text not null,          -- ProcessedNewsItem.id
  title text not null,
  link text not null,
  medium text not null,
  category text not null,
  saved_at timestamptz not null default now(),
  unique (user_id, news_id)
);

create table if not exists alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,            -- ej: "dólar", "Partido de la Costa"
  min_importance text not null default 'Alta' check (min_importance in ('Alta', 'Media', 'Baja')),
  created_at timestamptz not null default now(),
  unique (user_id, topic)
);

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  default_categories text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Row Level Security: cada usuario solo ve y modifica sus propias filas.
alter table favorites enable row level security;
alter table alert_subscriptions enable row level security;
alter table user_settings enable row level security;

create policy "favorites_owner" on favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "alerts_owner" on alert_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "settings_owner" on user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
