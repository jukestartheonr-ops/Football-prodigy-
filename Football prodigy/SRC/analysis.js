// Phase 2: explainable football probability engine.
// The model converts team performance inputs into expected goals (xG-like estimates),
// then derives 1X2, BTTS, totals and scoreline probabilities with a Poisson model.
// It is an analytical estimate, not a guarantee.

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const safe = (x, fallback = 0) => Number.isFinite(Number(x)) ? Number(x) : fallback;

function poisson(lambda, k) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

function normalize(value, low, high) {
  return clamp((safe(value, (low + high) / 2) - low) / (high - low), 0, 1);
}

export function formScore(results = []) {
  if (!results.length) return 0.5;
  const weights = results.map((_, i) => Math.pow(0.86, results.length - 1 - i));
  let total = 0, weight = 0;
  results.forEach((r, i) => {
    const v = r === "W" ? 1 : r === "D" ? 0.45 : 0;
    total += v * weights[i]; weight += weights[i];
  });
  return weight ? total / weight : 0.5;
}

function recentGoalRate(team, side) {
  const matches = team.recentMatches || [];
  if (!matches.length) return { scored: 1.35, conceded: 1.35 };
  let scored = 0, conceded = 0, weight = 0;
  matches.forEach((m, i) => {
    const w = Math.pow(0.86, matches.length - 1 - i);
    scored += safe(side === "home" ? m.homeGoals : m.awayGoals, 0) * w;
    conceded += safe(side === "home" ? m.awayGoals : m.homeGoals, 0) * w;
    weight += w;
  });
  return { scored: scored / weight, conceded: conceded / weight };
}

function teamStrength(team, side) {
  const goals = recentGoalRate(team, side);
  const attack = safe(team.attackRating, 1);
  const defence = safe(team.defenceRating, 1);
  const form = formScore(team.form);
  const points = normalize(team.pointsPerGame, 0, 3);
  const cleanSheets = normalize(team.cleanSheetRate, 0, 1);
  const goalDiff = clamp(safe(team.goalDifferencePerGame, 0) / 3, -1, 1);

  return {
    attack: attack * 0.35 + normalize(goals.scored, 0, 3.5) * 0.30 + form * 0.15 + points * 0.12 + Math.max(0, goalDiff) * 0.08,
    defence: defence * 0.35 + (1 - normalize(goals.conceded, 0, 3.5)) * 0.30 + cleanSheets * 0.20 + points * 0.10 + Math.max(0, goalDiff) * 0.05
  };
}

function expectedGoals(home, away, context) {
  const h = teamStrength(home, "home");
  const a = teamStrength(away, "away");
  const leagueGoals = safe(context.leagueAverageGoals, 2.65);
  const base = leagueGoals / 2;

  // Home advantage is applied only when the fixture is not neutral.
  const venue = context.neutral ? 1 : 1.10;
  const homeAttack = 0.72 + h.attack;
  const awayAttack = 0.68 + a.attack;
  const homeDef = 0.72 + h.defence;
  const awayDef = 0.68 + a.defence;

  let hxg = base * venue * homeAttack * (1.35 - awayDef * 0.42);
  let axg = base * awayAttack * (1.35 - homeDef * 0.42);

  const restEdge = clamp((safe(home.restDays, 5) - safe(away.restDays, 5)) / 20, -0.12, 0.12);
  hxg *= 1 + restEdge;
  axg *= 1 - restEdge;

  hxg *= 1 - clamp(safe(home.injuryImpact, 0), 0, 0.35);
  axg *= 1 - clamp(safe(away.injuryImpact, 0), 0, 0.35);

  return { home: clamp(hxg, 0.15, 4.5), away: clamp(axg, 0.15, 4.0) };
}

export function analyseMatch(home, away, context = {}) {
  const xg = expectedGoals(home, away, context);
  const maxGoals = 7;
  const hp = Array.from({length: maxGoals + 1}, (_, k) => poisson(xg.home, k));
  const ap = Array.from({length: maxGoals + 1}, (_, k) => poisson(xg.away, k));

  let homeWin = 0, draw = 0, awayWin = 0, btts = 0, over25 = 0;
  const scores = [];
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = hp[h] * ap[a];
      if (h > a) homeWin += p; else if (h === a) draw += p; else awayWin += p;
      if (h > 0 && a > 0) btts += p;
      if (h + a >= 3) over25 += p;
      scores.push({ home: h, away: a, probability: p });
    }
  }
  const total = homeWin + draw + awayWin;
  homeWin /= total; draw /= total; awayWin /= total;
  scores.sort((a, b) => b.probability - a.probability);

  const max = Math.max(homeWin, draw, awayWin);
  const entropy = -(homeWin*Math.log(homeWin) + draw*Math.log(draw) + awayWin*Math.log(awayWin));
  const confidence = clamp((1 - entropy / Math.log(3)) * 100, 0, 100);

  return {
    expectedGoals: { home: +xg.home.toFixed(2), away: +xg.away.toFixed(2), total: +(xg.home+xg.away).toFixed(2) },
    homeWin: +(homeWin * 100).toFixed(1), draw: +(draw * 100).toFixed(1), awayWin: +(awayWin * 100).toFixed(1),
    btts: +(btts * 100).toFixed(1), over25: +(over25 * 100).toFixed(1), under25: +((1-over25) * 100).toFixed(1),
    confidence: +confidence.toFixed(1),
    topScores: scores.slice(0, 5).map(s => ({ score: `${s.home}-${s.away}`, probability: +(s.probability*100).toFixed(1) })),
    factors: [
      { label: "Expected goals", value: `${xg.home.toFixed(2)} – ${xg.away.toFixed(2)}` },
      { label: "Recent form", value: "Weighted toward latest matches" },
      { label: "Attack / defence", value: "Combined into team strength" },
      { label: "Home advantage", value: context.neutral ? "Neutral venue" : "Applied" },
      { label: "Rest", value: "Applied when supplied" },
      { label: "Injuries", value: "Applied when supplied" }
    ]
  };
}

export const demoMatches = [
  {
    id: "demo-1", competition: "UEFA Champions League",
    home: { name: "Arsenal", attackRating: 1.18, defenceRating: 1.15, form: ["W","W","D","W","W"], pointsPerGame: 2.4, cleanSheetRate: .45, goalDifferencePerGame: 1.1, restDays: 5, injuryImpact: .03,
      recentMatches: [{homeGoals:3,awayGoals:0},{homeGoals:2,awayGoals:1},{homeGoals:1,awayGoals:1},{homeGoals:2,awayGoals:0},{homeGoals:3,awayGoals:1}] },
    away: { name: "Lille", attackRating: 1.00, defenceRating: 1.02, form: ["W","D","L","W","D"], pointsPerGame: 1.7, cleanSheetRate: .30, goalDifferencePerGame: .3, restDays: 4, injuryImpact: .05,
      recentMatches: [{homeGoals:1,awayGoals:0},{homeGoals:1,awayGoals:1},{homeGoals:0,awayGoals:2},{homeGoals:2,awayGoals:1},{homeGoals:1,awayGoals:1}] }
  },
  {
    id: "demo-2", competition: "CAF Champions League",
    home: { name: "Example Home", attackRating: 1.08, defenceRating: 1.05, form: ["W","D","W","L","W"], pointsPerGame: 2.0, cleanSheetRate: .4, goalDifferencePerGame: .6, restDays: 6 },
    away: { name: "Example Away", attackRating: 1.00, defenceRating: 1.02, form: ["D","W","L","D","W"], pointsPerGame: 1.6, cleanSheetRate: .3, goalDifferencePerGame: .2, restDays: 5 }
  }
];
