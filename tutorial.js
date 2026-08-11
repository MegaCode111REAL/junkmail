(() => {
  "use strict";

  const style = document.createElement("style");
  style.textContent = `
    #helpButton {
      position:fixed;right:18px;bottom:18px;width:48px;height:48px;border-radius:50%;
      border:1px solid #777b68;background:#25281f;color:#eee9d8;font-size:22px;font-weight:800;
      cursor:pointer;z-index:30;box-shadow:0 5px 18px #0008;
    }
    #helpButton:hover { transform:translateY(-2px); }
    #tutorialOverlay {
      position:fixed;inset:0;background:#0009;display:flex;align-items:center;justify-content:center;
      z-index:50;padding:18px;
    }
    #tutorialCard {
      width:min(680px,100%);max-height:min(760px,90vh);overflow:auto;background:#1c1e19;
      border:1px solid #5f6353;border-radius:16px;padding:26px;color:#eee9d8;
      box-shadow:0 20px 70px #000c;
    }
    #tutorialCard h2 { margin-top:0;font-size:25px; }
    .tutorial-step { display:flex;gap:14px;padding:13px 0;border-bottom:1px solid #34372d; }
    .tutorial-step:last-child { border-bottom:0; }
    .tutorial-num { flex:0 0 32px;height:32px;border-radius:50%;background:#303429;display:flex;align-items:center;justify-content:center;font-weight:800; }
    .tutorial-step b { display:block;margin-bottom:3px; }
    .tutorial-hint { margin-top:18px;padding:13px 15px;background:#25281f;border-radius:10px;border-left:3px solid #9b9f82; }
    .tutorial-close { width:100%;margin-top:20px;padding:12px;border:0;border-radius:9px;background:#d8d5c4;color:#20221c;font-weight:800;cursor:pointer; }
  `;
  document.head.appendChild(style);

  function makeButton() {
    if (document.getElementById("helpButton")) return;
    const b = document.createElement("button");
    b.id = "helpButton";
    b.textContent = "?";
    b.title = "Help — what can I do?";
    b.onclick = () => showHelp(false);
    document.body.appendChild(b);
  }

  function closeHelp() {
    document.getElementById("tutorialOverlay")?.remove();
  }

  function showHelp(firstDay) {
    closeHelp();
    const day = Number(state.day || 1);
    let steps;
    let hint;

    if (day === 1) {
      steps = [
        ["Open today's package", "Your first piece of junk mail is waiting. Open it from the Mail tab."],
        ["Look at what you received", "Select an item in your collection to inspect it. Some objects may be more useful than they first appear."],
        ["Try using an item", "Use the selected item to see whether it connects to something else you have. You don't need to understand everything yet."],
        ["Keep an eye on strange things", "The old photograph and the house may seem ordinary at first. If something feels oddly familiar, remember it."],
        ["Sell what you don't need", "You can sell junk for money. But be careful: once you sell something, it is actually gone."],
        ["Start the next day", "After opening today's package, click the Day counter to continue. New days can bring new packages, events and clues."],
        ["Check Discoveries", "The 📓 Discoveries button records things you learn. New discoveries appear at the top."]
      ];
      hint = "You don't need to solve the mystery today. Start by figuring out what this person used to own — and why you don't remember any of it.";
    } else if (day <= 3) {
      steps = [
        ["Open your package", "Packages are the normal routine here. Open today's one and see what turns up."],
        ["Investigate unusual objects", "Try combining or using objects that seem related. Radios, tapes, keys, photographs and other strange items may connect."],
        ["Watch for events", "Events can change money, inventory, relationships and the investigation. Your choices matter later."],
        ["Read your discoveries", "The newest discovery is always at the top. Look for repeated names, symbols, numbers and clues."],
        ["Advance the day", "Open today's package first, then click the Day counter to move on."]
      ];
      hint = "Something about this house belongs to someone who knew it much better than you do. The more you investigate, the harder that becomes to ignore.";
    } else {
      steps = [
        ["Open packages", "New objects can be useful, valuable, or clues. Don't assume an item is meaningless because it looks like junk."],
        ["Connect objects", "Try using related items together. Earlier clues may make later objects make sense."],
        ["Make deliberate choices", "Events remember what you do. Selling, keeping, helping, refusing or investigating can change what happens later."],
        ["Follow the strange details", "Check discoveries for recurring clues. Numbers, symbols, handwriting and objects can connect across different events."],
        ["Use the marketplace carefully", "Money is useful, but some objects may be evidence. Once something is sold, you may not get it back."],
        ["Keep going", "The game does not expect you to understand the whole mystery immediately. Some answers only become clear after several days."]
      ];
      hint = "If you are stuck, ask yourself: what did the person who lived here know that I don't?";
    }

    const overlay = document.createElement("div");
    overlay.id = "tutorialOverlay";
    overlay.innerHTML = `<div id="tutorialCard">
      <h2>${firstDay ? "📦 Welcome to JUNKMAIL" : "❔ What can I do?"}</h2>
      ${firstDay ? `<p class="muted">You seem to have inherited a house, a collection of junk, and a life you don't quite remember.</p>` : `<p class="muted">Here's what you can do right now on Day ${day}.</p>`}
      ${steps.map((s,i) => `<div class="tutorial-step"><div class="tutorial-num">${i+1}</div><div><b>${escapeHtml(s[0])}</b><span>${escapeHtml(s[1])}</span></div></div>`).join("")}
      <div class="tutorial-hint"><b>Hint</b><br>${escapeHtml(hint)}</div>
      <button class="tutorial-close" onclick="window.closeJunkmailHelp()">Got it</button>
    </div>`;
    document.body.appendChild(overlay);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  }

  window.closeJunkmailHelp = closeHelp;
  makeButton();

  // Only show the full tutorial automatically once, at the start of a new save.
  // Existing saves without this flag get the tutorial if they are still on Day 1.
  if (state.day === 1 && !state.tutorialSeen) {
    state.tutorialSeen = true;
    saveGame();
    setTimeout(() => showHelp(true), 350);
  }
})();
