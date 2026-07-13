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
  { sport: "baseball", league: "mlb", label: "MLB" },
  { sport: "basketball", league: "wnba", label: "WNBA" },
];

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

function cpParseScoreboard(json, leagueLabel) {
  const events = json.events || [];
  if (events.length === 0) {
    return [{ league: leagueLabel, empty: true }];
  }
  return events.map((event) => {
    const comp = event.competitions[0];
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    const status = comp.status || event.status;
    return {
      league: leagueLabel,
      isLive: status.type.state === "in",
      isFinal: status.type.state === "post",
      awayAbbr: away.team.abbreviation,
      awayScore: away.score,
      homeAbbr: home.team.abbreviation,
      homeScore: home.score,
      statusText: cpFormatGameStatus(status),
    };
  });
}

async function cpFetchTickerItems() {
  const results = await Promise.allSettled(
    CP_TICKER_LEAGUES.map((l) =>
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
  if (item.empty) {
    return `<span class="cp-ticker-item"><span class="cp-ticker-league">${item.league}</span> No games today</span>`;
  }
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
