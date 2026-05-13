#!/usr/bin/env python3
import os
import sys
import json
import time
import httpx
import re
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN", "").strip()

# Validación al inicio
if not SUPABASE_URL or not SUPABASE_URL.startswith("https://"):
    raise ValueError(f"SUPABASE_URL inválida: '{SUPABASE_URL}'")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY no encontrada")

KEYWORDS = {
    "hogar_cocina": [
        "freidora de aire", "organizador cocina", "aspiradora portátil",
        "sartén antiadherente", "licuadora portátil", "dispensador jabón",
        "set cuchillos cocina", "soporte celular cocina", "cafetera portátil",
        "contenedor hermético", "escurridor platos", "repisa flotante",
        "lámpara led hogar", "ventilador portátil", "humidificador"
    ],
    "mascotas": [
        "comedero automático mascotas", "cama para perro", "juguete gato",
        "correa retráctil perro", "ropa para perro", "bebedero automático mascotas",
        "arena sanitaria gato", "transportadora mascotas", "collar led perro"
    ],
    "oficina_escritorio": [
        "soporte laptop escritorio", "mouse inalámbrico", "teclado bluetooth",
        "lámpara escritorio usb", "organizador escritorio", "silla ergonómica",
        "auriculares con micrófono", "webcam hd", "base enfriadora laptop",
        "cuaderno inteligente", "agenda planificador"
    ],
    "belleza_personal": [
        "masajeador facial", "plancha cabello mini", "rizador automático",
        "set maquillaje", "crema hidratante", "suero vitamina c",
        "kit uñas gel", "removedor maquillaje", "esponja maquillaje",
        "perfume mujer", "kit cuidado barba", "afeitadora eléctrica"
    ],
    "juguetes_ninos": [
        "drone niños", "juguete control remoto", "set lego",
        "muñeca interactiva", "pizarra magnética", "juguete educativo",
        "kit manualidades niños", "castillo inflable", "bicicleta niño",
        "juego de mesa familiar", "peluche grande"
    ],
    "salud_bienestar": [
        "masajeador cuello", "banda ejercicio", "colchoneta yoga",
        "tensiómetro digital", "oxímetro", "termómetro digital",
        "suplemento colágeno", "vitaminas", "faja reductora",
        "rodillo masaje espalda", "pesas mano", "pistola masaje muscular"
    ]
}

def scrape_meta_ads(keyword: str, access_token: str) -> dict:
    url = "https://graph.facebook.com/v19.0/ads_archive"
    params = {
        "access_token": access_token,
        "ad_reached_countries": "['PY']",
        "search_terms": keyword,
        "ad_active_status": "ACTIVE",
        "fields": "ad_creative_body,ad_creative_link_title,page_name,impressions",
        "limit": 50
    }
    try:
        r = httpx.get(url, params=params, timeout=15)
        data = r.json()
        ads = data.get("data", [])
        page_names = list(set([a.get("page_name","") for a in ads if a.get("page_name")]))
        titulos = [a.get("ad_creative_link_title","") for a in ads[:5] if a.get("ad_creative_link_title")]
        cuerpos = [a.get("ad_creative_body","") for a in ads[:5] if a.get("ad_creative_body")]
        return {
            "ads_count": len(ads),
            "page_names": page_names[:5],
            "titulos_ads": titulos,
            "textos_ads": cuerpos,
            "competidor_principal": page_names[0] if page_names else None
        }
    except Exception as e:
        print(f"  Meta error ({keyword}): {e}")
        return {"ads_count": 0, "page_names": [], "titulos_ads": [], "textos_ads": [], "competidor_principal": None}

def scrape_tiktok(keyword: str) -> dict:
    url = "https://ads.tiktok.com/creative_radar_api/v1/popular_trend/list"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en"
    }
    params = {"period": 7, "country_code": "PY", "keyword": keyword, "page": 1, "limit": 20}
    try:
        r = httpx.get(url, params=params, headers=headers, timeout=15)
        data = r.json()
        items = data.get("data", {}).get("list", [])
        return {
            "tiktok_count": len(items),
            "tiktok_match": len(items) > 0,
            "tiktok_formatos": [i.get("video_info", {}).get("duration", 0) for i in items[:3]]
        }
    except:
        return {"tiktok_count": 0, "tiktok_match": False, "tiktok_formatos": []}

def scrape_facebook_posts(keyword: str, access_token: str) -> dict:
    url = "https://graph.facebook.com/v19.0/search"
    params = {
        "access_token": access_token,
        "q": keyword + " Paraguay venta",
        "type": "post",
        "fields": "message,created_time",
        "limit": 25
    }
    try:
        r = httpx.get(url, params=params, timeout=15)
        data = r.json()
        posts = data.get("data", [])
        return {"marketplace_count": len(posts)}
    except:
        return {"marketplace_count": 0}

def get_google_trends_py() -> list:
    url = "https://trends.google.com/trends/api/dailytrends"
    params = {"hl": "es", "tz": -240, "geo": "PY", "ns": 15}
    try:
        r = httpx.get(url, params=params, timeout=15)
        text = r.text[5:]
        data = json.loads(text)
        searches = data["default"]["trendingSearchesDays"][0]["trendingSearches"]
        return [s["title"]["query"].lower() for s in searches]
    except:
        return []

def get_gemini_model(api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    try:
        r = httpx.get(url, timeout=15)
        models = r.json().get("models", [])
        for m in models:
            name = m.get("name", "")
            if "flash" in name and "generateContent" in m.get("supportedGenerationMethods", []):
                model = name.replace("models/", "")
                print(f"  Modelo Gemini encontrado: {model}")
                return model
        return "gemini-1.5-flash"
    except Exception as e:
        print(f"  Error consultando modelos: {e}")
        return "gemini-1.5-flash"

GEMINI_MODEL = get_gemini_model(GEMINI_API_KEY)

def call_gemini(prompt: str, api_key: str) -> dict:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    try:
        r = httpx.post(url, json=body, timeout=30)
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        text = re.sub(r"```json|```", "", text).strip()
        return json.loads(text)
    except Exception as e:
        print(f"  Gemini error: {e}")
        return None

def save_product(supabase: Client, result: dict, categoria: str, keyword: str, meta: dict, tiktok: dict, fb: dict):
    ideas = result.get("ideas_contenido", {})
    
    product_data = {
        "nombre": result["nombre_producto"],
        "categoria": categoria,
        "trend_score": result["trend_score"],
        "viral_score": result["viral_score"],
        "ads_count": meta["ads_count"],
        "competition": result["competencia"],
        "demanda": result["demanda"],
        "vale_la_pena": result["vale_la_pena"],
        "analisis_gemini": result["razon"],
        "precio_venta_sugerido_gs": result["precio_venta_sugerido_gs"],
        "margen_estimado_pct": result["margen_estimado_pct"],
        "alerta": result["alerta"],
        "source": "meta_ads,tiktok,facebook,google_trends",
        "detected_keywords": [keyword],
        "status": "hot" if result["trend_score"] >= 80 else "new",
        "fuentes": ["meta", "tiktok", "facebook", "google_trends"]
    }
    
    try:
        response = supabase.table("trending_products").upsert(product_data, on_conflict="nombre").execute()
        if not response.data:
            return
        product_id = response.data[0]["id"]
        
        # Guardar ideas de contenido por plataforma
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
        print(f"  Error guardando en Supabase: {e}")

def generate_daily_report(supabase: Client, api_key: str):
    response = supabase.table("trending_products")\
        .select("*")\
        .eq("vale_la_pena", True)\
        .gte("created_at", date.today().isoformat())\
        .order("trend_score", desc=True)\
        .limit(3)\
        .execute()
    
    top3 = response.data
    if len(top3) < 1:
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
  "titulo": "título atractivo del reporte de hoy (máximo 10 palabras)",
  "resumen": "párrafo de 3 oraciones explicando qué está pasando en el mercado hoy",
  "producto_estrella": "nombre exacto del producto #1",
  "por_que_today": "razón específica y concreta de por qué este producto es oportunidad AHORA en Paraguay",
  "accion_inmediata": "qué hacer exactamente en las próximas 24 horas para empezar a venderlo",
  "idea_video_rapida": "idea de video de 30 segundos que podés grabar hoy mismo con el celular",
  "advertencia": "riesgo principal a tener en cuenta o null"
}}
"""
    
    result = call_gemini(prompt, api_key)
    if not result:
        return
    
    supabase.table("radar_daily_report").insert({
        "titulo": result["titulo"],
        "resumen": result["resumen"],
        "producto_estrella": result["producto_estrella"],
        "por_que_hoy": result["por_que_today"],
        "accion_inmediata": result["accion_inmediata"],
        "advertencia": result.get("advertencia"),
        "top3_ids": [p["id"] for p in top3]
    }).execute()
    
    print(f"✓ Reporte diario generado: {result['titulo']}")

async def main():
    if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY, META_ACCESS_TOKEN]):
        print("Faltan variables de entorno.")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    google_trends = get_google_trends_py()
    print(f"Google Trends PY hoy: {google_trends}")
    
    total_ok = 0
    total_err = 0
    
    for categoria, keywords in KEYWORDS.items():
        print(f"\n── Categoría: {categoria} ──")
        for keyword in keywords:
            print(f"  Procesando: {keyword}")
            try:
                meta = scrape_meta_ads(keyword, META_ACCESS_TOKEN)
                tiktok = scrape_tiktok(keyword)
                fb = scrape_facebook_posts(keyword, META_ACCESS_TOKEN)
                en_trends = any(keyword.lower() in t for t in google_trends)
                
                prompt = f"""
Eres un analista experto en comercio electrónico y marketing digital para Paraguay.
Tenés experiencia en TikTok, Instagram Reels y Facebook Ads.
Analizá este producto con los datos reales:
PRODUCTO: {keyword}
CATEGORÍA: {categoria}
ADS ACTIVOS EN META PARAGUAY: {meta['ads_count']}
PÁGINAS COMPETIDORAS ANUNCIANDO: {meta['page_names']}
FRASES QUE USAN EN SUS ADS: {meta['textos_ads']}
TÍTULOS DE ADS DE COMPETIDORES: {meta['titulos_ads']}
COMPETIDOR PRINCIPAL DETECTADO: {meta['competidor_principal']}
POSTS EN FACEBOOK PARAGUAY: {fb['marketplace_count']}
EN TIKTOK ADS: {tiktok['tiktok_match']} ({tiktok['tiktok_count']} videos)
EN GOOGLE TRENDS PY HOY: {en_trends}

Respondé SOLO con este JSON válido, sin texto adicional, sin backticks, sin markdown:
{{
  "nombre_producto": "nombre comercial real y atractivo del producto",
  "vale_la_pena": true o false,
  "razon": "máximo 2 oraciones basadas en los datos reales",
  "competencia": "low, medium o high",
  "demanda": "low, medium o high",
  "trend_score": número 0-100,
  "viral_score": número 0-100,
  "precio_venta_sugerido_gs": número entero en guaraníes,
  "margen_estimado_pct": número 0-100,
  "alerta": "texto corto sobre riesgo o null",
  "competidor_formato": "qué formato de video usa el competidor principal (unboxing/review/tutorial/comparacion/hook_directo)",
  "competidor_hook": "frase o estilo que usa el competidor para enganchar en los primeros segundos",
  "ideas_contenido": {{
    "tiktok": {{ "formato": "...", "hook": "...", "guion": "...", "descripcion_visual": "...", "hashtags": [], "musica": "...", "duracion_segundos": 30 }},
    "reels": {{ "formato": "...", "hook": "...", "guion": "...", "descripcion_visual": "...", "hashtags": [], "musica": "...", "duracion_segundos": 20 }},
    "facebook": {{ "formato": "...", "hook": "...", "guion": "...", "descripcion_visual": "...", "hashtags": [], "musica": "...", "duracion_segundos": 45 }}
  }}
}}
"""
                result = call_gemini(prompt, GEMINI_API_KEY)
                
                if result:
                    save_product(supabase, result, categoria, keyword, meta, tiktok, fb)
                    print(f"  ✓ {result['nombre_producto']} — score: {result['trend_score']}, vale: {result['vale_la_pena']}")
                    total_ok += 1
                else:
                    total_err += 1
                    
                time.sleep(1)
                
            except Exception as e:
                print(f"  ✗ Error en {keyword}: {e}")
                total_err += 1
    
    print(f"\n── Generando reporte diario ──")
    generate_daily_report(supabase, GEMINI_API_KEY)
    print(f"\n✓ Scraping completo: {total_ok} productos, {total_err} errores")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
