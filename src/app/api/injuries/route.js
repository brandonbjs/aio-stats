export async function GET() {
  try {
    const res = await fetch("https://api.sleeper.app/v1/players/nfl");

    if (!res.ok) {
      throw new Error("Failed to fetch Sleeper players.");
    }

    const players = await res.json();
    const playerList = Object.values(players);

    // statuses to ignore (not game relevant)
    const EXCLUDED_STATUSES = new Set([
      "IR",
      "IR-R", // injured reserve – return
      "PUP",
      "PUP-R", // pup return
      "NFI",
      "NFI-R",
      "SUS", // suspension
      "NA", // non-active
      null,
      undefined,
    ]);

    // Only Injured players with meaningful injury designation
    const injuredPlayers = playerList.filter((p) => {
      const status = p.injury_status;
      const team = p.team;

      if (!team) return false; // must belong to a team
      if (!status) return false; // no injury at all
      if (EXCLUDED_STATUSES.has(status)) return false; // remove IR etc.

      // At this point we only keep:
      // Q (Questionable)
      // D (Doubtful)
      // O (Out)
      // and maybe "INJ" (general injury flag)
      return true;
    });

    // Group by team abbrev
    const injuriesByTeam = {};

    injuredPlayers.forEach((p) => {
      const team = p.team;

      if (!injuriesByTeam[team]) {
        injuriesByTeam[team] = [];
      }

      injuriesByTeam[team].push({
        id: p.player_id,
        name: `${p.first_name} ${p.last_name}`,
        position: p.position,
        status: p.injury_status,
        body_part: p.injury_body_part || null,
        notes: p.injury_notes || null,
        update: p.injury_start_date || null,
      });
    });

    return Response.json(injuriesByTeam);
  } catch (error) {
    console.error("Injury API error:", error);
    return Response.json(
      { error: "Failed to load injuries." },
      { status: 500 }
    );
  }
}
