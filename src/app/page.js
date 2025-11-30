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

        const injuryRes = await fetch("/api/injuries");
        const injuryData = await injuryRes.json();

        const allGames = [
          ...(Array.isArray(gamesData) ? gamesData : []),
          ...(Array.isArray(nightGamesData) ? nightGamesData : []),
        ].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

        allGames.forEach((game) => {
          const awayAbbr = game.teams_normalized.find(
            (t) => t.is_away
          )?.abbreviation;
          const homeAbbr = game.teams_normalized.find(
            (t) => t.is_home
          )?.abbreviation;

          game.awayInjuries = injuryData[awayAbbr] || [];
          game.homeInjuries = injuryData[homeAbbr] || [];
        });

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
      <main className="max-w-7xl mx-auto p-2">
        <h1 className="text-3xl font-bold mb-8 text-white text-center">
          AIO Sunday Stats – Week 13 NFL
        </h1>

        {games.length === 0 ? (
          <p>Loading OR No games available.</p>
        ) : (
          <div className="grid gap-6">
            {games.map((game) => {
              const opener = openers.find((o) => o.event_id === game.event_id);

              const away =
                game.teams_normalized?.find((t) => t.is_away)?.name || "Away";
              const home =
                game.teams_normalized?.find((t) => t.is_home)?.name || "Home";

              const awayMascot =
                game.teams_normalized?.find((t) => t.is_away)?.mascot || "Away";
              const homeMascot =
                game.teams_normalized?.find((t) => t.is_home)?.mascot || "Home";

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
              const hours = game.weather_api || [];

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
                  className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[0.15fr_7fr_0.15fr] gap-1 items-start justify-items-center"
                >
                  {/* LEFT COLUMN — AWAY INJURIES */}
                  <div className="hidden sm:block p-3 rounded-md h-full">
                    <h3 className="font-semibold text-white mb-2">
                      {away} Injuries
                    </h3>

                    {game.awayInjuries?.length ? (
                      <ul className="space-y-1">
                        {game.awayInjuries.map((inj) => (
                          <li key={inj.id} className="text-sm text-gray-200">
                            <span className="font-bold">{inj.name}</span> (
                            {inj.position})
                            <span
                              className={
                                "ml-1 px-2 py-0.5 rounded " +
                                (inj.status === "Questionable"
                                  ? "bg-yellow-500/40 text-yellow-300"
                                  : inj.status === "Doubtful"
                                  ? "bg-orange-500/40 text-orange-300"
                                  : inj.status === "COV"
                                  ? "bg-pink-500/40 text-pink-300"
                                  : "bg-red-600/40 text-red-300")
                              }
                            >
                              {inj.status}
                            </span>
                            {inj.body_part && (
                              <span className="ml-1 text-gray-300">
                                ({inj.body_part})
                              </span>
                            )}
                            {inj.notes && (
                              <span className="block text-xs text-gray-400">
                                {inj.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">No injuries</p>
                    )}
                  </div>

                  {/* MIDDLE COLUMN — MAIN GAME CARD */}
                  <div className="border rounded-md p-4 shadow-sm bg-white max-w-[1200px] w-full mx-auto">
                    <h2 className="text-xl font-semibold mb-1">
                      {away} {awayMascot} ({awayRecord}) @ {home} {homeMascot} (
                      {homeRecord})
                    </h2>

                    <p>
                      {isDivisionGame
                        ? "🏆 Division Game"
                        : "Non-Division Game"}
                    </p>
                    <p>
                      📍 {stadium} — {city}
                    </p>
                    <p>🕒 {date}</p>

                    {/*WEATHER: INDOOR*/}
                    {isIndoor ? (
                      <div className="mt-2 p-3 bg-gray-800/30 rounded-md text-black inline-block">
                        <div className="text-lg font-semibold flex items-center gap-2">
                          🏟️ Indoor Stadium
                        </div>
                        <p className="text-sm text-black mt-1">
                          Weather conditions do not affect gameplay.
                        </p>
                      </div>
                    ) : hours.length > 0 ? (
                      <div className="mt-2 p-3 bg-blue-800/30 rounded-md text-gray-100">
                        <div className="text-lg font-semibold mb-2 text-black">
                          Game Weather (4-Hour Window)
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {hours.map((h, idx) => {
                            const t = Math.round(h.temp);
                            const feels = Math.round(h.feels_like);
                            const wind = Math.round(h.wind_speed);
                            const gust = Math.round(h.wind_gust);
                            const deg = h.wind_deg;
                            const direction = getWindDirection(deg);
                            const arrow = getWindArrow(direction);
                            const icon = h.weather?.[0]?.icon;
                            const desc = h.weather?.[0]?.description;
                            const time = new Date(
                              h.dt * 1000
                            ).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            });

                            return (
                              <div
                                key={idx}
                                className="bg-gray-700/40 p-2 rounded-md text-sm flex flex-col items-center"
                              >
                                <div className="font-semibold">
                                  {idx === 0 ? "Kickoff" : `+${idx} hr`}
                                </div>
                                <div className="text-xs text-gray-300">
                                  {time}
                                </div>

                                <img
                                  src={`https://openweathermap.org/img/wn/${icon}.png`}
                                  alt={desc}
                                  className="w-10 h-10"
                                />
                                <div className="font-bold">{desc}</div>
                                <div className="font-bold">{t}°F</div>
                                <div className="text-gray-300 text-xs">
                                  Feels {feels}°F
                                </div>

                                <div className="mt-1 text-xs bg-gray-600 px-2 py-0.5 rounded">
                                  💨 {wind} mph
                                </div>
                                {gust > 0 && (
                                  <div className="text-xs bg-gray-600 px-2 py-0.5 rounded mt-1">
                                    🌬️ Gusts {gust} mph
                                  </div>
                                )}

                                <div className="mt-1 text-xs">
                                  {arrow} {direction}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-300">Weather: N/A</p>
                    )}

                    {/* OPENING LINES */}
                    <div className="bg-[#d8d8d8] p-3 rounded-md mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-med">
                      <div>
                        <h3 className="font-bold mb-1">📈 Opening Lines</h3>

                        <div className="bg-[#9ac434] text-[#1d365e] inline-block p-1 rounded-md">
                          <p>
                            DK Spread ({home}): <b>{openerDKspread}</b>
                          </p>
                          <p>
                            DK Total: <b>{openerDKtotal}</b>
                          </p>
                          <p>
                            DK Moneyline — {home}: <b>{openerDKMLHome}</b>,{" "}
                            {away}: <b>{openerDKMLAway}</b>
                          </p>
                        </div>

                        <div className="bg-[#1d365e] text-white inline-block p-1 rounded-md">
                          <p>
                            FD Spread ({home}): <b>{openerFDspread}</b>
                          </p>
                          <p>
                            FD Total: <b>{openerFDtotal}</b>
                          </p>
                          <p>
                            FD Moneyline — {home}: <b>{openerFDMLHome}</b>,{" "}
                            {away}: <b>{openerFDMLAway}</b>
                          </p>
                        </div>
                      </div>

                      {/* CURRENT LINES */}
                      <div>
                        <h3 className="font-bold mb-1">📈 Current Lines</h3>

                        <div className="bg-[#9ac434] text-[#1d365e] inline-block p-1 rounded-md">
                          <p>
                            DK Spread ({home}): <b>{dkSpread}</b>
                          </p>
                          <p>
                            DK Total: <b>{dkTotal}</b>
                          </p>
                          <p>
                            DK Moneyline — {home}: <b>{dkMoneylineHome}</b>,{" "}
                            {away}: <b>{dkMoneylineAway}</b>
                          </p>
                        </div>

                        <div className="bg-[#1d365e] text-white inline-block p-1 rounded-md">
                          <p>
                            FD Spread ({home}): <b>{fdSpread}</b>
                          </p>
                          <p>
                            FD Total: <b>{fdTotal}</b>
                          </p>
                          <p>
                            FD Moneyline — {home}: <b>{fdMoneylineHome}</b>,{" "}
                            {away}: <b>{fdMoneylineAway}</b>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN — HOME INJURIES */}
                  <div className="hidden sm:block p-3 rounded-md h-full">
                    <h3 className="font-semibold text-white mb-2">
                      {home} Injuries
                    </h3>

                    {game.homeInjuries?.length ? (
                      <ul className="space-y-1">
                        {game.homeInjuries.map((inj) => (
                          <li key={inj.id} className="text-sm text-gray-200">
                            <span className="font-bold">{inj.name}</span> (
                            {inj.position})
                            <span
                              className={
                                "ml-1 px-2 py-0.5 rounded " +
                                (inj.status === "Questionable"
                                  ? "bg-yellow-500/40 text-yellow-300"
                                  : inj.status === "Doubtful"
                                  ? "bg-orange-500/40 text-orange-300"
                                  : inj.status === "COV"
                                  ? "bg-pink-500/40 text-pink-300"
                                  : "bg-red-600/40 text-red-300")
                              }
                            >
                              {inj.status}
                            </span>
                            {inj.body_part && (
                              <span className="ml-1 text-gray-300">
                                ({inj.body_part})
                              </span>
                            )}
                            {inj.notes && (
                              <span className="block text-xs text-gray-400">
                                {inj.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">No injuries</p>
                    )}
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
