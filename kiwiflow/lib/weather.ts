import "server-only";

/**
 * Real forecast data from Open-Meteo (open-meteo.com) — free, no API key, no
 * account required for non-commercial use. No fabricated numbers: if either call
 * fails, callers get `null` and the UI says "unavailable" rather than guessing.
 *
 * Location comes from the grower's own orchard regions (already collected when
 * an orchard is created) rather than a new field nobody has filled in yet.
 */

const WMO_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Slight rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Slight snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

export function weatherLabel(code: number): string {
  return WMO_LABELS[code] ?? "Unknown conditions";
}

export type DailyForecast = {
  date: string;
  maxTempC: number;
  minTempC: number;
  precipProbability: number | null;
  maxWindKmh: number;
  weatherCode: number;
  sprayWindow: "GOOD" | "MARGINAL" | "POOR";
};

export type WeatherSnapshot = {
  locationName: string;
  current: {
    tempC: number;
    weatherCode: number;
    windKmh: number;
  };
  daily: DailyForecast[];
};

// Geocoding results for NZ region names don't change; cache in-process rather
// than re-hitting the geocoder on every dashboard load.
const geocodeCache = new Map<string, { lat: number; lon: number; name: string } | null>();

async function geocodeRegion(region: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const key = region.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(region)}&count=1&country=NZ&language=en&format=json`;
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) throw new Error(`geocoding ${res.status}`);
    const data = await res.json();
    const first = data?.results?.[0];
    const result = first ? { lat: first.latitude, lon: first.longitude, name: first.name as string } : null;
    geocodeCache.set(key, result);
    return result;
  } catch {
    geocodeCache.set(key, null);
    return null;
  }
}

function sprayWindow(precipProbability: number | null, maxWindKmh: number): DailyForecast["sprayWindow"] {
  const rain = precipProbability ?? 0;
  if (rain < 30 && maxWindKmh < 15) return "GOOD";
  if (rain < 60 && maxWindKmh < 25) return "MARGINAL";
  return "POOR";
}

/**
 * `region` should be a New Zealand place/region name (e.g. "Bay of Plenty",
 * "Te Puke"). Falls back to Te Puke — the country's largest kiwifruit-growing
 * hub — when the grower hasn't set a region on any orchard yet, clearly labelled
 * as a fallback in the returned `locationName` via the caller's UI.
 */
export async function getWeatherForRegion(region: string | null): Promise<WeatherSnapshot | null> {
  const place = await geocodeRegion(region?.trim() || "Te Puke");
  if (!place) return null;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weather_code` +
      `&timezone=Pacific%2FAuckland&forecast_days=4`;
    const res = await fetch(url, { next: { revalidate: 60 * 30 } });
    if (!res.ok) throw new Error(`forecast ${res.status}`);
    const data = await res.json();

    const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
      date,
      maxTempC: data.daily.temperature_2m_max[i],
      minTempC: data.daily.temperature_2m_min[i],
      precipProbability: data.daily.precipitation_probability_max?.[i] ?? null,
      maxWindKmh: data.daily.wind_speed_10m_max[i],
      weatherCode: data.daily.weather_code[i],
      sprayWindow: sprayWindow(data.daily.precipitation_probability_max?.[i] ?? null, data.daily.wind_speed_10m_max[i]),
    }));

    return {
      locationName: place.name,
      current: {
        tempC: data.current.temperature_2m,
        weatherCode: data.current.weather_code,
        windKmh: data.current.wind_speed_10m,
      },
      daily,
    };
  } catch {
    return null;
  }
}
