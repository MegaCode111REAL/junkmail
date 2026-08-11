(() => {
  "use strict";

  /*
   * JUNKMAIL expansion layer.
   * Loaded after the main game script so it can work with the existing save,
   * inventory, event and discovery systems without replacing the game.
   */

  const AUs = {
    sender:{name:"The Sender",item:{id:"sender_manifest",name:"Old Delivery Manifest",emoji:"📋",value:14,tags:["paper","mystery"],desc:"A list of deliveries in familiar handwriting.",clue:"Every sender and recipient is the same person."}},
    thing:{name:"The Thing Behind the Deliveries",item:{id:"warm_metal",name:"Warm Piece of Metal",emoji:"🔩",value:8,tags:["metal","mystery"],desc:"It never seems to cool down.",clue:"It becomes warmer when the house is quiet."}},
    maintenance:{name:"The Maintenance System",item:{id:"maintenance_tag",name:"Maintenance Tag",emoji:"🏷️",value:5,tags:["paper","mystery"],desc:"It has no company logo.",clue:"It says the package is necessary for continued operation."}},
    house:{name:"The House Was Here First",item:{id:"old_nail",name:"Old Iron Nail",emoji:"📌",value:4,tags:["metal","old"],desc:"Far older than anything else in the house.",clue:"Its metal matches the strange coin."}},
    reset:{name:"The Resetting World",item:{id:"cycle_receipt",name:"Impossible Receipt",emoji:"🧾",value:3,tags:["paper","mystery"],desc:"The date on it has not happened yet.",clue:"The receipt has the same order number as an older receipt."}},
    delivered:{name:"The Player Was Delivered",item:{id:"shipping_label",name:"Unaddressed Shipping Label",emoji:"🏷️",value:2,tags:["paper","mystery"],desc:"The destination is your house.",clue:"The recipient field appears to describe a person, not a name."}},
    missing:{name:"The Missing Customer",item:{id:"blank_customer_card",name:"Blank Customer Card",emoji:"💳",value:2,tags:["data","mystery"],desc:"A customer card with no name.",clue:"The account number belongs to your house, but not to its owner."}},
    memories:{name:"The Packages Are Memories",item:{id:"memory_token",name:"Familiar Object",emoji:"🧩",value:4,tags:["memory","mystery"],desc:"You have never seen it before. It feels familiar anyway.",clue:"Touching it briefly makes someone else's memory feel like your own."}},
    people:{name:"The People Know",item:{id:"rehearsed_note",name:"Rehearsed Note",emoji:"📝",value:3,tags:["paper","mystery"],desc:"Several people seem to have copied the same sentence.",clue:"The handwriting changes, but the wording does not."}},
    experiment:{name:"The Experiment",item:{id:"test_card",name:"Behaviour Test Card",emoji:"🪪",value:6,tags:["data","mystery"],desc:"A card covered in checkboxes.",clue:"One column records choices made by someone who lived here before you."}},
    copies:{name:"The Copying Universe",item:{id:"wrong_coin",name:"Wrong Coin",emoji:"🪙",value:9,tags:["metal","mystery"],desc:"Almost identical to a normal coin.",clue:"The country stamped on it does not exist here."}},
    occupant:{name:"The Wrong Occupant",item:{id:"handwritten_note",name:"Handwritten Note",emoji:"✉️",value:1,tags:["paper","mystery"],desc:"The handwriting feels strangely personal.",clue:"It says: 'Please give my life back.'"}},
    empty:{name:"The Empty Sender",item:{id:"blank_label",name:"Blank Sender Label",emoji:"🏷️",value:1,tags:["paper","mystery"],desc:"There is no sender printed on it.",clue:"The blank space seems to change when you look away."}}
  };
  const AU_IDS=Object.keys(AUs);

  function ensureState(){
    if(!state.au||!AUs[state.au]) state.au=AU_IDS[Math.floor(Math.random()*AU_IDS.length)];
    if(!state.story) state.story={choices:0,attention:0,suspicion:0,trust:0,resistance:0,connectedClues:0,auProgress:0,flags:{},choiceHistory:[]};
    state.story.choices=Number(state.story.choices||0);state.story.attention=Number(state.story.attention||0);state.story.suspicion=Number(state.story.suspicion||0);state.story.trust=Number(state.story.trust||0);state.story.resistance=Number(state.story.resistance||0);state.story.connectedClues=Number(state.story.connectedClues||0);state.story.auProgress=Number(state.story.auProgress||0);state.story.flags=state.story.flags||{};state.story.choiceHistory=state.story.choiceHistory||[];
    const ai=AUs[state.au].item;if(!ITEMS[ai.id])ITEMS[ai.id]=ai;
  }
  ensureState();saveGame();

  const style=document.createElement("style");style.textContent=`
    .log{background:#151712!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;font-size:13px!important;line-height:1.45!important;padding:8px!important}
    .log-entry{padding:9px 10px;margin:0 0 6px;border:1px solid #303329;border-radius:8px;background:#1c1e19}.log-day{display:block;color:#a9aa9a;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px}.log-text{color:#eee9d8}
    .discovery-entry{border-left:3px solid var(--accent);padding:11px 13px;background:#20221c;border-radius:7px;margin-bottom:9px}.discovery-day{color:#a9aa9a;font-size:11px}.discovery-new{float:right;color:#e3b95b;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
    .event-result{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);width:min(720px,calc(100vw - 30px));padding:17px 20px;background:#24271f;border:1px solid #656a57;border-radius:14px;box-shadow:0 12px 40px #0009;opacity:0;pointer-events:none;transition:opacity .22s ease,transform .22s ease;z-index:20}.event-result.show{opacity:1;transform:translate(-50%,0)}.event-result-title{font-size:17px;font-weight:800;margin-bottom:7px}.event-result-line{font-size:14px;color:#eee9d8;margin-top:3px}.event-result-line.good{color:#9bdd8d}.event-result-line.bad{color:#e58b84}.event-result-line.muted{color:#b9b9aa}
  `;document.head.appendChild(style);

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  function result(title,lines,duration=6500){
    let box=document.getElementById("eventResult");if(!box){box=document.createElement("div");box.id="eventResult";box.className="event-result";document.body.appendChild(box)}
    clearTimeout(window.__junkmailResultTimer);const arr=(Array.isArray(lines)?lines:[lines]).filter(Boolean);
    box.innerHTML=`<div class="event-result-title">${escapeHtml(title)}</div>`+arr.map(x=>{const value=typeof x==="string"?x:x.text;const cls=typeof x==="string"?"":(x.className||"");return `<div class="event-result-line ${cls}">${escapeHtml(value)}</div>`}).join("");
    box.classList.add("show");window.__junkmailResultTimer=setTimeout(()=>box.classList.remove("show"),duration);
  }
  function snapshot(){return{money:state.money,inv:state.inv.map(x=>x.uid),discoveries:state.discoveries.length,attention:state.story.attention,suspicion:state.story.suspicion,trust:state.story.trust,resistance:state.story.resistance,auProgress:state.story.auProgress};}
  function diff(b){
    const lines=[],money=state.money-b.money;if(money>0)lines.push({text:`+$${money}`,className:"good"});if(money<0)lines.push({text:`-$${Math.abs(money)}`,className:"bad"});
    state.inv.filter(x=>!b.inv.includes(x.uid)).forEach(x=>lines.push({text:`+ ${ITEMS[x.id]?.name||x.id}`,className:"good"}));
    b.inv.filter(uid=>!state.inv.some(x=>x.uid===uid)).forEach(()=>lines.push({text:"An item left your collection.",className:"bad"}));
    if(state.discoveries.length>b.discoveries)lines.push({text:"New discovery recorded.",className:"good"});
    if(state.story.suspicion!==b.suspicion)lines.push({text:`Suspicion is now ${state.story.suspicion}.`,className:"muted"});
    if(state.story.trust!==b.trust)lines.push({text:`Trust changed to ${state.story.trust}.`,className:"muted"});
    if(state.story.resistance!==b.resistance)lines.push({text:"Something resisted your decision.",className:"bad"});return lines;
  }
  function improvedRenderLog(){const el=document.getElementById("log");if(!el)return;el.innerHTML=(state.logs||[]).map(entry=>{const m=String(entry).match(/^Day (\d+) — (.*)$/);const day=m?m[1]:"",text=m?m[2]:entry;return `<div class="log-entry">${day?`<span class="log-day">Day ${escapeHtml(day)}</span>`:""}<span class="log-text">${escapeHtml(text)}</span></div>`}).join("");}
  function improvedShowDiscoveries(){const list=[...(state.discoveries||[])].reverse();const content=list.length?list.map((d,i)=>`<div class="discovery-entry">${i===0?'<span class="discovery-new">Most recent</span>':''}<b>${escapeHtml(d.name)}</b><br><span class="muted">${escapeHtml(d.desc)}</span><br><span class="discovery-day">Discovered on Day ${escapeHtml(String(d.day))}</span></div>`).join(""):"<p class='muted'>No discoveries yet.</p>";modal(`<h2>📓 Discoveries</h2>${content}`);}

  const originalEventChoice=window.eventChoice;
  window.eventChoice=function(index){
    const event=window.currentEvent;if(!event||!event.choices[index])return;ensureState();const before=snapshot(),choiceText=event.choices[index][0];
    originalEventChoice(index);
    state.story.choices++;state.story.choiceHistory.unshift({day:state.day,event:event.title,choice:choiceText});state.story.choiceHistory=state.story.choiceHistory.slice(0,100);
    const n=choiceText.toLowerCase();
    if(/ignore|decline|refuse|leave|pass|do nothing|stay inside|don't|destroy|throw/.test(n)){state.story.attention=Math.max(0,state.story.attention-1);if(n.includes("ignore"))state.story.suspicion=Math.max(0,state.story.suspicion-1)}
    else if(/sell|accept|show|open|search|investigate|listen|reply|take|inspect|record|look|watch|ask|keep|test|use|mark/.test(n)){state.story.attention++;if(/sell|reply|search|investigate|record|open|test/.test(n))state.story.suspicion++}
    if(/ask|help|return|accept|show/.test(n))state.story.trust++;if(/refuse|destroy|ignore|decline/.test(n))state.story.trust--;
    if((state.au==="occupant"||state.au==="sender")&&chance(.10)){state.story.resistance++;state.story.flags.lastResistance=true;}
    let lines=diff(before);if(!lines.length)lines.push({text:`Your decision was recorded. Investigation attention: ${state.story.attention}.`,className:"muted"});lines.push({text:`Choice ${state.story.choices} will influence what happens later.`,className:"muted"});result(choiceText,lines);saveGame();render();
  };

  const originalSellSelected=window.sellSelected;
  window.sellSelected=function(){const selected=state.inv.find(x=>x.uid===state.selected);if(!selected)return;const name=ITEMS[selected.id]?.name||selected.id,before=snapshot();originalSellSelected();if(state.inv.length<before.inv.length)result("Item sold",[{text:`${name} is no longer in your collection.`,className:"good"},{text:`You received $${state.money-before.money}.`,className:"good"}]);};

  const originalOpenPackage=window.openPackage;
  window.openPackage=function(){
    ensureState();originalOpenPackage();const special=AUs[state.au].item;let added=false;
    if(state.day>=2&&chance(.34)){added=addItem(special.id);if(added){state.story.auProgress++;log("Something about today's package feels specific to this house.");}}
    if(added){result("Something doesn't belong",[{text:`+ ${special.name}`,className:"good"},{text:special.desc,className:"muted"}]);render();}else if(state.day>=2&&chance(.08))result("The package was ordinary","For once, nothing seems unusual.");saveGame();
  };

  const originalNextDay=window.nextDay;
  window.nextDay=function(){
    ensureState();originalNextDay();if(state.day<3||chance(.52))return;
    const special=AUs[state.au].item;
    const events={
      sender:{title:"📋 A Delivery Manifest",text:"A folded manifest is sitting under your door. The handwriting looks like yours, except you know it isn't.",choices:[["Read it",()=>{discover("The Sender","The original person appears to have sent packages before you arrived.");state.story.auProgress+=2;log("Read a delivery manifest written by the original person.");}],["Hide it",()=>{state.story.suspicion++;log("You hid the manifest instead of reading it.");}],["Destroy it",()=>{state.story.auProgress=Math.max(0,state.story.auProgress-1);log("You destroyed evidence about whoever was sending the packages.");}]]},
      thing:{title:"🌙 Something Outside",text:"There is a shape standing beyond the back fence. It is looking at the house, not at you.",choices:[["Watch it",()=>{state.story.suspicion+=2;discover("Something Outside","Something appears to be waiting for the original person to finish receiving something.");log("Watched the thing outside.");}],["Lock the house",()=>{state.story.trust++;log("Locked every door and window.");}],["Go outside",()=>{state.story.resistance++;log("You stepped outside. The shape was gone.");}]]},
      maintenance:{title:"📦 Missing Delivery",text:"For the first time, no package arrives. A neighbour asks if you are feeling all right.",choices:[["Ask about the packages",()=>{discover("The Maintenance System","People become uneasy when deliveries stop.");state.story.auProgress+=2;log("Asked why the missing package mattered.");}],["Say nothing",()=>{state.story.attention=Math.max(0,state.story.attention-1);log("Pretended the missing delivery was normal.");}],["Check the mailbox",()=>{if(addItem(special.id)){state.story.auProgress++;log("Found a maintenance tag where the package should have been.");}}]]},
      house:{title:"🏚️ Under the Shed",text:"Something metallic is visible beneath the shed floor. It looks much older than the house.",choices:[["Dig",()=>{state.story.auProgress+=2;discover("Beneath the Shed","Something predates the house and the delivery system built around it.");log("Dug beneath the shed.");}],["Photograph it",()=>{state.story.attention++;discover("Old Foundation","The shed appears to have been built before the rest of the property.");log("Photographed the strange foundation.");}],["Cover it",()=>{state.story.auProgress=Math.max(0,state.story.auProgress-1);log("Covered the strange metal again.");}]]},
      reset:{title:"🔁 Yesterday Again",text:"The morning feels familiar. Your package is wrapped exactly the way yesterday's was.",choices:[["Compare them",()=>{state.story.auProgress+=2;discover("A Repeated Package","The same packaging has appeared on two different days.");log("Compared today's package with yesterday's.");}],["Open it",()=>{state.story.attention++;log("Opened the repeated package without comparing it.");}],["Leave it unopened",()=>{state.story.suspicion++;log("Left the impossible package unopened.");}]]},
      delivered:{title:"🏷️ A Label For You",text:"A shipping label has appeared on your desk. The destination is your house. The recipient is described as a person who lives here.",choices:[["Keep it",()=>{state.story.auProgress+=2;discover("The Shipping Label","The delivery system can identify the house without naming the person who lives there.");log("Kept the strange shipping label.");}],["Tear it up",()=>{state.story.attention--;log("Destroyed the shipping label.");}],["Compare the handwriting",()=>{state.story.attention++;discover("The Handwriting","The label's writing does not match yours, but it belongs to the person whose life you are living.");log("Compared the label with the old photograph and notes.");}]]},
      missing:{title:"💳 The Blank Account",text:"The marketplace has found a customer account connected to your address. The name field is empty.",choices:[["Open the account",()=>{state.story.auProgress+=2;discover("The Missing Customer","Your house has an account, but the original person's identity has been removed from it.");log("Opened the blank customer account.");}],["Close it",()=>{state.story.trust--;log("Closed the account before reading it.");}],["Save the number",()=>{state.story.attention++;discover("The Account Number","The blank account is still tied to the house.");log("Saved the account number.");}]]},
      memories:{title:"🧩 Something Familiar",text:"The strange object from your collection gives you a memory that is not yours.",choices:[["Hold it",()=>{state.story.auProgress+=2;discover("Someone Else's Memory","You remembered a room you have never entered, from the original person's point of view.");log("Held the familiar object and remembered someone else's life.");}],["Put it away",()=>{state.story.attention--;log("Put the object somewhere you could not see it.");}],["Sell it",()=>{const x=find(special.id);if(x){removeItem(x.uid);state.money+=special.value;state.stats.sold++;state.story.auProgress=Math.max(0,state.story.auProgress-1);log("Sold the object that was triggering the strange memory.");}else log("You no longer had the strange object.");}]]},
      people:{title:"🧑 Everyone Says The Same Thing",text:"Three people independently use exactly the same sentence when you mention the packages.",choices:[["Call them out",()=>{state.story.suspicion+=2;state.story.auProgress+=2;discover("They Know","The people around you are pretending that everything is normal.");log("Confronted someone about the rehearsed explanation.");}],["Pretend not to notice",()=>{state.story.attention--;log("Pretended the repeated wording was normal.");}],["Ask one person privately",()=>{state.story.trust+=2;discover("A Crack In The Story","Someone privately admitted that the original person was different before you arrived.");log("Asked someone privately what happened.");}]]},
      experiment:{title:"🧪 Your Behaviour Has A Record",text:"You find a form documenting decisions made by the person who lived here before you.",choices:[["Read everything",()=>{state.story.auProgress+=2;discover("The Experiment","Someone has been recording how the original person behaves, and now your choices are being recorded too.");log("Read the behaviour record.");}],["Hide the record",()=>{state.story.suspicion++;log("Hid the behaviour record.");}],["Destroy it",()=>{state.story.resistance++;log("Destroyed the behaviour record.");}]]},
      copies:{title:"🪙 A Coin From Nowhere",text:"A coin arrives with the same symbol as your strange coin, but the country on it does not exist in this world.",choices:[["Keep both coins",()=>{state.story.auProgress+=2;discover("Another World","The same object exists with a different history.");log("Kept the impossible coin beside the original.");}],["Sell it",()=>{state.money+=9;state.story.attention++;log("Sold the impossible coin before anyone could ask questions.");}],["Compare them",()=>{state.story.auProgress+=3;discover("Two Versions","The coins are almost identical, but their tiny differences are deliberate.");log("Compared the two coins.");}]]},
      occupant:{title:"✉️ Please Give It Back",text:"A note is waiting on your desk. You recognize the handwriting from the old photograph and documents.",choices:[["Answer it",()=>{state.story.resistance+=2;state.story.auProgress+=2;discover("The Original Person","Someone is still trying to reach you from inside the life you are controlling.");log("Answered the note from the original person.");}],["Hide it",()=>{state.story.resistance++;log("Hid the note from the original person.");}],["Destroy it",()=>{state.story.resistance+=2;state.story.auProgress=Math.max(0,state.story.auProgress-1);log("Destroyed the note.");}]]},
      empty:{title:"🏷️ No Sender",text:"The next package has no sender. Not a blank name — there is simply no sender field at all.",choices:[["Study the label",()=>{state.story.auProgress+=2;discover("The Empty Sender","The package has a destination and a recipient, but no origin.");log("Studied the senderless package.");}],["Assume it is normal",()=>{state.story.attention--;log("Treated the missing sender as ordinary.");}],["Write your own name",()=>{state.story.suspicion+=2;state.story.auProgress++;discover("The Label Changed","The blank sender field changed after you wrote a name beside it.");log("Wrote a name into the empty sender field.");}]]}
    };
    const e=events[state.au];if(e)showEvent(e);
  };

  const originalDiscover=window.discover;
  window.discover=function(name,desc){const before=state.discoveries.length;originalDiscover(name,desc);if(state.discoveries.length>before){state.story.connectedClues++;state.story.auProgress++;result("Discovery",[{text:name,className:"good"},{text:desc,className:"muted"}],5200);}};

  window.renderLog=improvedRenderLog;window.showDiscoveries=improvedShowDiscoveries;
  window.junkmailDebug={getAU:()=>state.au,getStory:()=>JSON.parse(JSON.stringify(state.story)),getAUName:()=>AUs[state.au].name};

  /* The original page bound these handlers before this file loaded. Rebind
     them here so the expanded wrappers are actually used by the buttons. */
  const openBtn=document.getElementById("openBtn");if(openBtn)openBtn.onclick=window.openPackage;
  const buyBtn=document.getElementById("buyBtn");if(buyBtn)buyBtn.onclick=window.buyBox;
  const dayPill=document.getElementById("day")?.parentElement;
  if(dayPill)dayPill.onclick=()=>{if(!state.openedToday)toast("Open today's package first.");else window.nextDay();};

  improvedRenderLog();saveGame();
})();
