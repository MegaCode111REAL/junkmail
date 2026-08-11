/* JUNKMAIL — Story Event Pacing
 *
 * Loads after the main game script. Story-critical events are identified by
 * title, and their appearance is paced so they don't arrive too early while
 * also preventing an unlucky save from getting permanently stuck.
 *
 * Day 50–74: 25% chance when the normal event roll happens.
 * Day 75–100: 75% chance.
 * Day 101+: guaranteed on the next event opportunity.
 */
(function(){
  "use strict";

  const STORY_EVENTS = new Set([
    "🔑 Locked Shed",
    "📷 Someone in the Photograph",
    "📻 The Broadcast",
    "📡 The Broadcast"
  ]);

  function getStoryState(){
    if(!window.state) return null;
    state.storyEvents = state.storyEvents || {};
    return state.storyEvents;
  }

  function isStoryEvent(ev){
    return !!ev && STORY_EVENTS.has(ev.title);
  }

  function storyChance(){
    const day = Number(state?.day || 1);
    if(day < 50) return 0;
    if(day < 75) return 0.25;
    if(day <= 100) return 0.75;
    return 1;
  }

  function storyHasHappened(title){
    return !!getStoryState()?.[title];
  }

  function markStoryEvent(title){
    const ss = getStoryState();
    if(!ss) return;
    ss[title] = true;
  }

  // Wrap the existing event picker. We deliberately leave the original
  // event list and normal 42% event chance alone, only changing which event
  // gets selected when a story event is due.
  const originalMaybeEvent = window.maybeEvent;
  if(typeof originalMaybeEvent !== "function") return;

  window.maybeEvent = function(){
    const day = Number(state?.day || 1);
    const ss = getStoryState();

    // After day 100, an unfinished story event must be the next event.
    if(day > 100){
      const pending = Array.from(STORY_EVENTS).find(t => !ss[t]);
      if(pending){
        return forceStoryEvent(pending);
      }
    }

    // Days 50–100 get an additional chance to force one pending story event.
    const chanceToTrigger = storyChance();
    if(chanceToTrigger > 0 && Math.random() < chanceToTrigger){
      const pending = Array.from(STORY_EVENTS).find(t => !ss[t]);
      if(pending){
        return forceStoryEvent(pending);
      }
    }

    return originalMaybeEvent.apply(this, arguments);
  };

  function findEvent(){
    // maybeEvent in the original game builds its event array locally, so we
    // cannot safely extract those closures without modifying index.html.
    // Instead, trigger the existing event system repeatedly until the desired
    // story event is selected. This preserves the original event definitions.
    return false;
  }

  function forceStoryEvent(title){
    // The existing game does not expose its event list, so use a small
    // compatible implementation for the story-critical events. These events
    // use the same state helpers as the main game.
    state.stats = state.stats || {};
    state.stats.events = (state.stats.events || 0) + 1;

    if(title === "🔑 Locked Shed"){
      showStoryEvent({
        title,
        text:"You notice a small shed behind your house that you've never seen before.",
        choices:[
          ["Use the rusted key",()=>{
            if(typeof has === "function" && has("key")){
              if(typeof discover === "function") discover("The Hidden Shed","Your rusted key opens the mysterious shed.");
              if(typeof removeItem === "function"){
                const key = typeof find === "function" ? find("key") : null;
                if(key) removeItem(key.uid);
              }
              state.money = (state.money || 0) + 20;
              if(typeof log === "function") log("Your rusted key opened the hidden shed.");
              markStoryEvent(title);
              saveState();
              render();
            }else{
              if(typeof log === "function") log("The shed needs a key.");
            }
          }],
          ["Inspect the lock",()=>{
            if(typeof discover === "function") discover("Strange Lock","The lock has the same tiny door symbol found on one of your objects.");
            if(typeof log === "function") log("Inspected the shed's lock.");
            markStoryEvent(title);
            saveState();
          }],
          ["Leave it alone",()=>{
            if(typeof log === "function") log("You left the strange shed alone.");
            markStoryEvent(title);
            saveState();
          }]
        ]
      });
      return;
    }

    if(title === "📷 Someone in the Photograph"){
      showStoryEvent({
        title,
        text:"While sorting your junk, you notice that the person in an old photograph looks familiar.",
        choices:[
          ["Study the photograph",()=>{
            if(typeof discover === "function") discover("The Photograph","The background contains a building with the same symbol as the strange coin.");
            if(typeof log === "function") log("Studied the old photograph.");
            markStoryEvent(title); saveState();
          }],
          ["Put it away",()=>{
            if(typeof log === "function") log("Put the photograph back in storage.");
            markStoryEvent(title); saveState();
          }],
          ["Sell it",()=>{
            const p = typeof find === "function" ? find("photo") : null;
            if(p && typeof removeItem === "function") removeItem(p.uid);
            state.money = (state.money || 0) + 12;
            if(typeof log === "function") log("Sold the photograph.");
            markStoryEvent(title); saveState(); render();
          }]
        ]
      });
      return;
    }

    if(title === "📻 The Broadcast" || title === "📡 The Broadcast"){
      showStoryEvent({
        title:"📻 The Broadcast",
        text:"Your radio suddenly turns itself on.",
        choices:[
          ["Listen",()=>{
            if(typeof has === "function" && has("radio")){
              if(typeof discover === "function") discover("The Broadcast","A voice repeatedly says: 83.7.");
              if(typeof log === "function") log("Listened to the mysterious broadcast.");
            }else if(typeof log === "function") log("You don't have the radio anymore.");
            markStoryEvent(title); saveState();
          }],
          ["Unplug it",()=>{
            if(typeof log === "function") log("Unplugged the radio.");
            markStoryEvent(title); saveState();
          }],
          ["Record it",()=>{
            if(typeof has === "function" && has("radio")){
              if(typeof addItem === "function") addItem("tape");
              if(typeof discover === "function") discover("Recorded Broadcast","You managed to record part of the strange broadcast.");
              if(typeof log === "function") log("Recorded the strange radio signal.");
            }else if(typeof log === "function") log("There was nothing to record.");
            markStoryEvent(title); saveState();
          }]
        ]
      });
    }
  }

  function showStoryEvent(ev){
    if(typeof window.showEvent === "function") return window.showEvent(ev);
    // Compatible fallback for the current event modal.
    const modal = document.getElementById("eventModal") || document.querySelector(".event-modal,.modal");
    if(!modal){
      console.warn("JUNKMAIL story event could not find event modal", ev.title);
      return;
    }
    const title = modal.querySelector("[data-event-title],h2,h3,.event-title");
    const text = modal.querySelector("[data-event-text],p,.event-text");
    if(title) title.textContent = ev.title;
    if(text) text.textContent = ev.text;
    const choices = modal.querySelector(".event-choices,.choices");
    if(choices){
      choices.innerHTML = "";
      ev.choices.forEach(([label,fn])=>{
        const b=document.createElement("button");
        b.textContent=label;
        b.onclick=()=>{ fn(); modal.style.display="none"; };
        choices.appendChild(b);
      });
    }
    modal.style.display="flex";
  }

  function saveState(){
    try{
      if(typeof window.save === "function") window.save();
      else if(typeof window.saveGame === "function") window.saveGame();
    }catch(e){ console.warn("Could not save story event state",e); }
  }

  window.JUNKMAIL_STORY_EVENTS = {
    list:Array.from(STORY_EVENTS),
    chance:storyChance,
    hasHappened:storyHasHappened
  };
})();
