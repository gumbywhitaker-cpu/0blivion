import { getWeatherForRegion, weatherLabel } from "@/lib/weather";

const SPRAY_WINDOW_STYLE: Record<string, string> = {
  GOOD: "bg-kf-green-100 text-kf-green-700",
  MARGINAL: "bg-kf-gold/20 text-kf-gold",
  POOR: "bg-kf-red/10 text-kf-red",
};

const SPRAY_WINDOW_LABEL: Record<string, string> = {
  GOOD: "Good spray window",
  MARGINAL: "Marginal",
  POOR: "Poor",
};

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NZ", { weekday: "short" });
}

export async function WeatherPanel({ region }: { region: string | null }) {
  const weather = await getWeatherForRegion(region);

  if (!weather) {
    return (
      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Weather</h2>
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          Weather is unavailable right now — Open-Meteo didn&apos;t respond. Try refreshing shortly.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-kf-charcoal">Weather</h2>
        <span className="text-xs text-kf-muted">
          {weather.locationName}
          {!region ? " (default — set an orchard region for a local forecast)" : ""} · via Open-Meteo
        </span>
      </div>
      <div className="rounded-lg border border-kf-border bg-kf-card p-4">
        <div className="mb-4 flex items-center gap-4">
          <p className="text-4xl font-semibold text-kf-charcoal">{Math.round(weather.current.tempC)}°C</p>
          <div>
            <p className="text-kf-charcoal">{weatherLabel(weather.current.weatherCode)}</p>
            <p className="text-sm text-kf-muted">Wind {Math.round(weather.current.windKmh)} km/h</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {weather.daily.map((d, i) => (
            <div key={d.date} className="rounded-md border border-kf-border p-2 text-center">
              <p className="text-xs font-semibold text-kf-charcoal">{dayLabel(d.date, i)}</p>
              <p className="mt-1 text-sm text-kf-charcoal">
                {Math.round(d.maxTempC)}° / {Math.round(d.minTempC)}°
              </p>
              <p className="text-xs text-kf-muted">
                {d.precipProbability !== null ? `${d.precipProbability}% rain` : "—"}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${SPRAY_WINDOW_STYLE[d.sprayWindow]}`}
              >
                {SPRAY_WINDOW_LABEL[d.sprayWindow]}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-kf-muted">
          Spray window is a simple guide (rain chance &lt; 30% and wind &lt; 15 km/h = good) — always
          confirm against the label and your own judgement before spraying.
        </p>
      </div>
    </section>
  );
}
