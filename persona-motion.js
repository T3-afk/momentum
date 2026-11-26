/* Momentum Motion v27
   Presentation layer loaded after index.html and persona-overhaul.js.
   It never writes the save itself: data changes still go through the app's own
   functions (the only one it calls is completeProject, after you hold to send a Calling Card). */
(()=>{
  "use strict";
  const VERSION="27.2.0";
  const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const reducedQuery=matchMedia("(prefers-reduced-motion: reduce)");
  const still=()=>reducedQuery.matches;
  const SNAP="cubic-bezier(.16,1,.3,1)";
  const PAGE_LABEL={mainPage:"Main",inboxPage:"Inbox",notesPage:"Notes",mementosPage:"Mementos",projectsPage:"Palaces",statsPage:"Stats",settingsPage:"Settings"};
  const STAT_KEYS=()=>typeof SOCIAL_STAT_KEYS!=="undefined"?SOCIAL_STAT_KEYS:["knowledge","guts","proficiency","kindness","charm"];

  function anim(el,frames,opts={}){
    if(!el?.animate)return null;
    return el.animate(frames,{fill:"both",easing:SNAP,...opts,...(still()?{duration:1,delay:0}:{})})
  }
  function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn,{once:true});else fn()}
  function data(){try{return load()}catch{return null}}
  function selectedKey(){return q("#datePicker")?.value||(typeof localKey==="function"?localKey():new Date().toISOString().slice(0,10))}
  function titleCase(s){return String(s||"").toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase())}
  function wrapGlobal(name,make){
    const orig=window[name];if(typeof orig!=="function"||orig.__mm27)return false;
    const wrapped=make(orig);wrapped.__mm27=true;window[name]=wrapped;return true
  }
  function safe(label,fn){try{return fn()}catch(err){console.warn(`[Momentum Motion] ${label} failed`,err)}}
  function lum(rgb){const [r,g,b]=String(rgb).split(",").map(x=>Number(x)/255);if(![r,g,b].every(Number.isFinite))return 0;const f=c=>c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);return .2126*f(r)+.7152*f(g)+.0722*f(b)}
  function syncContrast(){
    const cs=getComputedStyle(document.documentElement),root=document.documentElement.style;
    root.setProperty("--mm-on-accent",lum(cs.getPropertyValue("--accent-rgb"))>.45?"#0a0a0a":"#f7f7f2");
    root.setProperty("--mm-on-accent2",lum(cs.getPropertyValue("--accent2-rgb"))>.45?"#0a0a0a":"#f7f7f2")
  }
  function typeText(el,text,ms=16){
    if(!el)return;clearInterval(el.__mmType);text=String(text||"");
    if(still()||!text){el.textContent=text;return}
    el.setAttribute("aria-label",text);el.textContent="";let i=0;const step=Math.max(1,Math.ceil(text.length/70));
    el.__mmType=setInterval(()=>{i=Math.min(text.length,i+step);el.textContent=text.slice(0,i);if(i>=text.length){clearInterval(el.__mmType);el.removeAttribute("aria-label")}},ms)
  }
  const SPEECH_SVG=`<svg class="mm-speech-shape" viewBox="0 0 400 130" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 70 30 52 38 10 396 0 386 128 44 120 36 92 18 96Z"/><path class="in" d="M12 70 38 57 46 17 388 7 378 120 52 112 44 86 28 88Z"/></svg>`;

  /* ---------- Cut-out lettering: the same word always gets the same tiles ---------- */
  function cutout(el,word,{max=40}={}){
    if(!el)return el;
    word=String(word??"").replace(/\s+/g," ").trim();
    if(!word||word.length>max){if(el.dataset.mmCut!==undefined){el.textContent=word;delete el.dataset.mmCut;el.classList.remove("mm-cutout")}return el}
    if(el.dataset.mmCut===word&&el.querySelector(":scope>.mm-w"))return el;
    let h=7;for(const c of word)h=(h*31+c.charCodeAt(0))>>>0;
    let i=0;
    const words=word.split(" ").map(w=>`<span class="mm-w" aria-hidden="true">${[...w].map(c=>{
      const n=(h>>>(i%13))+i*7;i++;
      const ch=n%5?c.toUpperCase():c.toLowerCase();
      return `<i class="mm-f${n%4===3?0:n%4} mm-p${n%6}" style="--r:${(n%9)-4}deg;--y:${(n%5-2)*2}%;--s:${(.9+(n%4)*.09).toFixed(2)};--a:${n%7}%;--b:${n%5}%;--c:${n%6}%;--d:${94+n%6}%;--e:${n%4}%">${esc(ch)}</i>`
    }).join("")}</span>`);
    el.innerHTML=`<span class="mm-sr">${esc(word)}</span>${words.join('<span class="mm-gap" aria-hidden="true"></span>')}`;
    el.dataset.mmCut=word;el.classList.add("mm-cutout");return el
  }
  function letterDrop(el){if(still()||!el)return;qa("i",el).forEach((l,i)=>l.animate([{opacity:0,translate:"0 -70%",scale:"1.8"},{opacity:1,translate:"0 0",scale:"1"}],{duration:260,delay:i*28,easing:SNAP,fill:"backwards"}))}

  /* ---------- 1. Shard cut between pages ---------- */
  let cutAnims=[],cutStartedAt=-1e9;
  function ensureCut(){
    let el=q("#mmCut");if(el)return el;
    el=document.createElement("div");el.id="mmCut";el.className="mm-cut";el.setAttribute("aria-hidden","true");
    el.innerHTML=`<i class="mm-shard s0"></i><i class="mm-shard s1"></i><i class="mm-shard s2"></i><i class="mm-shard s3"></i><div class="mm-cut-word"><span></span></div>`;
    document.body.append(el);return el
  }
  function pageCut(label="Momentum"){
    const el=ensureCut(),word=titleCase(label);
    if(word==="Mementos"&&descent())return;
    cutAnims.forEach(a=>a.cancel());cutAnims=[];
    const holder=q(".mm-cut-word",el);cutout(q("span",holder),word);el.dataset.word=word;
    if(still()){el.classList.remove("run");return}
    el.classList.add("run");cutStartedAt=performance.now();
    qa(".mm-shard",el).forEach((s,i)=>cutAnims.push(s.animate([{transform:"translateX(-135%)"},{transform:"translateX(0)",offset:.42},{transform:"translateX(0)",offset:.58},{transform:"translateX(135%)"}],{duration:560,delay:i*32,easing:"cubic-bezier(.5,0,.2,1)",fill:"both"})));
    cutAnims.push(holder.animate([{opacity:0,transform:"scale(1.9) rotate(6deg)"},{opacity:1,transform:"scale(1) rotate(-4deg)",offset:.4},{opacity:1,transform:"scale(1.02) rotate(-4deg)",offset:.72},{opacity:0,transform:"scale(1.02) translateX(30%) rotate(-4deg)"}],{duration:600,delay:90,easing:SNAP,fill:"both"}));
    const mine=cutAnims;Promise.all(mine.map(a=>a.finished)).then(()=>{if(cutAnims===mine)el.classList.remove("run")},()=>{})
  }
  function revealPage(){
    if(still()||performance.now()-cutStartedAt>150)return;
    const pg=q(".page.active");pg?.animate([{opacity:0,translate:"-24px 0"},{opacity:0,translate:"-24px 0",offset:.4},{opacity:1,translate:"0 0"}],{duration:540,easing:SNAP})
  }

  /* ---------- 3. Command menu with live intel ---------- */
  function rel(t){
    const ms=Date.now()-new Date(t).getTime();if(!Number.isFinite(ms))return"";
    const h=ms/36e5;if(h<1)return"less than an hour ago";if(h<24)return`${Math.floor(h)} hour${Math.floor(h)===1?"":"s"} ago`;
    const d=Math.floor(h/24);return d===1?"yesterday":`${d} days ago`
  }
  function intel(id){
    const d=data();if(!d)return"";
    try{
      if(id==="mainPage"){
        const key=selectedKey(),day=d.days?.[key]||{tasks:[]},tasks=day.tasks||[],done=tasks.filter(t=>t.done).length;
        if(!tasks.length)return"No tasks planned for this day yet.";
        const g=typeof grade==="function"&&typeof avg==="function"?grade(avg(day,key,d)):"";
        return `${done} of ${tasks.length} task${tasks.length===1?"":"s"} done.${g?` Grade ${g}.`:""}`
      }
      if(id==="inboxPage"){
        const unread=(d.reminders||[]).filter(r=>!r.read),next=unread.filter(r=>new Date(r.when).getTime()>Date.now()).sort((a,b)=>new Date(a.when)-new Date(b.when))[0];
        if(!unread.length)return"Inbox is clear.";
        return `${unread.length} unread.${next?` Next: ${next.title}, ${new Date(next.when).toLocaleString([], {weekday:"short",hour:"2-digit",minute:"2-digit"})}.`:""}`
      }
      if(id==="notesPage"){
        const notes=d.notebookNotes||[];if(!notes.length)return"No notes yet.";
        const last=notes.map(n=>n.updatedAt||n.createdAt).filter(Boolean).sort().pop();
        return `${notes.length} note${notes.length===1?"":"s"}.${last?` Last edited ${rel(last)}.`:""}`
      }
      if(id==="mementosPage"){
        const active=(d.mementosRequests||[]).filter(r=>r.status==="active");if(!active.length)return"No active Requests.";
        const soon=active.filter(r=>{const ms=new Date(r.deadline).getTime()-Date.now();return ms>0&&ms<=48*36e5}).length;
        return `${active.length} Request${active.length===1?"":"s"}. ${soon} due within 48h.`
      }
      if(id==="projectsPage"){
        const active=(d.projects||[]).filter(p=>p.status==="active"),ready=active.find(p=>p.routeSecured);
        if(ready)return`Calling Card ready: ${ready.name}.`;
        return active.length?`${active.length} active Palace${active.length===1?"":"s"}.`:"No Palaces yet."
      }
      if(id==="statsPage"){
        if(typeof socialStatInfo!=="function")return"";
        const close=STAT_KEYS().map(k=>({k,i:socialStatInfo(k,d)})).filter(x=>x.i.next!==null).sort((a,b)=>(a.i.next-a.i.xp)-(b.i.next-b.i.xp))[0];
        if(!close)return"Every Social Stat is maxed.";
        const name=typeof socialStatName==="function"?socialStatName(close.k):close.k,need=close.i.next-close.i.xp;
        return `${name} is ${need} XP from Lv. ${close.i.level+1}.`
      }
      if(id==="settingsPage"){
        const signed=typeof cloudState!=="undefined"&&cloudState?.user;
        return signed?"Signed in. Cloud sync is on.":"Theme, profile, backups and sync."
      }
    }catch(err){console.warn("[Momentum Motion] intel failed",err)}
    return""
  }
  function installCommandMenu(){
    const intro=q("#intro"),menu=q("#intro .intro-menu"),right=q("#intro .intro-right");if(!intro||!menu||!right||q(".mm-slab",menu))return;
    intro.classList.add("mm-command");
    const slab=document.createElement("span");slab.className="mm-slab";slab.setAttribute("aria-hidden","true");menu.append(slab);
    const card=document.createElement("div");card.className="mm-intel";card.id="mmIntel";card.setAttribute("aria-live","polite");card.innerHTML="<small></small><b></b>";right.append(card);
    let current=null;
    const buttons=()=>qa("button[data-go]",menu);
    const place=()=>{
      const b=current;if(!b||!intro.classList.contains("show"))return;
      const mr=menu.getBoundingClientRect(),rr=right.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(b);
      const br=range.getBoundingClientRect();if(!br.width)return;
      slab.style.transform=`translate(${(br.left-mr.left-18).toFixed(1)}px,${(br.top-mr.top-3).toFixed(1)}px) skewX(-12deg)`;
      slab.style.width=`${(br.width+36).toFixed(1)}px`;slab.style.height=`${(br.height+6).toFixed(1)}px`;
      card.style.left=`${(mr.left-rr.left+6).toFixed(1)}px`;card.style.top=`${(mr.bottom-rr.top+26).toFixed(1)}px`
    };
    const select=b=>{
      if(!b)return;current=b;buttons().forEach(x=>x.classList.toggle("mm-on",x===b));place();
      const label=(b.textContent||"").trim(),line=intel(b.dataset.go);
      q("small",card).textContent=`Open ${label}`;
      const out=q("b",card);if(out.textContent!==line){out.textContent=line;card.animate?.([{rotate:"8deg",translate:"40px 0",opacity:.2},{rotate:"0deg",translate:"0 0",opacity:1}],{duration:still()?1:260,easing:SNAP})}
      card.hidden=!line
    };
    menu.addEventListener("pointerover",e=>{const b=e.target.closest?.("button[data-go]");if(b&&b!==current)select(b)});
    menu.addEventListener("focusin",e=>{const b=e.target.closest?.("button[data-go]");if(b)select(b)});
    menu.addEventListener("keydown",e=>{
      const bs=buttons(),i=bs.indexOf(document.activeElement);
      const next=e.key==="ArrowDown"?i+1:e.key==="ArrowUp"?i-1:e.key==="Home"?0:e.key==="End"?bs.length-1:null;
      if(next===null)return;e.preventDefault();bs[(next+bs.length)%bs.length]?.focus()
    });
    const opened=()=>{
      const bs=buttons();
      if(!q(".intro-left",intro)?.dataset.mmWord){const name=(q("#introAppName")?.textContent||"Momentum").trim();q(".intro-left",intro)?.setAttribute("data-mm-word",name.toUpperCase())}
      current=null;requestAnimationFrame(()=>select(bs[0]))
    };
    new MutationObserver(()=>{const open=intro.classList.contains("show");if(open&&!intro.__mmOpen)opened();intro.__mmOpen=open;backdropKick()}).observe(intro,{attributes:true,attributeFilter:["class"]});
    addEventListener("resize",place);document.fonts?.ready?.then(place);
    intro.__mmOpen=intro.classList.contains("show");if(intro.__mmOpen)opened()
  }

  /* ---------- 4. Task slash ---------- */
  function taskSnapshot(i){
    try{const key=selectedKey(),d=load(),t=d.days?.[key]?.tasks?.[i];return t?{done:!!t.done,current:Number(t.current)||0,points:Number(t.points)||0,category:t.category,counter:t.taskType==="counter",unit:String(t.unit||"").trim()}:null}catch{return null}
  }
  function popAt(fromRect,text,size,toEl){
    if(still())return;
    const pop=document.createElement("div");pop.className="mm-pop";pop.textContent=text;pop.style.fontSize=`${size}px`;
    pop.style.left=`${fromRect.left+fromRect.width/2}px`;pop.style.top=`${fromRect.top+fromRect.height/2}px`;document.body.append(pop);
    let dx=-70,dy=-80;
    const tr=toEl?.getBoundingClientRect();
    if(tr&&tr.width&&tr.top>=0&&tr.bottom<=innerHeight){dx=tr.left+tr.width/2-(fromRect.left+fromRect.width/2);dy=tr.top+tr.height/2-(fromRect.top+fromRect.height/2)}
    const a=pop.animate([
      {transform:"translate(-50%,-50%) scale(.3) rotate(20deg)",opacity:1},
      {transform:"translate(-50%,-50%) scale(1.25) rotate(-9deg)",opacity:1,offset:.28},
      {transform:"translate(calc(-50% - 12px),calc(-50% - 16px)) scale(1) rotate(-7deg)",opacity:1,offset:.5},
      {transform:`translate(calc(-50% + ${dx.toFixed(0)}px),calc(-50% + ${dy.toFixed(0)}px)) scale(.55) rotate(-16deg)`,opacity:.1}
    ],{duration:820,easing:"cubic-bezier(.4,0,.2,1)"});
    a.onfinish=a.oncancel=()=>pop.remove();return a
  }
  function taskFeedback(i,before,after,gradeBefore){
    const row=qa("#taskList > .task")[i];
    const gradeEl=q("#grade"),gradeAfter=(gradeEl?.textContent||"").trim();
    const order={F:0,D:1,C:2,B:3,A:4,S:5};
    if(gradeEl&&order[gradeAfter]>order[gradeBefore])anim(gradeEl,[{scale:"2.4",rotate:"14deg",opacity:0},{scale:".9",rotate:"-6deg",opacity:1,offset:.7},{scale:"1",rotate:"0deg",opacity:1}],{duration:440,delay:380,fill:"none"});
    if(!row)return;
    const axis=q(`.triangle-scene .axis.${after.category}`);
    if(!before.done&&after.done){
      row.classList.add("mm-hit");
      if(still())return;
      const p=Math.max(.5,Math.min(6,after.points||1));
      row.animate([{translate:"0 0"},{translate:`${(-3*p).toFixed(1)}px 0`,rotate:"-.5deg"},{translate:`${(2.4*p).toFixed(1)}px 0`},{translate:"0 0"}],{duration:240,easing:"ease-out"});
      const pts=q(".pts",row)?.getBoundingClientRect();
      if(pts)popAt(pts,`+${Number(after.points.toFixed(2))}`,Math.round(24+p*7),axis);
      if(axis)axis.animate([{scale:"1"},{scale:"1.16",rotate:"-3deg"},{scale:"1",rotate:"0deg"}],{duration:300,delay:640,easing:SNAP});
      return
    }
    if(after.counter&&after.current>before.current){
      const fill=q(".task-progress-fill",row);fill?.animate([{filter:"brightness(1.9)"},{filter:"none"}],{duration:420});
      const label=q(".task-progress-label",row)?.getBoundingClientRect();
      const amt=Number((after.current-before.current).toFixed(3));
      if(label)popAt(label,`+${amt}${after.unit?` ${after.unit}`:""}`,22,null)
    }
  }
  function patchTasks(){
    wrapGlobal("mutateTaskAndRefresh",orig=>function(i){
      const before=taskSnapshot(i),gradeBefore=(q("#grade")?.textContent||"").trim();
      const result=orig.apply(this,arguments);
      safe("task feedback",()=>{const after=taskSnapshot(i);if(before&&after)taskFeedback(i,before,after,gradeBefore)});
      return result
    })
  }

  /* ---------- 5. Day Results sequence (and the briefing's navigator line) ---------- */
  let resultAnims=[],countFrames=[];
  function stopResults(){resultAnims.forEach(a=>a.cancel());resultAnims=[];countFrames.forEach(cancelAnimationFrame);countFrames=[]}
  function finishResults(){
    const running=resultAnims.filter(a=>a.playState==="running"||a.playState==="pending");
    if(!running.length&&!countFrames.length)return false;
    resultAnims.forEach(a=>{try{a.finish()}catch{}});countFrames.forEach(cancelAnimationFrame);countFrames=[];
    qa("#dailyOverlay .result-axis b").forEach(b=>{if(b.dataset.mmFinal)b.textContent=b.dataset.mmFinal});return true
  }
  function countUp(el,value,delay,duration){
    const final=el.textContent;el.dataset.mmFinal=final;el.textContent="0/6";const start=performance.now()+delay;
    const frame=t=>{const k=Math.max(0,Math.min(1,(t-start)/duration));el.textContent=`${Number((value*k).toFixed(1))}/6`;if(k<1)countFrames.push(requestAnimationFrame(frame));else el.textContent=final};
    countFrames.push(requestAnimationFrame(frame))
  }
  function runResults(ov,box){
    const axes=qa(".result-axis",box);
    axes.forEach(a=>{const v=Math.max(0,Math.min(6,parseFloat(q("b",a)?.textContent)||0));a.dataset.v=v;if(!q(".mm-bar",a))a.insertAdjacentHTML("beforeend",`<span class="mm-bar" aria-hidden="true"><i style="width:${(v/6*100).toFixed(1)}%"></i></span>`)});
    if(still())return;
    const push=a=>a&&resultAnims.push(a);
    axes.forEach((a,i)=>{
      push(anim(a,[{opacity:0,transform:"translateX(-60px)"},{opacity:1,transform:"none"}],{duration:260,delay:i*380}));
      push(anim(q(".mm-bar i",a),[{transform:"scaleX(0)"},{transform:"scaleX(1)"}],{duration:420,delay:120+i*380}));
      const b=q("b",a);if(b)countUp(b,Number(a.dataset.v),120+i*380,420)
    });
    const t0=axes.length*380+210;
    push(anim(q(".results-grade",box),[{opacity:0,transform:"scale(3.4) rotate(25deg)"},{opacity:1,transform:"scale(.92) rotate(-10deg)",offset:.7},{opacity:1,transform:"scale(1) rotate(-7deg)"}],{duration:430,delay:t0,easing:"cubic-bezier(.7,0,.3,1)"}));
    push(q(".daily-panel",ov)?.animate([{translate:"0 0"},{translate:"-10px 6px"},{translate:"8px -5px"},{translate:"0 0"}],{duration:260,delay:t0+290}));
    [q(".brief-grid",box),...qa(":scope > .brief-item",box),q(".daily-extra-strip",box)].filter(Boolean).forEach((el,i)=>push(anim(el,[{opacity:0,transform:"translateY(18px)"},{opacity:1,transform:"none"}],{duration:300,delay:t0+500+i*90})))
  }
  function briefingSpeech(box){
    const list=q(".brief-list",box),items=qa(".brief-item",list||box);if(!list||!items.length||q(".mm-speech",box))return;
    const text=items.map(x=>x.textContent.trim()).filter(Boolean).join(" ");
    const avatar=data()?.profile?.avatar||"";
    const el=document.createElement("div");el.className="mm-speech mm-brief-speech";
    el.innerHTML=`<span class="mm-speech-face" aria-hidden="true"><img alt=""></span><div class="mm-speech-bubble">${SPEECH_SVG}<b class="mm-speech-tag">Navigator</b><p class="mm-speech-text"></p></div>`;
    if(avatar)q("img",el).src=avatar;else q("img",el).remove();
    list.before(el);list.classList.add("mm-sr");
    if(!still())el.animate([{transform:"translateX(-110%) rotate(-9deg) skewX(20deg)"},{transform:"none"}],{duration:330,easing:SNAP});
    setTimeout(()=>typeText(q(".mm-speech-text",el),text),still()?0:200)
  }
  function patchDaily(){
    wrapGlobal("showDailyOverlay",orig=>function(mode="briefing"){
      const result=orig.apply(this,arguments);
      safe("daily overlay",()=>{
        const ov=q("#dailyOverlay"),box=q("#dailyOverlayContent");if(!ov||!box)return;
        const results=mode==="results";stopResults();
        ov.classList.toggle("mm-results",results);ov.classList.toggle("mm-briefing",!results);
        cutout(q("#dailyOverlayHeading"),results?"Day Results":"Daily Briefing");letterDrop(q("#dailyOverlayHeading"));
        if(results)runResults(ov,box);else briefingSpeech(box)
      });
      return result
    });
    const ov=q("#dailyOverlay");
    ov?.addEventListener("click",e=>{if(e.target.closest?.("#closeDailyOverlay"))return stopResults();finishResults()},true)
  }

  /* ---------- 7. Calling Card you send yourself ---------- */
  function callingCard(info,onSend){
    if(q("#mmCalling.show"))return;
    let el=q("#mmCalling");
    if(!el){el=document.createElement("div");el.id="mmCalling";el.className="mm-calling";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label","Calling Card");document.body.append(el)}
    const statName=typeof socialStatName==="function"?socialStatName(info.stat):info.stat||"";
    el.innerHTML=`<button type="button" class="mm-calling-x">Not yet</button>
      <div class="mm-card-stage"><div class="mm-card"><small>To the ruler of procrastination</small><div class="mm-card-name mm-on-paper"></div><p>Your distorted deadline has been located. The route is secured. We are taking the treasure.</p><b>The Momentum Thieves</b></div></div>
      <button type="button" class="mm-hold"><i aria-hidden="true"></i><span>Hold to send</span></button>
      <div class="mm-stolen" aria-live="assertive"><div class="mm-stolen-word"></div><small></small></div>`;
    const card=q(".mm-card",el),hold=q(".mm-hold",el),fill=q(".mm-hold i",hold),label=q(".mm-hold span",hold),cancelBtn=q(".mm-calling-x",el);
    const nameEl=q(".mm-card-name",el);cutout(nameEl,info.name,{max:34});if(!nameEl.dataset.mmCut)nameEl.textContent=info.name;
    let filling=null,shaking=null,sent=false,closer=0;
    const close=()=>{if(filling||shaking){filling?.cancel();shaking?.cancel()}clearTimeout(closer);el.classList.remove("show");el.innerHTML="";document.removeEventListener("keydown",onKey,true);flushLevelUps();q(`[data-palace-id="${CSS.escape(info.id)}"]`)?.focus?.()};
    const down=e=>{
      if(sent||filling)return;if(e?.type==="pointerdown"){e.preventDefault();try{hold.setPointerCapture(e.pointerId)}catch{}}
      label.textContent="Keep holding";
      filling=fill.animate([{transform:"scaleX(0)"},{transform:"scaleX(1)"}],{duration:900,fill:"forwards",easing:"linear"});
      if(!still())shaking=card.animate([{translate:"0 0",rotate:"0deg"},{translate:"-1% 1%",rotate:"-2deg"},{translate:"1% -1%",rotate:"2deg"},{translate:"0 0",rotate:"0deg"}],{duration:110,iterations:Infinity});
      filling.onfinish=send
    };
    const up=()=>{if(sent||!filling)return;filling.cancel();filling=null;shaking?.cancel();shaking=null;label.textContent="Hold to send"};
    function send(){
      if(sent)return;sent=true;shaking?.cancel();filling=null;hold.hidden=true;cancelBtn.hidden=true;
      const word=q(".mm-stolen-word",el);cutout(word,"Treasure stolen");q(".mm-stolen small",el).textContent=info.xp?`${statName} +${info.xp} XP`:"";
      card.animate([{transform:"rotate(-5deg)"},{transform:"translate(-8%,6%) rotate(-16deg) scale(.94)",offset:.3},{transform:"translate(150%,-160%) rotate(210deg) scale(.5)"}],{duration:still()?1:640,fill:"forwards",easing:"cubic-bezier(.6,-.1,.5,1)"});
      setTimeout(()=>{
        safe("complete palace",()=>onSend?.());
        const stolen=q(".mm-stolen",el);if(!stolen)return;stolen.style.opacity="1";
        anim(stolen,[{opacity:0,transform:"scale(2.6) rotate(9deg)"},{opacity:1,transform:"scale(1) rotate(-5deg)"}],{duration:340});
        closer=setTimeout(close,1700)
      },still()?0:480)
    }
    const onKey=e=>{
      if(e.key==="Escape"){e.preventDefault();if(!sent)close();return}
      if(sent&&(e.key==="Enter"||e.key===" ")){e.preventDefault();close()}
    };
    hold.addEventListener("pointerdown",down);["pointerup","pointercancel","lostpointercapture"].forEach(t=>hold.addEventListener(t,up));
    hold.addEventListener("contextmenu",e=>e.preventDefault());
    hold.addEventListener("keydown",e=>{if((e.key===" "||e.key==="Enter")&&!e.repeat){e.preventDefault();e.stopPropagation();down()}});
    hold.addEventListener("keyup",e=>{if(e.key===" "||e.key==="Enter")up()});
    cancelBtn.addEventListener("click",()=>{if(!sent)close()});
    el.addEventListener("click",e=>{if(sent&&!e.target.closest(".mm-hold"))close()});
    document.addEventListener("keydown",onKey,true);
    el.classList.add("show");
    if(!still())card.animate([{transform:"translate(0,-130%) rotate(40deg)"},{transform:"rotate(-5deg)"}],{duration:420,easing:SNAP});
    setTimeout(()=>hold.focus({preventScroll:true}),60)
  }

  /* ---------- 8. Star point burst on level up ---------- */
  const levelQueue=[];
  function starPoints(levels){
    if(typeof p5StarPoints==="function")return p5StarPoints(levels);
    const p=[];for(let i=0;i<5;i++){const a=(Math.max(1,Math.min(10,levels[i]))-1)/9,b=(Math.max(1,Math.min(10,levels[(i+1)%5]))-1)/9,o=60+130*a,n=27+55*(a+b)/2,t=(-90+i*72)*Math.PI/180,u=(-54+i*72)*Math.PI/180;p.push(`${(250+Math.cos(t)*o).toFixed(1)},${(250+Math.sin(t)*o).toFixed(1)}`,`${(250+Math.cos(u)*n).toFixed(1)},${(250+Math.sin(u)*n).toFixed(1)}`)}return p.join(" ")
  }
  function levelUp(award,source=""){
    if(!award?.stat)return;
    if(q("#mmCalling.show")||q("#mmStar.show")){levelQueue.push([award,source]);return}
    playStar(award,source)
  }
  function flushLevelUps(){const next=levelQueue.shift();if(next)setTimeout(()=>playStar(...next),260)}
  function playStar(award,source){
    const keys=STAT_KEYS(),key=keys.includes(award.stat)?award.stat:keys[0],idx=keys.indexOf(key),d=data();
    const levels=keys.map(k=>typeof socialStatInfo==="function"&&d?socialStatInfo(k,d).level:1);
    const to=Number(award.after?.level)||levels[idx],from=Math.min(to,Number(award.before?.level)||Math.max(1,to-1));levels[idx]=to;
    const name=typeof socialStatName==="function"?socialStatName(key):key,title=typeof socialStatTitle==="function"?socialStatTitle(key,to):"";
    let el=q("#mmStar");if(!el){el=document.createElement("div");el.id="mmStar";el.className="mm-star";el.setAttribute("role","status");document.body.append(el)}
    el.innerHTML=`<div class="mm-star-wrap"><div class="mm-star-name"></div><svg viewBox="0 0 500 500" aria-hidden="true" focusable="false">${[10,8,6,4,2].map(l=>`<polygon class="ring" points="${starPoints([l,l,l,l,l])}"/>`).join("")}<polygon class="area"/><circle class="burst" r="0"/></svg><div class="mm-star-lv"><b>Lv. ${to}</b> ${esc(title)}</div><small class="mm-star-src">${esc(source?`From ${source}`:"Level up")}</small></div>`;
    cutout(q(".mm-star-name",el),name);
    const area=q(".area",el),burst=q(".burst",el),lv=q(".mm-star-lv",el);
    const angle=(-90+idx*72)*Math.PI/180,outer=60+130*(to-1)/9;burst.setAttribute("cx",(250+Math.cos(angle)*outer).toFixed(1));burst.setAttribute("cy",(250+Math.sin(angle)*outer).toFixed(1));
    el.classList.add("show");
    let raf=0,timer=0;
    const done=()=>{cancelAnimationFrame(raf);clearTimeout(timer);el.classList.remove("show");el.innerHTML="";el.removeEventListener("click",done);flushLevelUps()};
    el.addEventListener("click",done);
    const stamp=()=>anim(lv,[{opacity:0,transform:"scale(2) rotate(10deg)"},{opacity:1,transform:"rotate(-4deg)"}],{duration:260});
    if(still()){area.setAttribute("points",starPoints(levels));stamp();timer=setTimeout(done,2600);return}
    lv.style.opacity="0";
    const start=performance.now();let stamped=false;
    const frame=t=>{
      const k=Math.max(0,Math.min(1,(t-start)/760)),e=1+2.9*Math.pow(k-1,3)+1.9*Math.pow(k-1,2),cur=[...levels];
      cur[idx]=from+(to-from)*e+Math.sin(k*Math.PI)*1.1;area.setAttribute("points",starPoints(cur));
      burst.setAttribute("r",(k*95).toFixed(1));burst.setAttribute("opacity",(1-k).toFixed(2));
      if(k>.45&&!stamped){stamped=true;lv.style.opacity="";stamp()}
      if(k<1)raf=requestAnimationFrame(frame)
    };
    raf=requestAnimationFrame(frame);timer=setTimeout(done,2800)
  }

  /* ---------- 9. Navigator speech alerts ---------- */
  function toastTarget(type,title){
    const t=String(title||"");
    if(/memento|request/i.test(t))return"mementosPage";
    if(/route|treasure|palace|calling/i.test(t))return"projectsPage";
    if(/note/i.test(t))return"notesPage";
    if(/inbox|reminder/i.test(t))return"inboxPage";
    if(type==="stat"||type==="rank"||type==="achievement")return"statsPage";
    if(type==="grade"||/task|repeat/i.test(t))return"mainPage";
    return null
  }
  function decorateToast(toast,type,title){
    if(!toast||toast.classList.contains("mm-speech-toast"))return;
    toast.classList.add("mm-speech-toast");toast.insertAdjacentHTML("afterbegin",SPEECH_SVG);
    const detail=q(".persona-toast-copy span",toast);if(detail)typeText(detail,detail.textContent,14);
    const target=toastTarget(type,title);if(!target)return;
    /* Only the small Open button takes taps, so alerts never block the tasks underneath them. */
    toast.classList.add("mm-tap");
    const open=document.createElement("button");open.type="button";open.className="mm-toast-open";open.textContent=`Open ${PAGE_LABEL[target]}`;
    (q(".persona-toast-copy",toast)||toast).append(open);
    const go=e=>{
      e.preventDefault();e.stopPropagation();toast.remove();
      q("#dailyOverlay")?.classList.remove("show");q("#mobileMoreSheet")?.classList.remove("show");
      const introOpen=q("#intro")?.classList.contains("show");
      if(q(".page.active")?.id!==target||introOpen){pageCut(PAGE_LABEL[target]);if(typeof showPage==="function")showPage(target)}
    };
    open.addEventListener("click",go)
  }
  function patchToasts(){
    wrapGlobal("showPersonaToast",orig=>function(type,title){
      const result=orig.apply(this,arguments);
      safe("toast",()=>decorateToast(q("#personaToastStack")?.lastElementChild,type,title));
      return result
    })
  }

  /* ---------- 10. Backdrop follows the day's grade ---------- */
  const bd={cv:null,ctx:null,raf:0,last:0,ph:0,gr:0,tex:null,texKey:"",colors:["#ffd21f","#ef2d2d"]};
  function gradeIndex(){return Math.max(0,"FDCBAS".indexOf((q("#grade")?.textContent||"F").trim()))}
  function backdropShould(){return !!bd.cv&&!document.hidden&&!!q("#mainPage.active")&&!q("#intro")?.classList.contains("show")}
  function backdropTexture(w,h){
    const key=`${w}x${h}:${bd.gr}`;if(bd.texKey===key)return bd.tex;
    const c=bd.tex||document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.clearRect(0,0,w,h);
    x.fillStyle="#060606";x.globalAlpha=.2+bd.gr/5*.3;const s=13;
    for(let y=0;y<h;y+=s)for(let px=((y/s)%2)*s/2;px<w;px+=s){x.beginPath();x.arc(px,y,s*.42*(.25+.75*px/w),0,6.283);x.fill()}
    bd.tex=c;bd.texKey=key;return c
  }
  function backdropDraw(){
    const cv=bd.cv,ctx=bd.ctx,w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
    const k=bd.gr/5,[a,b]=bd.colors,D=Math.hypot(w,h),gap=Math.max(70,(150-bd.gr*17)*Math.max(1,w/1100));
    ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-.32);ctx.globalAlpha=.07+k*.21;
    for(let x=-D-gap*2+(bd.ph%(gap*2));x<D+gap;x+=gap*2){
      ctx.fillStyle=b;ctx.fillRect(x,-D,gap*(.25+k*.75),D*2);
      if(bd.gr>2){ctx.fillStyle=a;ctx.fillRect(x+gap*(.35+k*.75),-D,3+bd.gr,D*2)}
    }
    ctx.restore();ctx.globalAlpha=1;ctx.drawImage(backdropTexture(w,h),0,0)
  }
  function backdropLoop(t){
    bd.raf=0;if(!backdropShould())return;
    const dt=t-bd.last;if(dt>=33){bd.ph+=(.25+bd.gr*.75)*Math.min(4,dt/16.7);bd.last=t;backdropDraw()}
    bd.raf=requestAnimationFrame(backdropLoop)
  }
  function backdropKick(){
    if(!bd.cv)return;const on=backdropShould();bd.cv.classList.toggle("on",on);
    if(!on){cancelAnimationFrame(bd.raf);bd.raf=0;return}
    const cs=getComputedStyle(document.documentElement);bd.colors=[cs.getPropertyValue("--accent").trim()||"#ffd21f",cs.getPropertyValue("--accent2").trim()||"#ef2d2d"];
    const g=gradeIndex();if(g!==bd.gr){bd.gr=g;bd.cv.dataset.grade="FDCBAS"[g]}
    if(still()){cancelAnimationFrame(bd.raf);bd.raf=0;backdropDraw();return}
    if(!bd.raf){bd.last=0;bd.raf=requestAnimationFrame(backdropLoop)}
  }
  function installBackdrop(){
    if(q("#mmBackdrop"))return;
    const cv=document.createElement("canvas");cv.id="mmBackdrop";cv.className="mm-backdrop";cv.setAttribute("aria-hidden","true");
    document.body.prepend(cv);bd.cv=cv;bd.ctx=cv.getContext("2d");
    document.addEventListener("visibilitychange",backdropKick);addEventListener("resize",()=>{if(still()&&backdropShould())backdropDraw()});
    reducedQuery.addEventListener?.("change",backdropKick);backdropKick()
  }

  /* ---------- 11. Mementos descent ----------
     Opening Mementos rides down the shaft and stops at the deepest floor that still has a
     Request on it, then the page opens already scrolled to that floor. Penalty sets the floor,
     exactly like the page itself. Tap to skip. With reduced motion it only scrolls. */
  const FLOORS=[null,["Minor","#8b8690"],["Low","#d8c04a"],["Moderate","#dd7f22"],["Important","#f05232"],["Severe","var(--accent2)"],["Critical","#ff1747"]];
  function floorOf(p){const n=Math.max(0,Number(p)||0);return n<=.5?1:n<=1?2:n<=2?3:n<=3?4:n<=4.5?5:6}
  function floorCounts(){
    const out=[null,0,0,0,0,0,0],loss=[null,0,0,0,0,0,0],late=[null,0,0,0,0,0,0];
    for(const r of data()?.mementosRequests||[]){if(!r||!(r.status==="active"||r.status==="failed"))continue;const f=floorOf(r.missPenalty);out[f]++;loss[f]+=Math.max(0,Number(r.missPenalty)||0);if(r.status==="failed")late[f]++}
    return{out,loss,late}
  }
  let descentRun=null;
  function scrollToFloor(n){
    const sec=q(`#mementosFloor${n}`);if(!sec)return;
    /* layout position, not the on-screen box: the floors are still sliding in when we land */
    let top=0;for(let e=sec;e;e=e.offsetParent)top+=e.offsetTop;
    /* the app sets smooth scrolling in CSS; landing should be instant, so switch it off for this one jump */
    const root=document.documentElement,prev=root.style.scrollBehavior;root.style.scrollBehavior="auto";
    scrollTo(0,Math.max(0,top-(innerWidth<=760?74:96)));root.style.scrollBehavior=prev
  }
  function descent(){
    const {out,loss,late}=floorCounts();let target=0;for(let f=6;f>=1;f--)if(out[f]){target=f;break}
    if(!target)return false;
    if(still()){setTimeout(()=>scrollToFloor(target),60);return true}
    descentRun?.finish();
    let el=q("#mmDescent");
    if(!el){el=document.createElement("div");el.id="mmDescent";el.className="mm-descent";el.setAttribute("aria-hidden","true");document.body.append(el)}
    const n=x=>Number((x||0).toFixed(1)).toLocaleString();
    el.innerHTML=`<div class="mm-d-rail"></div><div class="mm-d-shaft"><div class="mm-d-fl mm-d-gate"><b>${esc(typeof load==="function"?(load().profile?.appName||"Momentum"):"Momentum")}</b><span>Entrance</span></div>${[1,2,3,4,5,6].map(f=>`<div class="mm-d-fl${f===target?" mm-d-target":""}${out[f]?"":" mm-d-clear"}" style="--fc:${FLOORS[f][1]}"><b>F${f}</b><span>${FLOORS[f][0]}</span><em>${out[f]?`${out[f]} Request${out[f]===1?"":"s"} · −${n(loss[f])}${late[f]?` · ${late[f]} missed`:""}`:"Clear"}</em></div>`).join("")}</div><div class="mm-d-car"><i></i></div><div class="mm-d-word"><span></span></div>`;
    cutout(q(".mm-d-word span",el),"Mementos");
    el.classList.add("run");/* visible first, so the floor height can be measured */
    const shaft=q(".mm-d-shaft",el),fl=q(".mm-d-fl",el),h=fl.offsetHeight,H=innerHeight;
    const at=i=>`0 ${H/2-h*(i+.5)}px`;
    const travel=430+target*120,anims=[];
    anims.push(shaft.animate([{translate:at(0)},{translate:at(target)}],{duration:travel,easing:"cubic-bezier(.62,0,.22,1)",fill:"both"}));
    anims.push(q(".mm-d-rail",el).animate([{backgroundPositionY:"0px"},{backgroundPositionY:`${-h*target}px`}],{duration:travel,easing:"cubic-bezier(.62,0,.22,1)",fill:"both"}));
    anims.push(q(".mm-d-car",el).animate([{translate:"0 0"},{translate:"0 -6px",offset:.15},{translate:"0 4px",scale:"1 1.06",offset:.85},{translate:"0 -3px",scale:"1 1",offset:.93},{translate:"0 0"}],{duration:travel+160,easing:"ease-out",fill:"both"}));
    anims.push(q(".mm-d-word",el).animate([{opacity:0,translate:"0 -30px",rotate:"-6deg"},{opacity:1,translate:"0 0",rotate:"-4deg",offset:.2},{opacity:1,translate:"0 0",rotate:"-4deg",offset:.8},{opacity:0,translate:"0 -20px",rotate:"-4deg"}],{duration:travel+200,fill:"both"}));
    const stamp=q(".mm-d-target",el);
    anims.push(stamp.animate([{boxShadow:"inset 0 0 0 0 transparent"},{boxShadow:"inset 0 0 0 4px var(--fc)"}],{duration:160,delay:travel-60,fill:"both"}));
    const leave=el.animate([{clipPath:"inset(0 0 0 0)"},{clipPath:"inset(0 0 0 0)",offset:.5},{clipPath:"inset(0 0 100% 0)"}],{duration:520,delay:travel,easing:"cubic-bezier(.7,0,.3,1)",fill:"both"});
    anims.push(leave);
    let landed=false;const land=()=>{if(landed)return;landed=true;scrollToFloor(target)};
    const landTimer=setTimeout(land,travel+120);
    const end=()=>{clearTimeout(landTimer);land();el.classList.remove("run");el.innerHTML="";anims.forEach(a=>a.cancel());el.removeEventListener("pointerdown",skip);if(descentRun===run)descentRun=null};
    const skip=e=>{e.preventDefault();end()};
    el.addEventListener("pointerdown",skip);
    const run={finish:end};descentRun=run;
    leave.finished.then(end,()=>{});
    return true
  }

  /* ---------- Hooks into the app ---------- */
  function decorateStatic(){
    const mem=q(".mementos-title");if(mem)cutout(mem,mem.textContent);
    const social=q(".p5-social-heading b");if(social)cutout(social,titleCase(social.textContent));
  }
  function observePalaces(){
    const list=q("#projectList");if(!list)return;
    const run=()=>qa(".project-card .project-title",list).forEach(t=>{if(!t.querySelector(":scope>.mm-w"))cutout(t,t.textContent,{max:30})});
    new MutationObserver(()=>requestAnimationFrame(run)).observe(list,{childList:true});run()
  }
  function patchRender(){
    wrapGlobal("renderMain",orig=>function(){const r=orig.apply(this,arguments);safe("render",()=>{syncContrast();backdropKick()});return r});
    wrapGlobal("showPage",orig=>function(){const r=orig.apply(this,arguments);safe("page",()=>{revealPage();backdropKick()});return r})
  }

  window.MomentumMotion={version:VERSION,pageCut,cutout,callingCard,levelUp,intel,descent};

  function boot(){
    try{
      document.documentElement.classList.add("mm27");document.documentElement.dataset.motionVersion=VERSION;
      syncContrast();patchRender();patchTasks();patchDaily();patchToasts();installCommandMenu();installBackdrop();decorateStatic();observePalaces();
      console.info(`[Momentum] Motion ${VERSION} loaded`)
    }catch(err){console.error("[Momentum] Motion layer boot failed",err)}
  }
  ready(boot)
})();
