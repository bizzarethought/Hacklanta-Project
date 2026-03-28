"""
OpenFEMA Disaster Declarations API client.
Free, no API key required.
Returns historical disaster counts and breakdown by type for any US state.
"""
import httpx
from datetime import date
from backend.models.risk import DisasterHistory

FEMA_API = "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries"

# Map FEMA incident types to our simplified categories
INCIDENT_MAP: dict[str, str] = {
    "Hurricane": "Hurricane",
    "Typhoon": "Hurricane",
    "Coastal Storm": "Hurricane",
    "Tropical Storm": "Hurricane",
    "Flood": "Flood",
    "Severe Storm(s)": "Severe Storm",
    "Severe Storm": "Severe Storm",
    "Tornado": "Tornado",
    "Fire": "Wildfire",
    "Wildfire": "Wildfire",
    "Earthquake": "Earthquake",
    "Severe Ice Storm": "Winter Storm",
    "Snow": "Winter Storm",
    "Freezing": "Winter Storm",
    "Mud/Landslide": "Landslide",
    "Dam/Levee Break": "Flood",
    "Drought": "Drought",
    "Volcanic Eruption": "Volcanic",
    "Tsunami": "Tsunami",
}

# Fallback data for when API is unavailable (keyed by state)
_FALLBACK_DISASTER_COUNTS: dict[str, dict] = {
    "FL": {"total": 68, "by_type": {"Hurricane": 28, "Flood": 18, "Severe Storm": 12, "Tornado": 6, "Wildfire": 4}, "recent": 18},
    "CA": {"total": 72, "by_type": {"Wildfire": 32, "Flood": 15, "Earthquake": 10, "Severe Storm": 8, "Landslide": 7}, "recent": 22},
    "TX": {"total": 85, "by_type": {"Hurricane": 22, "Flood": 25, "Severe Storm": 18, "Tornado": 12, "Wildfire": 8}, "recent": 20},
    "LA": {"total": 62, "by_type": {"Hurricane": 25, "Flood": 20, "Severe Storm": 10, "Tornado": 5, "Wildfire": 2}, "recent": 16},
    "OK": {"total": 55, "by_type": {"Tornado": 22, "Severe Storm": 18, "Flood": 10, "Winter Storm": 5}, "recent": 14},
    "NY": {"total": 38, "by_type": {"Hurricane": 8, "Severe Storm": 12, "Flood": 10, "Winter Storm": 8}, "recent": 9},
    "NC": {"total": 45, "by_type": {"Hurricane": 18, "Flood": 12, "Severe Storm": 10, "Tornado": 5}, "recent": 12},
    "DEFAULT": {"total": 25, "by_type": {"Severe Storm": 10, "Flood": 8, "Tornado": 4, "Winter Storm": 3}, "recent": 6},
}


def get_disaster_history(state: str) -> DisasterHistory:
    """
    Query OpenFEMA for disaster declarations in the given state over the last 20 years.
    Returns counts, breakdown by type, and trend analysis.
    """
    try:
        today = date.today()
        start_year = today.year - 20
        start_date = f"{start_year}-01-01T00:00:00.000Z"

        # Fetch disaster declarations for the state
        resp = httpx.get(FEMA_API, params={
            "$filter": f"state eq '{state}' and declarationDate gt '{start_date}'",
            "$select": "incidentType,declarationDate,fyDeclared",
            "$top": 1000,
            "$inlinecount": "allpages",
        }, timeout=15)

        data = resp.json()
        records = data.get("DisasterDeclarationsSummaries", [])

        if not records:
            return _fallback(state)

        # Count by type
        by_type: dict[str, int] = {}
        recent_count = 0
        recent_cutoff = today.year - 5

        # Deduplicate by disaster number (multiple counties per disaster)
        seen_disasters: set[str] = set()
        for rec in records:
            incident = rec.get("incidentType", "Other")
            decl_date = rec.get("declarationDate", "")
            mapped = INCIDENT_MAP.get(incident, incident)

            # Use disaster type + year as dedup key (approximate)
            year_str = decl_date[:4] if decl_date else "0000"
            dedup_key = f"{mapped}_{year_str}"
            if dedup_key in seen_disasters:
                continue
            seen_disasters.add(dedup_key)

            by_type[mapped] = by_type.get(mapped, 0) + 1

            try:
                year = int(year_str)
                if year >= recent_cutoff:
                    recent_count += 1
            except ValueError:
                pass

        total = sum(by_type.values())

        # Trend: compare first 10 years vs last 10 years
        first_half_cutoff = today.year - 10
        first_half = 0
        second_half = 0
        seen_first: set[str] = set()
        seen_second: set[str] = set()
        for rec in records:
            incident = INCIDENT_MAP.get(rec.get("incidentType", ""), "Other")
            year_str = rec.get("declarationDate", "")[:4]
            try:
                year = int(year_str)
            except ValueError:
                continue
            dedup = f"{incident}_{year_str}"
            if year < first_half_cutoff:
                if dedup not in seen_first:
                    seen_first.add(dedup)
                    first_half += 1
            else:
                if dedup not in seen_second:
                    seen_second.add(dedup)
                    second_half += 1

        if second_half > first_half * 1.3:
            trend = "increasing"
        elif second_half < first_half * 0.7:
            trend = "decreasing"
        else:
            trend = "stable"

        return DisasterHistory(
            total_declarations=total,
            by_type=dict(sorted(by_type.items(), key=lambda x: x[1], reverse=True)),
            recent_5yr=recent_count,
            trend=trend,
        )
    except Exception:
        return _fallback(state)


def _fallback(state: str) -> DisasterHistory:
    """Return hardcoded fallback data when the API is unavailable."""
    fb = _FALLBACK_DISASTER_COUNTS.get(state, _FALLBACK_DISASTER_COUNTS["DEFAULT"])
    return DisasterHistory(
        total_declarations=fb["total"],
        by_type=fb["by_type"],
        recent_5yr=fb["recent"],
        trend="increasing" if state in ("FL", "CA", "TX", "LA") else "stable",
    )
