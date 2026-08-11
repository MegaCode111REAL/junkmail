/* JUNKMAIL — Story Event Pacing
 *
 * IMPORTANT:
 * This file does NOT replace the game's event system or recreate events.
 * It wraps the existing maybeEvent() and temporarily biases the existing
 * rand()/chance() functions while maybeEvent() is building its own event list.
 * That means the original event UI, choices, inventory logic, and event code
 * remain untouched.
 *
 * Timing for each story event:
 *   Before day 50: normal random event selection.
 *   Days 50–74: 25% chance to select a pending story event.
 *   Days 75–100: 75% chance to select a pending story event.
 *   Day 101+: the next event opportunity selects a pending story event.
 *
 * Add this script AFTER the main game script.
 */
(function () {
  "use strict";

  if (typeof window.maybeEvent !== "function" ||
      typeof window.rand !== "function" ||
      typeof window.chance !== "function") {
    console.warn("JUNKMAIL story_events.js: game functions are not ready.");
    return;
  }

  // These are the events in index.html that are part of the main mystery.
  // Add/remove titles here as more story-critical events are introduced.
  const STORY_EVENT_TITLES = [
    "🔑 Locked Shed",
    "📷 Someone in the Photograph",
    "📻 Sudden Static",
    "📡 The Broadcast",
    "📬 Anonymous Letter",
    "🗺️ A Strange Address",
    "🏚️ The Old House",
    "📨 Unordered Delivery",
    "💻 Strange Message",
    "🚚 Strange Van",
    "📡 Signal Detected",
    "📦 The Returned Package",
    "🪙 The Strange Coin",
    "📼 Cassette Recording"
  ];

  const STORY_SET = new Set(STORY_EVENT_TITLES);

  function ensureStoryState() {
    if (!window.state) return null;
    if (!state.storyEvents || typeof state.storyEvents !== "object") {
      state.storyEvents = {};
    }
    return state.storyEvents;
  }

  function pendingStoryTitles() {
    const story = ensureStoryState();
    if (!story) return [];
    return STORY_EVENT_TITLES.filter(title => !story[title]);
  }

  function getDay() {
    return Number(window.state && state.day) || 1;
  }

  function getStoryChance(day) {
    if (day < 50) return 0;
    if (day < 75) return 0.25;
    if (day <= 100) return 0.75;
    return 1;
  }

  // We need to know which event the game's own rand() selected so we can
  // remember that it happened. This is done without changing the event.
  function rememberIfStoryEvent(value) {
    if (!value || !STORY_SET.has(value.title)) return;

    const story = ensureStoryState();
    if (!story || story[value.title]) return;

    story[value.title] = true;

    // saveGame() exists in the original game and is safe to call here.
    if (typeof window.saveGame === "function") {
      window.saveGame();
    }
  }

  const originalMaybeEvent = window.maybeEvent;
  const originalRand = window.rand;
  const originalChance = window.chance;

  let wrapping = false;

  window.maybeEvent = function storyAwareMaybeEvent() {
    if (wrapping) {
      return originalMaybeEvent.apply(this, arguments);
    }

    const day = getDay();
    const pending = pendingStoryTitles();

    // No pending story event, or we're still before the story-event window:
    // leave the original game completely alone.
    if (!pending.length || day < 50) {
      return originalMaybeEvent.apply(this, arguments);
    }

    const chanceToUseStory = getStoryChance(day);
    const shouldForce = Math.random() < chanceToUseStory;

    // After day 100, every call to maybeEvent is an event opportunity and a
    // pending story event must win that opportunity.
    if (!shouldForce) {
      return originalMaybeEvent.apply(this, arguments);
    }

    wrapping = true;

    let firstChanceCall = true;
    let selectedStory = null;

    // maybeEvent() starts with chance(.42). On a forced story opportunity we
    // make ONLY that first event-roll succeed. Any chance() calls elsewhere
    // in the game are not affected because this wrapper is active only during
    // the synchronous maybeEvent() call.
    window.chance = function storyChanceOverride(n) {
      if (firstChanceCall) {
        firstChanceCall = false;
        return true;
      }
      return originalChance(n);
    };

    // maybeEvent() creates its local events array and then calls rand(events).
    // We inspect that exact array and choose one of the existing story events.
    window.rand = function storyRandOverride(array) {
      if (Array.isArray(array)) {
        const candidates = array.filter(event =>
          event && STORY_SET.has(event.title) && pending.includes(event.title)
        );

        if (candidates.length) {
          selectedStory = candidates[Math.floor(Math.random() * candidates.length)];
          return selectedStory;
        }
      }

      return originalRand(array);
    };

    try {
      const result = originalMaybeEvent.apply(this, arguments);

      // The selected event is now the exact event object from index.html.
      // Remember it, but do not alter it.
      if (selectedStory) {
        rememberIfStoryEvent(selectedStory);
      }

      return result;
    } finally {
      window.rand = originalRand;
      window.chance = originalChance;
      wrapping = false;
    }
  };

  // Public debug/info API. Nothing here is required by the game itself.
  window.JUNKMAIL_STORY_EVENTS = {
    titles: STORY_EVENT_TITLES.slice(),
    pending: pendingStoryTitles,
    chanceForDay: getStoryChance,
    hasHappened: function (title) {
      const story = ensureStoryState();
      return !!(story && story[title]);
    }
  };
})();
