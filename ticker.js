/**
 * Culture & Pulse Sports Intelligence — Live Scores Ticker (V1)
 * Fetches MLB + WNBA scoreboards directly from ESPN's public scoreboard API.
 * No backend needed. Refreshes every 60 seconds.
 *
 * Add to any page:
 *   <div id="cp-ticker"></div>
 *   <script src="ticker.js"></script>
 *
 * V2 note: once the WNBA engine is wired to real data, this file gets a
 * second data source (your own daily-intelligence.json) merged into the
 * same ticker items array — see buildModelAlertItems() stub at the bottom.
 */

const CP_TICKER_LEAGUES = [
  { sport: "baseball", league: "mlb", label: "MLB", active: true },
  { sport: "basketball", league: "wnba", label: "WNBA", active: true },
];

// ESPN scoreboard season.type: 1 preseason, 2 regular season, 3 postseason, 4 offseason.
const CP_TICKER_OFFSEASON_TYPE = 4;

const CP_TICKER_REFRESH_MS = 60000;

function cpFormatGameStatus(status) {
  const state = status.type.state; // "pre" | "in" | "post"
  if (state === "pre") {
    const d = new Date(status.type.detail || status.type.shortDetail);
    return isNaN(d) ? status.type.shortDetail : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (state === "post") {
    return "FINAL";
  }
  // live game
  return status.type.shortDetail || `${status.period}`;
}

const CP_TICKER_DAY_MS = 24 * 60 * 60 * 1000;

// Local-midnight timestamp for a Date, so day comparisons ignore time-of-day/timezone drift.
function cpLocalMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function cpParseScoreboard(json, leagueLabel) {
  if (json.season && json.season.type === CP_TICKER_OFFSEASON_TYPE) return [];

  const events = json.events || [];
  const todayLocal = cpLocalMidnight(new Date());

  const items = [];
  events.forEach((event) => {
    const eventDate = new Date(event.date);
    if (isNaN(eventDate)) return;
    // ESPN sometimes keeps stale/placeholder events around (e.g. after a season ends) —
    // only show games within a day of today, local time.
    if (Math.abs(cpLocalMidnight(eventDate) - todayLocal) > CP_TICKER_DAY_MS) return;

    const comp = event.competitions[0];
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    const status = comp.status || event.status;
    const state = status.type.state; // "pre" | "in" | "post"
    const awayScore = Number(away.score) || 0;
    const homeScore = Number(home.score) || 0;

    // A 0-0 "in progress"/"final" game is stale/bogus data, not a real result — skip it.
    // 0-0 is only legitimate for a game that hasn't started yet ("pre").
    if (awayScore === 0 && homeScore === 0 && state !== "pre") return;

    items.push({
      league: leagueLabel,
      isLive: state === "in",
      isFinal: state === "post",
      awayAbbr: away.team.abbreviation,
      awayScore: away.score,
      homeAbbr: home.team.abbreviation,
      homeScore: home.score,
      statusText: cpFormatGameStatus(status),
    });
  });
  return items;
}

async function cpFetchTickerItems() {
  const results = await Promise.allSettled(
    CP_TICKER_LEAGUES.filter((l) => l.active).map((l) =>
      fetch(`https://site.api.espn.com/apis/site/v2/sports/${l.sport}/${l.league}/scoreboard`)
        .then((r) => r.json())
        .then((json) => cpParseScoreboard(json, l.label))
    )
  );

  let items = [];
  results.forEach((r) => {
    if (r.status === "fulfilled") items = items.concat(r.value);
  });
  return items;
}

function cpRenderTickerItem(item) {
  const liveDot = item.isLive ? `<span class="cp-ticker-live-dot">●</span> LIVE` : "";
  const statusClass = item.isLive ? "cp-ticker-status-live" : item.isFinal ? "cp-ticker-status-final" : "cp-ticker-status-pre";
  return `
    <span class="cp-ticker-item">
      <span class="cp-ticker-league">${liveDot} ${item.league}</span>
      ${item.awayAbbr} ${item.awayScore} @ ${item.homeAbbr} ${item.homeScore}
      <span class="${statusClass}">${item.statusText}</span>
    </span>
  `;
}

async function cpRenderTicker() {
  const container = document.getElementById("cp-ticker");
  if (!container) return;

  const items = await cpFetchTickerItems();
  if (items.length === 0) {
    container.innerHTML = "";
    container.style.display = "none";
    return;
  }
  container.style.display = "";
  const html = items.map(cpRenderTickerItem).join('<span class="cp-ticker-sep">•</span>');

  // Duplicate content so the CSS marquee loop has no visible seam
  container.innerHTML = `
    <div class="cp-ticker-track">
      <div class="cp-ticker-content">${html}</div>
      <div class="cp-ticker-content" aria-hidden="true">${html}</div>
    </div>
  `;
}

// --- V2 stub (do not wire yet — see roadmap: WNBA engine wiring comes first) ---
// function buildModelAlertItems(dailyIntelligenceJson) {
//   // will read edge %, confidence tier, and rank moves from your own
//   // real engine output and format them as extra ticker items
// }

document.addEventListener("DOMContentLoaded", () => {
  cpRenderTicker();
  setInterval(cpRenderTicker, CP_TICKER_REFRESH_MS);
});
