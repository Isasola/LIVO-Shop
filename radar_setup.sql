-- ============================================================
-- RADAR DE PRODUCTOS — Livoshop
-- Ejecutá esto una sola vez en el SQL Editor de Supabase
-- ============================================================

create table if not exists producto_eventos (
  id          uuid        primary key default gen_random_uuid(),
  producto_id uuid        references productos(id) on delete cascade,
  tipo        text        not null check (tipo in ('vista', 'whatsapp', 'carrito')),
  creado_en   timestamptz not null default now()
);

-- Índices para que las queries del Radar sean rápidas
create index if not exists idx_eventos_producto_fecha on producto_eventos (producto_id, creado_en desc);
create index if not exists idx_eventos_tipo_fecha     on producto_eventos (tipo, creado_en desc);

-- Row Level Security
alter table producto_eventos enable row level security;

-- Cualquiera puede insertar (los visitantes registran sus acciones)
create policy "insert_publico" on producto_eventos
  for insert with check (true);

-- Solo usuarios autenticados (el admin) pueden leer
create policy "select_admin" on producto_eventos
  for select using (auth.role() = 'authenticated');

-- Solo el admin puede borrar (útil para limpiar datos viejos)
create policy "delete_admin" on producto_eventos
  for delete using (auth.role() = 'authenticated');
