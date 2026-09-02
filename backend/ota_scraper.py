"""
ota_scraper.py — AirlineScraperEngine: Standalone Demo Module
=============================================================
Self-contained demonstration of the multi-airline direct scraper architecture.
Run this file directly to show evaluators a live end-to-end scrape:

    python backend/ota_scraper.py

Architecture Demonstrated:
  • 5 individual airline source adapters (IndiGo, Air India, SpiceJet, Akasa, AIX)
  • CDP stealth JS injection (navigator.webdriver masking, WebGL spoofing)
  • XHR / Fetch response interception — captures internal airline JSON APIs
  • DOM fallback — ₹ regex over rendered flight card elements
  • Google Flights fallback — last resort multi-carrier aggregator
  • Gaussian timing jitter — human-like interaction pacing
  • Cascaded result merging with per-source attribution
"""

import asyncio
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

# Import the full engine from scraper.py
try:
    from backend.scraper import (
        scrape_route_all_airlines,
        scrape_live_fares_async,
        CORE_MARQUEE_ROUTES,
        HORIZONS,
        _STEALTH_JS,
        _jitter,
        _make_stealth_context,
        _build_record,
    )
except ModuleNotFoundError:
    from scraper import (
        scrape_route_all_airlines,
        scrape_live_fares_async,
        CORE_MARQUEE_ROUTES,
        HORIZONS,
        _STEALTH_JS,
        _jitter,
        _make_stealth_context,
        _build_record,
    )

from playwright.async_api import async_playwright


class AirlineScraperEngine:
    """
    High-level wrapper around the multi-airline scraper pipeline.

    Designed as a clean, inspectable class for evaluator demonstrations.
    Exposes individual airline scrape methods plus the full aggregated pipeline.

    Usage:
        engine = AirlineScraperEngine()
        results = await engine.scrape_route("DEL", "BOM", "2026-09-10")
        print(engine.summary(results))
    """

    AIRLINE_SOURCES = {
        "IndiGo (6E)":          "goindigo.in       — XHR API interception + DOM fallback",
        "Air India (AI)":        "airindia.com      — XHR API interception + DOM fallback",
        "SpiceJet (SG)":         "spicejet.com      — XHR API interception + DOM fallback",
        "Akasa Air (QP)":        "akasaair.com      — XHR API interception + DOM fallback",
        "Air India Express (IX)":"airindiaexpress.com — XHR API interception + DOM fallback",
        "FALLBACK":              "google.com/travel/flights — Multi-carrier aggregator",
    }

    ANTI_BOT_STACK = [
        "CDP navigator.webdriver = undefined  (kills #1 Selenium/Playwright detector)",
        "WebGL UNMASKED_VENDOR spoof          → Intel Inc. / Intel Iris OpenGL Engine",
        "navigator.plugins 3-entry mock       → Chrome PDF Plugin, PDF Viewer, NaCl",
        "navigator.languages = ['en-IN',...]  → matches target market fingerprint",
        "navigator.hardwareConcurrency = 8    → 1 is a headless giveaway",
        "Randomised User-Agent pool (Chrome 123/124, Win/macOS)",
        "Randomised viewport (1280–1920 × 720–1080) per worker",
        "Gaussian timing jitter μ=2.1s σ=0.7s between page interactions",
        "Indian locale (en-IN) + Asia/Kolkata timezone",
        "Realistic Accept / sec-ch-ua / Upgrade-Insecure-Requests headers",
    ]

    def __init__(self) -> None:
        self._session_log: List[Dict] = []

    # ── Public API ─────────────────────────────────────────────────────────────

    async def scrape_route(
        self,
        origin: str,
        destination: str,
        travel_date: str,
        horizon_key: str = "T+7",
    ) -> List[Dict]:
        """
        Scrape a single origin → destination corridor from all airline sources.

        Returns a list of normalized fare records, one per available flight.
        Each record includes: airline, flight_number, total_fare, source.
        """
        query_date_iso = datetime.now().isoformat()
        print(f"\n{'─'*65}")
        print(f"  AirlineScraperEngine: {origin} → {destination} | {travel_date} | {horizon_key}")
        print(f"  Anti-bot stack: {len(self.ANTI_BOT_STACK)} layers active")
        print(f"{'─'*65}")

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                ],
            )
            try:
                fares = await scrape_route_all_airlines(
                    browser, origin, destination, travel_date,
                    horizon_key, query_date_iso,
                )
            finally:
                await browser.close()

        self._session_log.extend(fares)
        return fares

    async def scrape_basket(
        self,
        routes: Optional[List[Tuple[str, str]]] = None,
        horizons: Optional[Dict[str, int]] = None,
    ) -> List[Dict]:
        """
        Scrape a full route basket across multiple booking horizons.
        This is the method called by /api/sync in production.
        """
        fares = await scrape_live_fares_async(
            target_routes=routes,
            target_horizons=horizons,
        )
        self._session_log.extend(fares)
        return fares

    def summary(self, fares: List[Dict]) -> str:
        """Return a formatted summary table of scraped fare results."""
        if not fares:
            return "  No fares collected in this session."

        lines = [
            f"\n{'═'*65}",
            f"  SCRAPE RESULTS  |  {len(fares)} total fare records",
            f"{'═'*65}",
            f"  {'AIRLINE':<28} {'FARE (₹)':>10}  {'SOURCE':<30}",
            f"  {'─'*62}",
        ]
        for f in sorted(fares, key=lambda x: x.get("total_fare", 0)):
            lines.append(
                f"  {f.get('airline','?'):<28} "
                f"₹{f.get('total_fare',0):>9,.0f}  "
                f"{f.get('source','?'):<30}"
            )

        # Source breakdown
        from collections import Counter
        source_counts = Counter(f.get("source", "?") for f in fares)
        lines.append(f"\n  Source Attribution:")
        for src, count in source_counts.most_common():
            lines.append(f"    {src:<40} → {count} records")

        lines.append(f"{'═'*65}")
        return "\n".join(lines)

    def print_anti_bot_stack(self) -> None:
        """Print the active anti-bot technique stack for evaluator review."""
        print(f"\n{'─'*65}")
        print("  ANTI-BOT / STEALTH ENGINEERING STACK")
        print(f"{'─'*65}")
        for i, technique in enumerate(self.ANTI_BOT_STACK, 1):
            print(f"  {i:>2}. {technique}")
        print(f"{'─'*65}")

    def print_architecture(self) -> None:
        """Print the data source architecture for evaluator review."""
        print(f"\n{'─'*65}")
        print("  AIRLINE SOURCE ADAPTERS")
        print(f"{'─'*65}")
        for airline, details in self.AIRLINE_SOURCES.items():
            print(f"  {airline:<28} → {details}")
        print(f"{'─'*65}")


# ─── CLI Demonstration Entry Point ────────────────────────────────────────────

async def _demo_run() -> None:
    """
    Live demonstration run — executes when script is called directly.
    Shows evaluators: architecture, anti-bot stack, and real scrape output.
    """
    engine = AirlineScraperEngine()

    print("\n" + "═" * 65)
    print("  APIx — Multi-Airline Direct Fare Scraper Engine")
    print("  SIH 2026 | Live Demonstration")
    print("═" * 65)

    # Print architecture and anti-bot stack
    engine.print_architecture()
    engine.print_anti_bot_stack()

    # Determine T+7 travel date from today
    travel_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

    print(f"\n  Initiating live multi-airline scrape...")
    print(f"  Route: DEL → BOM | Date: {travel_date} | Horizon: T+7")
    print(f"  (Scraping IndiGo, Air India, SpiceJet, Akasa, AIExpress in parallel)\n")

    fares = await engine.scrape_route("DEL", "BOM", travel_date, "T+7")

    # Print results
    print(engine.summary(fares))

    # Persist to JSON for inspection
    out_path = "ota_demo_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(fares, f, indent=2, ensure_ascii=False)
    print(f"\n  Full results saved to: {out_path}")
    print(f"\n  Demo complete. Total records: {len(fares)}")


if __name__ == "__main__":
    asyncio.run(_demo_run())
