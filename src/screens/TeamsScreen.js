import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TEAMS } from '../data/teams';
import { TEAM_COLORS, COLORS, SHADOWS } from '../theme';

export default function TeamsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Tournament Teams</Text>
          <Text style={styles.pageSub}>9 teams · 7 players each · competing for the championship</Text>
        </View>

        {TEAMS.map((team, index) => (
          <View key={team.id} style={[styles.teamCard, SHADOWS.md]}>
            <LinearGradient
              colors={TEAM_COLORS[index]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.teamHeader}
            >
              <Text style={styles.teamName}>
                {team.name} – {team.abbreviation}
              </Text>
            </LinearGradient>
            <View style={styles.playerList}>
              {team.players.map((player, pIdx) => (
                <View
                  key={pIdx}
                  style={[styles.playerRow, pIdx < team.players.length - 1 && styles.playerBorder, player.isCaptain && styles.captainRow]}
                >
                  <View style={[styles.playerBadge, player.isCaptain && styles.captainBadge]}>
                    <Text style={styles.playerBadgeText}>{player.isCaptain ? '🏆' : '🎾'}</Text>
                  </View>
                  <Text style={[styles.playerName, player.isCaptain && styles.captainName]}>
                    {player.name}
                    {player.isCaptain ? '  (Captain)' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>😏 Play Fair, Win Big, Party Hard! 🎾🏆</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgScreen },
  scroll: { flex: 1 },
  container: { padding: 12, paddingBottom: 32 },

  pageHeader: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  pageTitle: { fontSize: 22, fontWeight: '900', color: COLORS.ink, marginBottom: 4 },
  pageSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center' },

  teamCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  teamHeader: {
    padding: 14,
    alignItems: 'center',
  },
  teamName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },

  playerList: { paddingVertical: 4 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
  },
  playerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ring,
  },
  captainRow: { backgroundColor: '#fef3c7' },

  playerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captainBadge: { backgroundColor: '#f59e0b' },
  playerBadgeText: { fontSize: 13 },

  playerName: { flex: 1, fontSize: 14, color: COLORS.ink },
  captainName: { fontWeight: '700' },

  footer: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: { color: '#fff', fontWeight: '900', fontSize: 14, textAlign: 'center' },
});
