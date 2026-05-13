#!/usr/bin/env python3
"""
LIVO Radar — Scraper de inteligencia de mercado
Fuentes: Meta Ads Library + TikTok + Facebook + Google Trends
Análisis: Gemini 2.0 Flash
"""
import os
import json
import time
import random
import httpx
import re
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN", "").strip()

if not SUPABASE_URL or not SUPABASE_URL.startswith("https://"):
    raise ValueError(f"SUPABASE_URL inválida: '{SUPABASE_URL}'")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY no encontrada")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY no encontrada")

# ── Rotación de User-Agents para evitar bloqueos ──────────────────────────────
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]

def random_headers() -> dict:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "es-PY,es;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }

def safe_sleep(min_s: float, max_s: float):
    """Pausa aleatoria para simular comportamiento humano."""
    time.sleep(random.uniform(min_s, max_s))

# ── Keywords por categoría ────────────────────────────────────────────────────
KEYWORDS = {
    "hogar_cocina": [
        "freidora de aire", "organizador cocina", "aspiradora portátil",
        "sartén antiadherente", "licuadora portátil", "dispensador jabón",
        "set cuchillos cocina", "cafetera portátil", "contenedor hermético",
        "lámpara led hogar", "ventilador portátil", "humidificador"
    ],
    "mascotas": [
        "comedero automático mascotas", "cama para perro", "juguete gato",
        "correa retráctil perro", "bebedero automático mascotas",
        "transportadora mascotas", "collar led perro"
    ],
    "oficina_escritorio": [
        "soporte laptop escritorio", "mouse inalámbrico", "teclado bluetooth",
        "lámpara escritorio usb", "organizador escritorio",
        "auriculares con micrófono", "webcam hd"
    ],
    "belleza_personal": [
        "masajeador facial", "plancha cabello mini", "rizador automático",
        "set maquillaje", "crema hidratante", "suero vitamina c",
        "kit uñas gel", "perfume mujer", "afeitadora eléctrica"
    ],
    "juguetes_ninos": [
        "drone niños", "juguete control remoto", "set lego",
        "muñeca interactiva", "pizarra magnética", "juguete educativo",
        "juego de mesa familiar", "peluche grande"
    ],
    "salud_bienestar": [
        "masajeador cuello", "banda ejercicio", "colchoneta yoga",
        "oxímetro", "termómetro digital", "suplemento colágeno",
        "faja reductora", "pistola masaje muscular"
    ]
}

# ── Fuentes de datos ──────────────────────────────────────────────────────────

def scrape_meta_ads(keyword: str, access_token: str) -> dict:
    """Meta Ads Library API oficial — no requiere browser."""
    url = "https://graph.facebook.com/v19.0/ads_archive"
    params = {
        "access_token": access_token,
        "ad_reached_countries": "['PY']",
        "search_terms": keyword,
        "ad_active_status": "ACTIVE",
        "fields": "ad_creative_body,ad_creative_link_title,page_name",
        "limit": 50
    }
    try:
        r = httpx.get(url, params=params, timeout=20, headers=random_headers())
        if r.status_code != 200:
            print(f"  Meta status {r.status_code}: {r.text[:200]}")
            return _empty_meta()
        data = r.json()
        if "error" in data:
            print(f"  Meta API error: {data['error'].get('message','')}")
            return _empty_meta()
        ads = data.get("data", [])
        page_names = list(set([a.get("page_name", "") for a in ads if a.get("page_name")]))
        titulos = [a.get("ad_creative_link_title", "") for a in ads[:5] if a.get("ad_creative_link_title")]
        cuerpos = [a.get("ad_creative_body", "") for a in ads[:5] if a.get("ad_creative_body")]
        print(f"  Meta → {len(ads)} ads, competidores: {page_names[:3]}")
        return {
            "ads_count": len(ads),
            "page_names": page_names[:5],
            "titulos_ads": titulos,
            "textos_ads": cuerpos,
            "competidor_principal": page_names[0] if page_names else None
        }
    except Exception as e:
        print(f"  Meta error ({keyword}): {e}")
        return _empty_meta()

def _empty_meta() -> dict:
    return {"ads_count": 0, "page_names": [], "titulos_ads": [], "textos_ads": [], "competidor_principal": None}

def scrape_tiktok(keyword: str) -> dict:
    """TikTok Creative Center — endpoint público."""
    url = "https://ads.tiktok.com/creative_radar_api/v1/popular_trend/list"
    headers = {
        **random_headers(),
        "Referer": "https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en"
    }
    params = {"period": 7, "country_code": "PY", "keyword": keyword, "page": 1, "limit": 20}
    try:
        r = httpx.get(url, params=params, headers=headers, timeout=15)
        data = r.json()
        items = data.get("data", {}).get("list", [])
        print(f"  TikTok → {len(items)} resultados")
        return {"tiktok_count": len(items), "tiktok_match": len(items) > 0}
    except Exception as e:
        print(f"  TikTok error ({keyword}): {e}")
        return {"tiktok_count": 0, "tiktok_match": False}

def scrape_facebook_posts(keyword: str, access_token: str) -> dict:
    """Posts públicos de Facebook relacionados al keyword en Paraguay."""
    url = "https://graph.facebook.com/v19.0/search"
    params = {
        "access_token": access_token,
        "q": keyword + " Paraguay venta",
        "type": "post",
        "fields": "message,created_time",
        "limit": 25
    }
    try:
        r = httpx.get(url, params=params, timeout=15, headers=random_headers())
        data = r.json()
        posts = data.get("data", [])
        print(f"  Facebook → {len(posts)} posts")
        return {"marketplace_count": len(posts)}
    except Exception as e:
        print(f"  Facebook error ({keyword}): {e}")
        return {"marketplace_count": 0}

def get_google_trends_py() -> list:
    """Google Trends Paraguay — búsquedas del día."""
    url = "https://trends.google.com/trends/api/dailytrends"
    params = {"hl": "es", "tz": -240, "geo": "PY", "ns": 15}
    try:
        r = httpx.get(url, params=params, timeout=15, headers=random_headers())
        text = r.text[5:]  # remover prefix )]}'\n
        data = json.loads(text)
        searches = data["default"]["trendingSearchesDays"][0]["trendingSearches"]
        trends = [s["title"]["query"].lower() for s in searches]
        print(f"Google Trends PY hoy: {trends[:5]}")
        return trends
    except Exception as e:
        print(f"Google Trends error: {e}")
        return []

# ── Gemini ────────────────────────────────────────────────────────────────────

def call_gemini(prompt: str, api_key: str, retries: int = 3) -> dict:
    """
    Llama a Gemini 2.0 Flash con safety settings desactivados y responseMimeType JSON.
    Reintenta hasta 3 veces con pausa exponencial.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
        ]
    }

    for attempt in range(retries):
        try:
            r = httpx.post(url, json=body, timeout=40)
            raw = r.json()

            # Log detallado siempre
            print(f"  Gemini status: {r.status_code}")

            if r.status_code == 429:
                wait = (attempt + 1) * 15
                print(f"  Rate limit — esperando {wait}s")
                time.sleep(wait)
                continue

            if r.status_code != 200:
                print(f"  Gemini error HTTP: {r.status_code} — {str(raw)[:300]}")
                return None

            if "candidates" not in raw:
                print(f"  Gemini sin candidates: {str(raw)[:300]}")
                return None

            text = raw["candidates"][0]["content"]["parts"][0]["text"]
            # Limpiar posibles backticks residuales
            text = re.sub(r"```json|```", "", text).strip()
            result = json.loads(text)
            return result

        except json.JSONDecodeError as e:
            print(f"  Gemini JSON inválido (intento {attempt+1}): {e}")
            safe_sleep(4, 6)
        except Exception as e:
            print(f"  Gemini excepción (intento {attempt+1}): {e}")
            safe_sleep(4, 6)

    return None

# ── Supabase ──────────────────────────────────────────────────────────────────

def save_product(supabase: Client, result: dict, categoria: str, keyword: str, meta: dict, tiktok: dict, fb: dict):
    ideas = result.get("ideas_contenido", {})

    product_data = {
        "nombre": result["nombre_producto"],
        "categoria": categoria,
        "trend_score": result.get("trend_score", 0),
        "viral_score": result.get("viral_score", 0),
        "ads_count": meta["ads_count"],
        "competition": result.get("competencia", "medium"),
        "demanda": result.get("demanda", "medium"),
        "vale_la_pena": result.get("vale_la_pena", False),
        "analisis_gemini": result.get("razon", ""),
        "precio_venta_sugerido_gs": result.get("precio_venta_sugerido_gs"),
        "margen_estimado_pct": result.get("margen_estimado_pct"),
        "alerta": result.get("alerta"),
        "source": "meta_ads,tiktok,facebook,google_trends",
        "detected_keywords": [keyword],
        "status": "hot" if result.get("trend_score", 0) >= 80 else "new",
        "fuentes": ["meta", "tiktok", "facebook", "google_trends"]
    }

    try:
        response = supabase.table("trending_products").upsert(
            product_data, on_conflict="nombre"
        ).execute()

        if not response.data:
            print(f"  Supabase: sin datos en respuesta")
            return

        product_id = response.data[0]["id"]
        print(f"  Supabase: guardado con id {product_id}")

        # Guardar ideas de contenido
        for plataforma in ["tiktok", "reels", "facebook"]:
            idea = ideas.get(plataforma, {})
            if not idea:
                continue
            supabase.table("content_ideas").upsert({
                "producto_id": product_id,
                "producto_nombre": result["nombre_producto"],
                "plataforma": plataforma,
                "formato": idea.get("formato"),
                "hook": idea.get("hook"),
                "guion": idea.get("guion"),
                "descripcion_visual": idea.get("descripcion_visual"),
                "hashtags": idea.get("hashtags", []),
                "musica_sugerida": idea.get("musica"),
                "duracion_segundos": idea.get("duracion_segundos"),
                "competidor_referencia": meta.get("competidor_principal"),
                "competidor_formato": result.get("competidor_formato"),
                "competidor_hook": result.get("competidor_hook")
            }, on_conflict="producto_id,plataforma").execute()

    except Exception as e:
        print(f"  Error Supabase ({result.get('nombre_producto','')}): {e}")

def generate_daily_report(supabase: Client, api_key: str):
    try:
        response = supabase.table("trending_products")\
            .select("*")\
            .eq("vale_la_pena", True)\
            .gte("created_at", date.today().isoformat())\
            .order("trend_score", desc=True)\
            .limit(3)\
            .execute()

        top3 = response.data
        if not top3:
            print("Sin productos para reporte diario")
            return

        productos_txt = "\n".join([
            f"{i+1}. {p['nombre']} — trend: {p['trend_score']}, competencia: {p['competition']}, demanda: {p['demanda']}, margen: {p['margen_estimado_pct']}%"
            for i, p in enumerate(top3)
        ])

        prompt = f"""
Sos un analista experto en comercio electrónico para Paraguay con foco en ventas por redes sociales.
Top productos más vendibles detectados HOY:
{productos_txt}

Generá una guía de acción concreta para un vendedor paraguayo que vende por TikTok, Instagram y Facebook.
Respondé SOLO con JSON válido sin texto adicional ni backticks:
{{
  "titulo": "título atractivo del reporte de hoy máximo 10 palabras",
  "resumen": "párrafo de 3 oraciones explicando qué está pasando en el mercado hoy",
  "producto_estrella": "nombre exacto del producto número 1",
  "por_que_hoy": "razón específica y concreta de por qué este producto es oportunidad AHORA en Paraguay",
  "accion_inmediata": "qué hacer exactamente en las próximas 24 horas para empezar a venderlo",
  "idea_video_rapida": "idea de video de 30 segundos que podés grabar hoy mismo con el celular",
  "advertencia": "riesgo principal a tener en cuenta o null"
}}
"""
        result = call_gemini(prompt, api_key)
        if not result:
            return

        supabase.table("radar_daily_report").insert({
            "titulo": result.get("titulo", "Reporte del día"),
            "resumen": result.get("resumen", ""),
            "producto_estrella": result.get("producto_estrella", ""),
            "por_que_hoy": result.get("por_que_hoy", ""),
            "accion_inmediata": result.get("accion_inmediata", ""),
            "advertencia": result.get("advertencia"),
            "top3_ids": [p["id"] for p in top3]
        }).execute()

        print(f"✓ Reporte diario: {result.get('titulo','')}")

    except Exception as e:
        print(f"Error generando reporte diario: {e}")

# ── Prompt para análisis de producto ─────────────────────────────────────────

def build_prompt(keyword: str, categoria: str, meta: dict, tiktok: dict, fb: dict, en_trends: bool) -> str:
    return f"""
Eres un analista experto en comercio electrónico y marketing digital para Paraguay.
Analizá este producto con los datos reales que te doy:

PRODUCTO: {keyword}
CATEGORÍA: {categoria}
ADS ACTIVOS EN META PARAGUAY: {meta['ads_count']}
PÁGINAS QUE ANUNCIAN: {meta['page_names']}
TEXTOS DE ADS: {meta['textos_ads'][:3]}
TITULOS DE ADS: {meta['titulos_ads'][:3]}
COMPETIDOR PRINCIPAL: {meta['competidor_principal']}
POSTS EN FACEBOOK PARAGUAY: {fb['marketplace_count']}
EN TIKTOK: {tiktok['tiktok_match']} ({tiktok['tiktok_count']} videos)
EN GOOGLE TRENDS PY HOY: {en_trends}

Respondé SOLO con este JSON válido, sin texto adicional:
{{
  "nombre_producto": "nombre comercial atractivo",
  "vale_la_pena": true,
  "razon": "2 oraciones basadas en los datos",
  "competencia": "low",
  "demanda": "medium",
  "trend_score": 75,
  "viral_score": 70,
  "precio_venta_sugerido_gs": 150000,
  "margen_estimado_pct": 35,
  "alerta": null,
  "competidor_formato": "unboxing",
  "competidor_hook": "frase que usa el competidor",
  "ideas_contenido": {{
    "tiktok": {{
      "formato": "unboxing",
      "hook": "primera frase 3 segundos",
      "guion": "guión completo 30-45 seg",
      "descripcion_visual": "qué se ve en pantalla escena por escena",
      "hashtags": ["#paraguay", "#tiendaonline", "#oferta"],
      "musica": "beat urbano latino trending",
      "duracion_segundos": 30
    }},
    "reels": {{
      "formato": "review",
      "hook": "primera frase para reels",
      "guion": "guión 15-30 seg",
      "descripcion_visual": "escenas del reel",
      "hashtags": ["#reels", "#paraguay"],
      "musica": "canción trending reels",
      "duracion_segundos": 20
    }},
    "facebook": {{
      "formato": "video ad",
      "hook": "primera frase facebook",
      "guion": "guión 45-60 seg",
      "descripcion_visual": "escenas del video",
      "hashtags": ["#paraguay", "#venta"],
      "musica": "música suave de fondo",
      "duracion_segundos": 45
    }}
  }}
}}
"""

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("═" * 50)
    print("LIVO Radar — iniciando scraping")
    print("═" * 50)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    google_trends = get_google_trends_py()

    total_ok = 0
    total_err = 0
    gemini_calls = 0

    for categoria, keywords in KEYWORDS.items():
        print(f"\n── Categoría: {categoria} ──")
        for keyword in keywords:
            print(f"\n  Procesando: {keyword}")
            try:
                # Recolectar datos de las 4 fuentes
                meta = scrape_meta_ads(keyword, META_ACCESS_TOKEN)
                safe_sleep(1, 2)

                tiktok = scrape_tiktok(keyword)
                safe_sleep(1, 2)

                fb = scrape_facebook_posts(keyword, META_ACCESS_TOKEN)
                safe_sleep(1, 2)

                en_trends = any(keyword.lower() in t for t in google_trends)

                # Llamar a Gemini — respetar 15 req/min
                gemini_calls += 1
                if gemini_calls % 10 == 0:
                    print(f"  Pausa anti rate-limit (15s)...")
                    time.sleep(15)

                prompt = build_prompt(keyword, categoria, meta, tiktok, fb, en_trends)
                result = call_gemini(prompt, GEMINI_API_KEY)

                # Pausa entre llamadas a Gemini
                safe_sleep(4, 6)

                if result:
                    save_product(supabase, result, categoria, keyword, meta, tiktok, fb)
                    print(f"  ✓ {result.get('nombre_producto',keyword)} — score: {result.get('trend_score',0)}, vale: {result.get('vale_la_pena',False)}")
                    total_ok += 1
                else:
                    print(f"  ✗ Gemini no devolvió resultado para: {keyword}")
                    total_err += 1

            except Exception as e:
                print(f"  ✗ Error inesperado en {keyword}: {e}")
                total_err += 1

    print(f"\n── Generando reporte diario ──")
    generate_daily_report(supabase, GEMINI_API_KEY)

    print(f"\n{'═'*50}")
    print(f"✓ Scraping completo: {total_ok} productos guardados, {total_err} errores")
    print(f"{'═'*50}")

if __name__ == "__main__":
    main()
