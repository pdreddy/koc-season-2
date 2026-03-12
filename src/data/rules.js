export const RULES = [
  {
    emoji: '⚙️',
    title: 'PLAYER MATCH LIMITS',
    items: [
      { icon: '👥', label: 'Doubles Combo (Round-Robin only)', value: 'Max 3 days (6 matches). A specific Player1–Player2 pairing is limited to 3 days.' },
      { icon: '🎾', label: 'Singles Matches (Round-Robin only)', value: 'A Player can play Max 3 matches.' },
      { icon: '📊', label: 'Overall (Round-Robin only)', value: 'Max 6 days total across Singles + Doubles.' },
    ],
    note: '⚠️ Violation: Zero points for that match. (Caps apply only to round-robin matches.)',
    noteType: 'warn',
  },
  {
    emoji: '🏁',
    title: 'COMPETITION RULES',
    items: [
      { icon: '👥', label: 'Team', value: '7 players.' },
      { icon: '❗', label: 'Minimum Participation', value: 'Each player must play 3 matches or the team is ineligible for playoffs.' },
      { icon: '🩺', label: 'Injury Replacement (Committee)', value: 'Requires approval from captains & Uma.' },
    ],
  },
  {
    emoji: '🏆',
    title: 'SCORING',
    items: [
      { icon: '📊', label: 'Tiebreak (two teams level on points)', value: 'Points → Sets → Games → Head‑to‑Head.' },
    ],
    ok: '✅ Win: Win 3 out of 5 lines on a match day → 1 point.',
    note: '❌ Loss: 0 points.',
    noteType: 'error',
  },
  {
    emoji: '📅',
    title: 'SCHEDULING',
    items: [
      { icon: '🕒', label: 'Match Days', value: 'Friday & Saturday.' },
      { icon: '🤝', label: 'Reschedule', value: 'Both captains must agree. Can be played any weekday before Fri/Sat schedule.' },
      { icon: '🚫', label: 'Change Deadline', value: 'No changes after the scheduled day.' },
      { icon: '📣', label: 'Score Reporting', value: 'If both teams fail to post scores before Sunday morning → 0 points for both. Winning captain must post scores.' },
    ],
    note: '⚠️ No‑show = Forfeit.',
    noteType: 'warn',
  },
  {
    emoji: '🧾',
    title: 'SPECIAL RULES & GUIDELINES',
    items: [
      { icon: '🏟️', label: 'Format', value: '9 Teams • Round Robin.' },
      { icon: '🗓️', label: 'Duration', value: 'Oct 17 – Jan 31 (14 weeks).' },
      { icon: '🎾', label: 'Matches / Week', value: '4 lines per week (2 Fri, 2 Sat).' },
      { icon: '🆓', label: 'Bye', value: 'One team per week.' },
      { icon: '🛑', label: 'Breaks', value: 'Nov 28–29 • Dec 26–27 • Jan 2–3.' },
    ],
  },
  {
    emoji: '📋',
    title: 'MATCH DAY PROTOCOL',
    items: [
      { icon: '⏰', label: '', value: 'Arrive 15 minutes early.' },
      { icon: '📄', label: '', value: 'Exchange lineups before play.' },
      { icon: '🚫', label: '', value: 'No lineup changes once started.' },
      { icon: '🎯', label: '', value: 'All lines must finish the same day.' },
    ],
  },
  {
    emoji: '🏥',
    title: 'INJURIES',
    items: [
      { icon: '📃', label: 'League (Round‑Robin)', value: 'Replace with a similar UTR player; requires Committee approval (captains & Uma).' },
      { icon: '🏅', label: 'Playoffs', value: 'Only if 2+ players are ruled out; requires Committee approval (captains & Uma).' },
    ],
  },
  {
    emoji: '⚡',
    title: 'NO‑AD SCORING',
    items: [
      { icon: '➡️', label: '', value: 'Deciding point at deuce.' },
      { icon: '🎯', label: '', value: 'Receiver chooses side (no 2‑point advantage).' },
    ],
  },
  {
    emoji: '🤝',
    title: 'CONDUCT & FAIR PLAY',
    items: [
      { icon: '🎾', label: '', value: 'Players make their own line calls.' },
      { icon: '⚖️', label: '', value: 'Disputes → Committee decision.' },
      { icon: '🙌', label: '', value: 'Respectful behavior is mandatory.' },
    ],
    note: '⚠️ Misconduct = Penalty.',
    noteType: 'warn',
  },
];

export const PLAYOFF_FORMAT = [
  { name: 'Qualifier 1', date: 'Friday, Jan 16 • 5:00 PM', match: '#1 vs #2' },
  { name: 'Eliminator', date: 'Saturday, Jan 17 • 5:00 PM', match: '#3 vs #4' },
  { name: 'Qualifier 2', date: 'Friday, Jan 23 • 5:00 PM', match: 'Q1 Loser vs Elim Winner' },
  { name: 'Championship Final', date: 'Saturday, Jan 31 • 5:00 PM', match: 'Q1 Winner vs Q2 Winner', isFinal: true },
];
