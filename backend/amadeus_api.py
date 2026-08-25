import os
import requests
from datetime import datetime, timedelta

def get_amadeus_token():
    """Fetches an access token from Amadeus using client credentials."""
    api_key = os.environ.get("AMADEUS_API_KEY")
    api_secret = os.environ.get("AMADEUS_API_SECRET")
    
    if not api_key or not api_secret:
        return "mock_token" # Return mock token for testing if env vars not set

    url = "https://test.api.amadeus.com/v1/security/oauth2/token"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "client_credentials",
        "client_id": api_key,
        "client_secret": api_secret
    }
    
    response = requests.post(url, headers=headers, data=data)
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        print(f"Error fetching token: {response.text}")
        return None

def fetch_flight_offers(origin: str, destination: str, departure_date: str):
    """
    Fetches flight offers from Amadeus Flight Offers Search API.
    """
    token = get_amadeus_token()
    if not token:
        return None

    if token == "mock_token":
        # Return mock data for testing logic without active API keys
        print(f"[{datetime.now().isoformat()}] Fetching MOCK Amadeus data for route: {origin}-{destination} on {departure_date}")
        return {
            "data": [
                {
                    "type": "flight-offer",
                    "id": "1",
                    "itineraries": [
                        {
                            "segments": [
                                {
                                    "carrierCode": "6E",
                                    "number": "123",
                                    "departure": {"iataCode": origin, "at": f"{departure_date}T08:00:00"},
                                }
                            ]
                        }
                    ],
                    "price": {
                        "currency": "INR",
                        "total": "5400.00",
                        "base": "4800.00"
                    }
                }
            ]
        }

    url = "https://test.api.amadeus.com/v2/shopping/flight-offers"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "originLocationCode": origin,
        "destinationLocationCode": destination,
        "departureDate": departure_date,
        "adults": 1,
        "currencyCode": "INR",
        "max": 50 # Fetch up to 50 offers
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching Amadeus flight offers: {e}")
        return None

if __name__ == "__main__":
    # Test fetch
    target_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    print(fetch_flight_offers("DEL", "BOM", target_date))
