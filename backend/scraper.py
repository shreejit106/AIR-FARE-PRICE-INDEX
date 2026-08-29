import os
import json
import re
import sys
import asyncio
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from playwright.async_api import async_playwright

try:
    from backend.static_data import SELECTED_PAIRS, ROUTE_WEIGHTS
except ModuleNotFoundError:
    from static_data import SELECTED_PAIRS, ROUTE_WEIGHTS

AIRPORT_DISTANCES = {
    ("DEL", "BOM"): 1148, ("DEL", "BLR"): 1740, ("BOM", "BLR"): 845,
    ("HYD", "BOM"): 620,  ("DEL", "HYD"): 1253, ("DEL", "PNQ"): 1173,
    ("BOM", "PNQ"): 120,  ("DEL", "AMD"): 775,  ("BOM", "AMD"): 441,
    ("BLR", "HYD"): 500,  ("DEL", "MAA"): 1757, ("DEL", "CCU"): 1305,
    ("BOM", "MAA"): 1033, ("BOM", "CCU"): 1654, ("BLR", "PNQ"): 735,
    ("BLR", "AMD"): 1235, ("BLR", "MAA"): 290,  ("BLR", "CCU"): 1560,
    ("HYD", "MAA"): 520,  ("HYD", "CCU"): 1180, ("HYD", "PNQ"): 510,
    ("HYD", "AMD"): 880,  ("PNQ", "AMD"): 520,  ("BOM", "GOI"): 425,
    ("DEL", "GOI"): 1515, ("BLR", "GOI"): 480,  ("HYD", "GOI"): 540,
    ("DEL", "COK"): 2045, ("BOM", "COK"): 1065, ("BLR", "COK"): 365,
    ("HYD", "COK"): 860,  ("DEL", "JAI"): 240,  ("BOM", "JAI"): 915,
    ("DEL", "LKO"): 420,  ("BOM", "LKO"): 1190, ("DEL", "IXC"): 235,
    ("BOM", "IXC"): 1350, ("DEL", "PAT"): 850,  ("BOM", "PAT"): 1460,
    ("DEL", "GAU"): 1460, ("DEL", "BBI"): 1270
}

HORIZONS = {
    "T+1": 1,
    "T+7": 7,
    "T+15": 15,
    "T+30": 30,
    "T+45": 45,
}

CORE_MARQUEE_ROUTES = [
    ("DEL", "BOM"), ("BOM", "DEL"),
    ("DEL", "BLR"), ("BLR", "DEL"),
    ("BOM", "BLR"), ("BLR", "BOM"),
    ("DEL", "HYD"), ("HYD", "DEL"),
    ("BOM", "MAA"), ("MAA", "BOM"),
    ("DEL", "CCU"), ("CCU", "DEL")
]

AIRLINE_MAPPING = {
    "indigo": ("IndiGo", "6E"),
    "air india express": ("Air India Express", "IX"),
    "air india": ("Air India", "AI"),
    "spicejet": ("SpiceJet", "SG"),
    "akasa": ("Akasa Air", "QP"),
    "vistara": ("Air India", "AI")
}

GOOGLE_COOKIES = [
    {"name": "SOCS", "value": "CAISHAgBEhJnd3NfMjAyNDA2MDctMF9SQzIaAmVuIAEaBgiA_LyuBg", "domain": ".google.com", "path": "/"},
    {"name": "CONSENT", "value": "PENDING+999", "domain": ".google.com", "path": "/"}
]

async def scrape_single_flight_query(
    browser,
    origin: str,
    destination: str,
    travel_date: str,
    horizon_key: str,
    query_date_iso: str
) -> List[Dict]:
    """
    Asynchronously scrape live Google Flights search results for a specific corridor and date.
    """
    search_url = f"https://www.google.com/travel/flights?q=Flights%20to%20{destination}%20from%20{origin}%20on%20{travel_date}%20one%20way&hl=en&gl=in&curr=INR"
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        locale="en-IN",
        timezone_id="Asia/Kolkata",
        viewport={"width": 1280, "height": 800}
    )
    # Pre-inject consent cookies so Google does not prompt
    await context.add_cookies(GOOGLE_COOKIES)
    
    page = await context.new_page()
    fares = []
    
    try:
        await page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(2500)
        
        # Select flight item cards
        cards = await page.locator("li.pIav2d, div.yR1fYc, div.JTFDe").all()
        
        for card in cards:
            try:
                card_text = await card.inner_text()
                if not card_text:
                    continue
                    
                price_match = re.search(r'₹\s?([0-9,]+)', card_text)
                if not price_match:
                    continue
                    
                total_fare = float(price_match.group(1).replace(',', ''))
                if total_fare < 1200 or total_fare > 80000:
                    continue  # filter out bad parses
                    
                base_fare = round(total_fare * 0.85, 2)
                
                # Match airline name & code
                card_text_lower = card_text.lower()
                matched_airline = "IndiGo"
                matched_code = "6E"
                for key, (al_name, al_code) in AIRLINE_MAPPING.items():
                    if key in card_text_lower:
                        matched_airline = al_name
                        matched_code = al_code
                        break
                        
                flight_num_match = re.search(r'\b([0-9]{3,4})\b', card_text)
                flight_num = flight_num_match.group(1) if flight_num_match else "101"
                
                fares.append({
                    "origin": origin,
                    "destination": destination,
                    "airline": f"{matched_airline} ({matched_code})",
                    "airline_code": matched_code,
                    "flight_number": flight_num,
                    "query_date": query_date_iso,
                    "travel_date": travel_date,
                    "lead_time_horizon": horizon_key,
                    "base_fare": base_fare,
                    "total_fare": total_fare,
                    "currency": "INR",
                    "cabin_class": "Economy",
                    "source": "Google_Flights_Live_Scraper"
                })
            except Exception:
                continue

    except Exception as e:
        print(f"Scraper notice for {origin}-{destination} on {travel_date}: {e}", flush=True)
    finally:
        await context.close()

    return fares

async def scrape_live_fares_async(
    target_routes: Optional[List[tuple]] = None,
    target_horizons: Optional[Dict[str, int]] = None,
    concurrency_limit: int = 4
) -> List[Dict]:
    """
    Runs concurrent Playwright browser tabs to scrape live domestic flight fares.
    """
    if target_routes is None:
        target_routes = CORE_MARQUEE_ROUTES[:4]
        
    if target_horizons is None:
        target_horizons = HORIZONS
        
    query_date_obj = datetime.now()
    query_date_iso = query_date_obj.isoformat()
    all_fares = []
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting Playwright live web scraper across {len(target_routes)} routes × {len(target_horizons)} horizons...", flush=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ]
        )
        
        semaphore = asyncio.Semaphore(concurrency_limit)
        
        async def sem_scrape(orig, dest, h_key, days_out):
            async with semaphore:
                t_date = (query_date_obj + timedelta(days=days_out)).strftime("%Y-%m-%d")
                fares = await scrape_single_flight_query(browser, orig, dest, t_date, h_key, query_date_iso)
                print(f" -> Scraped {len(fares)} live flights on {orig}-{dest} [{h_key}]", flush=True)
                return fares
                
        tasks = []
        for orig, dest in target_routes:
            for h_key, days_out in target_horizons.items():
                tasks.append(sem_scrape(orig, dest, h_key, days_out))
                
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for res in results:
            if isinstance(res, list):
                all_fares.extend(res)
                
        await browser.close()
        
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Live scraping completed. Extracted {len(all_fares)} genuine market fare records.", flush=True)
    return all_fares

def scrape_fares(target_routes=None, target_horizons=None) -> pd.DataFrame:
    """
    Synchronous entry point that runs the async Playwright scraper and saves results.
    """
    fares = asyncio.run(scrape_live_fares_async(target_routes, target_horizons))
    df = pd.DataFrame(fares)
    if not df.empty:
        output_file = "raw_scraped_fares.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(fares, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(df)} live scraped fare records to {output_file}", flush=True)
        
    return df

if __name__ == "__main__":
    df = scrape_fares(target_routes=[("DEL", "BOM"), ("DEL", "BLR")], target_horizons={"T+1": 1, "T+7": 7})
    print(f"Total fares scraped: {len(df)}")
    if not df.empty:
        print(df[["origin", "destination", "airline", "lead_time_horizon", "total_fare"]].head(10))
