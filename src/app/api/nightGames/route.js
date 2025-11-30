import { NextResponse } from "next/server";

// Helper: find nearest 3-hour forecast to kickoff time
function findClosestForecast(forecasts, kickoffDate) {
  const kickoff = new Date(kickoffDate).getTime();
  let closest = forecasts[0];
  let minDiff = Math.abs(kickoff - new Date(forecasts[0].dt_txt).getTime());

  for (const f of forecasts) {
    const diff = Math.abs(kickoff - new Date(f.dt_txt).getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = f;
    }
  }

  return closest;
}

export async function GET() {
  try {
    const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;

    // ---- 🎯 Required Rundown params ----
    const params = new URLSearchParams({
      include: "scores,lines",
      affiliate_ids: "19,23",
      offset: "0",
    });

    // ---- 📅 Fetch ONLY Sunday games (2025-11-30) ----
    const sundayUrl = `https://therundown-therundown-v1.p.rapidapi.com/sports/2/events/2025-12-1?${params.toString()}`;

    const sundayRes = await fetch(sundayUrl, {
      headers: {
        "x-rapidapi-key": process.env.RUNDOWN_API_KEY,
        "x-rapidapi-host": "therundown-therundown-v1.p.rapidapi.com",
      },
    });

    const sundayData = await sundayRes.json();
    const sundayGames = Array.isArray(sundayData?.events)
      ? sundayData.events
      : [];

    // ---- 🌤 Integrate 5-day forecast weather ----
    const enhanced = await Promise.all(
      sundayGames.map(async (game) => {
        const location = game.score?.venue_location;
        const city = location?.split(",")[0].trim();

        if (!city) {
          return { ...game, weather_api: null };
        }

        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_KEY}&units=imperial`;

        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        const forecasts = weatherData?.list || [];

        if (forecasts.length === 0) {
          return { ...game, weather_api: null };
        }

        const closest = findClosestForecast(forecasts, game.event_date);

        return {
          ...game,
          weather_api: closest, // attach the forecast block
        };
      })
    );

    return NextResponse.json(enhanced);
  } catch (err) {
    console.error("GAME API ERROR:", err);
    return NextResponse.json({ error: "Failed to load Sunday games" });
  }
}
