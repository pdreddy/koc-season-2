import React from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RULES, PLAYOFF_FORMAT } from '../data/rules';
import { COLORS, SHADOWS } from '../theme';

function RuleItem({ icon, label, value }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemIcon}>{icon}</Text>
      <View style={styles.itemText}>
        {label ? <Text style={styles.itemLabel}>{label}</Text> : null}
        <Text style={styles.itemValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function RulesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>KOC Season 2 – TOURNAMENT RULES</Text>
          <Text style={styles.pageSub}>📘 Complete Guidelines</Text>
        </View>

        {RULES.map((rule, idx) => (
          <View key={idx} style={[styles.ruleCard, SHADOWS.sm]}>
            <View style={styles.ruleHead}>
              <Text style={styles.ruleEmoji}>{rule.emoji}</Text>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
            </View>

            {rule.ok && (
              <View style={styles.okBanner}>
                <Text style={styles.okText}>{rule.ok}</Text>
              </View>
            )}

            {rule.items.map((item, iIdx) => (
              <RuleItem key={iIdx} icon={item.icon} label={item.label} value={item.value} />
            ))}

            {rule.note && (
              <View style={[styles.noteBanner, rule.noteType === 'error' && styles.noteBannerError]}>
                <Text style={[styles.noteText, rule.noteType === 'error' && styles.noteTextError]}>
                  {rule.note}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Playoff Format Section */}
        <View style={[styles.playoffSection, SHADOWS.sm]}>
          <Text style={styles.playoffTitle}>🏆 Playoff Format</Text>
          <Text style={styles.playoffSub}>Top 4 Teams Qualify · Tiebreak: Points → Sets → Games → H2H</Text>

          {PLAYOFF_FORMAT.map((p, idx) => (
            <View key={idx} style={[styles.pCard, p.isFinal && styles.pCardFinal]}>
              <LinearGradient
                colors={p.isFinal ? ['#d69e2e', '#b7791f'] : [COLORS.bg1, COLORS.bg2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pHead}
              >
                <Text style={styles.pHeadText}>{p.name}</Text>
              </LinearGradient>
              <Text style={styles.pDate}>{p.date}</Text>
              <Text style={styles.pMatch}>{p.match}</Text>
            </View>
          ))}
        </View>

        <LinearGradient
          colors={['#06b6d4', '#8b5cf6', '#22c55e', '#f43f5e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.motto}
        >
          <Text style={styles.mottoText}>
            😏 Play Fair, Win Big, Party Hard! ✨ Play, Repeat, Celebrate! 🎾🏆🎾🎉
          </Text>
        </LinearGradient>
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
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  pageTitle: { fontSize: 17, fontWeight: '900', color: COLORS.ink, textAlign: 'center', marginBottom: 4 },
  pageSub: { fontSize: 14, color: COLORS.muted },

  ruleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.ring,
  },
  ruleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.ring,
  },
  ruleEmoji: { fontSize: 22 },
  ruleTitle: { fontSize: 15, fontWeight: '900', color: COLORS.ink, flex: 1 },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.bg1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    gap: 8,
  },
  itemIcon: { fontSize: 16, marginTop: 1 },
  itemText: { flex: 1 },
  itemLabel: { fontWeight: '900', color: '#2d3748', fontSize: 13, marginBottom: 2 },
  itemValue: { color: '#4a5568', fontSize: 13, lineHeight: 18 },

  okBanner: {
    backgroundColor: '#c6f6d5',
    borderWidth: 2,
    borderColor: '#9ae6b4',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  okText: { color: '#22543d', fontWeight: '900', textAlign: 'center', fontSize: 13 },

  noteBanner: {
    backgroundColor: '#fde68a',
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    alignItems: 'center',
  },
  noteBannerError: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  noteText: { color: '#744210', fontWeight: '800', textAlign: 'center', fontSize: 13 },
  noteTextError: { color: '#991b1b' },

  playoffSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  playoffTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    color: COLORS.bg1,
    marginBottom: 4,
  },
  playoffSub: { fontSize: 12, color: COLORS.muted, textAlign: 'center', marginBottom: 12 },

  pCard: {
    borderWidth: 2,
    borderColor: COLORS.ring,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  pCardFinal: { borderColor: '#d69e2e' },
  pHead: { padding: 10 },
  pHeadText: { color: '#fff', fontWeight: '900', textAlign: 'center', fontSize: 14 },
  pDate: { textAlign: 'center', color: COLORS.muted, fontWeight: '700', padding: 6, fontSize: 13 },
  pMatch: { textAlign: 'center', fontWeight: '900', paddingBottom: 10, fontSize: 15, color: COLORS.ink },

  motto: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  mottoText: { color: '#fff', fontWeight: '900', textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
