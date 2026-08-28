import os
import json
import random
import requests
import pandas as pd
from datetime import datetime, timedelta
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

AMADEUS_CLIENT_ID = os.getenv("AMADEUS_CLIENT_ID")
AMADEUS_CLIENT_SECRET = os.getenv("AMADEUS_CLIENT_SECRET")

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

ROUTES = []
for orig, dest in SELECTED_PAIRS:
    dist = AIRPORT_DISTANCES.get((orig, dest)) or AIRPORT_DISTANCES.get((dest, orig)) or 1000
    w = ROUTE_WEIGHTS.get(f"{orig}-{dest}", 0.0125)
    ROUTES.append({
        "origin": orig,
        "destination": dest,
        "weight": w,
        "distance_km": dist
    })


HORIZONS = {
    "T+1": 1,
    "T+7": 7,
    "T+15": 15,
    "T+30": 30,
    "T+45": 45,
}

AIRLINES = ["6E", "AI", "IX", "QP"]

def get_amadeus_token():
    if not AMADEUS_CLIENT_ID or not AMADEUS_CLIENT_SECRET:
        return None
        
    url = "https://test.api.amadeus.com/v1/security/oauth2/token"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "client_credentials",
        "client_id": AMADEUS_CLIENT_ID,
        "client_secret": AMADEUS_CLIENT_SECRET
    }
    
    try:
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()
        return response.json().get("access_token")
    except Exception:
        return None

def generate_synthetic_fares(route, horizon_key, days_out, query_date, travel_date):
    """
    Generates realistic synthetic fare distributions based on route distance and lead time.
    T+1: High variance, surge pricing
    T+45: Lower variance, baseline pricing
    """
    fares = []
    
    # Base price calculation dependent on distance
    base_price = 2000 + (route["distance_km"] * 2.5)
    
    # Lead time multiplier (closer = more expensive)
    if days_out <= 1:
        multiplier_range = (1.8, 3.0)
    elif days_out <= 7:
        multiplier_range = (1.3, 2.0)
    elif days_out <= 15:
        multiplier_range = (1.0, 1.4)
    elif days_out <= 30:
        multiplier_range = (0.8, 1.1)
    else:
        multiplier_range = (0.7, 0.9)
        
    num_flights = random.randint(3, 8)
    
    for _ in range(num_flights):
        mult = random.uniform(*multiplier_range)
        total = round(base_price * mult, 2)
        base = round(total * 0.85, 2) # Assume 15% taxes/fees
        airline = random.choice(AIRLINES)
        flight_number = str(random.randint(100, 999))
        
        fares.append({
            "origin": route["origin"],
            "destination": route["destination"],
            "airline": airline,
            "flight_number": flight_number,
            "query_date": query_date,
            "travel_date": travel_date,
            "lead_time_horizon": horizon_key,
            "base_fare": base,
            "total_fare": total,
            "currency": "INR",
            "cabin_class": "ECONOMY",
            "source": "Simulated_Engine"
        })
        
    return fares

def fetch_amadeus_fares(token, origin, destination, travel_date, horizon_key, query_date):
    """
    Fetch fares from Amadeus. If it fails, return empty list to trigger fallback.
    """
    url = "https://test.api.amadeus.com/v2/shopping/flight-offers"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "originLocationCode": origin,
        "destinationLocationCode": destination,
        "departureDate": travel_date,
        "adults": 1,
        "currencyCode": "INR",
        "max": 10
    }
    
    fares = []
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json().get("data", [])
        
        for offer in data:
            price = offer.get("price", {})
            total = float(price.get("total", 0.0))
            base = float(price.get("base", 0.0))
            
            # Extract first segment's airline and flight number
            itineraries = offer.get("itineraries", [])
            airline = "XX"
            flight_number = "000"
            if itineraries and itineraries[0].get("segments"):
                segment = itineraries[0]["segments"][0]
                airline = segment.get("carrierCode", "XX")
                flight_number = segment.get("number", "000")
                
            fares.append({
                "origin": origin,
                "destination": destination,
                "airline": airline,
                "flight_number": flight_number,
                "query_date": query_date,
                "travel_date": travel_date,
                "lead_time_horizon": horizon_key,
                "base_fare": base,
                "total_fare": total,
                "currency": "INR",
                "cabin_class": "ECONOMY",
                "source": "Amadeus_API"
            })
    except Exception as e:
        print(f"Amadeus fetch failed for {origin}-{destination} on {travel_date}: {e}")
        
    return fares

def scrape_fares():
    query_date_obj = datetime.now()
    query_date_iso = query_date_obj.isoformat()
    
    token = get_amadeus_token()
    if not token:
        print("No Amadeus credentials/token found. Using simulated engine.")
    
    all_fares = []
    
    for route in ROUTES:
        for horizon_key, days_out in HORIZONS.items():
            travel_date_obj = query_date_obj + timedelta(days=days_out)
            travel_date_str = travel_date_obj.strftime("%Y-%m-%d")
            
            fares = []
            if token:
                fares = fetch_amadeus_fares(
                    token, 
                    route["origin"], 
                    route["destination"], 
                    travel_date_str, 
                    horizon_key, 
                    query_date_iso
                )
                
            if not fares:
                fares = generate_synthetic_fares(
                    route, 
                    horizon_key, 
                    days_out, 
                    query_date_iso, 
                    travel_date_str
                )
                
            all_fares.extend(fares)
            
    df = pd.DataFrame(all_fares)
    print(f"Scraping complete. Total records: {len(df)}")
    
    output_file = "raw_scraped_fares.json"
    with open(output_file, 'w') as f:
        json.dump(all_fares, f, indent=4)
        
    print(f"Data saved to {output_file}")
    
    return df

if __name__ == "__main__":
    df = scrape_fares()
    print(df.head())
