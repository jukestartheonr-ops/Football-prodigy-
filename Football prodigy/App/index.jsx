import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { footballApi } from "../src/api";
import { demoMatches } from "../src/analysis";

const competitions = [
  ["🌍", "FIFA World Cup"], ["🏆", "UEFA Champions League"],
  ["🇪🇺", "UEFA Europa League"], ["🌍", "UEFA Conference League"],
  ["🌍", "CAF Champions League"], ["🌍", "CAF Confederation Cup"],
  ["🌎", "Copa Libertadores"], ["🌎", "Copa Sudamericana"],
  ["🌏", "AFC Champions League Elite"], ["🌎", "CONCACAF Champions Cup"]
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Ready");
  const [matches, setMatches] = useState(demoMatches);

  async function loadToday() {
    setStatus("Loading football data...");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await footballApi.fixturesByDate(today);
      setMatches(data.slice(0, 20).map(x => ({
        id: String(x.fixture.id),
        competition: x.league?.name || "Football",
        home: { name: x.teams.home.name },
        away: { name: x.teams.away.name }
      })));
      setStatus(`${data.length} fixtures loaded`);
    } catch (e) {
      setStatus("Demo mode — add your API key for live data");
    }
  }

  useEffect(() => { loadToday(); }, []);

  const filtered = matches.filter(m =>
    `${m.home.name} ${m.away.name} ${m.competition}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ScrollView style={s.page} contentContainerStyle={s.container}>
      <View style={s.hero}>
        <Text style={s.logo}>⚽</Text>
        <View>
          <Text style={s.title}>FOOTBALL</Text>
          <Text style={s.subtitle}>PROBABILITY ENGINE</Text>
        </View>
      </View>

      <TextInput
        value={query} onChangeText={setQuery}
        placeholder="Search teams, leagues or competitions"
        placeholderTextColor="#708096"
        style={s.search}
      />

      <Text style={s.section}>GLOBAL COMPETITIONS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {competitions.map(([icon, name]) => (
          <View style={s.comp} key={name}>
            <Text style={s.compIcon}>{icon}</Text>
            <Text style={s.compText}>{name}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={s.status}><Text style={s.statusText}>{status}</Text></View>

      <Text style={s.section}>MATCH ANALYSIS</Text>
      {filtered.map(match => (
        <TouchableOpacity key={match.id} style={s.card}
          onPress={() => router.push({ pathname: "/analyse", params: {
            home: match.home.name, away: match.away.name,
            competition: match.competition
          }})}>
          <Text style={s.compLabel}>{match.competition}</Text>
          <View style={s.teams}>
            <Text style={s.team}>{match.home.name}</Text>
            <Text style={s.vs}>VS</Text>
            <Text style={s.team}>{match.away.name}</Text>
          </View>
          <Text style={s.tap}>Tap for probability analysis →</Text>
        </TouchableOpacity>
      ))}

      <Text style={s.disclaimer}>
        Probabilities are statistical estimates, not guaranteed outcomes. Data availability
        varies by competition and season.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#050b14" },
  container: { padding: 18, paddingBottom: 40 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  logo: { fontSize: 44 }, title: { color: "#fff", fontSize: 25, fontWeight: "900" },
  subtitle: { color: "#38bdf8", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  search: { backgroundColor: "#0d1828", borderWidth: 1, borderColor: "#1c3047",
    borderRadius: 14, padding: 15, color: "#fff", marginBottom: 22 },
  section: { color: "#9fb0c5", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginBottom: 10, marginTop: 8 },
  comp: { backgroundColor: "#0d1828", borderRadius: 12, width: 125, minHeight: 100,
    padding: 12, marginRight: 10, borderWidth: 1, borderColor: "#1b2b3e" },
  compIcon: { fontSize: 25, marginBottom: 8 }, compText: { color: "#e8eef7", fontWeight: "700", fontSize: 12 },
  status: { paddingVertical: 12 }, statusText: { color: "#64748b", fontSize: 12 },
  card: { backgroundColor: "#0d1828", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#1b2b3e" },
  compLabel: { color: "#38bdf8", fontSize: 11, fontWeight: "800", marginBottom: 14 },
  teams: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  team: { color: "#fff", fontWeight: "800", width: "40%", textAlign: "center" },
  vs: { color: "#64748b", fontWeight: "900" }, tap: { color: "#64748b", marginTop: 15, fontSize: 11 },
  disclaimer: { color: "#526277", fontSize: 11, lineHeight: 17, marginTop: 20 }
});
