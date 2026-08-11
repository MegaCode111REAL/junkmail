/* JUNKMAIL — Interconnected choices + extra junk
 * Load after index.html's main script, improvements.js and tutorial.js.
 * This file deliberately does NOT replace the game's inventory, event list,
 * or render functions. It augments the existing objects and button handlers.
 */
(function(){
  "use strict";

  if(typeof window === "undefined" || typeof ITEMS === "undefined" || typeof state === "undefined") return;

  // ------------------------------------------------------------
  // EXTRA ITEMS
  // ------------------------------------------------------------
  Object.assign(ITEMS, {
    flashlight:{name:"Old Flashlight",emoji:"🔦",value:6,tags:["tool","electric"],desc:"The batteries are missing.",clue:"Someone scratched '83.7' into the battery compartment."},
    receipt:{name:"Faded Receipt",emoji:"🧾",value:3,tags:["paper","mystery"],desc:"Most of the ink has faded.",clue:"The purchase date is from before you remember moving here."},
    envelope:{name:"Sealed Envelope",emoji:"✉️",value:4,tags:["paper","mystery"],desc:"Your address is written on it. Nothing else.",clue:"The handwriting looks strangely familiar."},
    phone:{name:"Broken Phone",emoji:"📱",value:8,tags:["electric","data","mystery"],desc:"It has no SIM card and no signal.",clue:"The last saved contact is simply called HOME."},
    mirror:{name:"Cracked Mirror",emoji:"🪞",value:5,tags:["glass","mystery"],desc:"A crack runs straight through the reflection.",clue:"For a moment, the reflection seems to move first."},
    label:{name:"Blank Shipping Label",emoji:"🏷️",value:2,tags:["paper","package"],desc:"It has no address printed on it.",clue:"Under angled light, another address becomes visible."},
    memorycard:{name:"Unlabeled Memory Card",emoji:"💾",value:9,tags:["data","mystery"],desc:"No label. No case. No explanation.",clue:"It contains one file named 'ME'."},
    bolt:{name:"Rusted Bolt",emoji:"🔩",value:3,tags:["metal","machine"],desc:"Covered in reddish dust.",clue:"The threads match something much larger than a normal bolt."},
    string:{name:"Red String",emoji:"🧵",value:2,tags:["string","mystery"],desc:"A short piece of red thread tied in a strange knot.",clue:"The knot is identical to one drawn on an old receipt."},
    keycard:{name:"Old Keycard",emoji:"💳",value:7,tags:["data","key","mystery"],desc:"The magnetic strip is badly scratched.",clue:"It has your house number printed on it."},
    mirrorShard:{name:"Mirror Shard",emoji:"🔹",value:3,tags:["glass","mystery"],desc:"A small piece of broken mirror.",clue:"The edge is perfectly smooth, as if it was cut."},
    deliveryTag:{name:"Delivery Tag",emoji:"🎫",value:4,tags:["paper","package","mystery"],desc:"A tag marked 'ROUTE 0'.",clue:"The sender field contains your own handwriting."}
  });

  const EXTRA_POOL=[
    "flashlight","receipt","envelope","phone","mirror","label",
    "memorycard","bolt","string","keycard","mirrorShard","deliveryTag"
  ];

  // Give existing mystery boxes a small chance of containing one of the new
  // objects. The original package contents remain untouched.
  const openBtn=document.getElementById("openBtn");
  if(openBtn && typeof openBtn.onclick === "function"){
    const originalOpen=openBtn.onclick;
    openBtn.onclick=function(ev){
      const before=state.openedToday;
      originalOpen.call(this,ev);
      if(!before && state.openedToday && Math.random()<0.24){
        const id=EXTRA_POOL[Math.floor(Math.random()*EXTRA_POOL.length)];
        if(typeof addItem === "function" && addItem(id)){
          if(typeof log === "function") log("An extra object was tucked beneath the packaging: "+ITEMS[id].name+".");
          const pkg=document.getElementById("package");
          if(pkg){
            const small=pkg.querySelector("small");
            if(small) small.textContent += " · "+ITEMS[id].emoji+" "+ITEMS[id].name;
          }
          if(typeof render === "function") render();
        }
      }
    };
  }

  // ------------------------------------------------------------
  // MARKETPLACE — EXTRA JUNK
  // ------------------------------------------------------------
  const shop=document.getElementById("shopTab");
  if(shop && !document.getElementById("extraJunkMarket")){
    const box=document.createElement("div");
    box.id="extraJunkMarket";
    box.className="event";
    box.innerHTML=`
      <b>🗃️ Salvage Listing — $12</b>
      <br><span class="muted">A random piece of old household junk. Some listings seem oddly specific.</span>
      <div class="actions"><button id="buySalvageBtn">Buy salvage ($12)</button></div>
    `;
    shop.appendChild(box);
    document.getElementById("buySalvageBtn").onclick=function(){
      if(state.money<12){toast("Not enough money.");return}
      state.money-=12;
      state.stats.spent=(state.stats.spent||0)+12;
      const id=EXTRA_POOL[Math.floor(Math.random()*EXTRA_POOL.length)];
      if(typeof addItem === "function" && addItem(id)){
        if(typeof log === "function") log("Bought salvage containing "+ITEMS[id].name+".");
        if(typeof toast === "function") toast("Found: "+ITEMS[id].name);
      }else{
        state.money+=12;
        if(typeof toast === "function") toast("Your storage is full.");
      }
      if(typeof render === "function") render();
    };
  }

  // ------------------------------------------------------------
  // EVERY CHOICE LEAVES A TRACE
  // ------------------------------------------------------------
  state.choiceHistory=Array.isArray(state.choiceHistory)?state.choiceHistory:[];
  state.influence=state.influence||{curiosity:0,caution:0,greed:0,defiance:0};

  function classify(label){
    const s=String(label).toLowerCase();
    const out={curiosity:0,caution:0,greed:0,defiance:0};
    if(/inspect|search|investigate|study|watch|listen|look|follow|test|record|reply|ask|open|take a look|play|mark|write|use|lift|approach/.test(s)) out.curiosity=1;
    if(/ignore|leave|decline|refuse|destroy|stay inside|wait inside|don't|do nothing|put it away|pass|unplug|lock the door|stay out/.test(s)) out.caution=1;
    if(/sell|accept|buy|money|payment|keep it|take it/.test(s)) out.greed=1;
    if(/reply|confront|outside|risk|break|shake|return|throw/.test(s)) out.defiance=1;
    return out;
  }

  if(typeof window.eventChoice === "function"){
    const originalChoice=window.eventChoice;
    window.eventChoice=function(i){
      const e=window.currentEvent;
      const label=e && e.choices && e.choices[i] ? e.choices[i][0] : "Unknown choice";
      const f=classify(label);
      state.influence.curiosity+=f.curiosity;
      state.influence.caution+=f.caution;
      state.influence.greed+=f.greed;
      state.influence.defiance+=f.defiance;
      state.choiceHistory.push({day:state.day,event:e?e.title:"Unknown",choice:label});
      state.choiceHistory=state.choiceHistory.slice(-100);
      state.lastChoice={day:state.day,event:e?e.title:"Unknown",choice:label};
      originalChoice.call(this,i);
      saveGame();
    };
  }

  // ------------------------------------------------------------
  // DELAYED CONSEQUENCES
  // ------------------------------------------------------------
  // The next-day button already has a concrete onclick handler in index.html.
  // Wrap that handler so choices affect a later day rather than merely being
  // remembered in a variable.
  const dayPill=document.getElementById("day");
  const dayButton=dayPill && dayPill.parentElement;
  if(dayButton && typeof dayButton.onclick === "function"){
    const originalNextDay=dayButton.onclick;
    dayButton.onclick=function(ev){
      const inf=state.influence||{};
      const before=state.day;
      originalNextDay.call(this,ev);
      if(state.day===before) return;

      let consequence=null;

      if((inf.curiosity||0)>=2 && Math.random()<0.35){
        const id=EXTRA_POOL[Math.floor(Math.random()*EXTRA_POOL.length)];
        if(addItem(id)) consequence="Your earlier curiosity led you to notice something left with today's mail: "+ITEMS[id].name+".";
      }

      if((inf.caution||0)>=2 && Math.random()<0.30){
        state.money+=2;
        consequence=consequence?consequence+" You also found $2 that had been tucked somewhere safe.":"Your cautious choices paid off: you found $2 that had been tucked somewhere safe.";
      }

      if((inf.greed||0)>=2 && Math.random()<0.30){
        state.money+=5;
        consequence=consequence?consequence+" An old buyer sent you an unexpected $5 bonus.":"An old buyer sent you an unexpected $5 bonus.";
      }

      if((inf.defiance||0)>=2 && Math.random()<0.25){
        if(typeof discover === "function") discover("Someone Noticed","Your decisions are beginning to attract attention.");
        consequence=consequence?consequence+" Someone appears to have noticed what you've been doing.":"Someone appears to have noticed what you've been doing.";
      }

      if(consequence && typeof log === "function") log(consequence);
      saveGame();
      if(typeof render === "function") render();
    };
  }

  // ------------------------------------------------------------
  // SAVE MIGRATION
  // ------------------------------------------------------------
  // Older saves simply acquire the new fields without losing anything.
  state.choiceHistory=Array.isArray(state.choiceHistory)?state.choiceHistory:[];
  state.influence=state.influence||{curiosity:0,caution:0,greed:0,defiance:0};
  saveGame();
})();
