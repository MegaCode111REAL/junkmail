// Event definitions for JUNKMAIL.
// requirements is an array: every function must return true.
// onceKey marks a story event that should disappear after its story flag is set.
window.GAME_EVENTS = [
          {
            title:"📦 Wrong Address",
            text:"A package has been left outside your door. The label has your house number, but a completely different name.",
            requirements:[()=>state.day>=2],
            choices:[
              ["Keep it",()=>{
                const id=rand(["box","coin","disk","photo"]);
                addItem(id);
                log("Kept the wrongly delivered package.");
              }],
              ["Return it",()=>{
                state.money+=8;
                log("Returned the package.");
              }]
            ]
          },
          {
            title:"🧑‍🔧 The Collector",
            text:"A stranger messages you: \"I'm looking for something old. You might have it.\"",
            requirements:[()=>state.day>=5],
            choices:[
              ["Ask what they want",()=>{discover("The Collector","Someone is searching for a specific object in your collection.");log("Asked the collector what they were looking for.");}],
              ["Show them your collection",()=>{const metal=state.inv.filter(x=>ITEMS[x.id].tags.includes("metal"));if(metal.length>=2){state.money+=20;discover("The Collector's Interest","The collector seems particularly interested in the unusual metal objects.");log("Showed them your unusual objects.");}else log("The collector wasn't interested in what you had.");}],
              ["Ignore the message",()=>log("Ignored the collector.")]
            ]
          },
          {
            title:"📻 Sudden Static",
            text:"Your room fills with static. You aren't sure whether it's coming from the radio.",
            requirements:[()=>state.day>=3],
            choices:[
              ["Check the radio",()=>{if(has("radio")){discover("83.7","The radio briefly locks onto 83.7 before returning to static.");log("Checked the radio during the interference.");}else log("There was no radio to investigate.");}],
              ["Check the window",()=>{if(chance(.5)){state.money+=5;log("You find a small envelope outside containing $5.");}else log("There was nothing outside.");}],
              ["Do nothing",()=>log("Ignored the strange static.")]
            ]
          },
          {
            title:"🚪 The Knock",
            text:"Someone knocks three times. When you open the door, nobody is there.",
            requirements:[()=>state.day>=2],
            choices:[
              ["Search outside",()=>{if(chance(.5)){addItem(rand(["coin","key","photo"]));log("You found something strange outside.");}else log("You found nothing outside.");}],
              ["Wait inside",()=>{if(chance(.35)){discover("The Second Knock","Several minutes later, the same three knocks came from inside the house.");log("You waited. The knocking happened again.");}else log("Nothing else happened.");}],
              ["Lock the door",()=>log("You locked the door and went back to sorting junk.")]
            ]
          },
          {
            title:"📨 Unordered Delivery",
            text:"A courier hands you a package you definitely didn't order.",
            requirements:[()=>state.day>=4],
            choices:[
              ["Open it",()=>{addItem(rand(["tape","gear","bottle","disk"]));discover("Unordered Package","Someone is sending objects directly to you.");log("Opened an unexplained package.");}],
              ["Refuse it",()=>{state.money+=4;log("The courier gave you $4 for taking the time to refuse the package.");}]
            ]
          },
          {
            title:"💻 Strange Message",
            text:"Your computer displays: \"STOP SELLING THE OBJECTS.\"",
            requirements:[()=>state.day>=12,()=>state.stats.sold>0],
            choices:[
              ["Reply",()=>{discover("The Warning","Someone knows about the objects you're selling.");log("Replied to the mysterious warning.");}],
              ["Take a screenshot",()=>{discover("The Message","The message disappears immediately after being captured.");log("Captured the mysterious message.");}],
              ["Ignore it",()=>log("Ignored the strange message.")]
            ]
          },
          {
            title:"🚚 Strange Van",
            text:"A van has stopped across the street. The driver appears to be looking at your house.",
            requirements:[()=>state.day>=15],
            choices:[
              ["Watch from the window",()=>{if(chance(.5)){discover("The Van","The van left after someone placed an envelope underneath your mailbox.");addItem("photo");log("Watched the van from the window.");}else log("The van eventually drove away.");}],
              ["Go outside",()=>{if(chance(.4)){state.money+=15;log("The driver offered you $15 for an old object.");}else log("The driver drove away when you approached.");}],
              ["Stay inside",()=>log("You decided not to get involved.")]
            ]
          },
          {
            title:"🔑 Locked Shed",
            text:"You notice a small shed behind your house that you've never seen before.",
            requirements:[()=>state.day>=50,()=>!(state.storyFlags&&state.storyFlags.shedUnlocked)],
            onceKey:"shedUnlocked",
            choices:[
              ["Look for a key",()=>{if(has("key")){state.storyFlags=state.storyFlags||{};state.storyFlags.shedUnlocked=true;discover("The Hidden Shed","Your rusty key opens the mysterious shed.");addItem("gear");log("Your key opened the hidden shed.");}else log("You couldn't find anything that would open it.");}],
              ["Inspect the lock",()=>{discover("Strange Lock","The lock has the same tiny door symbol found on one of your objects.");log("Inspected the shed's lock.");}],
              ["Leave it alone",()=>log("Left the strange shed alone.")]
            ]
          },
          {
            title:"📷 Someone in the Photograph",
            text:"While sorting your junk, you notice that the person in an old photograph looks familiar.",
            requirements:[()=>state.day>=10,()=>has("photo"),()=>!(state.storyFlags&&state.storyFlags.photographStudied)],
            onceKey:"photographStudied",
            choices:[
              ["Study the photograph",()=>{state.storyFlags=state.storyFlags||{};state.storyFlags.photographStudied=true;discover("The Photograph","The background contains a building with the same symbol as the strange coin.");log("Studied the old photograph.");}],
              ["Put it away",()=>{state.storyFlags=state.storyFlags||{};state.storyFlags.photographStudied=true;log("Put the photograph back in storage.");}],
              ["Sell it",()=>{const p=find("photo");if(p){state.money+=12;removeItem(p.uid);state.storyFlags=state.storyFlags||{};state.storyFlags.photographStudied=true;log("Sold the photograph.");}}]
            ]
          },
          {
            title:"🧸 The Toy Bear",
            text:"You could swear the toy bear is facing a different direction than it was earlier.",
            requirements:[()=>state.day>=6,()=>has("bear")],
            choices:[
              ["Watch it",()=>{discover("The Moving Toy","The bear seems to move when you look away.");log("Watched the toy bear.");}],
              ["Take it apart",()=>{discover("The Bear Mechanism","There is a tiny mechanical component hidden inside the bear.");log("Inspected the toy bear.");}],
              ["Sell it",()=>{const b=find("bear");if(b){state.money+=20;removeItem(b.uid);log("Sold the strange toy bear.");}}]
            ]
          },
          {
            title:"📡 The Broadcast",
            text:"Your radio suddenly turns itself on.",
            requirements:[()=>state.day>=18,()=>has("radio"),()=>!(state.storyFlags&&state.storyFlags.broadcastHeard)],
            onceKey:"broadcastHeard",
            choices:[
              ["Listen",()=>{state.storyFlags=state.storyFlags||{};state.storyFlags.broadcastHeard=true;discover("The Broadcast","A voice repeatedly says: 83.7.");log("Listened to the mysterious broadcast.");}],
              ["Unplug it",()=>{state.storyFlags=state.storyFlags||{};state.storyFlags.broadcastHeard=true;log("Unplugged the radio.");}],
              ["Record it",()=>{if(has("radio")){state.storyFlags=state.storyFlags||{};state.storyFlags.broadcastHeard=true;addItem("tape");discover("Recorded Broadcast","You managed to record part of the strange broadcast.");log("Recorded the strange radio signal.");}}]
            ]
          },
          {
            title:"🧲 Something Metallic",
            text:"You hear a faint scraping noise somewhere in your house.",
            requirements:[()=>state.day>=20],
            choices:[
              ["Use the magnet",()=>{if(has("magnet")){discover("Hidden Metal","The magnet pulls toward something hidden behind the wall.");log("Used the magnet to investigate the scraping noise.");}else log("You don't have a magnet.");}],
              ["Follow the sound",()=>{if(chance(.5)){addItem("gear");log("You found a tiny gear beneath a loose floorboard.");}else log("The sound stopped.");}],
              ["Ignore it",()=>log("Ignored the scraping noise.")]
            ]
          },
          {
            title:"💵 Easy Money",
            text:"An online buyer offers an unusually high price for one random item in your inventory.",
            requirements:[()=>state.day>=8,()=>state.inv.length>0],
            choices:[
              ["Accept the offer",()=>{const x=rand(state.inv);const price=ITEMS[x.id].value*3;state.money+=price;log("Sold "+ITEMS[x.id].name+" for $"+price+".");removeItem(x.uid);}],
              ["Decline",()=>log("Declined the suspiciously generous offer.")]
            ]
          },
          {
            title:"🧪 The Blue Liquid",
            text:"The blue bottle has started glowing brighter than before.",
            requirements:[()=>state.day>=10,()=>has("bottle")],
            choices:[
              ["Put it in the dark",()=>{discover("Blue Glow","The liquid glows brightly when completely isolated from light.");log("Tested the blue bottle in darkness.");}],
              ["Shake it",()=>{if(chance(.5)){state.money+=10;log("The bottle reacted and produced something valuable.");}else log("Nothing happened.");}],
              ["Don't touch it",()=>log("Decided not to experiment with the bottle.")]
            ]
          },
          {
            title:"🛠️ Broken Machine",
            text:"A neighbor asks whether you can repair an old machine.",
            requirements:[()=>state.day>=7],
            choices:[
              ["Take a look",()=>{if(has("gear")||has("screwdriver")){state.money+=18;discover("Useful Junk","Your supposedly worthless junk can actually be useful.");log("Repaired the machine using your junk.");}else log("You didn't have anything useful for the machine.");}],
              ["Ask for payment first",()=>{state.money+=7;log("The neighbor paid you $7 before you started.");}],
              ["Decline",()=>log("Declined the repair job.")]
            ]
          },
          {
            title:"📬 Anonymous Letter",
            text:"A handwritten letter appears in your mailbox. It contains only one sentence: \"You have the key.\"",
            requirements:[()=>state.day>=25,()=>!(state.storyFlags&&state.storyFlags.anonymousLetter)],
            onceKey:"anonymousLetter",
            choices:[
              ["Keep the letter",()=>{state.storyFlags=state.storyFlags||{};state.storyFlags.anonymousLetter=true;discover("You Have the Key","Someone believes you already possess an important key.");log("Kept the anonymous letter.");}],
              ["Destroy it",()=>{state.storyFlags=state.storyFlags||{};state.storyFlags.anonymousLetter=true;log("Destroyed it.");}],
              ["Look for a key",()=>{state.storyFlags=state.storyFlags||{};state.storyFlags.anonymousLetter=true;if(has("key")){discover("The Correct Key","The rusty key may be much more important than you thought.");log("Checked your collection for the key.");}else log("You don't have a key.");}]
            ]
          },
          {
            title:"🎁 A Free Offer",
            text:"A seller online is giving away one mysterious object. Shipping costs $3.",
            requirements:[()=>state.day>=3],
            choices:[
              ["Pay the shipping",()=>{state.money-=3;addItem(rand(["coin","key","box","disk","bottle"]));log("Paid $3 for a mysterious object.");}],
              ["Pass",()=>log("Passed on the free object.")]
            ]
          },
          {
            title:"🕳️ Loose Floorboard",
            text:"One floorboard has become loose. Something is underneath it.",
            requirements:[()=>state.day>=9],
            choices:[
              ["Lift it",()=>{if(chance(.65)){addItem(rand(["coin","gear","key"]));log("Found something underneath the floorboard.");}else{state.money+=5;log("Found $5 underneath the floorboard.");}}],
              ["Leave it",()=>log("Left the floorboard alone.")]
            ]
          },
          {
            title:"📦 Package Inspection",
            text:"A delivery company offers to inspect your next package for dangerous materials.",
            requirements:[()=>state.day>=12],
            choices:[
              ["Accept",()=>{state.money-=2;discover("Package Inspection","The inspection company seems unusually interested in your packages.");log("Paid $2 for a package inspection.");}],
              ["Decline",()=>log("Declined the package inspection.")]
            ]
          },
          {
            title:"🌧️ Rainy Delivery",
            text:"Your package arrives soaked. One item inside has started rusting.",
            requirements:[()=>state.day>=6],
            choices:[
              ["Open it immediately",()=>{addItem(rand(["key","gear","box"]));log("Opened the soaked package.");}],
              ["Let it dry first",()=>{if(chance(.6)){addItem("coin");log("Let the package dry before opening it.");}else log("The package was already ruined.");}]
            ]
          },
          {
            title:"🔊 Noise Next Door",
            text:"Your neighbor is making an extremely loud mechanical noise.",
            requirements:[()=>state.day>=14],
            choices:[
              ["Investigate",()=>{if(chance(.5)){state.money+=10;log("Your neighbor paid you $10 to help move some machinery.");}else{discover("The Workshop","Your neighbor has been building machines from discarded junk.");log("Discovered your neighbor's strange workshop.");}}],
              ["Ignore it",()=>log("Ignored the noise.")]
            ]
          },
          {
            title:"🪙 The Strange Coin",
            text:"The strange coin feels warm even though the room is cold.",
            requirements:[()=>state.day>=8,()=>has("coin")],
            choices:[
              ["Inspect it",()=>{discover("Warm Coin","The coin becomes warm whenever you're near something containing the same metal.");log("Inspected the strange coin.");}],
              ["Sell it",()=>{const c=find("coin");if(c){state.money+=40;removeItem(c.uid);log("Sold the strange coin for $40.");}}],
              ["Keep it",()=>log("Kept the strange coin.")]
            ]
          },
          {
            title:"📼 Cassette Recording",
            text:"You find an old cassette player in a box of junk.",
            requirements:[()=>state.day>=12,()=>has("tape")],
            choices:[
              ["Play a tape",()=>{discover("The Recording","The tape contains a voice describing a location you don't recognize.");log("Played the cassette.");}],
              ["Sell the player",()=>{state.money+=9;log("Sold the cassette player.")}]
            ]
          },
          {
            title:"🗺️ A Strange Address",
            text:"An address is scribbled on the back of a receipt you found.",
            requirements:[()=>state.day>=20],
            choices:[
              ["Write it down",()=>{discover("The Address","The address appears to correspond to a building in the photograph.");log("Recorded the mysterious address.");}],
              ["Throw it away",()=>log("Threw away the strange receipt.")]
            ]
          },
          {
            title:"👤 Anonymous Buyer",
            text:"A buyer wants to purchase one item from you but refuses to tell you why.",
            requirements:[()=>state.day>=20,()=>state.inv.length>0],
            choices:[
              ["Ask what it's for",()=>{if(chance(.5)){discover("Anonymous Buyer","The buyer knows more about your objects than they should.");log("Questioned the anonymous buyer.");}else log("The buyer refused to explain.");}],
              ["Sell something",()=>{const x=rand(state.inv);const price=ITEMS[x.id].value*2;state.money+=price;removeItem(x.uid);log("Sold "+ITEMS[x.id].name+" to the anonymous buyer for $"+price+".");}],
              ["Refuse",()=>log("Refused the anonymous buyer.")]
            ]
          },
          {
            title:"📡 Signal Detected",
            text:"Something in your house is emitting a faint signal.",
            requirements:[()=>state.day>=30,()=>state.scanner||has("radio")||has("magnet")],
            choices:[
              ["Search for it",()=>{discover("Hidden Signal","The signal seems to come from one of your strange objects.");log("Tracked the mysterious signal.");}],
              ["Ignore it",()=>log("Ignored the signal.")]
            ]
          },
          {
            title:"🏚️ The Old House",
            text:"You recognize the house from one of your photographs while browsing an old map.",
            requirements:[()=>state.day>=35,()=>has("photo")],
            choices:[
              ["Mark its location",()=>{discover("The Location","You now know where the house from the photograph is.");log("Marked the house on the map.");}],
              ["Keep looking",()=>{if(chance(.5)){state.money+=6;log("You found an old coin while searching the map archive.");}else log("You found nothing else.");}]
            ]
          },
          {
            title:"🛒 Flash Sale",
            text:"A seller has one item available for almost nothing, but you have no idea what it is.",
            requirements:[()=>state.day>=4],
            choices:[
              ["Buy it for $5",()=>{state.money-=5;addItem(rand(["box","coin","key","bottle","disk"]));log("Bought an unidentified item for $5.");}],
              ["Don't risk it",()=>log("Passed on the mystery item.")]
            ]
          },
          {
            title:"💡 Power Flicker",
            text:"The lights flicker whenever you bring one particular object near the wall.",
            requirements:[()=>state.day>=15,()=>state.inv.length>0],
            choices:[
              ["Test your junk",()=>{const x=rand(state.inv);if(ITEMS[x.id].tags.includes("electric")||ITEMS[x.id].tags.includes("mystery")){discover("Electrical Reaction",x.name+" reacts strangely near the wall.");log("Tested "+x.name+" near the wall.");}else log("Nothing happened.");}],
              ["Leave it alone",()=>log("Ignored the electrical disturbance.")]
            ]
          },
          {
            title:"📦 The Returned Package",
            text:"A package you sold months ago has somehow been returned to you.",
            requirements:[()=>state.day>=40,()=>state.stats.sold>0],
            choices:[
              ["Open it",()=>{addItem(rand(["coin","photo","tape"]));discover("Returned","An object you thought was gone has somehow found its way back.");log("Opened the returned package.");}],
              ["Sell it again",()=>{state.money+=15;log("Sold the returned package without opening it.");}]
            ]
          },
          {
            title:"📋 Tomorrow's Delivery",
            text:"You find a delivery notice dated tomorrow. It lists an object you don't own.",
            requirements:[()=>state.day>=30,()=>!(state.storyFlags&&state.storyFlags.tomorrowNotice)],
            onceKey:"tomorrowNotice",
            choices:[
              ["Keep the notice",()=>{discover("Tomorrow's Delivery","The notice is dated tomorrow, but it describes something that hasn't happened yet.");log("Kept the impossible delivery notice.");}],
              ["Throw it away",()=>log("Threw away the impossible delivery notice.")]
            ]
          },
          {
            title:"📦 The Package With Your Name",
            text:"Today's package is addressed to you by name. You don't remember ever giving it to anyone.",
            requirements:[()=>state.day>=45,()=>!(state.storyFlags&&state.storyFlags.personalPackage)],
            onceKey:"personalPackage",
            choices:[
              ["Open it",()=>{addItem("photo");discover("A Package For You","The sender knew your name. You don't remember telling anyone.");log("Opened the package addressed specifically to you.");}],
              ["Leave it unopened",()=>log("Left the package unopened.")]
            ]
          },
          {
            title:"🧾 The Receipt From Tomorrow",
            text:"A receipt falls from an old box. The date printed on it is tomorrow.",
            requirements:[()=>state.day>=55,()=>has("box"),()=>!(state.storyFlags&&state.storyFlags.futureReceipt)],
            onceKey:"futureReceipt",
            choices:[
              ["Read the receipt",()=>{discover("Future Receipt","The receipt lists something you will apparently buy tomorrow.");log("Read the impossible receipt.");}],
              ["Put it away",()=>log("Put the receipt away.")]
            ]
          },
          {
            title:"🪞 The Wrong Reflection",
            text:"For an instant, your reflection is still when you move.",
            requirements:[()=>state.day>=60,()=>!(state.storyFlags&&state.storyFlags.wrongReflection)],
            onceKey:"wrongReflection",
            choices:[
              ["Watch carefully",()=>{discover("The Reflection","For one second, the reflection looked toward the door instead of at you.");log("Watched the reflection.");}],
              ["Look away",()=>log("Looked away from the mirror.")]
            ]
          },
          {
            title:"📬 No Return Address",
            text:"A package arrives with no sender, no tracking number, and no postage.",
            requirements:[()=>state.day>=22,()=>!(state.storyFlags&&state.storyFlags.noReturnAddress)],
            onceKey:"noReturnAddress",
            choices:[
              ["Open it",()=>{addItem(rand(["disk","tape","photo"]));discover("No Return Address","There was no record of the package anywhere.");log("Opened the package with no return address.");}],
              ["Keep it sealed",()=>log("Kept the package sealed.")]
            ]
          },
          {
            title:"🗝️ The Key Fits Twice",
            text:"You try the rusty key somewhere you've never used it before. It turns.",
            requirements:[()=>state.day>=65,()=>has("key"),()=>state.storyFlags&&state.storyFlags.shedUnlocked,()=>!(state.storyFlags&&state.storyFlags.keyFitsTwice)],
            onceKey:"keyFitsTwice",
            choices:[
              ["Turn it",()=>{discover("The Second Lock","The rusty key opens something other than the shed.");log("The rusty key turned in a second lock.");}],
              ["Stop",()=>log("You stopped before turning the key.")]
            ]
          },
          {
            title:"🚪 Something Behind The Shed",
            text:"There is a faint sound coming from the other side of the shed wall.",
            requirements:[()=>state.day>=70,()=>state.storyFlags&&state.storyFlags.shedUnlocked,()=>!(state.storyFlags&&state.storyFlags.shedBehind)],
            onceKey:"shedBehind",
            choices:[
              ["Go around back",()=>{discover("Behind The Shed","There are fresh marks in the dirt behind the shed. They weren't there yesterday.");log("Investigated behind the shed.");}],
              ["Stay inside",()=>log("You stayed inside.")]
            ]
          },
          {
            title:"📦 The Empty Package",
            text:"For the first time, your daily package is completely empty.",
            requirements:[()=>state.day>=75,()=>!(state.storyFlags&&state.storyFlags.emptyPackage)],
            onceKey:"emptyPackage",
            choices:[
              ["Check the packaging",()=>{discover("The Empty Package","There is no object inside, but the inside of the box is warm.");log("Examined the empty package.");}],
              ["Throw it away",()=>log("Threw away the empty package.")]
            ]
          }
        ];

(function(){
  function ensureStoryFlags(){
    state.storyFlags = state.storyFlags || {};
    return state.storyFlags;
  }

  window.maybeEvent = function(){
    if(!chance(.42)) return;
    state.stats.events++;

    const available = (window.GAME_EVENTS || []).filter(e => {
      if(e.onceKey && ensureStoryFlags()[e.onceKey]) return false;
      if(!e.requirements) return true;
      try {
        return e.requirements.every(fn => typeof fn === "function" && fn());
      } catch(err) {
        console.warn("Event requirement failed:", e.title, err);
        return false;
      }
    });

    if(!available.length) return;
    showEvent(rand(available));
  };

  const originalEventChoice = window.eventChoice;
  window.eventChoice = function(i){
    const e = window.currentEvent;
    if(!e) return;
    const onceKey = e.onceKey;
    originalEventChoice(i);
    if(onceKey){
      ensureStoryFlags()[onceKey] = true;
      saveGame();
    }
  };

  window.JUNKMAIL_EVENT_SYSTEM_VERSION = 2;
})();
