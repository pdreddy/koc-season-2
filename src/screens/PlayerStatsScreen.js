import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, onValue } from 'firebase/database';
import { db, MATCHES_REF } from '../firebase';
import { COLORS, SHADOWS } from '../theme';

const TABS = ['Player Stats', 'Singles Cap', 'Doubles Combos'];

function Badge({ color, text }) {
  const bgMap = { green: '#d1fae5', yellow: '#fef3c7', red: '#fee2e2' };
  const fgMap = { green: '#065f46', yellow: '#92400e', red: '#991b1b' };
  return (
    <View style={[styles.badge, { backgroundColor: bgMap[color] }]}>
      <Text style={[styles.badgeText, { color: fgMap[color] }]}>{text}</Text>
    </View>
  );
}

function TeamBadge({ name }) {
  return (
    <View style={styles.teamBadge}>
      <Text style={styles.teamBadgeText} numberOfLines={1}>{name}</Text>
    </View>
  );
}

export default function PlayerStatsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerData, setPlayerData] = useState([]);
  const [singlesData, setSinglesData] = useState([]);
  const [doublesData, setDoublesData] = useState([]);

  useEffect(() => {
    const unsub = onValue(
      ref(db, MATCHES_REF),
      (snap) => {
        const data = snap.val();
        if (!data) { setError('No data found'); setLoading(false); return; }
        processData(data);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return () => unsub();
  }, []);

  function processData(data) {
    const players = {};
    const doubles = {};
    const playerTeamMap = {};

    // Build player → team map
    Object.values(data).forEach((match) => {
      if (!match.lines) return;
      const t1 = match.t1 || 'Unknown', t2 = match.t2 || 'Unknown';
      match.lines.forEach((line) => {
        (line.players?.team1 || []).forEach((p) => { if (!playerTeamMap[p]) playerTeamMap[p] = t1; });
        (line.players?.team2 || []).forEach((p) => { if (!playerTeamMap[p]) playerTeamMap[p] = t2; });
      });
    });

    // Process stats
    Object.entries(data).forEach(([matchId, match]) => {
      if (!match.lines) return;
      match.lines.forEach((line) => {
        const t1players = line.players?.team1 || [];
        const t2players = line.players?.team2 || [];
        const g1 = line.g1 || 0, g2 = line.g2 || 0;
        const t1won = g1 > g2;

        t1players.concat(t2players).forEach((p) => {
          if (!players[p]) {
            players[p] = { courtsWon: 0, courtsLost: 0, matchDays: new Set(), singles: 0, doubles: 0, team: playerTeamMap[p] || 'Unknown' };
          }
          players[p].matchDays.add(matchId);
          const won = t1players.includes(p) ? t1won : !t1won;
          won ? players[p].courtsWon++ : players[p].courtsLost++;
          if (line.type === 'singles') players[p].singles++;
          else if (line.type === 'doubles') players[p].doubles++;
        });

        // Doubles combos
        if (line.type === 'doubles' && t1players.length === 2 && t2players.length === 2) {
          [t1players, t2players].forEach((team, idx) => {
            const key = [...team].sort().join(' & ');
            if (!doubles[key]) {
              doubles[key] = { w: 0, l: 0, matchDays: new Set(), teams: team.map((p) => playerTeamMap[p] || 'Unknown') };
            }
            doubles[key].matchDays.add(matchId);
            const won = idx === 0 ? t1won : !t1won;
            won ? doubles[key].w++ : doubles[key].l++;
          });
        }
      });
    });

    // Build sorted arrays
    const pArr = Object.entries(players).map(([name, d]) => ({
      name, team: d.team,
      matchDays: d.matchDays.size,
      totalCourts: d.courtsWon + d.courtsLost,
      courtsWon: d.courtsWon, courtsLost: d.courtsLost,
      singles: d.singles, doubles: d.doubles,
      maxed: d.matchDays.size >= 6,
    })).sort((a, b) => b.matchDays - a.matchDays || b.totalCourts - a.totalCourts);

    const sArr = Object.entries(players).map(([name, d]) => ({
      name, team: d.team,
      matchDays: d.matchDays.size,
      singles: d.singles, doubles: d.doubles,
      totalCourts: d.courtsWon + d.courtsLost,
      singlesMaxed: d.singles >= 3,
      matchMaxed: d.matchDays.size >= 6,
    })).sort((a, b) => {
      if (a.singlesMaxed && !b.singlesMaxed) return -1;
      if (b.singlesMaxed && !a.singlesMaxed) return 1;
      return b.matchDays - a.matchDays || b.singles - a.singles;
    });

    const dArr = Object.entries(doubles).map(([key, d]) => ({
      key, w: d.w, l: d.l, matchDays: d.matchDays.size,
      total: d.w + d.l, teams: [...new Set(d.teams)].join(' / '),
      maxed: d.matchDays.size >= 3,
    })).sort((a, b) => {
      if (a.maxed && !b.maxed) return -1;
      if (b.maxed && !a.maxed) return 1;
      return b.total - a.total;
    });

    setPlayerData(pArr);
    setSinglesData(sArr);
    setDoublesData(dArr);
  }

  const filterText = search.toLowerCase();

  const filteredPlayers = playerData.filter(
    (x) => x.name.toLowerCase().includes(filterText) || x.team.toLowerCase().includes(filterText)
  );
  const filteredSingles = singlesData.filter(
    (x) => x.name.toLowerCase().includes(filterText) || x.team.toLowerCase().includes(filterText)
  );
  const filteredDoubles = doublesData.filter(
    (x) => x.key.toLowerCase().includes(filterText) || x.teams.toLowerCase().includes(filterText)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === i && styles.tabBtnActive]}
            onPress={() => { setActiveTab(i); setSearch(''); }}
          >
            <Text style={[styles.tabBtnText, activeTab === i && styles.tabBtnTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 2 ? '🔍 Search combo or team...' : '🔍 Search player or team...'}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.bg1} style={{ flex: 1 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* ── Player Stats ────────────────────────────────────── */}
          {activeTab === 0 && (
            <View style={[styles.card, SHADOWS.sm]}>
              <Text style={styles.cardTitle}>Complete Player Statistics</Text>
              <View style={styles.tableHead}>
                {['Player', 'Team', 'Days', 'Cts', 'W', 'L', 'S', 'D', 'Win%'].map((h) => (
                  <Text key={h} style={[styles.th, h === 'Player' && styles.thWide, h === 'Team' && styles.thTeamH]}>{h}</Text>
                ))}
              </View>
              {filteredPlayers.length === 0 ? (
                <Text style={styles.noData}>No player data</Text>
              ) : (
                filteredPlayers.map((x, i) => {
                  const pct = x.totalCourts > 0 ? Math.round((x.courtsWon / x.totalCourts) * 100) : 0;
                  const color = pct >= 60 ? 'green' : pct >= 40 ? 'yellow' : 'red';
                  return (
                    <View key={x.name} style={[styles.tableRow, x.maxed && styles.maxedRow, i % 2 === 1 && styles.altRow]}>
                      <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>{x.name}</Text>
                      <Text style={[styles.td, styles.tdTeam]} numberOfLines={1}>{x.team.split(' ').map((w) => w[0]).join('')}</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.matchDays}</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.totalCourts}</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.courtsWon}</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.courtsLost}</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.singles}</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.doubles}</Text>
                      <Badge color={color} text={`${pct}%`} />
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ── Singles Cap ─────────────────────────────────────── */}
          {activeTab === 1 && (
            <View style={[styles.card, SHADOWS.sm]}>
              <Text style={styles.cardTitle}>Singles Cap Tracker (Limit: 3 match days)</Text>
              <View style={styles.tableHead}>
                {['Player', 'Team', 'Days', 'S', 'D', 'Cts', 'Status'].map((h) => (
                  <Text key={h} style={[styles.th, h === 'Player' && styles.thWide, h === 'Status' && styles.thStatus]}>{h}</Text>
                ))}
              </View>
              {filteredSingles.length === 0 ? (
                <Text style={styles.noData}>No player data</Text>
              ) : (
                filteredSingles.map((x, i) => {
                  const status = x.singlesMaxed ? 'MAXED' : `${3 - x.singles} left`;
                  const color = x.singlesMaxed ? 'red' : x.singles >= 2 ? 'yellow' : 'green';
                  return (
                    <View key={x.name} style={[styles.tableRow, (x.singlesMaxed || x.matchMaxed) && styles.maxedRow, i % 2 === 1 && styles.altRow]}>
                      <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>{x.name}</Text>
                      <Text style={[styles.td, styles.tdTeam]} numberOfLines={1}>{x.team.split(' ').map((w) => w[0]).join('')}</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.matchDays}</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.singles}/3</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.doubles}</Text>
                      <Text style={[styles.td, styles.tdNum]}>{x.totalCourts}</Text>
                      <Badge color={color} text={status} />
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ── Doubles Combos ──────────────────────────────────── */}
          {activeTab === 2 && (
            <View style={[styles.card, SHADOWS.sm]}>
              <Text style={styles.cardTitle}>Doubles Partnerships (Limit: 3 match days)</Text>
              {filteredDoubles.length === 0 ? (
                <Text style={styles.noData}>No doubles data</Text>
              ) : (
                filteredDoubles.map((x) => {
                  const pct = x.total > 0 ? Math.round((x.w / x.total) * 100) : 0;
                  const color = pct >= 60 ? 'green' : pct >= 40 ? 'yellow' : 'red';
                  return (
                    <View key={x.key} style={[styles.comboCard, x.maxed && styles.comboMaxed]}>
                      <View style={styles.comboHeader}>
                        <Text style={styles.comboName} numberOfLines={2}>{x.key}</Text>
                        {x.maxed && <Badge color="red" text="MAXED" />}
                      </View>
                      <TeamBadge name={x.teams} />
                      <View style={styles.comboStats}>
                        <Text style={styles.statItem}>Days: <Text style={styles.statBold}>{x.matchDays}</Text>/3</Text>
                        <Text style={styles.statItem}>Courts: <Text style={styles.statBold}>{x.total}</Text></Text>
                        <Text style={styles.statItem}>Record: <Text style={styles.statBold}>{x.w}-{x.l}</Text></Text>
                        <Badge color={color} text={`${pct}%`} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgScreen },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ring,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: COLORS.bg1 },
  tabBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.muted, textAlign: 'center' },
  tabBtnTextActive: { color: '#fff' },

  searchBar: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.ring },
  searchInput: {
    borderWidth: 2, borderColor: COLORS.ring, borderRadius: 8,
    padding: 10, fontSize: 14,
  },

  scrollContent: { padding: 12, paddingBottom: 32 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: COLORS.bg1, marginBottom: 12 },

  tableHead: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4 },
  th: { color: '#fff', fontWeight: '700', fontSize: 11, width: 28, textAlign: 'center' },
  thWide: { flex: 1, textAlign: 'left' },
  thTeamH: { width: 36, textAlign: 'center' },
  thStatus: { width: 52 },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 6 },
  altRow: { backgroundColor: '#f8fafc' },
  maxedRow: { backgroundColor: '#fee2e2' },
  td: { fontSize: 12, width: 28, textAlign: 'center', color: COLORS.ink },
  tdWide: { flex: 1, textAlign: 'left', fontWeight: '700' },
  tdTeam: { width: 36, textAlign: 'center', color: COLORS.muted, fontSize: 11 },
  tdNum: { width: 28, textAlign: 'center' },

  noData: { textAlign: 'center', color: COLORS.muted, padding: 16, fontStyle: 'italic' },
  errorText: { textAlign: 'center', color: '#991b1b', padding: 20, fontSize: 14 },

  badge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  teamBadge: { backgroundColor: '#e0e7ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  teamBadgeText: { color: '#3730a3', fontSize: 11, fontWeight: '600' },

  comboCard: {
    backgroundColor: '#f8fafc', borderRadius: 8, padding: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.bg2, marginBottom: 10,
  },
  comboMaxed: { backgroundColor: '#fee2e2', borderLeftColor: '#dc2626' },
  comboHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  comboName: { fontWeight: '800', color: COLORS.ink, fontSize: 14, flex: 1, marginRight: 8 },
  comboStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 8 },
  statItem: { fontSize: 13, color: '#64748b' },
  statBold: { fontWeight: '800', color: COLORS.ink, fontSize: 14 },
});
