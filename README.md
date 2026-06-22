# LIVOshop

Tienda online para Paraguay. Catálogo de productos con pedidos por WhatsApp, panel de administración y radar privado de oportunidades de mercado.

## Stack

- **React 18** + Vite
- **Supabase** — base de datos (PostgreSQL), auth y storage de imágenes
- **React Router v6**
- **Netlify** — deploy

## Estructura

```
src/
├── components/
│   ├── Navbar.jsx       — barra fija con logo y carrito
│   ├── Cart.jsx         — drawer lateral del pedido
│   ├── Footer.jsx
│   └── ProductCard.jsx  — tarjeta de producto con tracking
├── pages/
│   ├── Home.jsx         — catálogo público con filtro por categoría
│   ├── Producto.jsx     — detalle de producto
│   ├── Admin.jsx        — CRUD de productos (requiere login)
│   ├── Radar.jsx        — herramienta privada de inteligencia de mercado
│   └── Login.jsx
└── lib/
    ├── supabase.js      — cliente Supabase
    ├── AuthContext.jsx  — sesión del admin
    ├── CartContext.jsx  — estado del carrito
    ├── tracking.js      — registro de eventos (vista / whatsapp / carrito)
    └── mlapi.js         — wrapper API pública MercadoLibre Paraguay
```

## Variables de entorno

Crear `.env` en la raíz:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Supabase — tablas requeridas

### `productos`

| columna | tipo |
|---|---|
| id | uuid PK |
| nombre | text |
| precio_gs | int4 |
| descripcion | text |
| categoria | text |
| tipo | text (`stock` / `dropshipping`) |
| imagenes | text[] |
| variantes | text[] |
| activo | bool |
| destacado | bool |
| creado_en | timestamptz |

### `producto_eventos` (Radar)

Ejecutar `radar_setup.sql` una sola vez en el SQL Editor de Supabase:

```sql
create table if not exists producto_eventos (
  id          uuid        primary key default gen_random_uuid(),
  producto_id uuid        references productos(id) on delete cascade,
  tipo        text        not null check (tipo in ('vista','whatsapp','carrito')),
  creado_en   timestamptz not null default now()
);
create index if not exists idx_eventos_producto_fecha on producto_eventos (producto_id, creado_en desc);
create index if not exists idx_eventos_tipo_fecha     on producto_eventos (tipo, creado_en desc);
alter table producto_eventos enable row level security;
create policy "insert_publico" on producto_eventos for insert with check (true);
create policy "select_admin"   on producto_eventos for select using (auth.role() = 'authenticated');
create policy "delete_admin"   on producto_eventos for delete using (auth.role() = 'authenticated');
```

## Radar de Productos

Herramienta privada en `/radar` (solo accesible logueado como admin).

**Qué muestra:**
- Métricas internas de la tienda: vistas, consultas WhatsApp, carritos y tasa de conversión — filtrable por 7 / 14 / 30 días
- Ranking de tus productos más calientes (score ponderado: carrito ×4, WhatsApp ×2, vista ×1)
- Tendencias en tiempo real en MercadoLibre Paraguay
- Top productos más vendidos en MercadoLibre PY por categoría
- Buscador de demanda: escribís un producto y ves cuánto se mueve en Paraguay + precio promedio

**Nota sobre MercadoLibre:** la API pública de ML permite requests desde el browser con CORS. En `localhost` puede dar 403 dependiendo del endpoint; en producción (Netlify) funciona correctamente.

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
```

Netlify detecta el `netlify.toml` y hace el redirect de SPA automáticamente.
