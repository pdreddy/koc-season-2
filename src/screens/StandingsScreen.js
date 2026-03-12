import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, onValue, push, remove, child } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, MATCHES_REF } from '../firebase';
import { TEAMS } from '../data/teams';
import { COLORS, SHADOWS } from '../theme';

const TEAM_NAMES = TEAMS.map((t) => t.name);
const ABBR_MAP = {};
TEAMS.forEach((t) => {
  ABBR_MAP[t.abbreviation.toUpperCase()] = t.name;
  if (t.abbreviation === 'CC') ABBR_MAP['COCO'] = t.name;
});

const ACCESS_CODE = 'KOCPO#2';

// ── Score Parser ─────────────────────────────────────────────────────────────
function parseScores(scoresStr) {
  const sets = [];
  const pattern = /(\d+)-(\d+)(?:\((\d+)-(\d+)\))?/g;
  let m;
  while ((m = pattern.exec(scoresStr)) !== null) {
    const set = { left: parseInt(m[1]), right: parseInt(m[2]) };
    if (m[3] && m[4]) set.tiebreak = { left: parseInt(m[3]), right: parseInt(m[4]) };
    sets.push(set);
  }
  return sets;
}

function parseLine(line, t1, t2, a1, a2) {
  const typeMatch = line.match(/^(S(?:ingles)?|D(?:oubles)?\s*\d?)[\s:]+/i);
  let remainder = line;
  let isDoubles = true;
  if (typeMatch) {
    isDoubles = typeMatch[1].toUpperCase().startsWith('D');
    remainder = line.slice(typeMatch[0].length).trim();
  }
  const wonMatch = remainder.match(/\(won\)\s*(\w+)\s*\.?\s*$/i);
  if (!wonMatch) throw new Error('Must include (won) ABBR');
  const winnerAbbr = wonMatch[1].toUpperCase();
  remainder = remainder.slice(0, wonMatch.index).trim();
  let winnerTeamNum = null;
  if (winnerAbbr === a1 || ABBR_MAP[winnerAbbr] === t1) winnerTeamNum = 1;
  else if (winnerAbbr === a2 || ABBR_MAP[winnerAbbr] === t2) winnerTeamNum = 2;
  else throw new Error(`Winner "${winnerAbbr}" doesn't match ${a1} or ${a2}`);

  const vsMatch = remainder.match(/\s+vs\.?\s+/i);
  if (!vsMatch) throw new Error('Must include "vs" between players');
  const leftSide = remainder.slice(0, vsMatch.index).trim();
  const rightSide = remainder.slice(vsMatch.index + vsMatch[0].length).trim();
  const leftPlayers = leftSide.split('/').map((p) => p.trim()).filter(Boolean);
  const scoreStart = rightSide.match(/\s+(\d+-\d+)/);
  if (!scoreStart) throw new Error('Could not find scores');
  const rightPlayersStr = rightSide.slice(0, scoreStart.index).trim();
  const scoresStr = rightSide.slice(scoreStart.index).trim();
  const rightPlayers = rightPlayersStr.split('/').map((p) => p.trim()).filter(Boolean);
  if (leftPlayers.length === 1 && rightPlayers.length === 1) isDoubles = false;
  if (leftPlayers.length === 2 && rightPlayers.length === 2) isDoubles = true;

  const setsData = parseScores(scoresStr);
  let g1 = 0, g2 = 0, s1 = 0, s2 = 0;
  const setsOut = [];
  setsData.forEach((s, i) => {
    g1 += s.left; g2 += s.right;
    if (s.left > s.right) s1++;
    else if (s.right > s.left) s2++;
    else if (s.tiebreak) {
      if (s.tiebreak.left > s.tiebreak.right) { s1++; g1++; } else { s2++; g2++; }
    }
    const sd = { set: i + 1, team1: s.left, team2: s.right };
    if (s.tiebreak) sd.tieBreak = { team1: s.tiebreak.left, team2: s.tiebreak.right };
    setsOut.push(sd);
  });
  return {
    label: isDoubles ? 'Doubles' : 'Singles',
    type: isDoubles ? 'doubles' : 'singles',
    players: { team1: leftPlayers.map((p) => p.toUpperCase()), team2: rightPlayers.map((p) => p.toUpperCase()) },
    sets: setsOut, g1, g2, sets1: s1, sets2: s2, winnerTeamNum,
  };
}

function parseScoreText(text) {
  const results = [], errors = [];
  const rawLines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (!rawLines.length) return { results: [], errors: [], team1: null, team2: null };
  let team1 = null, team2 = null, startLine = 0;
  const teamsMatch = rawLines[0].match(/^(\w+)\s+vs\.?\s+(\w+)$/i);
  if (teamsMatch) {
    const n1 = ABBR_MAP[teamsMatch[1].toUpperCase()];
    const n2 = ABBR_MAP[teamsMatch[2].toUpperCase()];
    team1 = n1 ? { name: n1, abbreviation: teamsMatch[1].toUpperCase() } : null;
    team2 = n2 ? { name: n2, abbreviation: teamsMatch[2].toUpperCase() } : null;
    if (!n1) errors.push(`Unknown team: ${teamsMatch[1]}`);
    if (!n2) errors.push(`Unknown team: ${teamsMatch[2]}`);
    startLine = 1;
  } else {
    errors.push('First line should be: TEAM1 vs TEAM2 (e.g., SK vs RR)');
    return { results: [], errors, team1: null, team2: null };
  }
  if (!team1 || !team2) return { results: [], errors, team1: null, team2: null };
  const a1 = team1.abbreviation, a2 = team2.abbreviation;
  const merged = [];
  for (let i = startLine; i < rawLines.length; i++) {
    const line = rawLines[i];
    const isScoreOnly = /^[\d\-\(\),\s]+\(won\)/i.test(line);
    if (isScoreOnly && merged.length > 0) merged[merged.length - 1] += ' ' + line;
    else if (/^(S|D\d?|Singles|Doubles\s*\d?)[\s:]/i.test(line) || line.match(/vs/i)) merged.push(line);
  }
  let dCount = 0, sCount = 0;
  merged.forEach((line, i) => {
    try {
      const parsed = parseLine(line, team1.name, team2.name, a1, a2);
      if (parsed.type === 'doubles') { dCount++; parsed.label = `Doubles ${dCount}`; }
      else { sCount++; parsed.label = `Singles ${sCount}`; }
      results.push(parsed);
    } catch (err) { errors.push(`Line ${i + 1 + startLine}: ${err.message}`); }
  });
  return { results, errors, team1, team2 };
}

// ── Standings computation ─────────────────────────────────────────────────────
function computeStandings(matches) {
  const stats = {};
  TEAM_NAMES.forEach((n) => {
    stats[n] = { team: n, matches: 0, wins: 0, losses: 0, setsFor: 0, setsAgainst: 0, gamesFor: 0, gamesAgainst: 0, points: 0 };
  });
  matches.forEach((m) => {
    if (!stats[m.t1] || !stats[m.t2]) return;
    stats[m.t1].matches++; stats[m.t2].matches++;
    stats[m.t1].gamesFor += m.g1; stats[m.t1].gamesAgainst += m.g2;
    stats[m.t2].gamesFor += m.g2; stats[m.t2].gamesAgainst += m.g1;
    stats[m.t1].setsFor += m.s1 || 0; stats[m.t1].setsAgainst += m.s2 || 0;
    stats[m.t2].setsFor += m.s2 || 0; stats[m.t2].setsAgainst += m.s1 || 0;
    if (m.win === m.t1) { stats[m.t1].wins++; stats[m.t2].losses++; stats[m.t1].points++; }
    else if (m.win === m.t2) { stats[m.t2].wins++; stats[m.t1].losses++; stats[m.t2].points++; }
  });
  return Object.values(stats).sort((a, b) =>
    (b.points - a.points) || (b.setsFor - b.setsAgainst - (a.setsFor - a.setsAgainst)) ||
    (b.setsFor - a.setsFor) || (b.gamesFor - b.gamesAgainst - (a.gamesFor - a.gamesAgainst)) ||
    (b.gamesFor - a.gamesFor) || a.team.localeCompare(b.team)
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StandingsScreen() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [scoreText, setScoreText] = useState('');
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [preview, setPreview] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const matchesRef = ref(db, MATCHES_REF);

  useEffect(() => {
    signInAnonymously(auth).then(() => setAuthReady(true)).catch(() => {});
    const unsub = onValue(matchesRef, (snap) => {
      const data = snap.val();
      const list = [];
      if (data) {
        Object.entries(data).forEach(([id, entry]) => {
          if (entry && entry.t1 && entry.t2) list.push({ ...entry, id, g1: Number(entry.g1) || 0, g2: Number(entry.g2) || 0, s1: Number(entry.s1) || 0, s2: Number(entry.s2) || 0 });
        });
      }
      setMatches(list.sort((a, b) => (b.ts || 0) - (a.ts || 0)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const handleUnlock = () => {
    if (accessCode.trim() === ACCESS_CODE) {
      setUnlocked(true);
      setAccessCode('');
      Alert.alert('✅', 'Scoring unlocked!');
    } else {
      Alert.alert('❌', 'Invalid access code');
    }
  };

  const handlePreview = (text) => {
    setScoreText(text);
    if (!text.trim()) { setPreview(null); return; }
    const { results, errors, team1, team2 } = parseScoreText(text);
    setPreview({ results, errors, team1, team2 });
  };

  const handleSubmit = async () => {
    if (!preview || preview.errors.length > 0) {
      Alert.alert('⚠️', 'Fix errors before submitting:\n' + (preview?.errors || []).join('\n'));
      return;
    }
    const { results, team1, team2 } = preview;
    if (!team1 || !team2 || !results.length) {
      Alert.alert('⚠️', 'No valid scores found.');
      return;
    }
    let totalG1 = 0, totalG2 = 0, totalS1 = 0, totalS2 = 0, courts1 = 0, courts2 = 0;
    results.forEach((r) => {
      totalG1 += r.g1; totalG2 += r.g2; totalS1 += r.sets1; totalS2 += r.sets2;
      if (r.winnerTeamNum === 1) courts1++; else courts2++;
    });
    if (courts1 === courts2) { Alert.alert('⚠️', 'Match is tied. Check scores.'); return; }
    const winner = courts1 > courts2 ? team1.name : team2.name;
    const lines = results.map((r) => ({
      label: r.label, type: r.type, g1: r.g1, g2: r.g2,
      sets: r.sets, setWins: { team1: r.sets1, team2: r.sets2 },
      players: { team1: r.players.team1, team2: r.players.team2 },
    }));
    const record = { t1: team1.name, t2: team2.name, g1: totalG1, g2: totalG2, s1: totalS1, s2: totalS2, win: winner, ts: Date.now(), lines };
    try {
      await push(matchesRef, record);
      setScoreText('');
      setPreview(null);
      setScoreModalVisible(false);
      Alert.alert('✅ Saved', `${team1.name} ${totalG1}-${totalG2} ${team2.name}\nCourts: ${courts1}-${courts2}\nWinner: ${winner}`);
    } catch (err) {
      Alert.alert('❌', 'Save failed: ' + err.message);
    }
  };

  const handleUndo = async () => {
    if (!matches.length) { Alert.alert('Nothing to undo'); return; }
    const last = matches[0];
    Alert.alert('Undo last match?', `${last.t1} ${last.g1}-${last.g2} ${last.t2}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Undo', style: 'destructive',
        onPress: async () => {
          try { await remove(child(matchesRef, last.id)); }
          catch (err) { Alert.alert('❌', err.message); }
        },
      },
    ]);
  };

  const standings = computeStandings(matches);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Tournament Standings</Text>
          <Text style={styles.pageSub}>Live rankings · Match points · Firebase-backed</Text>
        </View>

        {/* Access / Score Entry */}
        {!unlocked ? (
          <View style={[styles.card, SHADOWS.sm, styles.accessCard]}>
            <Text style={styles.cardTitle}>🔒 Score Entry Access</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter access code"
              secureTextEntry
              value={accessCode}
              onChangeText={setAccessCode}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUnlock}>
              <LinearGradient colors={[COLORS.bg1, COLORS.bg2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                <Text style={styles.btnText}>Unlock Scoring</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.hint}>Captains: enter the secure access code provided by the organizers.</Text>
          </View>
        ) : (
          <View style={[styles.card, SHADOWS.sm]}>
            <Text style={styles.cardTitle}>📝 Score Entry</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.halfBtn} onPress={() => setScoreModalVisible(true)}>
                <LinearGradient colors={[COLORS.bg1, COLORS.bg2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                  <Text style={styles.btnText}>Enter Scores</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.halfBtn, styles.warnBtn]} onPress={handleUndo}>
                <Text style={[styles.btnText, { color: COLORS.ink }]}>Undo Last</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.halfBtn, styles.lockBtn]} onPress={() => setUnlocked(false)}>
                <Text style={styles.btnText}>Lock</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Standings Table */}
        <View style={[styles.card, SHADOWS.sm]}>
          <Text style={styles.cardTitle}>📊 Current Standings</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.bg1} style={{ padding: 20 }} />
          ) : (
            <>
              <View style={styles.tableHead}>
                {['#', 'Team', 'M', 'W', 'L', 'SF', 'GF', 'Pts'].map((h) => (
                  <Text key={h} style={[styles.th, h === 'Team' && styles.thTeam]}>{h}</Text>
                ))}
              </View>
              {standings.map((row, i) => (
                <View key={row.team} style={[styles.tableRow, i < 4 && styles.qualifiedRow, i % 2 === 1 && styles.altRow]}>
                  <Text style={[styles.td, styles.tdNum]}>{i + 1}</Text>
                  <Text style={[styles.td, styles.tdTeam]} numberOfLines={1}>{row.team}</Text>
                  <Text style={[styles.td, styles.tdNum]}>{row.matches}</Text>
                  <Text style={[styles.td, styles.tdNum]}>{row.wins}</Text>
                  <Text style={[styles.td, styles.tdNum]}>{row.losses}</Text>
                  <Text style={[styles.td, styles.tdNum]}>{row.setsFor}</Text>
                  <Text style={[styles.td, styles.tdNum]}>{row.gamesFor}</Text>
                  <Text style={[styles.td, styles.tdPts]}>{row.points}</Text>
                </View>
              ))}
              {!matches.length && (
                <Text style={styles.noData}>No results yet.</Text>
              )}
              <Text style={styles.hint}>Top 4 (green) qualify for playoffs. Sorted by Points → Sets → Games.</Text>
            </>
          )}
        </View>

        {/* Match History */}
        <View style={[styles.card, SHADOWS.sm]}>
          <Text style={styles.cardTitle}>📜 Match History</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.bg1} style={{ padding: 20 }} />
          ) : !matches.length ? (
            <Text style={styles.noData}>No matches yet.</Text>
          ) : (
            matches.map((m, idx) => (
              <View key={m.id} style={styles.historyRow}>
                <View style={styles.historyMeta}>
                  <Text style={styles.historyNum}>{matches.length - idx}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTeams}>{m.t1} vs {m.t2}</Text>
                    <Text style={styles.historyScore}>
                      Games: {m.g1}-{m.g2}
                      {(m.s1 + m.s2) > 0 ? `  Sets: ${m.s1}-${m.s2}` : ''}
                    </Text>
                    <Text style={styles.historyWinner}>🏆 {m.win}</Text>
                  </View>
                  <Text style={styles.historyDate}>
                    {m.ts ? new Date(m.ts).toLocaleDateString() : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Score Entry Modal */}
      <Modal visible={scoreModalVisible} animationType="slide" onRequestClose={() => setScoreModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Enter Match Scores</Text>
              <TouchableOpacity onPress={() => setScoreModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalBody}>
              <Text style={styles.formatGuide}>
                Format:{'\n'}Line 1: SK vs RR{'\n'}S: Player1 vs Player2 4-2,4-1 (won) SK{'\n'}D1: P1/P2 vs P3/P4 4-2,2-4,4-3(10-7) (won) RR
              </Text>
              <TextInput
                style={styles.scoreInput}
                multiline
                placeholder="Paste match results here..."
                value={scoreText}
                onChangeText={handlePreview}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {preview && (
                <View style={styles.previewBox}>
                  <Text style={styles.previewTitle}>Preview</Text>
                  {preview.errors.map((e, i) => (
                    <Text key={i} style={styles.previewError}>❌ {e}</Text>
                  ))}
                  {preview.team1 && preview.team2 && preview.results.length > 0 && (() => {
                    let g1 = 0, g2 = 0, c1 = 0, c2 = 0;
                    preview.results.forEach((r) => { g1 += r.g1; g2 += r.g2; if (r.winnerTeamNum === 1) c1++; else c2++; });
                    return (
                      <>
                        <Text style={styles.previewTotal}>
                          {preview.team1.name} {g1}-{g2} {preview.team2.name} · Courts: {c1}-{c2} · Winner: {c1 > c2 ? preview.team1.name : preview.team2.name}
                        </Text>
                        {preview.results.map((r, i) => (
                          <Text key={i} style={styles.previewLine}>
                            ✅ {r.label}: {r.players.team1.join('/')} vs {r.players.team2.join('/')} ({r.g1}-{r.g2})
                          </Text>
                        ))}
                      </>
                    );
                  })()}
                </View>
              )}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                  <Text style={styles.btnText}>Save Match Result</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearInputBtn} onPress={() => { setScoreText(''); setPreview(null); }}>
                <Text style={styles.clearInputBtnText}>Clear Input</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgScreen },
  container: { padding: 12, paddingBottom: 32 },

  pageHeader: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.accent, alignItems: 'center', ...SHADOWS.sm,
  },
  pageTitle: { fontSize: 22, fontWeight: '900', color: COLORS.ink, marginBottom: 4 },
  pageSub: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },

  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 12 },
  accessCard: { borderWidth: 2, borderColor: COLORS.accent },
  cardTitle: { fontSize: 16, fontWeight: '900', color: COLORS.ink, marginBottom: 12 },

  input: {
    borderWidth: 2, borderColor: COLORS.ring, borderRadius: 8, padding: 12,
    fontSize: 15, marginBottom: 10,
  },
  hint: { fontSize: 12, color: COLORS.muted, marginTop: 8, textAlign: 'center' },

  primaryBtn: { borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  btnGrad: { padding: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  btnRow: { flexDirection: 'row', gap: 8 },
  halfBtn: { flex: 1, borderRadius: 8, overflow: 'hidden' },
  warnBtn: { backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', padding: 13 },
  lockBtn: { backgroundColor: '#64748b', justifyContent: 'center', alignItems: 'center', padding: 13 },

  tableHead: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 6, padding: 8, marginBottom: 4 },
  th: { color: '#fff', fontWeight: '700', fontSize: 12, width: 32, textAlign: 'center' },
  thTeam: { flex: 1, textAlign: 'left' },

  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 4, borderRadius: 6, alignItems: 'center' },
  qualifiedRow: { backgroundColor: '#d1fae5' },
  altRow: { backgroundColor: '#f8fafc' },
  td: { fontSize: 13, width: 32, textAlign: 'center', color: COLORS.ink },
  tdNum: { width: 32, textAlign: 'center' },
  tdTeam: { flex: 1, textAlign: 'left', fontWeight: '700' },
  tdPts: { width: 32, textAlign: 'center', fontWeight: '900', color: COLORS.bg1 },

  noData: { textAlign: 'center', color: COLORS.muted, padding: 16, fontStyle: 'italic' },

  historyRow: { borderBottomWidth: 1, borderBottomColor: COLORS.ring, paddingVertical: 10 },
  historyMeta: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  historyNum: { fontWeight: '900', color: COLORS.bg1, fontSize: 14, minWidth: 20 },
  historyTeams: { fontWeight: '800', fontSize: 14, color: COLORS.ink, marginBottom: 2 },
  historyScore: { fontSize: 13, color: COLORS.muted },
  historyWinner: { fontSize: 13, fontWeight: '700', color: '#059669', marginTop: 2 },
  historyDate: { fontSize: 11, color: COLORS.muted, marginTop: 2 },

  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.ring,
  },
  modalTitle: { fontSize: 17, fontWeight: '900', color: COLORS.ink },
  modalClose: { fontSize: 20, color: COLORS.muted, padding: 4 },
  modalBody: { padding: 16, paddingBottom: 40 },

  formatGuide: {
    backgroundColor: '#ecfeff', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#a5f3fc', fontSize: 12,
    color: '#155e75', marginBottom: 12, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreInput: {
    borderWidth: 2, borderColor: COLORS.ring, borderRadius: 8, padding: 12,
    fontSize: 14, minHeight: 160, textAlignVertical: 'top', marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  previewBox: {
    backgroundColor: '#f8fafc', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: COLORS.ring, marginBottom: 12,
  },
  previewTitle: { fontWeight: '900', fontSize: 14, marginBottom: 6, color: COLORS.ink },
  previewError: { color: '#991b1b', fontSize: 13, marginBottom: 4 },
  previewTotal: {
    backgroundColor: '#d1fae5', borderRadius: 6, padding: 8, fontSize: 13,
    fontWeight: '700', marginBottom: 6, color: '#065f46',
  },
  previewLine: { fontSize: 13, color: '#065f46', marginBottom: 3 },
  submitBtn: { borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  clearInputBtn: {
    borderWidth: 2, borderColor: COLORS.ring, borderRadius: 8, padding: 13, alignItems: 'center',
  },
  clearInputBtnText: { fontWeight: '700', color: COLORS.ink },
});
