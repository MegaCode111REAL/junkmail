/* JUNKMAIL — optional expansion
 * Safe design: does not wrap core game functions, buttons, inventory rendering,
 * event selection, or day progression. It only adds data and a few independent
 * event listeners after the page has loaded.
 */
(function () {
  "use strict";

  if (!window.state || !window.ITEMS) return;

  // ------------------------------------------------------------
  // EXTRA ITEMS
  // ------------------------------------------------------------
  const EXTRA_ITEMS = {
    flashlight: {name:"Old Flashlight", emoji:"🔦", value:6, tags:["tool","electric"], desc:"The batteries are missing.", clue:"Someone scratched '83.7' into the battery compartment."},
    fadedReceipt: {name:"Faded Receipt", emoji:"🧾", value:3, tags:["paper","mystery"], desc:"Most of the ink has faded.", clue:"The purchase date is from before you remember moving here."},
    sealedEnvelope: {name:"Sealed Envelope", emoji:"✉️", value:4, tags:["paper","mystery"], desc:"Your address is written on it. Nothing else.", clue:"The handwriting looks strangely familiar."},
    brokenPhone: {name:"Broken Phone", emoji:"📱", value:8, tags:["electric","mystery"], desc:"It has no SIM card and no signal.", clue:"The last saved contact is simply called HOME."},
    crackedMirror: {name:"Cracked Mirror", emoji:"🪞", value:5, tags:["glass","mystery"], desc:"A crack runs straight through the reflection.", clue:"For a moment, the reflection seems to move first."},
    blankLabel: {name:"Blank Shipping Label", emoji:"🏷️", value:2, tags:["paper","package"], desc:"There is no address printed on it.", clue:"Under angled light, another address becomes visible."},
    memoryCard: {name:"Unlabeled Memory Card", emoji:"💾", value:9, tags:["data","mystery"], desc:"No label. No case. No explanation.", clue:"It contains one file named 'ME'."},
    rustedBolt: {name:"Rusted Bolt", emoji:"🔩", value:3, tags:["metal","machine"], desc:"Covered in reddish dust.", clue:"The threads match something much larger than a normal bolt."},
    redString: {name:"Red String", emoji:"🧵", value:2, tags:["string","mystery"], desc:"A short piece tied in a strange knot.", clue:"The knot is identical to one drawn on an old receipt."},
    oldKeycard: {name:"Old Keycard", emoji:"💳", value:7, tags:["data","key","mystery"], desc:"The magnetic strip is badly scratched.", clue:"It has your house number printed on it."},
    mirrorShard: {name:"Mirror Shard", emoji:"🔹", value:3, tags:["glass","mystery"], desc:"A small piece of broken mirror.", clue:"The edge is perfectly smooth, as if it was cut."},
    deliveryTag: {name:"Delivery Tag", emoji:"🎫", value:4, tags:["paper","package","mystery"], desc:"A tag marked 'ROUTE 0'.", clue:"The sender field contains your own handwriting."}
  };

  for (const [id, item] of Object.entries(EXTRA_ITEMS)) {
    if (!ITEMS[id]) ITEMS[id] = item;
  }

  const EXTRA_POOL = Object.keys(EXTRA_ITEMS);

  // ------------------------------------------------------------
  // HIDDEN CHOICE HISTORY
  // ------------------------------------------------------------
  // Nothing is displayed. No toast. No '+2'. No visible stats.
  state.choiceHistory = Array.isArray(state.choiceHistory) ? state.choiceHistory : [];

  // This is deliberately just descriptive history. Future storylines can
  // inspect it and react to what the player actually did.
  window.JunkmailChoiceHistory = function (eventTitle, choiceText) {
    state.choiceHistory.push({
      day: Number(state.day || 1),
      event: String(eventTitle || ""),
      choice: String(choiceText || "")
    });
    if (state.choiceHistory.length > 100) state.choiceHistory.shift();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  // ------------------------------------------------------------
  // RARE EARLY RENT
  // ------------------------------------------------------------
  // Uses a normal custom event instead of modifying the existing event
  // picker. This means it cannot break normal events or inventory rendering.
  state.rentNoticeSeen = !!state.rentNoticeSeen;

  function maybeRent() {
    const day = Number(state.day || 1);
    if (day > 20 || state.rentNoticeSeen) return;

    // Very rare: roughly 1.5% per eligible day.
    if (Math.random() >= 0.015) return;

    state.rentNoticeSeen = true;
    const current = Number(state.money || 0);
    const rent = current * 8;

    const event = {
      title: "📬 Rent Notice",
      text: "A letter has arrived. It says the rent is overdue. You don't remember ever agreeing to rent this house.",
      choices: [
        ["Pay it", function () {
          state.money -= rent;
          if (typeof log === "function") log("You paid the rent. You are not sure how you managed to owe it.");
          finishRent();
        }],
        ["Read the notice again", function () {
          if (typeof discover === "function") discover("The Rent Notice", "The notice is addressed to someone who apparently has your house.");
          finishRent();
        }]
      ]
    };

    window.currentEvent = event;
    const area = document.getElementById("eventArea");
    if (!area) return;

    area.innerHTML = '<div class="event"><b>' + event.title + '</b><div class="muted">' + event.text + '</div>' + event.choices.map(function (c, i) {
      return '<button class="choice" onclick="window.JunkmailRentChoice(' + i + ')"><b>' + c[0] + '</b></button>';
    }).join("") + '</div>';

    window.JunkmailRentChoice = function (i) {
      const choice = event.choices[i];
      if (!choice) return;
      choice[1]();
    };

    function finishRent() {
      area.innerHTML = "";
      if (typeof window.saveGame === "function") window.saveGame();
      if (typeof window.render === "function") window.render();
    }
  }

  // Observe day changes without replacing the game's next-day function.
  let lastDay = Number(state.day || 1);
  setInterval(function () {
    const now = Number(state.day || 1);
    if (now !== lastDay) {
      lastDay = now;
      maybeRent();
    }
  }, 250);

  // ------------------------------------------------------------
  // EXTRA JUNK — passive, low-frequency additions
  // ------------------------------------------------------------
  // This intentionally does NOT replace the Open Package button. Instead it
  // watches the package-opened state and gives a small chance of finding a
  // second piece of junk after the normal package has already been processed.
  let lastOpenedDay = null;
  setInterval(function () {
    const day = Number(state.day || 1);
    if (!state.openedToday || lastOpenedDay === day) return;
    lastOpenedDay = day;

    if (Math.random() >= 0.12) return;
    if (typeof window.addItem !== "function") return;

    const id = EXTRA_POOL[Math.floor(Math.random() * EXTRA_POOL.length)];
    if (!ITEMS[id]) return;

    const result = window.addItem(id);
    if (result !== false) {
      if (typeof window.log === "function") window.log("There was something underneath the packaging: " + ITEMS[id].name + ".");
      if (typeof window.render === "function") window.render();
    }
  }, 400);

  // ------------------------------------------------------------
  // SMALL MARKETPLACE ADDITION
  // ------------------------------------------------------------
  // Only add the listing if the marketplace container already exists.
  // We never replace or rebuild the existing marketplace.
  function addMarketplaceListing() {
    const shop = document.getElementById("shopTab");
    if (!shop || document.getElementById("junkmailSalvageListing")) return;

    const box = document.createElement("div");
    box.id = "junkmailSalvageListing";
    box.className = "event";
    box.innerHTML = '<b>🗃️ Unclaimed Salvage</b><div class="muted">A small box of miscellaneous household junk.</div><button id="junkmailBuySalvage">Buy for $12</button>';
    shop.appendChild(box);

    const button = document.getElementById("junkmailBuySalvage");
    button.onclick = function () {
      if (Number(state.money || 0) < 12) {
        if (typeof window.toast === "function") window.toast("You don't have enough money.");
        return;
      }
      state.money -= 12;
      const id = EXTRA_POOL[Math.floor(Math.random() * EXTRA_POOL.length)];
      if (typeof window.addItem === "function") window.addItem(id);
      if (typeof window.log === "function") window.log("The salvage box contained: " + ITEMS[id].name + ".");
      if (typeof window.saveGame === "function") window.saveGame();
      if (typeof window.render === "function") window.render();
    };
  }

  setTimeout(addMarketplaceListing, 500);
})();
