import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime

try:
    from backend.static_data import ROUTE_WEIGHTS, BASE_FARES, SELECTED_PAIRS
except ModuleNotFoundError:
    from static_data import ROUTE_WEIGHTS, BASE_FARES, SELECTED_PAIRS

def clean_and_normalize_fares(raw_data: List[Dict]) -> pd.DataFrame:
    """
    Cleans raw fare data by normalizing names/codes, deduplicating,
    and removing invalid prices.
    """
    if not raw_data:
        return pd.DataFrame()
        
    df = pd.DataFrame(raw_data)
    
    # Deduplicate prices based on core dimensions
    dedup_cols = ["origin", "destination", "airline", "flight_number", "travel_date", "lead_time_horizon"]
    avail_cols = [c for c in dedup_cols if c in df.columns]
    if avail_cols:
        df = df.drop_duplicates(subset=avail_cols, keep="last")
        
    if "total_fare" in df.columns:
        df["total_fare"] = pd.to_numeric(df["total_fare"], errors="coerce")
        df = df.dropna(subset=["total_fare"])
        # Remove irrational extreme outliers
        df = df[(df["total_fare"] >= 1200) & (df["total_fare"] <= 90000)]
        
    return df

def filter_outliers(df: pd.DataFrame, fare_col: str = "total_fare") -> pd.DataFrame:
    """
    Filters outliers using the IQR (Interquartile Range) method per route and lead time horizon.
    """
    if df.empty or fare_col not in df.columns:
        return df
        
    def _remove_outliers(group):
        if len(group) < 4:
            return group
        q1 = group[fare_col].quantile(0.25)
        q3 = group[fare_col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        return group[(group[fare_col] >= lower) & (group[fare_col] <= upper)]

    group_cols = [c for c in ["origin", "destination", "lead_time_horizon"] if c in df.columns]
    if group_cols:
        return df.groupby(group_cols, group_keys=False).apply(_remove_outliers)
    return df

def calculate_representative_fares(df: pd.DataFrame, fare_col: str = "total_fare") -> pd.DataFrame:
    """
    Calculates the representative median fare per route per horizon.
    """
    if df.empty or fare_col not in df.columns:
        return pd.DataFrame()
        
    group_cols = [c for c in ["origin", "destination", "lead_time_horizon", "query_date"] if c in df.columns]
    if group_cols:
        rep = df.groupby(group_cols)[fare_col].median().reset_index()
        rep = rep.rename(columns={fare_col: "representative_fare"})
        return rep
    return pd.DataFrame()

def calculate_apix_index(rep_fares: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates the dynamic APIx index based on the Laspeyres fixed-weight formula:
    APIx(h) = Σ [ weight_route × ( fare_route(h) / base_fare_route(h) ) ] / Σ [ weight_route ] × 100
    """
    if rep_fares.empty:
        return pd.DataFrame()
        
    if "origin" in rep_fares.columns and "destination" in rep_fares.columns:
        rep_fares["route"] = rep_fares["origin"] + "-" + rep_fares["destination"]
    else:
        return pd.DataFrame()
    
    records = []
    horizon_col = "lead_time_horizon" if "lead_time_horizon" in rep_fares.columns else "lead_time"
    query_col = "query_date" if "query_date" in rep_fares.columns else rep_fares.columns[0]
    
    for (q_date, h_key), group in rep_fares.groupby([query_col, horizon_col]):
        if h_key not in BASE_FARES:
            continue
            
        weighted_sum = 0.0
        total_weight = 0.0
        
        for _, row in group.iterrows():
            route = row["route"]
            cur_fare = row["representative_fare"]
            base_fare = BASE_FARES[h_key].get(route)
            weight = ROUTE_WEIGHTS.get(route, 0.0125)
            
            if base_fare and base_fare > 0:
                price_relative = cur_fare / base_fare
                weighted_sum += weight * price_relative
                total_weight += weight
                
        if total_weight > 0:
            apix_val = round((weighted_sum / total_weight) * 100, 2)
            records.append({
                "query_date": q_date,
                "horizon": h_key,
                "APIx": apix_val,
                "routes_covered": len(group),
                "weight_covered": round(total_weight, 4)
            })
            
    return pd.DataFrame(records)

def process_pipeline(raw_data: List[Dict]) -> Dict[str, pd.DataFrame]:
    """
    Executes the full live processing pipeline on scraped fares.
    """
    df = clean_and_normalize_fares(raw_data)
    df_clean = filter_outliers(df)
    rep_fares = calculate_representative_fares(df_clean)
    apix_index = calculate_apix_index(rep_fares)
    
    return {
        "raw_df": df,
        "clean_df": df_clean,
        "route_fares": rep_fares,
        "apix_index": apix_index
    }

if __name__ == "__main__":
    try:
        from backend.scraper import scrape_fares
    except ModuleNotFoundError:
        from scraper import scrape_fares
        
    print("Testing live scraping pipeline...")
    df_scraped = scrape_fares(target_routes=[("DEL", "BOM"), ("DEL", "BLR")])
    if not df_scraped.empty:
        results = process_pipeline(df_scraped.to_dict(orient="records"))
        print("\n=== DYNAMIC APIX INDEX FROM LIVE WEB SCRAPING ===")
        print(results["apix_index"].to_string(index=False))
