"use client";

import { useEffect, useState } from "react";
import { indoorStadiums } from "@/lib/stadiumIndoors";

export default function Home() {
  const [games, setGames] = useState([]);
  const [openers, setOpeners] = useState([]);

  // -------- WIND HELPERS --------
  function getWindDirection(deg) {
    if (deg === undefined || deg === null) return "";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  }

  function getWindArrow(direction) {
    const map = {
      N: "↑",
      NE: "↗",
      E: "→",
      SE: "↘",
      S: "↓",
      SW: "↙",
      W: "←",
      NW: "↖",
    };
    return map[direction] || "";
  }

  // -------- FETCH DATA --------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const gamesRes = await fetch("/api/games");
        const gamesData = await gamesRes.json();

        const openersRes = await fetch("/api/openers");
        const openersData = await openersRes.json();

        const nightGamesRes = await fetch("/api/nightGames");
        const nightGamesData = await nightGamesRes.json();

        const nightOpenerRes = await fetch("/api/nightOpener");
        const nightOpenerData = await nightOpenerRes.json();

        const allGames = [
          ...(Array.isArray(gamesData) ? gamesData : []),
          ...(Array.isArray(nightGamesData) ? nightGamesData : []),
        ].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

        setGames(allGames);

        const allOpeners = [
          ...(Array.isArray(openersData) ? openersData : []),
          ...(Array.isArray(nightOpenerData) ? nightOpenerData : []),
        ];

        setOpeners(allOpeners);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#1c1c1c]">
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-white text-center">
          AIO Sunday Stats – Week 13 NFL
        </h1>

        {games.length === 0 ? (
          <p>No games available.</p>
        ) : (
          <div className="grid gap-6">
            {games.map((game) => {
              const opener = openers.find((o) => o.event_id === game.event_id);

              const away =
                game.teams_normalized?.find((t) => t.is_away)?.name || "Away";
              const home =
                game.teams_normalized?.find((t) => t.is_home)?.name || "Home";

              const date = new Date(game.event_date).toLocaleString();

              const stadium = game.score?.venue_name || "Unknown Stadium";
              const isIndoor = indoorStadiums[stadium] === true;
              const city = game.score?.venue_location || "Unknown City";

              const awayRecord = game.teams_normalized?.[0]?.record;
              const homeRecord = game.teams_normalized?.[1]?.record;
              const awayDivision = game.teams_normalized?.[0]?.division_id;
              const homeDivision = game.teams_normalized?.[1]?.division_id;
              const isDivisionGame = awayDivision === homeDivision;

              // -------- WEATHER (One Call Hourly) --------
              const wx = game.weather_api; // already matched to kickoff hour

              const temp = wx ? Math.round(wx.temp) : null;
              const feels = wx ? Math.round(wx.feels_like) : null;
              const wind = wx ? Math.round(wx.wind_speed) : null;
              const gust = wx ? Math.round(wx.wind_gust) : null;
              const deg = wx?.wind_deg;
              const direction = wx ? getWindDirection(deg) : "";
              const arrow = wx ? getWindArrow(direction) : "";
              const icon = wx?.weather?.[0]?.icon;
              const desc = wx?.weather?.[0]?.description;

              // -------- LINE DATA --------
              const dk = game.lines?.["19"];
              const fd = game.lines?.["23"];

              const dkSpread = dk?.spread?.point_spread_home ?? "N/A";
              const dkTotal = dk?.total?.total_over ?? "N/A";
              const dkMoneylineHome = dk?.moneyline?.moneyline_home ?? "N/A";
              const dkMoneylineAway = dk?.moneyline?.moneyline_away ?? "N/A";

              const fdSpread = fd?.spread?.point_spread_home ?? "N/A";
              const fdTotal = fd?.total?.total_over ?? "N/A";
              const fdMoneylineHome = fd?.moneyline?.moneyline_home ?? "N/A";
              const fdMoneylineAway = fd?.moneyline?.moneyline_away ?? "N/A";

              const openerDK = opener?.lines?.["19"];
              const openerDKspread =
                openerDK?.spread?.point_spread_home ?? "N/A";
              const openerDKtotal = openerDK?.total?.total_over ?? "N/A";
              const openerDKMLHome =
                openerDK?.moneyline?.moneyline_home ?? "N/A";
              const openerDKMLAway =
                openerDK?.moneyline?.moneyline_away ?? "N/A";

              const openerFD = opener?.lines?.["23"];
              const openerFDspread =
                openerFD?.spread?.point_spread_home ?? "N/A";
              const openerFDtotal = openerFD?.total?.total_over ?? "N/A";
              const openerFDMLHome =
                openerFD?.moneyline?.moneyline_home ?? "N/A";
              const openerFDMLAway =
                openerFD?.moneyline?.moneyline_away ?? "N/A";

              return (
                <div
                  key={game.event_id}
                  className="border rounded-md p-4 shadow-sm bg-white"
                >
                  <h2 className="text-xl font-semibold mb-1">
                    {away} ({awayRecord}) @ {home} ({homeRecord})
                  </h2>

                  <p>
                    {isDivisionGame ? "🏆 Division Game" : "Non-Division Game"}
                  </p>
                  <p>
                    📍 {stadium} — {city}
                  </p>
                  <p>🕒 {date}</p>

                  {/* -------- WEATHER CARD -------- */}
                  {isIndoor ? (
                    <div className="mt-2 p-3 bg-gray-800/30 rounded-md text-gray-100 inline-block">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        🏟️ Indoor Stadium
                      </div>
                      <p className="text-sm text-black mt-1">
                        Weather conditions do not affect gameplay.
                      </p>
                    </div>
                  ) : wx ? (
                    <div className="mt-2 p-3 bg-gray-800/30 rounded-md text-gray-100 inline-block">
                      {/* Top Row: Icon + Temp */}
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                          alt={desc}
                          className="w-10 h-10"
                        />
                        <div className="text-lg font-semibold">
                          {temp}°F — {desc}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2 text-sm">
                        <span className="px-2 py-1 bg-gray-700 rounded-md">
                          💨 {wind} mph
                        </span>

                        <span className="px-2 py-1 bg-gray-700 rounded-md">
                          {arrow} {direction}
                        </span>

                        {gust != null && (
                          <span className="px-2 py-1 bg-gray-700 rounded-md">
                            🌬️ Gusts {gust} mph
                          </span>
                        )}

                        <span className="px-2 py-1 bg-gray-700 rounded-md">
                          Feels {feels}°F
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-black">
                        Forecast for {new Date(wx.dt * 1000).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300">Weather: N/A</p>
                  )}

                  {/* -------- LINES -------- */}
                  <div className="bg-[#8a828293] p-3 rounded-md mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h3 className="font-bold mb-1">📈 Opening Lines</h3>

                      <div className="bg-[#5cb85c] text-white inline-block p-1 rounded-md">
                        <p>
                          DK Spread ({home}): {openerDKspread}
                        </p>
                        <p>DK Total: {openerDKtotal}</p>
                        <p>
                          DK Moneyline — {home}: {openerDKMLHome}, {away}:{" "}
                          {openerDKMLAway}
                        </p>
                      </div>

                      <div className="bg-[#0b6fff] text-white inline-block p-1 rounded-md">
                        <p>
                          FD Spread ({home}): {openerFDspread}
                        </p>
                        <p>FD Total: {openerFDtotal}</p>
                        <p>
                          FD Moneyline — {home}: {openerFDMLHome}, {away}:{" "}
                          {openerFDMLAway}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-1">📈 Current Lines</h3>

                      <div className="bg-[#5cb85c] text-white inline-block p-1 rounded-md">
                        <p>
                          DK Spread ({home}): {dkSpread}
                        </p>
                        <p>DK Total: {dkTotal}</p>
                        <p>
                          DK Moneyline — {home}: {dkMoneylineHome}, {away}:{" "}
                          {dkMoneylineAway}
                        </p>
                      </div>

                      <div className="bg-[#0b6fff] text-white inline-block p-1 rounded-md">
                        <p>
                          FD Spread ({home}): {fdSpread}
                        </p>
                        <p>FD Total: {fdTotal}</p>
                        <p>
                          FD Moneyline — {home}: {fdMoneylineHome}, {away}:{" "}
                          {fdMoneylineAway}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
