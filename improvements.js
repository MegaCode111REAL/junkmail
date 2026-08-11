(() => {
  "use strict";

  /*
   * JUNKMAIL quality-of-life/lore-system improvements.
   * This file is intentionally separate so the main game logic stays readable.
   * Load it AFTER the main inline game script with:
   * <script src="improvements.js"></script>
   */

  const style = document.createElement("style");
  style.textContent = `
    .log {
      background:#151712 !important;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
      font-size:13px !important;
      line-height:1.45 !important;
      padding:8px !important;
    }
    .log-entry {
      padding:9px 10px;
      margin:0 0 6px;
      border:1px solid #303329;
      border-radius:8px;
      background:#1c1e19;
    }
    .log-entry:last-child { margin-bottom:0; }
    .log-day {
      display:block;
      color:#a9aa9a;
      font-size:10px;
      text-transform:uppercase;
      letter-spacing:.08em;
      margin-bottom:2px;
    }
    .log-text { color:#eee9d8; }
    .discovery-entry {
      border-left:3px solid var(--accent);
      padding:11px 13px;
      background:#20221c;
      border-radius:7px;
      margin-bottom:9px;
    }
    .discovery-entry:first-of-type { margin-top:10px; }
    .discovery-day {
      color:#a9aa9a;
      font-size:11px;
    }
    .discovery-new {
      float:right;
      color:#e3b95b;
      font-size:10px;
      text-transform:uppercase;
      letter-spacing:.08em;
    }
  `;
  document.head.appendChild(style);

  function improvedRenderLog() {
    const el = document.getElementById("log");
    if (!el) return;

    el.innerHTML = (state.logs || []).map(entry => {
      const match = String(entry).match(/^Day (\\d+) — (.*)$/);
      const day = match ? match[1] : "";
      const text = match ? match[2] : entry;
      return `<div class="log-entry">
        ${day ? `<span class="log-day">Day ${escapeHtml(day)}</span>` : ""}
        <span class="log-text">${escapeHtml(text)}</span>
      </div>`;
    }).join("");
  }

  function improvedShowDiscoveries() {
    const list = [...(state.discoveries || [])].reverse();
    const content = list.length
      ? list.map((d, index) => `
          <div class="discovery-entry">
            ${index === 0 ? '<span class="discovery-new">Most recent</span>' : ''}
            <b>${escapeHtml(d.name)}</b>
            <br>
            <span class="muted">${escapeHtml(d.desc)}</span>
            <br>
            <span class="discovery-day">Discovered on Day ${escapeHtml(String(d.day))}</span>
          </div>
        `).join("")
      : "<p class='muted'>No discoveries yet.</p>";

    modal(`<h2>📓 Discoveries</h2>${content}`);
  }

  /*
   * Selling is a real removal from the collection. The original game already
   * did this for the inventory button; this wrapper also makes the log clearer
   * and prevents stale selections after an item has disappeared.
   */
  const originalSellSelected = window.sellSelected;
  window.sellSelected = function () {
    const selected = state.inv.find(x => x.uid === state.selected);
    if (!selected) return;

    const soldName = ITEMS[selected.id].name;
    const before = state.inv.length;
    originalSellSelected();

    if (state.inv.length < before) {
      state.selected = null;
      toast(`${soldName} left your collection.`);
    }
  };

  /*
   * A few event choices previously paid for an item without actually removing
   * it. Make those transactions behave like real sales.
   */
  const originalEventChoice = window.eventChoice;
  window.eventChoice = function (index) {
    const event = window.currentEvent;
    if (!event) return;

    const title = event.title;
    const beforeIds = state.inv.map(x => x.uid);

    originalEventChoice(index);

    if (title === "📷 Someone in the Photograph" && index === 2) {
      const photo = state.inv.find(x => x.id === "photo");
      if (photo && beforeIds.includes(photo.uid)) {
        removeItem(photo.uid);
        log("The photograph was sold and is no longer in your collection.");
        render();
      }
    }
  };

  /*
   * Make several existing interactions feel more physical and connected.
   * These are deliberately conservative: mystery-critical objects are not
   * consumed unless the original game already represented a transformation.
   */
  const originalTryCombination = window.tryCombination;
  window.tryCombination = function (x) {
    if (!x || !state.inv.some(i => i.uid === x.uid)) return;
    originalTryCombination(x);
  };

  window.renderLog = improvedRenderLog;
  window.showDiscoveries = improvedShowDiscoveries;

  /* Re-render immediately so the improvements appear without waiting for input. */
  improvedRenderLog();
})();
