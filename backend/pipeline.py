import pandas as pd
import numpy as np
from typing import List, Dict

try:
    from backend.static_data import ROUTE_WEIGHTS, BASE_FARES
except ModuleNotFoundError:
    from static_data import ROUTE_WEIGHTS, BASE_FARES

def clean_and_normalize_fares(raw_data: List[Dict]) -> pd.DataFrame:
    """
    Cleans raw fare data by normalizing names/codes, deduplicating,
    and handling missing values.
    """
    if not raw_data:
        return pd.DataFrame()
        
    df = pd.DataFrame(raw_data)
    
    # 1. Deduplicate prices based on core dimensions
    dedup_cols = ["origin", "destination", "airline", "flight_no", "travel_date", "query_date"]
    if all(col in df.columns for col in dedup_cols):
        df = df.drop_duplicates(subset=dedup_cols, keep="last")
        
    # 2. Ensure currency/units are consistent (Assuming INR for now)
    if "total_fare" in df.columns:
        df["total_fare"] = pd.to_numeric(df["total_fare"], errors="coerce")
        df = df.dropna(subset=["total_fare"]) # Drop unparseable prices
        
    return df

def filter_outliers(df: pd.DataFrame, fare_col: str = "total_fare") -> pd.DataFrame:
    """
    Filters outliers using the IQR (Interquartile Range) method per route and lead time.
    """
    if df.empty or fare_col not in df.columns:
        return df
        
    def _remove_outliers(group):
        if len(group) < 4: # Not enough data for meaningful IQR
            return group
        Q1 = group[fare_col].quantile(0.25)
        Q3 = group[fare_col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        return group[(group[fare_col] >= lower_bound) & (group[fare_col] <= upper_bound)]

    # Group by route and lead time before filtering
    group_cols = ["origin", "destination", "lead_time"]
    if all(col in df.columns for col in group_cols):
        return df.groupby(group_cols, group_keys=False).apply(_remove_outliers)
    else:
        return df

def calculate_representative_fares(df: pd.DataFrame, fare_col: str = "total_fare") -> pd.DataFrame:
    """
    Calculates the representative fare (median) per route per horizon.
    """
    if df.empty or fare_col not in df.columns:
        return pd.DataFrame()
        
    group_cols = ["origin", "destination", "lead_time", "query_date"]
    
    if all(col in df.columns for col in group_cols):
        rep_fares = df.groupby(group_cols)[fare_col].median().reset_index()
        rep_fares = rep_fares.rename(columns={fare_col: "representative_fare"})
        return rep_fares
    else:
        return pd.DataFrame()

def calculate_apix_index(rep_fares: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates the APIx index based on the Laspeyres-type formula:
    APIx = Σ [ weight_route × ( fare_route(t) / fare_route(base) ) ] × 100
    """
    if rep_fares.empty:
        return pd.DataFrame()
        
    # We need a route identifier to match weights
    if "origin" in rep_fares.columns and "destination" in rep_fares.columns:
        rep_fares["route"] = rep_fares["origin"] + "-" + rep_fares["destination"]
    else:
        return pd.DataFrame()
    
    records = []
    
    # Calculate index per horizon and query date
    for (query_date, lead_time), group in rep_fares.groupby(["query_date", "lead_time"]):
        if lead_time not in BASE_FARES:
            continue
            
        index_value = 0.0
        total_weight_used = 0.0
        
        for _, row in group.iterrows():
            route = row["route"]
            current_fare = row["representative_fare"]
            
            # Use base fare and weight for the specific horizon and route
            base_fare = BASE_FARES[lead_time].get(route)
            weight = ROUTE_WEIGHTS.get(route, 0.0)
            
            if base_fare and weight > 0:
                index_value += weight * (current_fare / base_fare)
                total_weight_used += weight
                
        # Normalize index if not all routes were present
        if total_weight_used > 0:
            final_index = (index_value / total_weight_used) * 100
            records.append({
                "query_date": query_date,
                "lead_time": lead_time,
                "APIx": final_index,
                "routes_covered": len(group),
                "weight_covered": total_weight_used
            })
            
    return pd.DataFrame(records)

def process_pipeline(raw_data: List[Dict]) -> Dict[str, pd.DataFrame]:
    """
    Executes the full data processing pipeline and returns both the route-level fares and the final index.
    """
    df = clean_and_normalize_fares(raw_data)
    df = filter_outliers(df)
    rep_fares = calculate_representative_fares(df)
    apix_index = calculate_apix_index(rep_fares)
    
    return {
        "route_fares": rep_fares,
        "apix_index": apix_index
    }

def run_live_pipeline_with_scraper():
    """
    Orchestrates the entire flow: uses the Playwright OTA scraper to pull live fare data,
    then processes it through the pipeline to compute the APIx index.
    """
    import asyncio
    try:
        from backend.ota_scraper import scrape_ota_flight
    except ModuleNotFoundError:
        from ota_scraper import scrape_ota_flight
        
    from datetime import datetime, timedelta
    
    # We will simulate pulling T+7 and T+30 data for a couple of routes to demonstrate
    routes_to_test = ["DEL-BOM", "DEL-BLR"]
    horizons = {"T+7": 7, "T+30": 30}
    
    all_raw_data = []
    
    print(f"[{datetime.now().isoformat()}] Starting live pipeline run using Playwright scraper...")
    
    for route in routes_to_test:
        origin, destination = route.split("-")
        
        for lead_time_label, days_ahead in horizons.items():
            travel_date = (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            
            # Execute the Playwright scraper
            scraped_fares = asyncio.run(scrape_ota_flight(origin, destination, travel_date))
            
            if scraped_fares:
                # Add the lead_time label required by the pipeline
                for fare in scraped_fares:
                    fare["lead_time"] = lead_time_label
                all_raw_data.extend(scraped_fares)
                
    if not all_raw_data:
        print("Scraper failed to collect any data.")
        return None
        
    print(f"Collected {len(all_raw_data)} raw fare records. Running pipeline processing...")
    results = process_pipeline(all_raw_data)
    
    print("\n=== FINAL APIx INDEX RESULTS ===")
    print(results["apix_index"].to_string(index=False))
    return results

if __name__ == "__main__":
    run_live_pipeline_with_scraper()
