const BASE = process.env.EXPO_PUBLIC_API_BASE || "https://v3.football.api-sports.io";
const KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;

async function request(path, params = {}) {
  if (!KEY) throw new Error("Missing EXPO_PUBLIC_API_FOOTBALL_KEY");
  const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== "")).toString();
  const res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ""}`, { headers: { "x-apisports-key": KEY } });
  if (!res.ok) throw new Error(`Football data request failed: ${res.status}`);
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length) throw new Error(JSON.stringify(data.errors));
  return data.response || [];
}

export const footballApi = {
  leagues: (country = "") => request("/leagues", country ? { country } : {}),
  fixturesByDate: (date) => request("/fixtures", { date }),
  fixturesByLeague: (league, season) => request("/fixtures", { league, season }),
  fixturesByTeam: (team, last = 10, season) => request("/fixtures", { team, last, season }),
  teams: (search) => request("/teams", { search }),
  teamStatistics: (team, league, season) => request("/teams/statistics", { team, league, season }),
  headToHead: (h2h, last = 10) => request("/fixtures/headtohead", { h2h, last }),
  standings: (league, season) => request("/standings", { league, season }),
  fixture: (id) => request("/fixtures", { id }),
  fixtureStatistics: (fixture) => request("/fixtures/statistics", { fixture }),
  fixtureLineups: (fixture) => request("/fixtures/lineups", { fixture }),
  injuries: (fixture) => request("/injuries", { fixture }),
  predictions: (fixture) => request("/predictions", { fixture })
};

export function mapRecentFixtures(fixtures, teamId) {
  return fixtures.map(f => {
    const home = f.teams?.home?.id === teamId;
    return {
      homeGoals: Number(f.goals?.home ?? 0),
      awayGoals: Number(f.goals?.away ?? 0),
      isHome: home,
      result: home ? (f.teams.home.winner ? "W" : f.teams.away.winner ? "L" : "D") : (f.teams.away.winner ? "W" : f.teams.home.winner ? "L" : "D")
    };
  }).sort((a,b) => 0);
}
