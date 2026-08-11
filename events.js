/* JUNKMAIL — Event requirements + AU event routing
 * Load after index.html. It safely filters the existing event array without
 * replacing the game's event definitions or inventory functions.
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;

  const AU_EVENTS = {
    sender: [
      "📨 Unordered Delivery", "💻 Strange Message", "📬 Anonymous Letter", "📦 The Returned Package"
    ],
    thing: [
      "🚚 Strange Van", "🚪 The Knock", "🔑 Locked Shed", "🧲 Something Metallic"
    ],
    no_sender: [
      "📨 Unordered Delivery", "📦 Wrong Address", "📦 Package Inspection", "🚚 Strange Van"
    ],
    house: [
      "🔑 Locked Shed", "📷 Someone in the Photograph", "🏚️ The Old House", "🕳️ Loose Floorboard", "🗺️ A Strange Address"
    ],
    reset: [
      "📦 The Returned Package", "🕳️ Loose Floorboard", "📼 Cassette Recording", "📦 Package Inspection"
    ],
    player_package: [
      "📨 Unordered Delivery", "📦 Wrong Address", "📬 Anonymous Letter", "📦 Package Inspection"
    ],
    customer: [
      "📦 Wrong Address", "📨 Unordered Delivery", "👤 Anonymous Buyer", "📦 Package Inspection"
    ],
    memories: [
      "📷 Someone in the Photograph", "🧸 The Toy Bear", "📼 Cassette Recording", "📦 The Returned Package"
    ],
    people_know: [
      "🧑‍🔧 The Collector", "🚪 The Knock", "📨 Unordered Delivery", "👤 Anonymous Buyer"
    ],
    company: [
      "💻 Strange Message", "📦 Package Inspection", "👤 Anonymous Buyer", "📡 Signal Detected"
    ],
    copies: [
      "🪙 The Strange Coin", "📦 The Returned Package", "📨 Unordered Delivery", "🗺️ A Strange Address"
    ],
    empty: [
      "📦 Wrong Address", "📨 Unordered Delivery", "📬 Anonymous Letter", "📦 Package Inspection"
    ]
  };

  const RULES = {
    "🔑 Locked Shed": [
      s => Number(s.day || 1) >= 50,
      s => !s.storyline?.flags?.shedUnlocked,
      s => !!(s.inv || []).some(x => x.id === "key")
    ],
    "📷 Someone in the Photograph": [
      s => Number(s.day || 1) >= 35,
      s => hasDiscovery(s, ["The Photograph", "Old Photograph"])
    ],
    "📡 The Broadcast": [
      s => Number(s.day || 1) >= 20,
      s => !!(s.inv || []).some(x => x.id === "radio")
    ],
    "📬 Anonymous Letter": [
      s => Number(s.day || 1) >= 20,
      s => !!(s.inv || []).some(x => x.id === "key") || Number(s.day || 1) >= 60
    ],
    "📦 The Returned Package": [
      s => Number(s.day || 1) >= 30,
      s => (s.stats?.sold || 0) >= 1
    ],
    "🧸 The Toy Bear": [
      s => !!(s.inv || []).some(x => x.id === "bear")
    ],
    "🧲 Something Metallic": [
      s => !!(s.inv || []).some(x => x.id === "magnet")
    ],
    "📼 Cassette Recording": [
      s => !!(s.inv || []).some(x => x.id === "tape")
    ],
    "🪙 The Strange Coin": [
      s => !!(s.inv || []).some(x => x.id === "coin")
    ],
    "🧪 The Blue Liquid": [
      s => !!(s.inv || []).some(x => x.id === "bottle")
    ],
    "💡 Power Flicker": [
      s => (s.inv || []).length > 0
    ],
    "📡 Signal Detected": [
      s => !!s.scanner || !!(s.inv || []).some(x => x.id === "radio" || x.id === "magnet")
    ],
    "💻 Strange Message": [
      s => Number(s.day || 1) >= 15,
      s => (s.stats?.opened || 0) >= 3
    ],
    "🏚️ The Old House": [
      s => Number(s.day || 1) >= 25,
      s => hasDiscovery(s, ["The Photograph", "The Address", "The Location"])
    ],
    "🗺️ A Strange Address": [
      s => Number(s.day || 1) >= 20,
      s => hasDiscovery(s, ["Unordered Package", "The Photograph", "Warm Coin"])
    ],
    "👤 Anonymous Buyer": [
      s => (s.stats?.sold || 0) >= 2
    ],
    "🛠️ Broken Machine": [
      s => !!(s.inv || []).some(x => x.id === "gear" || x.id === "screwdriver")
    ]
  };

  function hasDiscovery(s, names) {
    const list = Array.isArray(s.discoveries) ? s.discoveries : [];
    const old = Array.isArray(s.discoveredNames) ? s.discoveredNames : [];
    return names.some(name =>
      list.some(d => (typeof d === "string" ? d : d && d.name) === name) ||
      old.includes(name)
    );
  }

  function currentAU(s) {
    return s?.storyline?.auId || s?.au || s?.alternateUniverse || null;
  }

  // Build the inverse map so an event listed for several AUs is available in
  // all of those AUs, rather than being accidentally assigned to the first one.
  const EVENT_AUS = {};
  for (const [au, titles] of Object.entries(AU_EVENTS)) {
    for (const title of titles) {
      if (!EVENT_AUS[title]) EVENT_AUS[title] = new Set();
      EVENT_AUS[title].add(au);
    }
  }

  function isAUAllowed(event, s) {
    const au = currentAU(s);
    if (!au) return true;

    const allowedAUs = EVENT_AUS[event.title];
    if (!allowedAUs) return true;

    return allowedAUs.has(au);
  }

  function requirementsFor(event) {
    const list = [];
    if (Array.isArray(event.requirements)) list.push(...event.requirements);
    if (RULES[event.title]) list.push(...RULES[event.title]);
    return list;
  }

  function applyRequirements(events) {
    if (!Array.isArray(events)) return events;

    // Every event gets a requirements array. Empty means it is available
    // unless AU routing says otherwise.
    for (const event of events) {
      event.requirements = requirementsFor(event);
    }

    const available = events.filter(event => {
      if (!isAUAllowed(event, state)) return false;

      return event.requirements.every(requirement => {
        try {
          return typeof requirement === "function" ? !!requirement(state) : !!requirement;
        } catch (error) {
          console.warn("JUNKMAIL event requirement failed:", event.title, error);
          return false;
        }
      });
    });

    // Never leave the game with no event. If every event was blocked, use
    // unrestricted events from the current AU before falling back to the full list.
    if (available.length) return available;

    const fallback = events.filter(event => {
      return isAUAllowed(event, state) && event.requirements.length === 0;
    });

    return fallback.length ? fallback : events;
  }

  window.JUNKMAIL_EVENT_REQUIREMENTS = RULES;
  window.JUNKMAIL_AU_EVENT_ROUTING = AU_EVENTS;
  window.JUNKMAIL_FILTER_EVENTS = applyRequirements;

  const originalMaybeEvent = window.maybeEvent;
  const originalRand = window.rand;

  if (typeof originalMaybeEvent !== "function" || typeof originalRand !== "function") {
    console.warn("JUNKMAIL events.js: maybeEvent/rand not available yet.");
    return;
  }

  // The existing game keeps its events array inside maybeEvent(). We therefore
  // intercept only the rand(events) call while maybeEvent is running. The
  // original rand is restored in finally{}, so package/inventory randomness is
  // never permanently changed.
  window.maybeEvent = function () {
    const previousRand = window.rand;

    window.rand = function (value) {
      if (
        Array.isArray(value) &&
        value.length &&
        value.every(x => x && typeof x === "object" && "title" in x && Array.isArray(x.choices))
      ) {
        const filtered = applyRequirements(value);
        return filtered[Math.floor(Math.random() * filtered.length)];
      }

      return originalRand(value);
    };

    try {
      return originalMaybeEvent.apply(this, arguments);
    } finally {
      window.rand = previousRand;
    }
  };
})();
