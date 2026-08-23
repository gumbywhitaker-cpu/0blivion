import "server-only";

/**
 * OpenWeatherMap (openweathermap.org) — a second weather provider, wired
 * alongside the Open-Meteo integration already powering the grower
 * dashboard's spray-window forecast (lib/weather.ts). Not called from any
 * page yet: this is integration-only, ready for a future feature to use.
 *
 * Adapter-point pattern, same as lib/aiGrading.ts: fails closed with a
 * clear reason when OPENWEATHER_API_KEY isn't configured, rather than
 * throwing.
 */

export type OpenWeatherCurrentConditions = {
  cityName: string;
  tempC: number;
  description: string;
  icon: string;
  windKmh: number;
  humidityPercent: number;
};

export type OpenWeatherResult = { ok: true; conditions: OpenWeatherCurrentConditions } | { ok: false; reason: string };

/** `lat`/`lon` in decimal degrees. */
export async function getCurrentWeather(lat: number, lon: number): Promise<OpenWeatherResult> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn("[openweathermap] OPENWEATHER_API_KEY not configured — OpenWeatherMap lookup unavailable");
    return { ok: false, reason: "OpenWeatherMap isn't configured on this deployment yet." };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 60 * 30 } });
  } catch {
    return { ok: false, reason: "Couldn't reach OpenWeatherMap — try again shortly." };
  }

  if (!response.ok) {
    return { ok: false, reason: `OpenWeatherMap returned an error (${response.status}).` };
  }

  const data = await response.json();
  return {
    ok: true,
    conditions: {
      cityName: data.name,
      tempC: Math.round(data.main.temp),
      description: data.weather?.[0]?.description ?? "unknown",
      icon: data.weather?.[0]?.icon ?? "",
      windKmh: Math.round((data.wind?.speed ?? 0) * 3.6), // OpenWeatherMap gives m/s
      humidityPercent: data.main.humidity,
    },
  };
}
