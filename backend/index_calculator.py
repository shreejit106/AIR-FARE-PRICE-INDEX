import pandas as pd

def calculate_apix(current_fares: pd.DataFrame, base_fares: pd.DataFrame, route_weights: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates the Airfare Price Index (APIx) using a Laspeyres-type fixed-weight index formula.
    
    Formula: APIx(t) = Σ [ weight_route × ( fare_route(t) / fare_route(base) ) ] × 100
    
    Args:
        current_fares: DataFrame with cols ['origin', 'destination', 'lead_time', 'representative_fare']
        base_fares: DataFrame with cols ['origin', 'destination', 'lead_time', 'base_fare']
        route_weights: DataFrame with cols ['origin', 'destination', 'weight']
    """
    if current_fares.empty or base_fares.empty or route_weights.empty:
        return pd.DataFrame()

    # Merge current fares with base fares
    merged = pd.merge(current_fares, base_fares, on=['origin', 'destination', 'lead_time'])
    
    # Merge with weights
    merged = pd.merge(merged, route_weights, on=['origin', 'destination'])
    
    # Calculate route-level index component
    merged['price_relative'] = merged['representative_fare'] / merged['base_fare']
    merged['weighted_component'] = merged['weight'] * merged['price_relative']
    
    # Calculate overall APIx per lead_time (horizon)
    # Note: Weights should sum to 1. If not, divide by sum(weights)
    apix = merged.groupby('lead_time').apply(
        lambda x: (x['weighted_component'].sum() / x['weight'].sum()) * 100
    ).reset_index(name='apix')
    
    return apix

def calculate_route_index(current_fares: pd.DataFrame, base_fares: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates the route-specific index.
    """
    if current_fares.empty or base_fares.empty:
        return pd.DataFrame()

    merged = pd.merge(current_fares, base_fares, on=['origin', 'destination', 'lead_time'])
    merged['route_index'] = (merged['representative_fare'] / merged['base_fare']) * 100
    
    return merged[['origin', 'destination', 'lead_time', 'route_index']]
