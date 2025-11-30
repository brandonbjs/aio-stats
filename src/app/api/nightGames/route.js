import { stadiumCoords } from "@/lib/stadiumCoords";

function findClosestHour(hourly, kickoffDate) {
  const kickoff = new Date(kickoffDate).getTime();
  let closest = hourly[0];
  let minDiff = Math.abs(kickoff - hourly[0].dt * 1000);

  for (const h of hourly) {
    const diff = Math.abs(kickoff - h.dt * 1000);
    if (diff < minDiff) {
      minDiff = diff;
      closest = h;
    }
  }

  return closest;
}

export async function GET() {
  const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;
  const params = new URLSearchParams({
    include: "scores,lines",
    affiliate_ids: "19,23",
    offset: "0",
  });

  const nightUrl =
    "https://therundown-therundown-v1.p.rapidapi.com/sports/2/events/2025-12-1?" +
    params.toString();

  const nightRes = await fetch(nightUrl, {
    headers: {
      "x-rapidapi-key": process.env.RUNDOWN_API_KEY,
      "x-rapidapi-host": "therundown-therundown-v1.p.rapidapi.com",
    },
  });

  const nightData = await nightRes.json();
  const nightGames = nightData.events || [];

  const enhanced = await Promise.all(
    nightGames.map(async (game) => {
      const venue = game.score?.venue_name;
      const coords = stadiumCoords[venue];

      if (!coords) {
        console.log("Missing coordinates for:", venue);
        return { ...game, weather_api: null };
      }

      const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_KEY}&units=imperial&exclude=minutely,daily,alerts`;

      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      if (!weatherData.hourly) {
        return { ...game, weather_api: null };
      }

      const hourly = weatherData.hourly || [];
      const kickoff = new Date(game.event_date).getTime();

      // find index of hour closest to kickoff
      let closestIndex = 0;
      let smallestDiff = Infinity;

      hourly.forEach((h, i) => {
        const diff = Math.abs(kickoff - h.dt * 1000);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIndex = i;
        }
      });

      // get 4-hour block
      const windowHours = hourly.slice(closestIndex, closestIndex + 4);

      return {
        ...game,
        weather_api: windowHours,
      };
    })
  );

  return Response.json(enhanced);
}
