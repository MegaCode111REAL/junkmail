/* JUNKMAIL — Alternate Universe Storylines
 *
 * Load this AFTER index.html's main script, improvements.js, tutorial.js,
 * game_expansion.js, and any script that modifies eventChoice.
 *
 * The story is implemented as persistent state transitions. Actions, items,
 * discoveries, event choices, selling, combinations, and days can move the
 * selected universe forward. This follows the state-machine approach used in
 * game logic: an input causes a transition to the next story state. See MDN's
 * state-machine overview: https://developer.mozilla.org/en-US/docs/Glossary/State_machine
 */
(function(){
  "use strict";

  if(typeof window === "undefined" || typeof state === "undefined") return;

  const AU = {
    SENDER: {
      id:"sender", name:"The Sender",
      stages:[
        "Something about the labels feels familiar.",
        "The handwriting is yours.",
        "The system has two versions of you.",
        "You are both sender and recipient.",
        "The sender-self is making decisions you did not make."
      ]
    },
    THING: {
      id:"thing", name:"The Thing Behind the Deliveries",
      stages:[
        "The packages are becoming too specific.",
        "Something is selecting what you receive.",
        "The deliveries stop.",
        "Something starts moving around the house.",
        "The shed is the safest place you have."
      ]
    },
    NO_SENDER: {
      id:"no_sender", name:"Everyone Is Receiving Them",
      stages:[
        "Nobody can explain where packages begin.",
        "The warehouse contains boxes that arrived already packed.",
        "The system seems to exist for a reason.",
        "Something goes wrong when deliveries stop.",
        "The packages are maintaining the world."
      ]
    },
    HOUSE: {
      id:"house", name:"The House Was Here First",
      stages:[
        "The photograph is older than the house should be.",
        "The shed predates everything around it.",
        "The house was built around the shed.",
        "Something was buried beneath it.",
        "The house was waiting for you."
      ]
    },
    RESET: {
      id:"reset", name:"The Resetting World",
      stages:[
        "Something has happened before.",
        "Objects are surviving changes that people do not.",
        "You find evidence from another run.",
        "The world is approaching the point where it resets.",
        "You have to reach the end without forgetting."
      ]
    },
    PLAYER_PACKAGE: {
      id:"player_package", name:"The Player Is the Package",
      stages:[
        "Your arrival does not appear in any record.",
        "Something about you has a shipping history.",
        "You find a label that describes you.",
        "You discover that you were delivered.",
        "Someone ordered you."
      ]
    },
    CUSTOMER: {
      id:"customer", name:"The Customer Who Never Existed",
      stages:[
        "Delivery records don't quite add up.",
        "Other people's packages keep pointing back to you.",
        "Your address has a strange status.",
        "There is no customer record for you.",
        "The system is trying to recreate a missing account."
      ]
    },
    MEMORIES: {
      id:"memories", name:"The Packages Are Memories",
      stages:[
        "Some objects feel strangely familiar.",
        "Keeping certain objects brings back fragments.",
        "Selling something makes a memory harder to hold onto.",
        "Your past is returning piece by piece.",
        "You have to decide whether remembering is worth it."
      ]
    },
    PEOPLE_KNOW: {
      id:"people_know", name:"The People Know",
      stages:[
        "People are answering questions too perfectly.",
        "The same words keep appearing in different mouths.",
        "Someone breaks character.",
        "The town is trying to keep you quiet.",
        "Someone finally tells you what they are afraid of."
      ]
    },
    COMPANY: {
      id:"company", name:"The Delivery Company",
      stages:[
        "Your behavior is being noticed.",
        "Someone seems to be recording your choices.",
        "You find your behavior described like an experiment.",
        "There are other versions of the experiment.",
        "Something is comparing your universe to the others."
      ]
    },
    COPIES: {
      id:"copies", name:"The Universe Is Copying Itself",
      stages:[
        "Some objects are almost right.",
        "You find evidence from somewhere that isn't here.",
        "The differences are accumulating.",
        "The packages are carrying information between copies.",
        "Another version of you knows you exist."
      ]
    },
    EMPTY: {
      id:"empty", name:"The Empty Sender",
      stages:[
        "The sender field never looks quite right.",
        "It seems to reflect what you expect to see.",
        "You catch the world changing around your assumptions.",
        "The mystery may be reacting to you.",
        "You can no longer tell whether you discovered the mystery or created it."
      ]
    }
  };

  const AULIST=Object.values(AU);

  // These items are deliberately story objects, not stat bonuses.
  const STORY_ITEMS={
    sender_label:{name:"Impossible Delivery Label",emoji:"🏷️",value:0,tags:["paper","story","mystery"],desc:"The sender and recipient are both you."},
    sender_manifest:{name:"Tomorrow's Manifest",emoji:"📋",value:0,tags:["paper","story","mystery"],desc:"A delivery list containing tomorrow's date."},
    warm_tag:{name:"Warm Metal Tag",emoji:"🔖",value:0,tags:["metal","story","mystery"],desc:"It is warm even when the room is cold."},
    escape_key:{name:"Shed Escape Key",emoji:"🗝️",value:0,tags:["key","story"],desc:"A key that was not in the shed yesterday."},
    warehouse_ticket:{name:"Warehouse Ticket",emoji:"🎫",value:0,tags:["paper","story"],desc:"It says the package arrived already packed."},
    house_foundation:{name:"Foundation Fragment",emoji:"🧱",value:0,tags:["stone","story"],desc:"A piece of something much older than the house."},
    reset_receipt:{name:"Previous-Day Receipt",emoji:"🧾",value:0,tags:["paper","story","mystery"],desc:"It is dated tomorrow, but lists yesterday's purchases."},
    delivery_label:{name:"Personal Shipping Label",emoji:"📦",value:0,tags:["paper","story","mystery"],desc:"The contents field describes you."},
    missing_account:{name:"Missing Customer Card",emoji:"💳",value:0,tags:["data","story"],desc:"Your customer number is blank."},
    memory_fragment:{name:"Memory Fragment",emoji:"🧠",value:0,tags:["memory","story"],desc:"Holding it makes one forgotten place feel familiar."},
    warning_note:{name:"Warning Note",emoji:"⚠️",value:0,tags:["paper","story"],desc:"Someone wrote: YOU ARE NOT SUPPOSED TO NOTICE."},
    experiment_card:{name:"Observation Card",emoji:"🗂️",value:0,tags:["data","story"],desc:"Your behavior is listed in neat categories."},
    foreign_coin:{name:"Wrong Coin",emoji:"🪙",value:0,tags:["metal","story","mystery"],desc:"The country printed on it does not exist here."},
    blank_sender:{name:"Blank Sender Slip",emoji:"⬜",value:0,tags:["paper","story","mystery"],desc:"The sender field changes when you stop looking at it."}
  };

  window.JUNKMAIL_AU=AU;
  window.JUNKMAIL_AU_LIST=AULIST;

  function ensureItems(){
    if(typeof window.ITEMS !== "object") return;
    Object.keys(STORY_ITEMS).forEach(id=>{
      if(!ITEMS[id]) ITEMS[id]=STORY_ITEMS[id];
    });
  }
  ensureItems();

  function save(){
    try{ if(typeof window.saveGame === "function") window.saveGame(); }
    catch(e){ console.warn("JUNKMAIL storyline save failed",e); }
  }

  function ensureState(){
    state.storyline=state.storyline||{};
    if(!state.storyline.auId){
      const pick=AULIST[Math.floor(Math.random()*AULIST.length)];
      state.storyline.auId=pick.id;
    }
    const au=AULIST.find(x=>x.id===state.storyline.auId)||AULIST[0];
    state.storyline.stage=Number.isFinite(state.storyline.stage)?state.storyline.stage:0;
    state.storyline.flags=state.storyline.flags||{};
    state.storyline.history=Array.isArray(state.storyline.history)?state.storyline.history:[];
    state.storyline.auName=au.name;
    return au;
  }

  const currentAU=ensureState();

  function hasStoryItem(id){
    return typeof window.has === "function" && has(id);
  }

  function giveStoryItem(id){
    ensureItems();
    if(hasStoryItem(id)) return true;
    let ok=false;
    if(typeof window.addItem === "function") ok=addItem(id,{identified:true,storyItem:true});
    if(!ok){
      // Story evidence must never be lost because the normal inventory is full.
      state.storage=(state.storage||16)+1;
      ok=typeof window.addItem === "function" && addItem(id,{identified:true,storyItem:true});
    }
    if(ok && typeof window.log === "function") log("You received: "+ITEMS[id].name+".");
    return ok;
  }

  function discoverSafe(name,text){
    if(typeof window.discover === "function") discover(name,text);
  }

  function remember(flag){
    state.storyline.flags[flag]=true;
  }
  function knows(flag){return !!state.storyline.flags[flag]}

  function advance(stage,reason){
    if(stage<=state.storyline.stage) return false;
    state.storyline.stage=stage;
    state.storyline.history.push({day:state.day,stage,reason:reason||""});
    state.storyline.history=state.storyline.history.slice(-40);
    updateAppearance();
    save();
    return true;
  }

  function updateAppearance(){
    const b=document.body;
    if(!b) return;
    [...b.classList].filter(c=>c.indexOf("au-")===0||c.indexOf("story-stage-")===0).forEach(c=>b.classList.remove(c));
    b.classList.add("au-"+currentAU.id);
    b.classList.add("story-stage-"+state.storyline.stage);
    b.dataset.au=currentAU.id;
    b.dataset.storyStage=String(state.storyline.stage);
  }

  function storyToast(text){
    if(typeof window.toast === "function") toast(text);
  }

  function makeEvent(id,title,text,choices){
    return {title,text,choices,storyEvent:true,storyId:id};
  }

  function showStoryEvent(ev){
    if(typeof window.showEvent !== "function") return;
    showEvent(ev);
  }

  function safeRender(){
    try{if(typeof window.render === "function") render();}catch(e){console.warn(e)}
  }

  // ------------------------------------------------------------
  // STORY EVENTS
  // ------------------------------------------------------------
  function senderEvent(){
    if(state.storyline.stage===1 && !knows("senderLabelGiven")){
      return makeEvent("sender_label","🏷️ The Label","A new package has a label on the inside as well as the outside. The handwriting looks familiar.",[
        ["Study it",()=>{giveStoryItem("sender_label");discoverSafe("Your Handwriting","The sender and recipient fields are both written in your handwriting.");remember("senderLabelGiven");advance(2,"studied impossible label");}],
        ["Throw it away",()=>{remember("senderLabelGiven");advance(2,"discarded impossible label");}],
        ["Keep the package sealed",()=>{remember("senderLabelGiven");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("manifestGiven")){
      return makeEvent("sender_manifest","📋 Tomorrow's Delivery","Inside a package is a delivery manifest. One entry is dated tomorrow.",[
        ["Read it",()=>{giveStoryItem("sender_manifest");discoverSafe("Tomorrow's Delivery","The manifest lists a package from YOU to YOU, dated tomorrow.");remember("manifestGiven");advance(3,"read future manifest");}],
        ["Hide it",()=>{giveStoryItem("sender_manifest");remember("manifestGiven");advance(3,"kept future manifest");}],
        ["Destroy it",()=>{remember("manifestGiven");advance(3,"destroyed future manifest");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("senderParadox")){
      return makeEvent("sender_paradox","📦 Sender: YOU","Tomorrow's package is already prepared. The sender field says YOU. The recipient field also says YOU.",[
        ["Try to stop it",()=>{discoverSafe("The Other You","You feel a resistance that isn't yours. Something has already decided what happens next.");remember("senderParadox");advance(4,"tried to stop sender-self");}],
        ["Open the manifest",()=>{giveStoryItem("sender_manifest");remember("senderParadox");advance(4,"accepted the manifest");}],
        ["Do nothing",()=>{remember("senderParadox");advance(4,"accepted paradox");}]
      ]);
    }
  }

  function thingEvent(){
    if(state.storyline.stage===1 && !knows("warmTag")){
      return makeEvent("thing_tag","📦 Too Specific","The last few packages contain objects that seem chosen for you. One contains a warm metal tag.",[
        ["Keep the tag",()=>{giveStoryItem("warm_tag");remember("warmTag");advance(2,"kept warm tag");}],
        ["Throw it away",()=>{remember("warmTag");advance(2,"discarded warm tag");}],
        ["Follow the delivery label",()=>{giveStoryItem("warm_tag");remember("warmTag");advance(2,"followed tag");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("deliveriesStop")){
      return makeEvent("thing_stop","📭 Nothing Today","For the first time since you can remember, there is no package. Not one.",[
        ["Check the mailbox again",()=>{discoverSafe("No Delivery","There is no package. The absence feels deliberate.");remember("deliveriesStop");advance(3,"noticed deliveries stopped");}],
        ["Be relieved",()=>{remember("deliveriesStop");advance(3,"accepted silence");}],
        ["Go outside",()=>{remember("deliveriesStop");advance(3,"went outside after deliveries stopped");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("monsterNearby")){
      return makeEvent("thing_nearby","👁️ Something Outside","There is a sound outside. It moves once. Then stops directly outside your house.",[
        ["Lock everything",()=>{discoverSafe("Something Is Here","Whatever used to send the packages is no longer waiting outside.");remember("monsterNearby");advance(4,"secured the house");}],
        ["Look through the window",()=>{discoverSafe("The Shape","You see something that does not move like a person.");remember("monsterNearby");advance(4,"saw the thing");}],
        ["Go to the shed",()=>{giveStoryItem("escape_key");remember("monsterNearby");advance(4,"chose the shed as shelter");}]
      ]);
    }
    if(state.storyline.stage===4 && !knows("hideInShed")){
      return makeEvent("thing_hide","🏚️ The Shed","You hear something enter the house. The shed is the only place you have not checked.",[
        ["Hide in the shed",()=>{giveStoryItem("escape_key");discoverSafe("The Hiding Place","The shed contains an old tunnel and a note: 'Good luck; I hope you escape.'");remember("hideInShed");state.storyline.flags.shedSafe=true;advance(5,"hid in shed");}],
        ["Run for the street",()=>{discoverSafe("The Escape Attempt","You make it outside, but you can hear something following you.");remember("hideInShed");advance(5,"ran from the house");}],
        ["Stay upstairs",()=>{discoverSafe("The Thing Enters","The floorboards creak below you.");remember("hideInShed");advance(5,"stayed inside");}]
      ]);
    }
  }

  function noSenderEvent(){
    if(state.storyline.stage===1 && !knows("warehouseTicket")){
      return makeEvent("warehouse","🏭 The Warehouse","You find a warehouse receipt for your own package. It says: 'Arrived already packed.'",
        [["Keep the receipt",()=>{giveStoryItem("warehouse_ticket");discoverSafe("Already Packed","Nobody at the warehouse knows where the packages are packed.");remember("warehouseTicket");advance(2,"found warehouse receipt");}],
         ["Ask the worker",()=>{giveStoryItem("warehouse_ticket");discoverSafe("The Worker","The worker says the boxes arrive already packed.");remember("warehouseTicket");advance(2,"questioned warehouse worker");}],
         ["Leave",()=>{remember("warehouseTicket");advance(2,"left warehouse");}]]);
    }
    if(state.storyline.stage===2 && !knows("maintenanceClue")){
      return makeEvent("maintenance","📦 Empty Shelves","Every shelf is empty, but the warehouse has records for millions of deliveries.",[
        ["Follow a package backwards",()=>{discoverSafe("No Beginning","The delivery trail ends at a blank wall.");remember("maintenanceClue");advance(3,"followed delivery backwards");}],
        ["Ask where they arrive from",()=>{discoverSafe("They Arrive","The worker says: 'They arrive already packed.'");remember("maintenanceClue");advance(3,"asked where packages come from");}],
        ["Take a box",()=>{giveStoryItem("warehouse_ticket");remember("maintenanceClue");advance(3,"took evidence");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("systemFailure")){
      return makeEvent("maintenance_failure","⚠️ No Deliveries","A day passes with no packages anywhere. People are becoming visibly confused.",[
        ["Keep watching",()=>{discoverSafe("The World Stutters","Without deliveries, tiny things begin changing around town.");remember("systemFailure");advance(4,"watched system failure");}],
        ["Ask people what is wrong",()=>{discoverSafe("Maintenance","People say things feel wrong when packages stop.");remember("systemFailure");advance(4,"questioned people");}],
        ["Deliver a package yourself",()=>{discoverSafe("Forced Delivery","The moment you deliver a box, things become normal again.");remember("systemFailure");advance(4,"forced a delivery");}]
      ]);
    }
  }

  function houseEvent(){
    if(state.storyline.stage===1 && !knows("foundation")){
      return makeEvent("house_foundation","🏚️ Under the House","A crack near the shed reveals a layer of stone beneath the foundations.",[
        ["Dig carefully",()=>{giveStoryItem("house_foundation");discoverSafe("Older Than the House","The foundation fragment is much older than the house.");remember("foundation");advance(2,"found old foundation");}],
        ["Cover it",()=>{remember("foundation");advance(2,"covered old foundation");}],
        ["Mark the location",()=>{giveStoryItem("house_foundation");remember("foundation");advance(2,"marked old foundation");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("shedOld")){
      return makeEvent("house_shed","🧱 The Original Structure","The shed's walls contain material that predates the rest of the house.",[
        ["Open the floor",()=>{discoverSafe("The Buried Room","There is a sealed space beneath the shed.");remember("shedOld");advance(3,"opened old shed floor");}],
        ["Study the walls",()=>{discoverSafe("Before the House","The shed existed before the house was built around it.");remember("shedOld");advance(3,"studied shed walls");}],
        ["Leave it alone",()=>{remember("shedOld");advance(3,"left old shed alone");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("buriedThing")){
      return makeEvent("house_buried","⬛ Beneath the Shed","Something is buried beneath the shed. The old photograph shows the same spot before the house existed.",[
        ["Open it",()=>{discoverSafe("The Thing Beneath","The buried object is not described anywhere in the old records.");remember("buriedThing");advance(4,"opened buried space");}],
        ["Photograph it",()=>{giveStoryItem("house_foundation");discoverSafe("The Old Photograph","The photograph was taken before the house was built.");remember("buriedThing");advance(4,"documented buried space");}],
        ["Seal it again",()=>{remember("buriedThing");advance(4,"sealed buried space");}]
      ]);
    }
  }

  function resetEvent(){
    if(state.storyline.stage===1 && !knows("repeat")){
      return makeEvent("reset_repeat","🔁 Again","The same package you opened earlier is sitting unopened in front of you.",[
        ["Open it",()=>{giveStoryItem("reset_receipt");discoverSafe("A Previous Run","The receipt describes something you have not done yet.");remember("repeat");advance(2,"noticed repeated day");}],
        ["Leave it unopened",()=>{remember("repeat");advance(2,"refused repeated package");}],
        ["Write down the date",()=>{giveStoryItem("reset_receipt");remember("repeat");advance(2,"recorded repetition");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("previousRun")){
      return makeEvent("reset_evidence","🧾 Evidence From Before","You find a receipt with a previous version of your inventory on it.",[
        ["Compare it",()=>{discoverSafe("Another Run","The receipt contains objects you remember selling.");remember("previousRun");advance(3,"compared previous inventory");}],
        ["Keep it",()=>{giveStoryItem("reset_receipt");remember("previousRun");advance(3,"kept previous receipt");}],
        ["Throw it away",()=>{remember("previousRun");advance(3,"discarded reset evidence");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("resetPoint")){
      return makeEvent("reset_point","⏳ Almost There","You recognize tomorrow before it happens. The feeling is getting stronger.",[
        ["Prepare evidence",()=>{giveStoryItem("reset_receipt");discoverSafe("Outside the Reset","The junk mail is the only thing that seems able to survive the change.");remember("resetPoint");advance(4,"prepared for reset");}],
        ["Try to change tomorrow",()=>{discoverSafe("Resistance","Something pushes back when you try to change what is supposed to happen.");remember("resetPoint");advance(4,"resisted reset");}],
        ["Do nothing",()=>{remember("resetPoint");advance(4,"accepted reset");}]
      ]);
    }
  }

  function playerPackageEvent(){
    if(state.storyline.stage===1 && !knows("arrivalRecord")){
      return makeEvent("arrival","📦 Missing Arrival","You find a delivery record for the day you supposedly moved in. There is no recipient name.",[
        ["Keep the record",()=>{giveStoryItem("delivery_label");discoverSafe("No Arrival","There is no record of you entering the house.");remember("arrivalRecord");advance(2,"found missing arrival record");}],
        ["Ask the courier",()=>{giveStoryItem("delivery_label");discoverSafe("No One Saw You","Nobody remembers delivering you anything unusual.");remember("arrivalRecord");advance(2,"asked about arrival");}],
        ["Destroy it",()=>{remember("arrivalRecord");advance(2,"destroyed arrival record");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("personalLabel")){
      return makeEvent("personal_label","🏷️ Contents: ONE PERSON","A shipping label lists a package whose contents are described as: 'ONE PERSON'. The destination is your house.",[
        ["Keep it",()=>{giveStoryItem("delivery_label");discoverSafe("The Contents Field","The label seems to describe you rather than an object.");remember("personalLabel");advance(3,"kept personal label");}],
        ["Check the date",()=>{giveStoryItem("delivery_label");discoverSafe("Before Day One","The label predates your first memory.");remember("personalLabel");advance(3,"checked personal label date");}],
        ["Burn it",()=>{remember("personalLabel");advance(3,"destroyed personal label");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("ordered")){
      return makeEvent("who_ordered","📬 Who Ordered You?","There is finally a sender. It is not a company name. It is a customer number.",[
        ["Look up the number",()=>{giveStoryItem("delivery_label");discoverSafe("The Order","The number is linked to a delivery scheduled before you remember existing.");remember("ordered");advance(4,"looked up order");}],
        ["Ignore it",()=>{remember("ordered");advance(4,"ignored order");}],
        ["Ask the post office",()=>{discoverSafe("The Post Office","The clerk insists there was never anything unusual about your arrival.");remember("ordered");advance(4,"asked post office");}]
      ]);
    }
  }

  function customerEvent(){
    if(state.storyline.stage===1 && !knows("wrongRecords")){
      return makeEvent("wrong_records","📮 Your Address","A neighbor's delivery record lists your address as the sender.",[
        ["Compare the records",()=>{giveStoryItem("missing_account");discoverSafe("Wrong Sender","Other people's packages are routing through your address.");remember("wrongRecords");advance(2,"compared delivery records");}],
        ["Ignore it",()=>{remember("wrongRecords");advance(2,"ignored wrong record");}],
        ["Tell the neighbor",()=>{giveStoryItem("missing_account");discoverSafe("The Neighbor's Record","Their record has your handwriting on it.");remember("wrongRecords");advance(2,"told neighbor");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("addressStatus")){
      return makeEvent("account_status","🗂️ Address Status","A delivery database says your address is active, but your customer number is blank.",[
        ["Print the record",()=>{giveStoryItem("missing_account");discoverSafe("Blank Customer","The address exists without a customer attached to it.");remember("addressStatus");advance(3,"printed blank customer record");}],
        ["Search your name",()=>{discoverSafe("No Customer","There is no customer record under your name.");remember("addressStatus");advance(3,"searched customer database");}],
        ["Close the database",()=>{remember("addressStatus");advance(3,"closed database");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("recreation")){
      return makeEvent("recreation","👤 Missing Account","A system message says: 'CUSTOMER PROFILE INCOMPLETE. RECREATION REQUIRED.'",
        [["Let it run",()=>{discoverSafe("Recreation","The system starts rebuilding a profile from your choices.");remember("recreation");advance(4,"allowed recreation");}],
         ["Cancel it",()=>{discoverSafe("Recreation Cancelled","The system responds: 'CUSTOMER STILL REQUIRED.'");remember("recreation");advance(4,"cancelled recreation");}],
         ["Copy the message",()=>{giveStoryItem("missing_account");remember("recreation");advance(4,"copied recreation message");}]]);
    }
  }

  function memoryEvent(){
    if(state.storyline.stage===1 && !knows("firstMemory")){
      return makeEvent("memory_first","🧠 That Feeling","One of the objects in your inventory feels familiar in a way you cannot explain.",[
        ["Hold it",()=>{giveStoryItem("memory_fragment");discoverSafe("A Familiar Room","For a second, you remember a room you cannot place.");remember("firstMemory");advance(2,"held memory object");}],
        ["Put it away",()=>{remember("firstMemory");advance(2,"put memory object away");}],
        ["Sell it",()=>{remember("firstMemory");advance(2,"sold memory object");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("memoryLoss")){
      return makeEvent("memory_loss","🧠 The Missing Part","You suddenly realize you cannot remember the object you sold yesterday.",[
        ["Try to remember",()=>{discoverSafe("A Lost Memory","Selling certain objects seems to remove memories with them.");remember("memoryLoss");advance(3,"tried to remember");}],
        ["Check your notes",()=>{giveStoryItem("memory_fragment");remember("memoryLoss");advance(3,"checked notes");}],
        ["Let it go",()=>{remember("memoryLoss");advance(3,"accepted memory loss");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("pastReturning")){
      return makeEvent("past_returning","📷 Someone You Know","A photograph arrives showing a person you recognize before you can remember why.",[
        ["Study the face",()=>{discoverSafe("The Person","The person in the photograph is the person who used to live your life.");remember("pastReturning");advance(4,"studied remembered person");}],
        ["Keep the photograph",()=>{giveStoryItem("memory_fragment");remember("pastReturning");advance(4,"kept memory photograph");}],
        ["Sell it",()=>{remember("pastReturning");advance(4,"sold memory photograph");}]
      ]);
    }
  }

  function peopleKnowEvent(){
    if(state.storyline.stage===1 && !knows("rehearsed")){
      return makeEvent("rehearsed","🗣️ The Same Words","A neighbor and a courier use exactly the same sentence when you ask about the packages.",[
        ["Ask again",()=>{discoverSafe("Rehearsed Answers","Their answer is word-for-word identical.");remember("rehearsed");advance(2,"tested repeated answer");}],
        ["Write it down",()=>{giveStoryItem("warning_note");remember("rehearsed");advance(2,"recorded repeated answer");}],
        ["Pretend not to notice",()=>{remember("rehearsed");advance(2,"ignored repeated answer");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("breakCharacter")){
      return makeEvent("break_character","🤫 You're Not Supposed to Notice","A stranger looks around before saying: 'You're not supposed to notice.'",
        [["Ask why",()=>{discoverSafe("The Warning","The stranger is terrified of what happens when people notice.");remember("breakCharacter");advance(3,"asked why");}],
         ["Ask who told them",()=>{giveStoryItem("warning_note");remember("breakCharacter");advance(3,"asked who told them");}],
         ["Walk away",()=>{remember("breakCharacter");advance(3,"walked away");}]]);
    }
    if(state.storyline.stage===3 && !knows("townFear")){
      return makeEvent("town_fear","🏘️ The Agreement","You learn that the town has an agreement: nobody acknowledges what is wrong.",[
        ["Break the agreement",()=>{discoverSafe("The Agreement","People are afraid that acknowledging the truth will make something happen.");remember("townFear");advance(4,"broke agreement");}],
        ["Ask what they fear",()=>{giveStoryItem("warning_note");discoverSafe("What They Fear","Nobody will tell you exactly what happens.");remember("townFear");advance(4,"asked about fear");}],
        ["Keep quiet",()=>{remember("townFear");advance(4,"kept quiet");}]
      ]);
    }
  }

  function companyEvent(){
    if(state.storyline.stage===1 && !knows("observation")){
      return makeEvent("observation","🗂️ Observation","A form appears beside your packages. It has boxes for 'KEEP', 'SELL', 'INVESTIGATE', and 'IGNORE'.",
        [["Fill it in",()=>{giveStoryItem("experiment_card");discoverSafe("Observed Behavior","The form records your choices more carefully than it should.");remember("observation");advance(2,"filled observation card");}],
         ["Destroy it",()=>{remember("observation");advance(2,"destroyed observation card");}],
         ["Leave it there",()=>{remember("observation");advance(2,"ignored observation card");}]]);
    }
    if(state.storyline.stage===2 && !knows("experiment") ){
      return makeEvent("experiment","🧪 Your Profile","A document describes your behavior in clinical language.",[
        ["Read it",()=>{giveStoryItem("experiment_card");discoverSafe("Experiment Profile","Your choices have been categorized and compared with other subjects.");remember("experiment");advance(3,"read experiment profile");}],
        ["Take it with you",()=>{giveStoryItem("experiment_card");remember("experiment");advance(3,"stole experiment profile");}],
        ["Leave it",()=>{remember("experiment");advance(3,"left experiment profile");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("otherExperiments")){
      return makeEvent("other_experiments","🌐 Other Subjects","A screen shows hundreds of nearly identical worlds.",[
        ["Look for yours",()=>{discoverSafe("Other Worlds","Every world has tiny differences. Something is comparing them.");remember("otherExperiments");advance(4,"found other worlds");}],
        ["Close the screen",()=>{remember("otherExperiments");advance(4,"closed other-world screen");}],
        ["Copy the list",()=>{giveStoryItem("experiment_card");remember("otherExperiments");advance(4,"copied world list");}]
      ]);
    }
  }

  function copiesEvent(){
    if(state.storyline.stage===1 && !knows("wrongObject")){
      return makeEvent("wrong_object","🪙 The Wrong Coin","A coin arrives with a country printed on it that does not exist here.",[
        ["Keep it",()=>{giveStoryItem("foreign_coin");discoverSafe("Wrong World","The coin appears to be from a nearly identical world.");remember("wrongObject");advance(2,"kept foreign coin");}],
        ["Sell it",()=>{remember("wrongObject");advance(2,"sold foreign coin");}],
        ["Compare it to your coin",()=>{giveStoryItem("foreign_coin");discoverSafe("Almost the Same","The coins are identical except for one impossible detail.");remember("wrongObject");advance(2,"compared foreign coin");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("copyProof")){
      return makeEvent("copy_proof","📰 Tomorrow's News","A newspaper describes an event that happened in another version of the town.",[
        ["Read it",()=>{giveStoryItem("foreign_coin");discoverSafe("Another Version","The event is real, but not in this universe.");remember("copyProof");advance(3,"read alternate newspaper");}],
        ["Keep it",()=>{giveStoryItem("foreign_coin");remember("copyProof");advance(3,"kept alternate newspaper");}],
        ["Ignore it",()=>{remember("copyProof");advance(3,"ignored alternate evidence");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("crossing")){
      return makeEvent("crossing","📦 Crossed Package","A package contains an object that should exist only in another version of the world.",[
        ["Open it",()=>{discoverSafe("Cross-Universe Delivery","The junk-mail system can move objects between copies.");remember("crossing");advance(4,"opened crossed package");}],
        ["Seal it again",()=>{remember("crossing");advance(4,"sealed crossed package");}],
        ["Keep the object",()=>{giveStoryItem("foreign_coin");remember("crossing");advance(4,"kept cross-universe object");}]
      ]);
    }
  }

  function emptyEvent(){
    if(state.storyline.stage===1 && !knows("senderChange")){
      return makeEvent("sender_change","⬜ The Sender Field","The sender field looks like a company name. You look away. It looks like a person's name.",[
        ["Look again",()=>{giveStoryItem("blank_sender");discoverSafe("Changing Sender","The sender field seems to reflect what you expect.");remember("senderChange");advance(2,"noticed changing sender");}],
        ["Write down what you saw",()=>{giveStoryItem("blank_sender");remember("senderChange");advance(2,"recorded sender field");}],
        ["Don't look again",()=>{remember("senderChange");advance(2,"avoided sender field");}]
      ]);
    }
    if(state.storyline.stage===2 && !knows("assumption")){
      return makeEvent("assumption","🪞 Your Assumption","The package label changes after you decide what you think the sender is.",[
        ["Change your assumption",()=>{discoverSafe("Expectation","The package changes to match your new explanation.");remember("assumption");advance(3,"changed assumption");}],
        ["Refuse to guess",()=>{discoverSafe("No Answer","Without an assumption, the sender field is completely blank.");remember("assumption");advance(3,"refused to guess");}],
        ["Ask someone else",()=>{giveStoryItem("blank_sender");remember("assumption");advance(3,"asked another person");}]
      ]);
    }
    if(state.storyline.stage===3 && !knows("createdMystery")){
      return makeEvent("created_mystery","❓ The Explanation","You realize every explanation you have made has changed something about the mystery.",[
        ["Stop explaining it",()=>{discoverSafe("No Explanation","For a moment, the world becomes completely ordinary.");remember("createdMystery");advance(4,"stopped explaining");}],
        ["Choose an explanation",()=>{discoverSafe("Your Explanation","The world immediately provides evidence for the explanation you chose.");remember("createdMystery");advance(4,"chose explanation");}],
        ["Write down everything",()=>{giveStoryItem("blank_sender");remember("createdMystery");advance(4,"recorded explanations");}]
      ]);
    }
  }

  function runStoryEvent(){
    const a=currentAU.id;
    let ev=null;
    if(a==="sender") ev=senderEvent();
    else if(a==="thing") ev=thingEvent();
    else if(a==="no_sender") ev=noSenderEvent();
    else if(a==="house") ev=houseEvent();
    else if(a==="reset") ev=resetEvent();
    else if(a==="player_package") ev=playerPackageEvent();
    else if(a==="customer") ev=customerEvent();
    else if(a==="memories") ev=memoryEvent();
    else if(a==="people_know") ev=peopleKnowEvent();
    else if(a==="company") ev=companyEvent();
    else if(a==="copies") ev=copiesEvent();
    else if(a==="empty") ev=emptyEvent();
    if(ev){
      showStoryEvent(ev);
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------
  // ACTION DETECTION
  // ------------------------------------------------------------
  function progressFromAction(action,data){
    if(!state.storyline) return;
    const a=currentAU.id;
    const id=data&&data.id;
    const title=data&&data.title||"";
    const choice=String(data&&data.choice||"").toLowerCase();
    const discovery=String(data&&data.discovery||"").toLowerCase();

    if(a==="sender"){
      if((id==="label"||id==="deliveryTag") && state.storyline.stage<1) advance(1,"found a suspicious label");
      if(/sender|recipient|handwriting|manifest/.test(choice+" "+discovery+" "+title) && state.storyline.stage<2) advance(2,"investigated sender evidence");
    }
    if(a==="thing"){
      if((id==="key"||id==="warm_tag") && state.storyline.stage<1) advance(1,"found the right kind of object");
      if(title.includes("Locked Shed") && /key/.test(choice) && has("key")) advance(2,"connected key to shed");
      if(knows("shedUnlocked") && state.storyline.stage<3) advance(3,"shed became relevant");
    }
    if(a==="no_sender"){
      if(id==="deliveryTag"||id==="label"||title.includes("Unordered Delivery")) advance(Math.max(1,state.storyline.stage),"noticed unexplained delivery");
      if(/warehouse|where.*from|already packed/.test(choice+" "+discovery+" "+title) && state.storyline.stage<2) advance(2,"traced delivery origin");
    }
    if(a==="house"){
      if(id==="photo" && state.storyline.stage<1) advance(1,"connected photograph to house");
      if(title.includes("Locked Shed") && state.storyline.stage<2) advance(2,"found shed");
      if(knows("shedUnlocked") && state.storyline.stage<3) advance(3,"entered old structure");
    }
    if(a==="reset"){
      if(title.includes("Returned Package")||title.includes("Package") && state.day>20) advance(1,"noticed impossible repetition");
      if(/again|previous|repeat|sold.*back/.test(choice+" "+discovery+" "+title) && state.storyline.stage<2) advance(2,"investigated repetition");
      if(state.day>=60 && state.storyline.stage<3) advance(3,"repetition became obvious");
    }
    if(a==="player_package"){
      if(id==="photo" && state.storyline.stage<1) advance(1,"found evidence from before arrival");
      if(id==="deliveryTag"||id==="label") advance(Math.max(1,state.storyline.stage),"found delivery identity clue");
    }
    if(a==="customer"){
      if(title.includes("Wrong Address")||title.includes("Unordered Delivery")) advance(1,"delivery record pointed back to address");
      if(/record|database|customer|address/.test(choice+" "+discovery+" "+title) && state.storyline.stage<2) advance(2,"checked customer records");
    }
    if(a==="memories"){
      if(id==="photo"||id==="bear"||id==="tape") advance(Math.max(1,state.storyline.stage),"received a familiar object");
      if(/sell/.test(choice) && state.storyline.stage>=1 && state.storyline.stage<3) advance(3,"sold something that felt familiar");
      if(/keep|hold|study|remember/.test(choice) && state.storyline.stage<2) advance(2,"held onto a memory");
    }
    if(a==="people_know"){
      if(/same words|rehearsed|neighbor|courier/.test(title+" "+choice+" "+discovery) && state.storyline.stage<1) advance(1,"noticed repeated language");
      if(/not supposed|notice|why/.test(title+" "+choice+" "+discovery) && state.storyline.stage<2) advance(2,"someone broke character");
    }
    if(a==="company"){
      if(/sell|keep|investigate|ignore/.test(choice) && state.storyline.stage<1) advance(1,"made a recorded choice");
      if(state.storyline.stage>=1 && (id==="scanner"||id==="experiment_card")) advance(2,"found evidence of observation");
      if(/profile|experiment|observ/.test(choice+" "+discovery+" "+title) && state.storyline.stage<3) advance(3,"read observation data");
    }
    if(a==="copies"){
      if(id==="coin" && state.storyline.stage<1) advance(1,"noticed a familiar object was slightly wrong");
      if(id==="foreign_coin") advance(Math.max(2,state.storyline.stage),"kept an object from another copy");
      if(/another|different|wrong world|copy/.test(choice+" "+discovery+" "+title) && state.storyline.stage<3) advance(3,"recognized another world");
    }
    if(a==="empty"){
      if(id==="label"||id==="deliveryTag") advance(1,"looked at a sender field");
      if(/sender|assumption|expect/.test(choice+" "+discovery+" "+title) && state.storyline.stage<2) advance(2,"questioned the sender");
      if(state.storyline.stage>=2 && /guess|explanation|expect/.test(choice) && state.storyline.stage<3) advance(3,"tested an explanation");
    }
  }

  // ------------------------------------------------------------
  // Wrap eventChoice. The original game still owns all normal event logic.
  // ------------------------------------------------------------
  const originalEventChoice=window.eventChoice;
  if(typeof originalEventChoice==="function"){
    window.eventChoice=function(i){
      const e=window.currentEvent;
      const c=e&&e.choices&&e.choices[i];
      const choice=c?c[0]:"";
      const story=e&&e.storyEvent;
      originalEventChoice.call(this,i);
      if(e){
        if(!state.storyEvents) state.storyEvents={};
        state.storyEvents[e.title]=true;
        progressFromAction("choice",{title:e.title,choice,story});
        if(e.title==="🔑 Locked Shed" && /look for a key/i.test(choice) && has("key")){
          remember("shedUnlocked");
          state.storyline.flags.shedUnlocked=true;
          if(currentAU.id==="thing") giveStoryItem("warm_tag");
          else if(currentAU.id==="house") giveStoryItem("house_foundation");
          else giveStoryItem("escape_key");
          discoverSafe("The Shed Opens","The rusty key finally opens the shed. Something inside looks as though it was waiting for you.");
          if(state.storyline.stage<2) advance(2,"unlocked shed with rusty key");
        }
        if(story) save();
      }
      setTimeout(()=>{safeRender();updateAppearance();},0);
    };
  }

  // Detect inventory additions without replacing the inventory system.
  const originalAddItem=window.addItem;
  if(typeof originalAddItem==="function"){
    window.addItem=function(id,extra){
      const result=originalAddItem.call(this,id,extra);
      if(result && !state.storyline._addingStoryItem){
        progressFromAction("item",{id});
        updateAppearance();
      }
      return result;
    };
  }

  // Detect discoveries. This makes lore progress when the player actually
  // connects clues, rather than merely waiting for a timer.
  const originalDiscover=window.discover;
  if(typeof originalDiscover==="function"){
    window.discover=function(name,text){
      const result=originalDiscover.apply(this,arguments);
      progressFromAction("discovery",{discovery:name,title:text});
      updateAppearance();
      return result;
    };
  }

  // Detect normal item selling. Some universes care that an object was sold.
  const originalSell=window.sellSelected;
  if(typeof originalSell==="function"){
    window.sellSelected=function(){
      const x=state.inv.find(a=>a.uid===state.selected);
      const id=x&&x.id;
      const result=originalSell.apply(this,arguments);
      if(id) progressFromAction("sell",{id,choice:"sell"});
      return result;
    };
  }

  // Detect combinations without changing the combination implementation.
  const originalCombine=window.tryCombination;
  if(typeof originalCombine==="function"){
    window.tryCombination=function(x){
      const id=x&&x.id;
      const result=originalCombine.apply(this,arguments);
      progressFromAction("combine",{id,choice:"use "+id});
      return result;
    };
  }

  // ------------------------------------------------------------
  // Story-event scheduler. Normal events always get first chance.
  // If no normal event is currently displayed, a pending AU event may appear.
  // ------------------------------------------------------------
  const originalMaybeEvent=window.maybeEvent;
  if(typeof originalMaybeEvent==="function"){
    window.maybeEvent=function(){
      const before=window.currentEvent;
      const result=originalMaybeEvent.apply(this,arguments);
      const normalEvent=window.currentEvent;
      if(!normalEvent){
        const day=Number(state.day||1);
        const stage=Number(state.storyline.stage||0);
        if(day>=5 && stage<4 && Math.random() < (stage===0?.22:0.48)) runStoryEvent();
      }
      return result;
    };
  }

  // Days can themselves be story triggers, especially for the reset universe.
  const originalNextDay=window.nextDay;
  if(typeof originalNextDay==="function"){
    window.nextDay=function(){
      const oldDay=state.day;
      const result=originalNextDay.apply(this,arguments);
      if(state.day!==oldDay){
        if(currentAU.id==="reset" && state.day>=60 && state.storyline.stage<3) advance(3,"repeated days became undeniable");
        if(currentAU.id==="company" && state.day>=30 && state.storyline.stage<1) advance(1,"enough behavior was recorded");
        if(currentAU.id==="people_know" && state.day>=40 && state.storyline.stage<1) advance(1,"the same answers kept repeating");
        if(currentAU.id==="copies" && state.day>=45 && state.storyline.stage<1) advance(1,"small differences accumulated");
        if(currentAU.id==="memories" && state.day>=30 && state.storyline.stage<1) advance(1,"familiar objects accumulated");
        setTimeout(()=>{if(!window.currentEvent) runStoryEvent();safeRender();updateAppearance();},250);
      }
      return result;
    };
  }

  // A small, non-intrusive indicator is added only to the document title.
  // The actual AU name is never shown, preserving the mystery.
  updateAppearance();
  save();

})();
