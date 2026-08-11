/* JUNKMAIL — Interconnected choices + extra junk + rare rent event
 * Load after index.html, improvements.js and tutorial.js.
 * No visible RPG-style stats: choices leave subtle traces instead.
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

  const EXTRA_POOL=["flashlight","receipt","envelope","phone","mirror","label","memorycard","bolt","string","keycard","mirrorShard","deliveryTag"];

  // ------------------------------------------------------------
  // SUBTLE CHOICE HISTORY
  // ------------------------------------------------------------
  state.choiceHistory=Array.isArray(state.choiceHistory)?state.choiceHistory:[];
  state.influence=state.influence||{curiosity:0,caution:0,greed:0,defiance:0};

  const FEEDBACK={
    curiosity:[
      "You find yourself wanting to know more.",
      "You can't quite let it go.",
      "Something about it keeps bothering you.",
      "You wonder what else you've missed.",
      "You feel a little more curious than before."
    ],
    caution:[
      "You feel a little more careful about what you trust.",
      "Something tells you to be more careful.",
      "You find yourself thinking twice before acting.",
      "You feel slightly more hesitant than before.",
      "You decide it's probably better not to take unnecessary risks."
    ],
    greed:[
      "You find yourself thinking a little more about what things are worth.",
      "The money is starting to seem strangely important.",
      "You wonder how much you could get for it.",
      "You feel a little more tempted by the easy option.",
      "You start looking at things differently."
    ],
    defiance:[
      "You feel a little less willing to simply accept things.",
      "Something in you wants to push back.",
      "You feel like you're starting to question the rules.",
      "You don't like being told what to do.",
      "You find yourself wondering what would happen if you refused."
    ]
  };

  function classify(label){
    const s=String(label).toLowerCase();
    const out={curiosity:0,caution:0,greed:0,defiance:0};
    if(/inspect|search|investigate|study|watch|listen|look|follow|test|record|ask|open|play|mark|write|use|examine|read/.test(s)) out.curiosity=1;
    if(/ignore|leave|decline|refuse|destroy|stay inside|wait inside|don't|do nothing|put it away|pass|unplug|lock the door|stay out/.test(s)) out.caution=1;
    if(/sell|accept|buy|money|payment|keep it|take it/.test(s)) out.greed=1;
    if(/reply|confront|outside|risk|break|shake|return|throw|challenge/.test(s)) out.defiance=1;
    return out;
  }

  function subtleFeedback(f){
    const keys=Object.keys(f).filter(k=>f[k]);
    if(!keys.length || Math.random()<0.18) return;
    const key=keys[Math.floor(Math.random()*keys.length)];
    if(typeof toast === "function") toast(FEEDBACK[key][Math.floor(Math.random()*FEEDBACK[key].length)]);
  }

  if(typeof window.eventChoice === "function"){
    const originalChoice=window.eventChoice;
    window.eventChoice=function(i){
      const e=window.currentEvent;
      const label=e&&e.choices&&e.choices[i]?e.choices[i][0]:"Unknown choice";
      const f=classify(label);
      state.influence.curiosity+=f.curiosity;
      state.influence.caution+=f.caution;
      state.influence.greed+=f.greed;
      state.influence.defiance+=f.defiance;
      state.choiceHistory.push({day:state.day,event:e?e.title:"Unknown",choice:label});
      state.choiceHistory=state.choiceHistory.slice(-100);
      subtleFeedback(f);
      originalChoice.call(this,i);
      saveGame();
    };
  }

  // ------------------------------------------------------------
  // EXTRA ITEMS IN PACKAGES
  // ------------------------------------------------------------
  const openBtn=document.getElementById("openBtn");
  if(openBtn && typeof openBtn.onclick === "function"){
    const originalOpen=openBtn.onclick;
    openBtn.onclick=function(ev){
      const before=state.openedToday;
      originalOpen.call(this,ev);
      if(!before && state.openedToday && Math.random()<0.24){
        const id=EXTRA_POOL[Math.floor(Math.random()*EXTRA_POOL.length)];
        if(typeof addItem === "function" && addItem(id)){
          if(typeof log === "function") log("Something else was tucked beneath the packaging: "+ITEMS[id].name+".");
          if(typeof render === "function") render();
        }
      }
    };
  }

  // ------------------------------------------------------------
  // MARKETPLACE
  // ------------------------------------------------------------
  const shop=document.getElementById("shopTab");
  if(shop && !document.getElementById("extraJunkMarket")){
    const box=document.createElement("div");
    box.id="extraJunkMarket";
    box.className="event";
    box.innerHTML='<b>🗃️ Salvage Listing — $12</b><br><span class="muted">A random piece of old household junk. Some listings seem oddly specific.</span><div class="actions"><button id="buySalvageBtn">Buy salvage ($12)</button></div>';
    shop.appendChild(box);
    document.getElementById("buySalvageBtn").onclick=function(){
      if(state.money<12){toast("Not enough money.");return}
      state.money-=12;state.stats.spent=(state.stats.spent||0)+12;
      const id=EXTRA_POOL[Math.floor(Math.random()*EXTRA_POOL.length)];
      if(typeof addItem === "function" && addItem(id)) log("Bought salvage containing "+ITEMS[id].name+".");
      else state.money+=12;
      render();
    };
  }

  // ------------------------------------------------------------
  // VERY RARE EARLY RENT EVENT
  // ------------------------------------------------------------
  // Only considered during the first 20 days, and deliberately very rare.
  // The rent is eight times current money, so it can push the player deep
  // into debt. Negative money is allowed by the existing game.
  const dayPill=document.getElementById("day");
  const dayButton=dayPill&&dayPill.parentElement;
  if(dayButton && typeof dayButton.onclick === "function"){
    const originalNextDay=dayButton.onclick;
    dayButton.onclick=function(ev){
      const before=state.day;
      originalNextDay.call(this,ev);
      if(state.day===before) return;

      if(state.day<=20 && !state.rentEventSeen && Math.random()<0.018){
        state.rentEventSeen=true;
        const amount=Math.max(1,Math.floor((state.money||0)*8));
        state.money-=amount;
        if(typeof log === "function") log("A rent notice arrives. It costs $"+amount+". Somehow, you are now in debt.");
        if(typeof toast === "function") toast("A rent notice arrives. You owe $"+amount+".");
        saveGame();render();
      }
    };
  }

  // ------------------------------------------------------------
  // DELAYED CONSEQUENCES — NO NUMBERS SHOWN TO PLAYER
  // ------------------------------------------------------------
  // Choices can quietly influence later gameplay. Effects are intentionally
  // sparse so the player experiences them as story rather than statistics.
  if(dayButton && typeof dayButton.onclick === "function"){
    const previousDayHandler=dayButton.onclick;
    dayButton.onclick=function(ev){
      const before=state.day;
      previousDayHandler.call(this,ev);
      if(state.day===before) return;
      const inf=state.influence||{};
      let changed=false;

      if((inf.curiosity||0)>=3 && Math.random()<0.22){
        const id=EXTRA_POOL[Math.floor(Math.random()*EXTRA_POOL.length)];
        if(addItem(id)){
          log("You notice something that you might have overlooked before: "+ITEMS[id].name+".");
          changed=true;
        }
      }

      if((inf.caution||0)>=3 && Math.random()<0.18){
        state.money+=2;
        log("You find $2 somewhere you had put it for safekeeping.");
        changed=true;
      }

      if((inf.greed||0)>=3 && Math.random()<0.18){
        state.money+=5;
        log("An old buyer sends you a small unexpected payment.");
        changed=true;
      }

      if((inf.defiance||0)>=3 && Math.random()<0.16){
        if(typeof discover === "function") discover("Someone Noticed","Your decisions seem to have attracted someone's attention.");
        log("You get the uncomfortable feeling that someone has noticed what you've been doing.");
        changed=true;
      }

      if(changed){saveGame();render();}
    };
  }

  state.rentEventSeen=!!state.rentEventSeen;
  saveGame();
})();
