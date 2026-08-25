from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

# Try importing the pipeline function
try:
    from backend.pipeline import run_live_pipeline_with_scraper
except ModuleNotFoundError:
    from pipeline import run_live_pipeline_with_scraper

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
def get_apix_data():
    """
    In a real production environment, this would call `run_live_pipeline_with_scraper()`.
    However, for the hackathon demo, the scraper takes 10+ seconds because it launches a headless browser.
    To ensure the UI is snappy, we will return a rich set of cached mock data that matches the output structure perfectly.
    """
    
    # Uncomment this for actual live scraping (Warning: will take 10+ seconds)
    # results = run_live_pipeline_with_scraper()
    # return results if results else {"error": "Failed to scrape data"}

    # Returning mock data for an instant UI experience
    return {
        "apix_index": [
            {"query_date": "2026-08-25", "lead_time": "T+7", "APIx": 105.4},
            {"query_date": "2026-08-25", "lead_time": "T+15", "APIx": 110.2},
            {"query_date": "2026-08-25", "lead_time": "T+30", "APIx": 125.8}
        ],
        "route_fares": [
            {"origin": "DEL", "destination": "BOM", "lead_time": "T+7", "representative_fare": 6200},
            {"origin": "DEL", "destination": "BLR", "lead_time": "T+7", "representative_fare": 7100},
            {"origin": "BOM", "destination": "BLR", "lead_time": "T+7", "representative_fare": 4300},
            {"origin": "DEL", "destination": "BOM", "lead_time": "T+30", "representative_fare": 5100},
            {"origin": "DEL", "destination": "BLR", "lead_time": "T+30", "representative_fare": 5800},
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
