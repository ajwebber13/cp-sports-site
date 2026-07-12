/*
badges.js — Culture & Pulse Sports Intelligence
====================================================
Generates initial-based avatars for teams and players — NOT real
logos or photos. Real team logos and player photos are trademarked/
likeness-protected assets; using them without licensing is legally
fragile even for a small site. This gives every team/player a clean,
consistent, on-brand visual identity (gold/black, matches the rest of
the site) with zero licensing risk. If real logos/photos are ever
licensed later, swap renderTeamBadge/renderPlayerBadge's <div> output
for an <img> tag — every call site stays the same.

Deterministic: the same name always gets the same color (hashed from
the name string), so a team/player looks consistent everywhere they
appear across the site, without needing a lookup table to maintain.
*/

// A small on-brand palette — variations of gold plus a few muted
// accent tones that stay legible against the dark background. Never
// pure white/black backgrounds (breaks the dark theme), never neon
// colors (breaks the ESPN/Boardroom feel).
const BADGE_PALETTE = [
  "#CFB53B", "#B8952E", "#8C7328", "#D4A017",
  "#9A7B2F", "#C9A83E", "#7C6423", "#E0B93A",
];

function _hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function _badgeColor(name) {
  return BADGE_PALETTE[_hashString(name) % BADGE_PALETTE.length];
}

function _teamInitials(teamName) {
  // Team names are "City Name" or "City Multi-Word Name" — use the
  // last word's first letter plus the first word's first letter
  // (e.g. "Minnesota Lynx" -> "ML", "Golden State Valkyries" -> "GV",
  // "LA Clippers" -> "LC") for a 2-letter mark that reads as a crest.
  const words = teamName.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function _playerInitials(playerName) {
  const words = playerName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Square-ish crest badge for a team. sizePx controls both dimensions. */
function renderTeamBadge(teamName, sizePx = 40) {
  const initials = _teamInitials(teamName);
  const color = _badgeColor(teamName);
  const fontSize = Math.round(sizePx * 0.38);
  return `<span class="badge badge-team" style="width:${sizePx}px;height:${sizePx}px;background:${color};font-size:${fontSize}px;" title="${teamName}" aria-hidden="true">${initials}</span>`;
}

/** Round avatar for a player. sizePx controls both dimensions. */
function renderPlayerBadge(playerName, sizePx = 40) {
  const initials = _playerInitials(playerName);
  const color = _badgeColor(playerName);
  const fontSize = Math.round(sizePx * 0.38);
  return `<span class="badge badge-player" style="width:${sizePx}px;height:${sizePx}px;background:${color};font-size:${fontSize}px;" title="${playerName}" aria-hidden="true">${initials}</span>`;
}
