import pandas as pd
import numpy as np
from typing import List, Dict

def clean_and_normalize_fares(raw_data: List[Dict]) -> pd.DataFrame:
    """
    Cleans raw fare data by normalizing names/codes, deduplicating,
    and handling missing values.
    """
    if not raw_data:
        return pd.DataFrame()
        
    df = pd.DataFrame(raw_data)
    
    # Example raw data structure:
    # {
    #    "origin": "DEL", "destination": "BOM", "airline": "6E",
    #    "flight_no": "123", "query_date": "2024-11-20", 
    #    "travel_date": "2024-11-27", "lead_time": "T+7",
    #    "total_fare": 5400
    # }
    
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

def process_pipeline(raw_data: List[Dict]) -> pd.DataFrame:
    """
    Executes the full data processing pipeline.
    """
    df = clean_and_normalize_fares(raw_data)
    df = filter_outliers(df)
    rep_fares = calculate_representative_fares(df)
    return rep_fares
