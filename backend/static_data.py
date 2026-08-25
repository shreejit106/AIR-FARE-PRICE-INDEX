# static_data.py

# Marquee routes for the prototype based on DGCA traffic data.
# Weights are representative passenger traffic shares (adding up to 1.0 or 100 for the selected basket).
# In a full implementation, these are derived from Vonter/india-aviation-traffic.
ROUTE_WEIGHTS = {
    "DEL-BOM": 0.25,
    "DEL-BLR": 0.20,
    "BOM-BLR": 0.15,
    "DEL-HYD": 0.15,
    "BOM-GOI": 0.15, # Using GOI representing Goa
    "DEL-CCU": 0.10
}

# Example base fares for T+7 and T+30 horizons for the index (Laspeyres base)
# In reality, this would be the median fare on the chosen 'base date'
BASE_FARES = {
    "T+7": {
        "DEL-BOM": 5500,
        "DEL-BLR": 6500,
        "BOM-BLR": 4000,
        "DEL-HYD": 5000,
        "BOM-GOI": 3500,
        "DEL-CCU": 6000
    },
    "T+30": {
        "DEL-BOM": 4500,
        "DEL-BLR": 5500,
        "BOM-BLR": 3000,
        "DEL-HYD": 4000,
        "BOM-GOI": 2500,
        "DEL-CCU": 5000
    }
}
