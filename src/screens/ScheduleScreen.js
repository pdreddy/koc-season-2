import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SCHEDULE, PLAYOFFS, ALL_TEAMS } from '../data/schedule';
import { COLORS, SHADOWS } from '../theme';

export default function ScheduleScreen() {
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [pickerVisible, setPickerVisible] = useState(false);

  const teamOptions = ['All Teams', ...ALL_TEAMS];

  const visibleItems = SCHEDULE.filter((item) => {
    if (selectedTeam === 'All Teams') return true;
    if (item.isBreak) return false;
    const hasMatch = item.matches.some((m) => m.teams.includes(selectedTeam));
    const hasBye = item.bye === selectedTeam;
    return hasMatch || hasBye;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Filter */}
        <View style={[styles.card, SHADOWS.sm, { marginBottom: 12 }]}>
          <Text style={styles.sectionTitle}>Tournament Schedule</Text>
          <Text style={styles.sectionSub}>9 weeks · 9 teams · Round-robin format</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerVisible(true)}>
            <Text style={styles.pickerBtnText}>{selectedTeam} ▾</Text>
          </TouchableOpacity>
          {selectedTeam !== 'All Teams' && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSelectedTeam('All Teams')}>
              <Text style={styles.clearBtnText}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Weeks */}
        {visibleItems.map((item, idx) => {
          if (item.isBreak) {
            return (
              <View key={idx} style={styles.breakCard}>
                <Text style={styles.breakText}>{item.text}</Text>
                <Text style={styles.breakDates}>{item.dates}</Text>
              </View>
            );
          }
          return (
            <View key={item.week} style={[styles.weekCard, SHADOWS.sm]}>
              <View style={styles.weekHead}>
                <LinearGradient
                  colors={[COLORS.bg1, COLORS.bg2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.weekChip}
                >
                  <Text style={styles.weekChipText}>Week {item.week}</Text>
                </LinearGradient>
                <Text style={styles.weekDates}>{item.dates}</Text>
              </View>

              {item.matches.map((match, mIdx) => {
                const isFri = match.day === 'FRI';
                const isHighlighted =
                  selectedTeam !== 'All Teams' && match.teams.includes(selectedTeam);
                return (
                  <View
                    key={mIdx}
                    style={[
                      styles.matchRow,
                      isFri ? styles.matchFri : styles.matchSat,
                      isHighlighted && styles.matchHighlighted,
                      selectedTeam !== 'All Teams' && !match.teams.includes(selectedTeam) && styles.matchDimmed,
                    ]}
                  >
                    <View style={[styles.timeBox, isFri ? styles.timeFri : styles.timeSat]}>
                      <Text style={[styles.dayLabel, isFri ? styles.dayFri : styles.daySat]}>
                        {match.day}
                      </Text>
                      <Text style={styles.timeLabel}>{match.time}</Text>
                    </View>
                    <View style={styles.teamsBox}>
                      <Text style={styles.teamLabel}>
                        {match.teams[0]}{' '}
                        <Text style={styles.captLabel}>({match.captains[0]})</Text>
                      </Text>
                      <Text style={styles.vsLabel}>vs</Text>
                      <Text style={styles.teamLabel}>
                        {match.teams[1]}{' '}
                        <Text style={styles.captLabel}>({match.captains[1]})</Text>
                      </Text>
                    </View>
                  </View>
                );
              })}

              {(selectedTeam === 'All Teams' || item.bye === selectedTeam) && (
                <View style={styles.byeRow}>
                  <Text style={styles.byeText}>🛌 Bye: {item.bye}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Playoffs */}
        <View style={[styles.card, SHADOWS.sm, { marginTop: 8 }]}>
          <Text style={styles.playoffTitle}>🏆 Playoffs</Text>
          {PLAYOFFS.map((p, idx) => (
            <View key={idx} style={[styles.playoffCard, p.isFinal && styles.playoffFinal]}>
              <LinearGradient
                colors={p.isFinal ? ['#d69e2e', '#b7791f'] : [COLORS.bg1, COLORS.bg2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playoffHead}
              >
                <Text style={styles.playoffHeadText}>{p.name}</Text>
              </LinearGradient>
              <Text style={styles.playoffDate}>{p.date}</Text>
              <Text style={styles.playoffMatch}>{p.match}</Text>
              {p.win && (
                <View style={styles.tagRow}>
                  <View style={styles.tagWin}><Text style={styles.tagWinText}>{p.win}</Text></View>
                  {p.lose && <View style={styles.tagLose}><Text style={styles.tagLoseText}>{p.lose}</Text></View>}
                </View>
              )}
              {p.isFinal && (
                <View style={styles.tagRow}>
                  <View style={styles.tagWin}><Text style={styles.tagWinText}>🏆 Champion</Text></View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Team Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Team</Text>
            <FlatList
              data={teamOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, item === selectedTeam && styles.modalOptionActive]}
                  onPress={() => {
                    setSelectedTeam(item);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, item === selectedTeam && styles.modalOptionActiveText]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgScreen },
  scroll: { flex: 1 },
  container: { padding: 12, paddingBottom: 32 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center', color: COLORS.ink, marginBottom: 2 },
  sectionSub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginBottom: 10 },

  pickerBtn: {
    borderWidth: 2,
    borderColor: COLORS.ring,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerBtnText: { fontSize: 15, color: COLORS.ink, fontWeight: '600' },
  clearBtn: {
    marginTop: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  clearBtnText: { fontWeight: '700', color: COLORS.ink },

  weekCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  weekHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.ring,
  },
  weekChip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  weekChipText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  weekDates: { color: COLORS.muted, fontWeight: '700', fontSize: 13 },

  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 10,
    borderLeftWidth: 4,
    overflow: 'hidden',
    backgroundColor: '#f7fafc',
    gap: 8,
  },
  matchFri: { borderLeftColor: '#2563eb' },
  matchSat: { borderLeftColor: '#d97706' },
  matchHighlighted: { backgroundColor: '#e0f2fe' },
  matchDimmed: { opacity: 0.4 },

  timeBox: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 60,
    borderRadius: 6,
    margin: 6,
    backgroundColor: '#fff',
  },
  timeFri: {},
  timeSat: {},
  dayLabel: { fontSize: 12, fontWeight: '900' },
  dayFri: { color: '#2563eb' },
  daySat: { color: '#d97706' },
  timeLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },

  teamsBox: { flex: 1, paddingVertical: 8, paddingRight: 8 },
  teamLabel: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  captLabel: { fontSize: 12, fontWeight: '400', color: COLORS.muted },
  vsLabel: { fontSize: 12, fontWeight: '900', color: '#a0aec0', marginVertical: 2 },

  byeRow: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 8,
    margin: 10,
    marginTop: 6,
    alignItems: 'center',
  },
  byeText: { color: '#744210', fontWeight: '800', fontSize: 13 },

  breakCard: {
    backgroundColor: '#fed7d7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  breakText: { fontSize: 16, fontWeight: '900', color: '#742a2a', marginBottom: 4 },
  breakDates: { color: '#742a2a', fontWeight: '600' },

  playoffTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    color: COLORS.bg1,
    marginBottom: 12,
  },
  playoffCard: {
    borderWidth: 2,
    borderColor: COLORS.ring,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  playoffFinal: { borderColor: '#d69e2e' },
  playoffHead: { padding: 10 },
  playoffHeadText: { color: '#fff', fontWeight: '900', textAlign: 'center', fontSize: 15 },
  playoffDate: { textAlign: 'center', color: COLORS.muted, fontWeight: '700', padding: 6 },
  playoffMatch: { textAlign: 'center', fontWeight: '900', fontSize: 15, paddingBottom: 4, color: COLORS.ink },
  tagRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 10 },
  tagWin: { backgroundColor: '#c6f6d5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tagWinText: { color: '#22543d', fontWeight: '800', fontSize: 12 },
  tagLose: { backgroundColor: '#fed7d7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tagLoseText: { color: '#742a2a', fontWeight: '800', fontSize: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 12, color: COLORS.ink },
  modalOption: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.ring },
  modalOptionActive: { backgroundColor: '#e0e7ff' },
  modalOptionText: { fontSize: 15, color: COLORS.ink },
  modalOptionActiveText: { fontWeight: '800', color: COLORS.bg1 },
  modalClose: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.ring },
  modalCloseText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});
