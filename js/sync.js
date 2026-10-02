// ---------- the shared world: Firebase sign-in, and everything that syncs between your two devices ----------
// These values identify the Firebase project and are safe to be public; the security rules (kept out of the
// repo, see docs/adr/0001) are what keep everyone else out.
const FIREBASE={
  apiKey:"AIzaSyCvX5HjBpAu7ysF87kZIakJSRX4lwDT4sw",
  authDomain:"our-little-world-879e5.firebaseapp.com",
  projectId:"our-little-world-879e5",
  storageBucket:"our-little-world-879e5.firebasestorage.app",
  messagingSenderId:"588829887057",
  appId:"1:588829887057:web:16246b828a0adb08e04670"
};

// chat and letters live in separate collections so letters never get pushed out by chatter
function listen(col,kind,lim){
  let first=true;
  db.collection(col).orderBy("ts","desc").limit(lim).onSnapshot(snap=>{
    box[kind]=snap.docs.map(d=>d.data()).reverse();
    if(!first) snap.docChanges().forEach(c=>{
      if(c.type!=="added") return; const m=c.doc.data(), k=m.from;
      const line=m.kind==="letter"?"I left you a letter.":m.text;
      k==="g"?say(line,null):say(null,line); msgBubble(m);
      if(k!==me()){ toast(m.kind==="letter"?NAME[k]+" left you a letter.":NAME[k]+": "+m.text.slice(0,40)); heart(P[k].x,P[k].y); bumpUnread(); SFX.play(m.kind==="letter"?"letter":"chime"); TYPING[k]=false; }
    });
    first=false; if($("chat").classList.contains("on")) render();
  },()=>{});
}

// ---------- live: where each of you is, and what you're doing together ----------
// pos/g and pos/b hold each Character's spot; the live/ documents hold the Pair moment, typing, emotes, music and events.
const HERE={g:"Pratiksha is here ♥",b:"Anubhav is here ♥"};
const other=()=>role==="g"?"b":"g";
const r1=v=>Math.round(v*10)/10;
let posReady=false,posKey="",posAt=0,seenPair=null,otherSeen=0;
const otherHere=()=>Date.now()-otherSeen<70000;
function writePos(k,a){
  const held=a.hold&&a.pose?a.pose:null, go=a.tx!=null;
  db.doc("pos/"+k).set({x:r1(a.x),y:r1(a.y),tx:go?r1(a.tx):null,ty:go?r1(a.ty):null,pose:held,phone:a.phone?1:0,by:role,ts:Date.now()}).catch(()=>{});
}
// called every frame; only writes when your target/pose changed, at most ~3x a second while walking
function sharePos(t){
  if(!LIVE||!posReady) return; const a=P[role], go=a.tx!=null;
  const k=[r1(go?a.tx:a.x),r1(go?a.ty:a.y),go,a.hold?a.pose:"",a.phone].join();
  if(k===posKey||t-posAt<300) return; posKey=k; posAt=t; writePos(role,a);
}
function applyPos(k,d,snap){
  const a=P[k]; if(snap){a.x=d.x;a.y=d.y;}
  if(d.pose){ a.x=d.x; a.y=d.y; a.tx=null; a.pose=d.pose; a.hold=1; a.phone=d.phone?1:0; }
  else{ if(a.hold){a.pose=null;a.hold=0;} a.phone=0; a.tx=d.tx!=null?d.tx:d.x; a.ty=d.ty!=null?d.ty:d.y; }
}
function sharePair(p){
  if(!LIVE) return; const id=Math.random().toString(36).slice(2); seenPair=id;
  db.doc("live/pair").set(p?{id,n:p.n,x:p.x,y:p.y,hold:p.hold?1:0,f:p.f?1:0,by:role,ts:Date.now()}:{id,n:null,by:role,ts:Date.now()}).catch(()=>{});
}
function onPair(d,first){
  if(!d||d.id===seenPair) return; seenPair=d.id;
  if(!d.n){ if(pair&&pair.hold) endPair(); return; }
  if(first&&!d.hold) return;      // an old kiss/hug that has already finished
  startPair(d,false);
}
function onEvent(d){
  if(!d||d.by===role||Date.now()-d.ts>60000) return;
  if(d.type==="memory"){ toast(NAME[d.by]+" kept a new Memory ♥"); hearts(28.7,12,4); SFX.play("chime"); }
  else if(d.type==="plan") celebratePlan(d.text);
  else if(d.type==="jar") toast(NAME[d.by]+" opened one of your notes ♥");
}
let typingTimers={};
function onLive(id,d,first){
  const k=id.slice(-1);
  if(id==="pair") return onPair(d,first);
  if(id==="listen"){ if(!first) onListen(d); return; }
  if(id==="event"){ if(!first) onEvent(d); return; }
  if(k===role||!d) return;
  if(id.startsWith("typing_")){
    TYPING[k]=!!d.on&&Date.now()-d.ts<15000; clearTimeout(typingTimers[k]);
    if(TYPING[k]) typingTimers[k]=setTimeout(()=>TYPING[k]=false,15000);
  }
  else if(id.startsWith("emote_")){ if(!first&&Date.now()-d.ts<10000) emote(d.e,k,false); }
  else if(id.startsWith("music_")){ NOWP[k]=d.playing&&Date.now()-d.ts<20*60000?d:null; showChip(k); if(openId==="music") rerender("music"); }
}

let synced=false;
function startSync(){
  if(synced) return; synced=true;
  let firstW=true;
  db.doc("world/state").onSnapshot(s=>{
    const first=firstW; firstW=false;
    if(!s.exists) return; const d=s.data(), fresh=(d.fedAt||0)>W.fedAt, oldPlant=(W.plant||{}).last;
    Object.assign(W,d); applyWorld();
    if(first||s.metadata.hasPendingWrites) return;      // no news on arrival, and no news about your own changes
    if(fresh&&d.fedBy&&d.fedBy!==me()){ goTo(BOWL.x,BOWL.y+1,"eatgo"); toast(NAME[d.fedBy]+" fed the cat."); }
    if(d.plant&&d.plant.last!==oldPlant&&d.plant.by&&d.plant.by!==me()){ toast(NAME[d.plant.by]+" watered our plant 💧"); drops(PLANT.x,PLANT.y-7); }
  },()=>{});
  listen("msgs","chat",80); listen("letters","letter",200);
  db.collection("outfit").onSnapshot(snap=>snap.docChanges().forEach(c=>{ const d=c.doc.data(); if(d) WARD.set(c.doc.id,d); }),()=>{});
  watchFrame();
  if(!LIVE) return;
  // ----- only when signed in: the two of you, live -----
  let firstPos=true;
  db.collection("pos").onSnapshot(snap=>{
    snap.docChanges().forEach(c=>{
      const k=c.doc.id, d=c.doc.data(); if(!P[k]||!d||c.doc.metadata.hasPendingWrites) return;
      if(k===role){ if(firstPos) applyPos(k,d,true); return; }       // put you back where you left off
      if(firstPos){ if(Date.now()-(d.ts||0)<70000) otherSeen=Date.now(); }
      else if(d.by===k){ if(!otherHere()){ toast(HERE[k]); SFX.play("chime"); setTimeout(()=>catGreet(k),800); } otherSeen=Date.now(); }
      applyPos(k,d,firstPos);
    });
    firstPos=false; posReady=true;
  },()=>{posReady=true;});
  let firstLive=true;
  db.collection("live").onSnapshot(snap=>{
    snap.docChanges().forEach(c=>{ if(c.doc.metadata.hasPendingWrites||c.type==="removed") return; onLive(c.doc.id,c.doc.data(),firstLive); });
    firstLive=false;
  },()=>{});
  // a quiet heartbeat so the other one knows you're here
  const beat=()=>{ if(posReady&&document.visibilityState==="visible") writePos(role,P[role]); };
  setInterval(beat,45000); document.addEventListener("visibilitychange",beat);
  spLoadShared(); setTimeout(pollNow,2000);
}

// ---------- signing in: just the two of you ----------
function showRole(mode,q){ $("rq").textContent=q; $("rpick").hidden=mode!=="pick"; $("gin").hidden=mode!=="signin"; $("role").classList.add("on"); document.body.classList.add("signin"); }
let afterBegin=[];
function beginWith(store,r){ setRole(r); db=store; LIVE=true; startSync(); setTimeout(()=>catGreet(me()),2600); afterBegin.forEach(f=>f()); afterBegin=[]; }
function local(note){         // no connection: play on this device only, like before (kept in this browser)
  try{role=localStorage.getItem("role")}catch(e){}
  db=LocalDB; startSync();
  if(role) pick(role); else showRole("pick","Who is playing on this device?");
  toast(note||"Playing on this device only.");
}
(async function boot(){
  applyView(); applyWorld(); labels(); greet(); requestAnimationFrame(loop);
  if("serviceWorker" in navigator&&location.protocol==="https:") navigator.serviceWorker.register("sw.js").catch(()=>{});
  if(await spCallback()) afterBegin.push(()=>setTimeout(()=>openPanel("music"),600));
  if(typeof firebase==="undefined"||!FIREBASE.apiKey) return local();
  firebase.initializeApp(FIREBASE);
  const auth=firebase.auth(), fs=firebase.firestore();
  signOut=()=>auth.signOut().then(()=>location.reload());
  $("gin").onclick=e=>{ e.stopPropagation();
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(err=>{
      if(!/popup-closed|cancelled-popup/.test(err.code)) toast("Sign-in didn't work. Try again.");
    });
  };
  auth.onAuthStateChanged(async u=>{
    if(!u) return showRole("signin","Our Little World");
    if(LIVE) return;
    let mine;
    try{ mine=await fs.doc("users/"+u.uid).get(); }
    catch(e){
      if(e.code==="permission-denied"){ toast("Sorry, this little world is just for two."); return auth.signOut(); }
      return local("Can't reach our world right now. Playing on this device.");
    }
    if(mine.exists) return beginWith(fs,mine.data().role);
    chooseRole=r=>fs.doc("users/"+u.uid).set({role:r}).then(()=>beginWith(fs,r),()=>toast("Hmm, that one isn't you."));
    showRole("pick","Who are you?");
  });
})();
