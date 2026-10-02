import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { analyseMatch } from "../src/analysis";

export default function Analyse() {
  const { home = "Home", away = "Away", competition = "Football" } = useLocalSearchParams();

  const result = useMemo(() => analyseMatch(
    { name: home, attack: 1.08, defence: 1.06, form: ["W","D","W","L","W"], pointsPerGame: 1.9 },
    { name: away, attack: 1.03, defence: 1.02, form: ["W","D","L","W","D"], pointsPerGame: 1.7 },
    { knockout: String(competition).toLowerCase().includes("champions") }
  ), [home, away, competition]);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.container}>
      <Text style={s.comp}>{competition}</Text>
      <Text style={s.match}>{home}</Text>
      <Text style={s.vs}>vs</Text>
      <Text style={s.match}>{away}</Text>

      <View style={s.grid}>
        <Box label={home} value={`${result.homeWin}%`} />
        <Box label="Draw" value={`${result.draw}%`} />
        <Box label={away} value={`${result.awayWin}%`} />
      </View>

      <View style={s.panel}>
        <Text style={s.heading}>EXPECTED GOALS</Text>
        <Text style={s.xg}>{result.expectedGoals.home} — {result.expectedGoals.away}</Text>
        <Text style={s.note}>Estimated goal environment: {result.expectedGoals.total} total.</Text>
      </View>

      <View style={s.grid}>
        <Box label="BTTS" value={`${result.btts}%`} />
        <Box label="Over 2.5" value={`${result.over25}%`} />
        <Box label="Under 2.5" value={`${result.under25}%`} />
      </View>

      <View style={s.panel}>
        <Text style={s.heading}>MODEL CONFIDENCE</Text>
        <Text style={s.conf}>{result.confidence}%</Text>
        <Text style={s.note}>Confidence reflects separation in the model inputs; it is not a guarantee.</Text>
      </View>

      <View style={s.panel}>
        <Text style={s.heading}>MOST LIKELY SCORELINES</Text>
        {result.topScores.map(x => <View style={s.row} key={x.score}>
          <Text style={s.factor}>{x.score}</Text><Text style={s.included}>{x.probability}%</Text>
        </View>)}
      </View>

      <View style={s.panel}>
        <Text style={s.heading}>WHAT THE MODEL USES</Text>
        {result.factors.map(x => (
          <View style={s.row} key={x.label}>
            <Text style={s.factor}>{x.label}</Text>
            <Text style={s.included}>{x.value}</Text>
          </View>
        ))}
      </View>

      <View style={s.panel}>
        <Text style={s.heading}>PLANNED GLOBAL DATA LAYERS</Text>
        <Text style={s.note}>
          Fixtures • results • standings • home/away splits • goals • clean sheets •
          expected goals when available • lineups • injuries • suspensions • rest days •
          head-to-head • competition stage • venue • travel • weather when available.
        </Text>
      </View>
    </ScrollView>
  );
}

function Box({label, value}) {
  return <View style={s.box}><Text style={s.boxValue}>{value}</Text><Text style={s.boxLabel}>{label}</Text></View>
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#050b14" },
  container: { padding: 20, paddingBottom: 50 },
  comp: { color: "#38bdf8", fontWeight: "800", fontSize: 12, marginBottom: 22 },
  match: { color: "#fff", fontSize: 27, fontWeight: "900", textAlign: "center" },
  vs: { color: "#64748b", textAlign: "center", marginVertical: 6, fontWeight: "900" },
  grid: { flexDirection: "row", gap: 8, marginTop: 28 },
  box: { flex: 1, backgroundColor: "#0d1828", borderRadius: 15, padding: 15, alignItems: "center",
    borderWidth: 1, borderColor: "#1b2b3e" },
  boxValue: { color: "#fff", fontSize: 22, fontWeight: "900" },
  boxLabel: { color: "#8ea0b7", fontSize: 11, marginTop: 6, textAlign: "center" },
  panel: { backgroundColor: "#0d1828", borderRadius: 16, padding: 17, marginTop: 14,
    borderWidth: 1, borderColor: "#1b2b3e" },
  heading: { color: "#9fb0c5", fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 10 },
  conf: { color: "#38bdf8", fontSize: 34, fontWeight: "900" },
  xg: { color: "#fff", fontSize: 30, fontWeight: "900", marginBottom: 5 },
  note: { color: "#718198", lineHeight: 19, fontSize: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#162438" },
  factor: { color: "#e5edf7", fontSize: 13 }, included: { color: "#7dd3fc", fontSize: 12 }
});
