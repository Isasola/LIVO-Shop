#!/usr/bin/env python3
"""
LIVO RADAR — Sistema de scraping automático de productos trending
Detecta productos populares en Meta Ads, Google Trends y TikTok
"""

import os
import sys
import json
import time
import asyncio
import httpx
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urlencode
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase imports
from supabase import create_client, Client

# Playwright imports
from playwright.async_api import async_playwright, Page, Browser

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
TIMEOUT = 30000  # 30 seconds

# Keywords to search
KEYWORDS = [
    "mini printer", "organizador cocina", "aspiradora portátil",
    "cámara wifi", "masajeador", "luz led", "auriculares bluetooth",
    "reloj inteligente", "funda celular", "cargador rápido",
    "crema facial", "suero vitamina c", "shampoo", "perfume mujer",
    "ropa deportiva", "zapatillas", "bolso", "cartera",
    "juguete niño", "kit cocina", "sartén", "freidora de aire",
    "suplemento proteína", "colágeno", "vitaminas"
]

class LivoRadar:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.results = []
        self.errors = []
        
    async def scrape_meta_ads(self) -> Dict[str, int]:
        """Scrape Meta Ads Library for active ads by keyword"""
        print("\n📱 Iniciando scraping de Meta Ads Library...")
        meta_data = {}
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            for keyword in KEYWORDS[:10]:  # Limit to 10 keywords for speed
                try:
                    page = await browser.new_page()
                    url = f"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=PY&search_type=keyword_unordered&q={keyword}"
                    
                    print(f"  🔍 Buscando: {keyword}")
                    await page.goto(url, wait_until="networkidle", timeout=TIMEOUT)
                    await page.wait_for_timeout(3000)
                    
                    # Try to count visible ads (this is a simplified approach)
                    # In reality, Meta Ads Library requires authentication for full access
                    try:
                        ad_count = await page.evaluate("""
                            () => {
                                const ads = document.querySelectorAll('[data-testid*="ad"]');
                                return ads.length;
                            }
                        """)
                        meta_data[keyword] = max(ad_count, 1)  # At least 1
                        print(f"    ✓ {keyword}: {meta_data[keyword]} ads detectados")
                    except:
                        # If evaluation fails, use a default count
                        meta_data[keyword] = 1
                    
                    await page.close()
                    await page.context.close()
                    
                except Exception as e:
                    print(f"    ✗ Error en {keyword}: {str(e)}")
                    meta_data[keyword] = 1
                    self.errors.append(f"Meta Ads - {keyword}: {str(e)}")
            
            await browser.close()
        
        return meta_data

    async def scrape_google_trends(self) -> Dict[str, int]:
        """Fetch Google Trends data for Paraguay"""
        print("\n🔥 Obteniendo datos de Google Trends...")
        trends_data = {}
        
        try:
            async with httpx.AsyncClient() as client:
                url = "https://trends.google.com/trends/api/dailytrends?hl=es&tz=-240&geo=PY"
                response = await client.get(url, timeout=TIMEOUT)
                
                # Google Trends returns JSONP, need to parse it
                text = response.text
                if text.startswith(')]}\''):
                    text = text[5:]  # Remove JSONP wrapper
                
                data = json.loads(text)
                trends = data.get('default', {}).get('trendingSearchesDays', [])
                
                if trends:
                    for day in trends[:1]:  # Get today's trends
                        for trend in day.get('trendingSearches', [])[:20]:
                            query = trend.get('title', {}).get('query', '').lower()
                            if query:
                                # Check if trend matches any keyword
                                for keyword in KEYWORDS:
                                    if keyword.lower() in query or query in keyword.lower():
                                        trends_data[keyword] = trends_data.get(keyword, 0) + 20
                                        print(f"  ✓ Trend match: {keyword} (boost +20)")
                
                print(f"  ✓ {len(trends_data)} keywords con trend boost")
                
        except Exception as e:
            print(f"  ✗ Error en Google Trends: {str(e)}")
            self.errors.append(f"Google Trends: {str(e)}")
        
        return trends_data

    async def scrape_tiktok_creative_center(self) -> List[str]:
        """Scrape TikTok Creative Center for trending ads"""
        print("\n🎵 Analizando TikTok Creative Center...")
        tiktok_matches = []
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                url = "https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en"
                await page.goto(url, wait_until="networkidle", timeout=TIMEOUT)
                await page.wait_for_timeout(3000)
                
                # Extract visible product names
                try:
                    products = await page.evaluate("""
                        () => {
                            const elements = document.querySelectorAll('[class*="product"], [class*="ad"], h2, h3');
                            const names = [];
                            elements.forEach(el => {
                                const text = el.textContent?.trim().toLowerCase();
                                if (text && text.length > 3 && text.length < 100) {
                                    names.push(text);
                                }
                            });
                            return [...new Set(names)].slice(0, 30);
                        }
                    """)
                    
                    # Check if any products match our keywords
                    for product in products:
                        for keyword in KEYWORDS:
                            if keyword.lower() in product or product in keyword.lower():
                                if keyword not in tiktok_matches:
                                    tiktok_matches.append(keyword)
                                    print(f"  ✓ TikTok match: {keyword}")
                    
                except:
                    pass
                
                await page.close()
                await browser.close()
                
        except Exception as e:
            print(f"  ✗ Error en TikTok: {str(e)}")
            self.errors.append(f"TikTok: {str(e)}")
        
        return tiktok_matches

    def compute_full_score(self, ads_count: int, google_trend: int, 
                          tiktok_match: bool, competition_count: int) -> Dict:
        """Compute trend score, viral score, and competition level"""
        
        # Trend score: qué tan popular es
        trend = 0
        trend += min(50, ads_count * 1.5)           # max 50 puntos por ads
        trend += min(25, google_trend * 0.25)        # max 25 puntos por Google
        trend += 25 if tiktok_match else 0           # 25 puntos si está en TikTok
        
        # Viral score: velocidad de crecimiento
        viral = min(100, trend * 1.1)
        
        # Competencia: basado en cantidad de anunciantes distintos
        if competition_count >= 30:
            competition = 'high'
        elif competition_count >= 12:
            competition = 'medium'
        else:
            competition = 'low'
        
        # Status automático
        status = 'hot' if trend >= 85 else 'new'
        
        return {
            'trend_score': int(min(100, trend)),
            'viral_score': int(min(100, viral)),
            'competition': competition,
            'status': status
        }

    async def run(self):
        """Main execution"""
        print("=" * 60)
        print("🚀 LIVO RADAR — Scraping automático iniciado")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        try:
            # Scrape all sources
            meta_data = await self.scrape_meta_ads()
            google_trends = await self.scrape_google_trends()
            tiktok_matches = await self.scrape_tiktok_creative_center()
            
            # Process and upsert data
            print("\n💾 Guardando datos en Supabase...")
            updated_count = 0
            
            for keyword in KEYWORDS:
                ads_count = meta_data.get(keyword, 1)
                google_trend = google_trends.get(keyword, 0)
                tiktok_match = keyword in tiktok_matches
                
                # Estimate competition (simplified)
                competition_count = ads_count * 2
                
                # Compute scores
                scores = self.compute_full_score(ads_count, google_trend, tiktok_match, competition_count)
                
                # Prepare payload
                payload = {
                    'nombre': keyword.title(),
                    'categoria': 'Electrónica',  # Default category
                    'trend_score': scores['trend_score'],
                    'viral_score': scores['viral_score'],
                    'ads_count': ads_count,
                    'competition': scores['competition'],
                    'source': 'meta,google' if google_trend > 0 else 'meta',
                    'detected_keywords': [keyword],
                    'status': scores['status'],
                    'image_url': None,
                }
                
                # Upsert to Supabase
                try:
                    response = self.supabase.table('trending_products').upsert(
                        payload,
                        on_conflict='nombre'
                    ).execute()
                    
                    updated_count += 1
                    print(f"  ✓ {keyword} → trend:{scores['trend_score']}, ads:{ads_count}, comp:{scores['competition']}")
                    
                except Exception as e:
                    print(f"  ✗ Error guardando {keyword}: {str(e)}")
                    self.errors.append(f"Upsert {keyword}: {str(e)}")
            
            # Print summary
            print("\n" + "=" * 60)
            print(f"✅ Scraping completado")
            print(f"📊 {updated_count} productos actualizados")
            print(f"⚠️  {len(self.errors)} errores")
            if self.errors:
                print("\nErrores:")
                for error in self.errors:
                    print(f"  - {error}")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Error fatal: {str(e)}")
            sys.exit(1)

async def main():
    radar = LivoRadar()
    await radar.run()

if __name__ == '__main__':
    asyncio.run(main())
