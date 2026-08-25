from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json

app = FastAPI(title="APIx Backend")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/apix")
def get_apix_data(
    base_date: Optional[str] = Query(None),
    aggregation: Optional[str] = Query("overall"),
    airline: Optional[str] = Query("all"),
    route: Optional[str] = Query("all"),
    cabin_class: Optional[str] = Query("economy")
):
    """
    Returns dynamically adjusted mock data based on the applied filters.
    """
    
    # Base multiplier to simulate data changing based on filters
    multiplier = 1.0
    
    if aggregation == "airline" and airline != "all":
        # Simulate Indigo being slightly cheaper, Air India slightly more expensive
        multiplier = 0.95 if airline == "6E" else 1.05
    elif aggregation == "route" and route != "all":
        multiplier = 1.1 if route == "DEL-BOM" else 0.9
        
    if cabin_class == "business":
        multiplier *= 3.5
    elif cabin_class == "first":
        multiplier *= 6.0

    # Returning dynamic mock data for an instant UI experience
    return {
        "apix_index": [
            {"query_date": "2026-08-25", "lead_time": "T+7", "APIx": round(105.4 * multiplier, 1)},
            {"query_date": "2026-08-25", "lead_time": "T+15", "APIx": round(110.2 * multiplier, 1)},
            {"query_date": "2026-08-25", "lead_time": "T+30", "APIx": round(125.8 * multiplier, 1)}
        ],
        "route_fares": [
            {"origin": "DEL", "destination": "BOM", "lead_time": "T+7", "representative_fare": round(6200 * multiplier)},
            {"origin": "DEL", "destination": "BLR", "lead_time": "T+7", "representative_fare": round(7100 * multiplier)},
            {"origin": "BOM", "destination": "BLR", "lead_time": "T+7", "representative_fare": round(4300 * multiplier)},
            {"origin": "DEL", "destination": "BOM", "lead_time": "T+30", "representative_fare": round(5100 * multiplier)},
            {"origin": "DEL", "destination": "BLR", "lead_time": "T+30", "representative_fare": round(5800 * multiplier)},
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
