// ---------- Our Little World: the room ----------
// Pratiksha's original game. Live sync, Gamer view and the newer features hook in from the other js/ files.
const K = 1.15;               // sprite scale vs. the sheet
const $ = id => document.getElementById(id);
const stage = $("stage");
stage.style.backgroundImage = `url(${BG})`;
Object.values(S).forEach(s=>{const i=new Image();i.src=s.src;});   // fetch every sprite up front so a pose doesn't blink in the first time it's used

// ---------- editable words ----------
const ACT = {
  kiss:["Mwah.","Hehe, again?"], hug:["Don't let go.","Never."], hands:["Your hand fits mine.","Always has."],
  sit:["Stay a while?","As long as you want."], lap:["Five more minutes...","Take ten."], feed:["Open up!","Mmm, more."],
  boop:["Boop!","Hey!"], play:["I'm winning.","Keep dreaming."], cuddle:["Cold?","Now I'm warm."],
  look:["What?","Nothing. Just you."], talk:["Guess what happened today.","Tell me everything."],
  photo:["Smile!","Which side is better?"], sleep:["Goodnight.","Goodnight."], stand:["Just us.","Just us."]
};
const CHAT = [["Come closer...","Always."],["Miss you.","Miss you more."],["What should we do today?","Anything with you."],["Look, the stars are out.","Not as pretty as you."]];
// [label, what it opens, x0, y0, x1, y1 on the 1536x1024 painting]
const SPOTS = [
  ["Letters","letter",670,188,800,340],["Games","games",1190,436,1400,700],
  ["Memories","memories",400,628,645,800],["Surprise me","jar",1135,700,1310,830],
  ["Home","home",20,146,200,190],["Our Letters","letter",20,196,200,240],["Memories","memories",20,246,200,290],
  ["Games","games",20,296,200,340],["Our Map","map",20,346,200,390],["Future Plans","plans",20,396,200,440],
  ["Music","music",20,446,200,490],["Settings","settings",20,496,200,540],
  ["Mirror","wardrobe",1425,560,1520,786]
];
const NAME={g:"Pratiksha",b:"Anubhav"};
// -------------------------------------

const me=()=>role||sel;
const who=k=>k===me()?"You":NAME[k];       // labels read from the viewer's side: "You", and the other one by name
let tt; const toast = t => { const e=$("toast"); e.textContent=t; e.classList.add("on"); clearTimeout(tt); tt=setTimeout(()=>e.classList.remove("on"),2600); };
const heart = (x,y)=>{const h=document.createElement("i");h.className="ht";h.textContent="♥";h.style.left=x+"%";h.style.top=(y-14)+"%";stage.appendChild(h);setTimeout(()=>h.remove(),1400)};
function hotspot(label,x0,y0,x1,y1,fn){
  const b=document.createElement("button"); b.className="hs"; b.setAttribute("aria-label",label);
  b.style.cssText=`left:${x0/15.36}%;top:${y0/10.24}%;width:${(x1-x0)/15.36}%;height:${(y1-y0)/10.24}%`;
  b.onclick=e=>{e.stopPropagation();SFX.play("tap");fn(e)}; stage.appendChild(b); return b;
}
function openSpot(t){ if(t==="letter") openChat("letter"); else if(t==="home") goHome(); else openPanel(t); }
SPOTS.forEach(([n,t,x0,y0,x1,y1])=>hotspot(n,x0,y0,x1,y1,()=>openSpot(t)));

const P = {g:{x:45.6,y:60.5,tx:null,ty:null,pose:null,mv:false,d:"down"}, b:{x:56.5,y:60.5,tx:null,ty:null,pose:null,mv:false,d:"down"}};
const els = {g:mk(), b:mk(), p:mk(), c:mk()};
function mk(){const i=document.createElement("img");i.className="spr";i.alt="";stage.insertBefore(i,$("base"));const s=document.createElement("i");s.className="shd";stage.insertBefore(s,i);i._s=s;return i}
let sel="g", pair=null, pairT=0, NOW=0;
let LIVE=false;               // true once signed in: you move only your own character, the other one follows the other device
const keys=new Set();
const JOY={x:0,y:0,on:false}; // the on-screen joystick in Gamer view

function say(g,b){ if(g!=null) document.querySelector("#sg p").textContent=g; if(b!=null) document.querySelector("#sb p").textContent=b; sayBubbles(g,b); }
function pick(k){ sel=k; $("sg").classList.toggle("sel",k==="g"); $("sb").classList.toggle("sel",k==="b"); labels(); }
$("sg").onclick=e=>{e.stopPropagation();if(!LIVE)pick("g")}; $("sb").onclick=e=>{e.stopPropagation();if(!LIVE)pick("b")};

function act(name){
  SFX.play("tap");
  if(name==="cat"){ petCat(); return; }
  if(name==="feedcat"){ feedCat(); return; }
  if(name==="night"){ setWorld({night:!W.night}); return; }
  if(name==="chat"){ openChat("chat"); return; }
  if(name==="emote"){ openPanel("emotes"); return; }
  if(name==="water"){ waterPlant(); return; }
  if(name==="wardrobe"){ openPanel("wardrobe"); return; }
  if(name==="lamp"){ setWorld({lamp:!W.lamp}); SFX.play(W.lamp?"on":"off"); return; }
  if(pair&&pair.hold){ clearHold(); return; }
  if(pair) return;
  const g=P.g,b=P.b, d=Math.hypot(g.x-b.x,(g.y-b.y)/1.5);
  if(name==="photo"&&d>17){ snapFlash(true); return; }   // too far apart to pose: just take the picture
  if(["sit","sleep","cuddle"].includes(name)&&d>17){ const a=P[sel]; a.pose="sit"; a.hold=1; a.tx=null; return; }
  if(d>17){ say("Come closer...","Always."); return; }
  const list=Object.keys(ACT).filter(k=>!["kiss","hug"].includes(k));
  const n = name==="e" ? list[Math.floor(Math.random()*list.length)] : name;
  startPair({n,x:(g.x+b.x)/2,y:Math.max(g.y,b.y),hold:["sit","sleep","cuddle"].includes(n)},true);
}
// p: {n, x, y, hold, f (from furniture)}; mine = started on this device, so tell the other one
function startPair(p,mine){
  const n=p.n; pair={n,x:p.x,y:p.y}; pairT=3.4; job=null;
  for(const k of ["g","b"]){ const a=P[k]; a.tx=null; a.phone=0; if(a.hold){a.pose=null;a.hold=0;} }
  if(p.hold){pair.hold=1;pairT=1e9;}
  say(ACT[n][0],ACT[n][1]);
  SFX.play(n==="kiss"||n==="boop"?"pop":["hug","cuddle","hands"].includes(n)?"hug":"chime");
  if(p.f) heart(pair.x,pair.y);
  else{
    if(n==="photo") setTimeout(()=>snapFlash(mine),1500);
    if(["kiss","hug","hands","cuddle"].includes(n)) heart(pair.x,pair.y);
    if(cat.st!=="rub") goTo(pair.x+(cat.x>pair.x?10:-10),pair.y+1,"come");
  }
  sparkle(pair.x,pair.y-9,5);
  if(mine) sharePair(p);
}
function endPair(){
  P.g.x=pair.x-3.5; P.b.x=pair.x+3.5; P.g.y=P.b.y=pair.y; P.g.tx=P.b.tx=null; pair=null;
  if(LIVE&&!otherHere()) writePos(other(),P[other()]);   // they're away, so keep their spot up to date for them
}
// the camera flash; take = this device keeps the picture
function snapFlash(take){
  $("flash").classList.add("on"); SFX.play("shutter"); setTimeout(()=>$("flash").classList.remove("on"),120);
  if(take) setTimeout(takeSnapshot,260);
}
document.querySelectorAll("[data-a]").forEach(b=>b.onclick=e=>{e.stopPropagation();act(b.dataset.a)});

addEventListener("keydown",e=>{
  if(e.key==="Escape"){ closePanels(); return; }
  if(e.metaKey||e.ctrlKey||e.altKey||(e.target.matches&&e.target.matches("input,textarea,select"))) return;
  const k=e.key.toLowerCase();
  if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)){keys.add(k);e.preventDefault();clearHold();}
  if(k==="c") act("cat"); if(k==="k") act("kiss"); if(k==="h") act("hug"); if(k==="e") act("e");
});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
addEventListener("blur",()=>keys.clear());
stage.addEventListener("pointerdown",e=>{
  if(!e.target.closest("#fm")) $("fm").style.display="none";
  if(e.target.closest("button,.say,#chat,#role,#fm,.sb,.chip,#plant,#frame")) return; clearHold();
  const r=stage.getBoundingClientRect(), a=P[sel];
  a.tx=Math.min(88,Math.max(12,(e.clientX-r.left)/r.width*100));
  a.ty=Math.min(80,Math.max(37,(e.clientY-r.top)/r.height*100));
  tapRing(a.tx,a.ty);
});

// put a sprite at x%, y% (its feet); bob in cqw, rot in degrees, sy = breathing/step squash
function place(el,key,x,y,bob,rot,sy){
  const s=S[key], src=SRC(key);
  if(el._k!==key||el._src!==src){el.src=src;el.style.width=(s.w*K/15.36)+"%";el._k=key;el._src=src;}
  el.style.display="block"; el.style.left=x+"%"; el.style.top=y+"%"; el.style.zIndex=Math.round(y*10);
  el.style.transform=`translate(-50%,calc(-100% + ${bob||0}cqw)) rotate(${rot||0}deg) scale(${2-(sy||1)},${sy||1})`;
  const sh=el._s; sh.style.display="block"; sh.style.left=x+"%"; sh.style.top=y+"%"; sh.style.width=(s.w*K/15.36*.66)+"%"; sh.style.zIndex=Math.round(y*10)-1;
  sh.style.opacity=bob?1+bob*.8:1;
}
function hide(el){ el.style.display="none"; el._s.style.display="none"; }
let last=performance.now();
function loop(t){
  const dt=Math.min(.05,(t-last)/1000); last=t; NOW=t;
  const map={g:["w","a","s","d"],b:["arrowup","arrowleft","arrowdown","arrowright"]};
  for(const k of ["g","b"]){
    const a=P[k]; a.mv=false; if(a.pose||pair) continue;
    const on=i=>LIVE?k===role&&(keys.has(map.g[i])||keys.has(map.b[i])):keys.has(map[k][i]);
    let dx=(on(3)?1:0)-(on(1)?1:0), dy=(on(2)?1:0)-(on(0)?1:0);
    if(JOY.on&&k===sel&&(JOY.x||JOY.y)){a.tx=null; dx=JOY.x; dy=JOY.y;}
    else if(dx||dy){a.tx=null; const L=Math.hypot(dx,dy); dx/=L; dy/=L;}
    else if(a.tx!=null){const ex=a.tx-a.x, ey=(a.ty-a.y)/1.5, L=Math.hypot(ex,ey); if(L<.8){a.tx=null}else{dx=ex/L;dy=ey/L}}
    if(dx||dy){
      a.mv=true; a.d=Math.abs(dx)>Math.abs(dy)?(dx<0?"left":"right"):(dy<0?"up":"down");
      a.x=Math.min(88,Math.max(12,a.x+dx*24*dt)); a.y=Math.min(80,Math.max(37,a.y+dy*36*dt));
      if(a.x>72&&a.y<46.5) a.y=46.5; if(a.x<25&&a.y>57) a.x=25;
    }
  }
  if(pair){ pairT-=dt; if(pairT<=0) endPair(); }
  if(pair){ hide(els.g); hide(els.b); place(els.p,pair.n,pair.x,pair.y,0,0,1+.01*Math.sin(t/620)); }
  else{
    hide(els.p);
    const close=Math.hypot(P.g.x-P.b.x,(P.g.y-P.b.y)/1.5)<14;
    for(const k of ["g","b"]){ const a=P[k];
      let pose=a.pose||(a.mv?a.d:"idle");
      if(!a.pose&&!a.mv){
        if(t<(a.emU||0)) pose=a.em;                                    // an emote (wave, happy, shy)
        else if(close){ a.glT=(a.glT??4+Math.random()*5)-dt;            // standing close: a happy or shy glance now and then
          if(a.glT<=0){ a.gl=Math.random()<.5?"happy":"shy"; a.glU=t+1500; a.glT=7+Math.random()*7; }
          if(t<(a.glU||0)) pose=a.gl; }
      }
      const ph=k==="g"?0:1.7;
      if(a.mv) place(els[k],k+"_"+pose,a.x,a.y,-Math.abs(Math.sin(t/95))*.45,Math.sin(t/95)*3.2,1+.022*Math.cos(t/47.5));
      else place(els[k],k+"_"+pose,a.x,a.y,0,0,1+.011*Math.sin(t/560+ph));
    }
  }
  catStep(dt,t); fxStep(dt,t); camStep(dt); bubbleStep(t); sharePos(t);
  requestAnimationFrame(loop);
}

// ---------- the grey Persian cat ----------
const BED={x:26,y:53.6};
const CATSAY={g:["Hello, gorgeous.","Who's the fluffiest? You are."],b:["Hey, buddy.","She picked you again."]};
const cat={x:BED.x,y:BED.y,d:"right",st:"sleep",tx:null,ty:null,t:20,mv:false,who:"g"};
const bub=document.createElement("div"); bub.className="bub"; stage.appendChild(bub); let bubT=0;
const cbtn=document.createElement("button"); cbtn.className="hs"; cbtn.setAttribute("aria-label","Pet the cat");
cbtn.style.cssText="width:8%;height:11%;z-index:1500;transform:translate(-50%,-100%)"; stage.appendChild(cbtn);
cbtn.onclick=e=>{e.stopPropagation();act("cat")};
const cd=a=>Math.hypot(cat.x-a.x,(cat.y-a.y)/1.5);
const near=()=>cd(P.g)<=cd(P.b)?"g":"b";
const meow=s=>{bub.textContent=s;bubT=1.8;if(/meow|mrrp/.test(s))SFX.play("meow")};
function goTo(x,y,st){cat.tx=Math.min(88,Math.max(12,x));cat.ty=Math.min(80,Math.max(37,y));cat.st=st;}
function startRub(k){
  cat.st="rub";cat.t=2.8;cat.tx=null;cat.who=k;heart(cat.x,cat.y-2);meow("purr...");SFX.play("purr");
  const L=CATSAY[k][Math.floor(Math.random()*2)]; k==="g"?say(L,null):say(null,L);
}
function petCat(){
  const k=cd(P[near()])<16?near():sel; cat.who=k;
  if(cd(P[k])<11) startRub(k); else {goTo(P[k].x+(cat.x<P[k].x?-6:6),P[k].y+.5,"visit");meow("meow!");}
}
function arrive(){
  const s=cat.st; cat.tx=null;
  if(s==="visit") startRub(cat.who);
  else if(s==="bed"){cat.st="sleep";cat.t=25+Math.random()*20;}
  else if(s==="eatgo"){cat.st="eating";cat.t=4;meow("nom nom");}
  else if(s==="come"){cat.st="idle";cat.t=4;meow("meow");}
  else {cat.st="idle";cat.t=3+Math.random()*3;}
}
function decide(){
  const r=Math.random();
  if(bowlLevel()>0&&r<.3){goTo(BOWL.x,BOWL.y+1,"eatgo");return;}
  if(r<.4){const k=near();cat.who=k;goTo(P[k].x+(Math.random()<.5?-6:6),P[k].y+.5,"visit");}
  else if(r<.75) goTo(20+Math.random()*48,42+Math.random()*34,"wander");
  else goTo(BED.x,BED.y,"bed");
}
function catStep(dt,t){
  phoneStep(); jobStep(); cat.mv=false; cat.t-=dt; if(bubT>0) bubT-=dt;
  if(["visit","come","wander","bed","eatgo"].includes(cat.st)){
    const ex=cat.tx-cat.x, ey=(cat.ty-cat.y)/1.5, L=Math.hypot(ex,ey);
    if(L<.8) arrive(); else {cat.mv=true;cat.d=ex<0?"left":"right";cat.x+=ex/L*15*dt;cat.y+=ey/L*22.5*dt;}
  } else if(cat.st==="sleep"){
    if(cat.t<=0||cd(P.g)<9||cd(P.b)<9){cat.st="idle";cat.t=2;meow("mrrp?");}
  } else if(cat.t<=0) decide();
  const key=cat.st==="sleep"?"cat_sleep":cat.mv?"cat_"+(cat.d==="left"?"l":"r")+(Math.floor(t/140)%2+1):cat.st==="rub"?"cat_happy":"cat_sit";
  place(els.c,key,cat.x,cat.y,cat.mv?-Math.abs(Math.sin(t/110))*.18:0,0,cat.st==="sleep"?1+.03*Math.sin(t/700):1);
  cbtn.style.left=cat.x+"%";cbtn.style.top=cat.y+"%";
  bub.style.left=cat.x+"%";bub.style.top=(cat.y-(cat.st==="sleep"?9:12))+"%";
  if(bubT>0) bub.style.display="block"; else if(cat.st==="sleep"){bub.textContent="z z z";bub.style.display="block";} else bub.style.display="none";
}

// ---------- using the furniture ----------
// [label, "pair"|"solo", pose, [x%, y% where they end up]]. Positions are % of the room.
const FURN={
  bed:{spot:[1130,180,1450,430],app:[78,46.5],opts:[["Sleep together","pair","sleep",[84,42]],["Sit on the bed","solo","sit",[80,42.8]]]},
  sofa:{spot:[150,600,380,820],app:[29,72],opts:[["Sit together","pair","sit",[17,74.5]],["Cuddle","pair","cuddle",[17.4,75]],["Scroll the phone","solo","phone",[15.5,74.5]]]},
  desk:{spot:[250,190,570,360],app:[33,40],opts:[["Use the laptop","solo","type",[29,34.5]]]}
};
const SOLO={sit:"Comfy.",type:"Just answering a few emails...",phone:"Scrolling..."};
let job=null;
Object.entries(FURN).forEach(([id,F])=>{
  const [x0,y0,x1,y1]=F.spot;
  hotspot(id,x0,y0,x1,y1,()=>{
    const m=$("fm"); m.innerHTML="";
    F.opts.forEach((o,i)=>{const c=document.createElement("button");c.textContent=o[0];c.onclick=ev=>{ev.stopPropagation();SFX.play("tap");useFurn(id,i)};m.appendChild(c);});
    m.style.left=((x0+x1)/2/15.36)+"%"; m.style.top=((y0+y1)/2/10.24)+"%"; m.style.display="flex";
  });
});
function useFurn(id,i){
  const F=FURN[id],o=F.opts[i]; $("fm").style.display="none"; clearHold();
  if(o[1]==="pair"&&LIVE){ const k=role; P[k].tx=F.app[0]+(k==="g"?-2:2); P[k].ty=F.app[1]; job={k,pair:1,o}; }   // you walk over; they join you there
  else if(o[1]==="pair"){ P.g.tx=F.app[0]-2; P.b.tx=F.app[0]+2; P.g.ty=P.b.ty=F.app[1]; job={pair:1,o}; }
  else { const k=sel; P[k].tx=F.app[0]; P[k].ty=F.app[1]; job={k,o}; }
}
function jobStep(){
  if(!job||pair) return;
  const ks=job.k?[job.k]:["g","b"];
  if(!ks.every(k=>P[k].tx==null&&!P[k].mv)) return;
  const o=job.o;
  if(job.do){ job.do(); job=null; return; }                       // a walk-then-do errand (watering the plant)
  if(job.pair){ startPair({n:o[2],x:o[3][0],y:o[3][1],hold:1,f:1},true); }
  else{
    const a=P[job.k]; a.x=o[3][0]+(job.k==="b"?3:0); a.y=o[3][1];
    a.pose=o[2]==="phone"?"sit":o[2]; a.phone=o[2]==="phone"?1:0; a.hold=1;
    job.k==="g"?say(SOLO[o[2]],null):say(null,SOLO[o[2]]);
  }
  job=null;
}
const phones={g:$("phg"),b:$("phb")};
function phoneStep(){
  for(const k of ["g","b"]){ const a=P[k],e=phones[k];
    if(a.phone&&a.pose&&!pair){e.style.display="block";e.style.left=(a.x+(k==="g"?1.3:-1.3))+"%";e.style.top=(a.y-5)+"%";}
    else e.style.display="none";
  }
}

// ---------- day/night, cat food, messages, letters ----------
const BOWL={x:47,y:77};
const W={night:true,fedAt:0,fedBy:"",lamp:true,catName:"",anniv:"",playlist:"",plant:{days:0,last:"",by:""}};
let db=null,role=null,tab="chat";
const box={chat:[],letter:[]};
function setRole(r){role=r;try{localStorage.setItem("role",r)}catch(e){} $("role").classList.remove("on");document.body.classList.remove("signin");pick(r);}
let chooseRole=setRole;       // swapped for the signed-in version in boot()
document.querySelectorAll("[data-r]").forEach(b=>b.onclick=e=>{e.stopPropagation();chooseRole(b.dataset.r)});
function clearHold(){
  job=null; for(const k of LIVE?[role]:["g","b"]){ P[k].phone=0; P[k].emU=0; if(P[k].hold){P[k].pose=null;P[k].hold=0;} }
  if(pair&&pair.hold){ endPair(); sharePair(null); }
}
function applyWorld(){ $("sky").classList.toggle("on",!W.night); $("tint").style.background=W.night?"transparent":"rgba(255,214,150,.16)"; worldExtras(); }
const bowlLevel=()=>Math.max(0,1-(Date.now()-W.fedAt)/120000);
setInterval(()=>{$("bowl").firstChild.style.height=(bowlLevel()*46)+"%"},1000);
function setWorld(p){
  Object.assign(W,p); applyWorld();
  if(db) db.doc("world/state").set(p,{merge:true}).catch(()=>toast("That didn't sync. Check your connection."));
}
function feedCat(){
  const k=me(); setWorld({fedAt:Date.now(),fedBy:k}); goTo(BOWL.x,BOWL.y+1,"eatgo"); meow("food!"); SFX.play("pour");
  k==="g"?say("Dinner time, fluffball!",null):say(null,"Dinner time, fluffball!");
}
function render(){
  const L=$("log"); L.innerHTML="";
  const arr=box[tab];
  if(!arr.length){const p=document.createElement("p");p.textContent=tab==="letter"?"No letters yet. Write the first one.":"Say hi.";L.appendChild(p);}
  arr.forEach(m=>{
    const d=document.createElement("div"); d.className="m"+(m.from===me()?" me":"");
    const s=document.createElement("small"); s.textContent=who(m.from)+" · "+new Date(m.ts).toLocaleString([],{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
    const p=document.createElement("span"); p.textContent=m.text; d.append(s,p); L.appendChild(d);
  });
  L.scrollTop=L.scrollHeight;
}
function openChat(t){
  closePanels(); tab=t; $("chat").classList.add("on"); document.body.classList.add("sheet"); SFX.play("page");
  document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("on",b.dataset.tab===t));
  $("tx").placeholder=t==="letter"?"Write a letter...":"Write a message..."; render(); markRead();
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>openChat(b.dataset.tab));
$("x").onclick=()=>closePanels();
async function send(){
  const v=$("tx").value.trim(); if(!v) return;
  const m={from:me(),text:v.slice(0,1200),kind:tab==="letter"?"letter":"chat",ts:Date.now()};
  $("tx").value=""; setTyping(false); SFX.play(tab==="letter"?"letter":"tap");
  if(!db){box[tab].push(m);render();return;}
  try{await db.collection(tab==="letter"?"letters":"msgs").add(m);}catch(e){toast("Could not send. Check your connection.");}
}
$("send").onclick=send;
$("tx").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}});
$("tx").addEventListener("input",()=>setTyping(!!$("tx").value.trim()));
$("tx").addEventListener("blur",()=>setTyping(false));

// greeting, then quiet chatter (started from boot)
function greet(){
  P.g.pose="wave"; P.b.pose="wave"; say("Hi, you!","Hi, love.");
  setTimeout(()=>{for(const k of ["g","b"]) if(P[k].pose==="wave") P[k].pose=null},2200);
  setInterval(()=>{ if(pair||P.g.pose||document.hidden) return; const c=CHAT[Math.floor(Math.random()*CHAT.length)]; say(c[0],c[1]); },9000);
}
