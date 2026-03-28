import httpx
from datetime import date, timedelta
from backend.models.risk import HazardDetail
from backend.risk.mock_client import MIAMI_COASTAL_SEED, _deterministic_offset


def get_heat_wind_scores(lat: float, lng: float) -> dict[str, HazardDetail]:
    """Open-Meteo ERA5 archive — heat from 1-year avg max temp, wind from 10-year peak."""
    try:
        today = date.today()
        # Heat: 1 year is enough (temperature is stable year-to-year)
        heat_start = (today - timedelta(days=370)).isoformat()
        heat_end   = (today - timedelta(days=5)).isoformat()
        # Wind: 10 years to capture hurricane seasons
        wind_start = date(today.year - 10, today.month, today.day).isoformat()

        url = "https://archive-api.open-meteo.com/v1/archive"
        resp = httpx.get(url, params={
            "latitude": lat, "longitude": lng,
            "start_date": wind_start, "end_date": heat_end,
            "daily": "temperature_2m_max,windspeed_10m_max",
            "temperature_unit": "fahrenheit",
            "timezone": "auto",
        }, timeout=20)
        daily = resp.json().get("daily", {})
        dates  = daily.get("time", [])
        temps  = daily.get("temperature_2m_max", [])
        winds  = daily.get("windspeed_10m_max", [])

        # Heat: average over last 1 year only
        cutoff = heat_start
        recent_temps = [
            t for d, t in zip(dates, temps)
            if d >= cutoff and t is not None
        ]
        avg_max_f = sum(recent_temps) / len(recent_temps) if recent_temps else 78.0

        # Wind: peak over full 10-year window (catches hurricanes)
        valid_winds = [w for w in winds if w is not None]
        max_wind_kph = max(valid_winds) if valid_winds else 30.0
        max_wind_mph = max_wind_kph * 0.621371

        # Heat score: 100°F+ = 10, 90-100 = 8-9, 80-90 = 5-7, <80 = 1-4
        heat_score = min(10, max(1, int((avg_max_f - 55) / 4.5)))

        # Wind score: hurricane force 74+ mph = 9-10, tropical storm 39-73 = 5-8, else lower
        wind_score = min(10, max(1, int(max_wind_mph / 9)))

        return {
            "heat": HazardDetail(
                score=heat_score,
                source=f"Open-Meteo ERA5 (avg max {avg_max_f:.1f}°F)",
                trajectory="increasing",
            ),
            "wind": HazardDetail(
                score=wind_score,
                source=f"Open-Meteo ERA5 (10yr peak {max_wind_mph:.0f} mph)",
                trajectory="increasing" if lat < 35 else "stationary",
            ),
        }
    except Exception:
        result = {}
        for hazard in ("heat", "wind"):
            base = MIAMI_COASTAL_SEED[hazard]
            offset = _deterministic_offset(lat, lng, hazard)
            result[hazard] = HazardDetail(
                score=max(1, min(10, base["score"] + offset)),
                source=f"Open-Meteo (mock fallback)",
                trajectory=base["trajectory"],
            )
        return result


def get_seismic_score(lat: float, lng: float) -> HazardDetail:
    """USGS earthquake event count within 200 km over 10 years, M3+."""
    try:
        today = date.today()
        resp = httpx.get(
            "https://earthquake.usgs.gov/fdsnws/event/1/count",
            params={
                "format": "geojson",
                "latitude": lat, "longitude": lng,
                "maxradiuskm": 200,
                "minmagnitude": 3.0,
                "starttime": date(today.year - 10, today.month, today.day).isoformat(),
                "endtime": today.isoformat(),
            },
            timeout=10,
        )
        count = resp.json().get("count", 0)
        score = min(10, max(1, count // 20 + 1))
        return HazardDetail(score=score, source=f"USGS ({count} M3+ events/10yr)", trajectory="stationary")
    except Exception:
        base = MIAMI_COASTAL_SEED["seismic"]
        offset = _deterministic_offset(lat, lng, "seismic")
        return HazardDetail(
            score=max(1, min(10, base["score"] + offset)),
            source="USGS (mock fallback)",
            trajectory=base["trajectory"],
        )
