/* Momentum Persona Overhaul v25
   Loaded after the original single-file app. Existing save + Supabase structure stays intact. */
(()=>{
  "use strict";
  const VERSION="25.0.0";
  const FLOOR_META=[
    null,
    {name:"Minor",max:.5,color:"#6f6f6f"},
    {name:"Low",max:1,color:"#b9a233"},
    {name:"Moderate",max:2,color:"#dd7f22"},
    {name:"Important",max:3,color:"#f05232"},
    {name:"Severe",max:4.5,color:"#e60022"},
    {name:"Critical",max:Infinity,color:"#ff1747"}
  ];
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const escHTML=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const uid=()=>crypto.randomUUID?.()||`m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const core={};
  let projectObserver=null;
  let transitionTimer=null;

  function ready(fn){
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn,{once:true});
    else fn();
  }
  function floorForPenalty(value){
    const n=Math.max(0,Number(value)||0);
    if(n<=.5)return 1;if(n<=1)return 2;if(n<=2)return 3;if(n<=3)return 4;if(n<=4.5)return 5;return 6;
  }
  function categoryLabel(c){return c==="school"?"School":c==="home"?"Home":"Health"}
  function fmtNumber(n){return Number((Number(n)||0).toFixed(1)).toLocaleString()}
  function ensurePersonaData(d){
    d.mementosRequests=Array.isArray(d.mementosRequests)?d.mementosRequests:[];
    d.mementosRequests=d.mementosRequests.filter(Boolean).map(r=>({
      id:String(r.id||uid()),name:String(r.name||"Untitled Request").slice(0,120),
      category:["school","home","health"].includes(r.category)?r.category:"school",
      deadline:r.deadline||null,missPenalty:Math.max(0,Number(r.missPenalty)||0),
      rewardPoints:Math.max(0,Number(r.rewardPoints??r.missPenalty)||0),
      rewardStat:(typeof SOCIAL_STAT_KEYS!=="undefined"&&SOCIAL_STAT_KEYS.includes(r.rewardStat))?r.rewardStat:(typeof defaultSocialStatForCategory==="function"?defaultSocialStatForCategory(r.category):"knowledge"),
      statReward:Math.max(0,Math.round(Number(r.statReward??2)||0)),
      status:["active","completed","failed","completed-late"].includes(r.status)?r.status:"active",
      createdAt:r.createdAt||new Date().toISOString(),completedAt:r.completedAt||null,failureDate:r.failureDate||null,
      penaltyApplied:!!r.penaltyApplied,completionTaskId:r.completionTaskId||null
    }));
    d.projects=Array.isArray(d.projects)?d.projects:[];
    d.projects.forEach(p=>{if(typeof p.routeSecured!=="boolean")p.routeSecured=false});
    d.personaOverhaulVersion=Math.max(Number(d.personaOverhaulVersion)||0,25);
    return d;
  }
  function loadPersona(){const d=ensurePersonaData(load());return d}
  function savePersona(d){save(ensurePersonaData(d))}

  function installIdentity(){
    document.documentElement.classList.add("persona-v21");
    document.documentElement.dataset.personaVersion=VERSION;
    const brand=q(".brand");
    if(brand&&!q(".meta-brand-icon",brand)){
      const img=document.createElement("img");img.className="meta-brand-icon";img.src="./metanav-momentum.svg";img.alt="Momentum Navigator";brand.prepend(img)
    }
    const brandSmall=q(".brand small");if(brandSmall)brandSmall.textContent="Meta Progress Navigator";
    const introRight=q(".intro-right");
    if(introRight&&!q(".meta-intro-logo",introRight)){
      const img=document.createElement("img");img.className="meta-intro-logo";img.src="./metanav-momentum.svg";img.alt="";introRight.append(img);
      const lab=document.createElement("div");lab.className="meta-intro-label";lab.textContent="Navigator Online";introRight.append(lab)
    }
    renameProjectLabels();
  }
  function installLaunch(){
    if(q("#metaLaunch"))return;
    const el=document.createElement("div");el.id="metaLaunch";el.className="meta-launch";
    el.innerHTML=`<div class="meta-launch-core"><img src="./metanav-momentum.svg" alt=""><b>MOMENTUM</b><small>Meta Progress Navigator</small></div>`;
    document.body.append(el);setTimeout(()=>el.remove(),1650)
  }
  function installTransition(){
    if(q("#metaTransition"))return;
    const el=document.createElement("div");el.id="metaTransition";el.className="meta-transition";el.innerHTML=`<div class="blade"></div><div class="word">MOMENTUM</div>`;document.body.append(el)
  }
  function playTransition(label="MOMENTUM"){
    const el=q("#metaTransition");if(!el)return;
    q(".word",el).textContent=String(label).toUpperCase();clearTimeout(transitionTimer);el.classList.remove("run");void el.offsetWidth;el.classList.add("run");transitionTimer=setTimeout(()=>el.classList.remove("run"),620)
  }

  function insertNavigatorButtons(){
    const desktop=q(".nav");
    if(desktop&&!q('[data-go="mementosPage"]',desktop)){
      const b=document.createElement("button");b.className="nav-btn";b.dataset.go="mementosPage";b.innerHTML="<span>Mementos</span>";
      const projects=q('[data-go="projectsPage"]',desktop);desktop.insertBefore(b,projects||q('[data-go="statsPage"]',desktop))
    }
    const intro=q("#intro .intro-menu");
    if(intro&&!q('[data-go="mementosPage"]',intro)){
      const b=document.createElement("button");b.dataset.go="mementosPage";b.textContent="Mementos";
      const projects=q('[data-go="projectsPage"]',intro);intro.insertBefore(b,projects||null)
    }
    const more=q("#mobileMoreSheet .mobile-more-grid");
    if(more&&!q('[data-mobile-go="mementosPage"]',more)){
      const b=document.createElement("button");b.dataset.mobileGo="mementosPage";b.textContent="Mementos";more.prepend(b)
    }
    qa('[data-go="projectsPage"],[data-mobile-go="projectsPage"]').forEach(b=>{
      const target=b.querySelector("span")||b; if(target&&/Projects/i.test(target.textContent))target.textContent=target.textContent.replace(/Projects/i,"Palaces")
    });
  }
  function installMenuFeedback(){
    const menu=q("#intro .intro-menu"),hint=q("#intro .intro-hint");if(!menu||!hint)return;const initial=hint.textContent.trim()||"Choose a section";
    const show=b=>{const label=(b?.textContent||"").trim();if(label)hint.textContent=`OPEN ${label.toUpperCase()}`};
    menu.addEventListener("pointerover",e=>show(e.target.closest("button")));
    menu.addEventListener("focusin",e=>show(e.target.closest("button")));
    menu.addEventListener("pointerleave",()=>{if(!menu.contains(document.activeElement))hint.textContent=initial});
    menu.addEventListener("focusout",e=>{if(!menu.contains(e.relatedTarget))hint.textContent=initial})
  }

  function installMementosPage(){
    if(q("#mementosPage"))return;
    const page=document.createElement("section");page.id="mementosPage";page.className="page";
    page.innerHTML=`<div class="mementos-shell">
      <div class="mementos-hero">
        <div class="mementos-title-card">
          <div class="mementos-kicker">Deadline Request Network</div><div class="mementos-title">Mementos</div>
          <div class="mementos-sub">Requests descend deeper according to how many daily points you lose if you miss them. Time controls urgency; consequence controls depth.</div>
          <button class="btn mementos-add" id="addMementosRequest">+ New Request</button>
        </div>
        <div class="mementos-summary">
          <div class="mementos-stat"><small>Active Requests</small><b id="mementoActive">0</b></div>
          <div class="mementos-stat loss"><small>Potential Loss</small><b id="mementoLoss">−0</b></div>
          <div class="mementos-stat"><small>Deepest Target</small><b id="mementoDeepest">F0</b></div>
          <div class="mementos-stat"><small>Due ≤ 48h</small><b id="mementoUrgent">0</b></div>
        </div>
      </div>
      <nav id="mementosFloorNav" class="mementos-floor-nav" aria-label="Jump to a Mementos floor"></nav>
      <div id="mementosDepths" class="mementos-depths"></div>
      <div class="mementos-cleared"><h3>Request Archive</h3><div id="mementosCleared" class="cleared-strip"></div></div>
    </div>`;
    const settings=q("#settingsPage");settings?.parentNode?.insertBefore(page,settings);

    const dialog=document.createElement("dialog");dialog.id="mementosRequestDialog";
    dialog.innerHTML=`<form id="mementosRequestForm" class="mementos-form" method="dialog">
      <h2>New Request</h2>
      <div class="field"><label>Request / deadline task</label><input id="mementoName" maxlength="120" required placeholder="e.g. Submit chemistry report"></div>
      <div class="mementos-two"><div class="field"><label>Category</label><select id="mementoCategory"><option value="school">Productivity (School)</option><option value="home">Productivity (Home)</option><option value="health">Health</option></select></div><div class="field"><label>Deadline</label><input id="mementoDeadline" type="datetime-local" required></div></div>
      <div class="mementos-two"><div class="field"><label>Miss penalty</label><input id="mementoPenalty" type="number" min="0" step="0.1" value="1" required><small class="settings-note">This decides the Mementos floor and is deducted from that category on the missed deadline day.</small></div><div class="field"><label>Completion points</label><input id="mementoRewardPoints" type="number" min="0" step="0.1" value="1" required><small class="settings-note">Added to the day you clear the Request.</small></div></div>
      <div id="mementoFloorPreview" class="mementos-floor-preview"><b>Floor 2 • Low</b><span>−1 point if missed</span></div>
      <div class="mementos-two"><div class="field"><label>Social Stat</label><select id="mementoStat"><option value="knowledge">Knowledge</option><option value="guts">Guts</option><option value="proficiency">Proficiency</option><option value="kindness">Kindness</option><option value="charm">Charm</option></select></div><div class="field"><label>Social Stat XP</label><input id="mementoXP" type="number" min="0" step="1" value="2" required></div></div>
      <div class="modal-actions"><button type="button" class="ghost" id="cancelMemento">Cancel</button><button type="submit" class="btn">Locate Target</button></div>
    </form>`;document.body.append(dialog);

    const cut=document.createElement("div");cut.id="requestCutin";cut.className="request-cutin";cut.innerHTML=`<div class="request-cutin-copy"><small>Mementos</small><b>REQUEST COMPLETE</b><span id="requestCutinName"></span></div>`;document.body.append(cut)
  }

  function requestUrgency(r){
    if(r.status==="failed")return{cls:"failed",label:"MISSED"};
    if(r.status!=="active")return{cls:"",label:"CLEARED"};
    const ms=new Date(r.deadline).getTime()-Date.now();
    if(!Number.isFinite(ms))return{cls:"",label:"NO DEADLINE"};
    const hours=ms/36e5;
    if(hours<=0)return{cls:"failed",label:"OVERDUE"};
    if(hours<=24)return{cls:"urgency-today",label:"DUE TODAY"};
    if(hours<=48)return{cls:"urgency-danger",label:`${Math.ceil(hours)}H LEFT`};
    if(hours<=144)return{cls:"urgency-watch",label:`${Math.ceil(hours/24)}D LEFT`};
    return{cls:"",label:`${Math.ceil(hours/24)}D LEFT`}
  }
  function sortedRequests(d){return [...d.mementosRequests].sort((a,b)=>{
    const state={active:0,failed:1,"completed-late":2,completed:3};if(state[a.status]!==state[b.status])return state[a.status]-state[b.status];
    return (new Date(a.deadline).getTime()||Infinity)-(new Date(b.deadline).getTime()||Infinity)
  })}
  function requestCard(r){
    const floor=floorForPenalty(r.missPenalty),meta=FLOOR_META[floor],u=requestUrgency(r),deadline=r.deadline?new Date(r.deadline).toLocaleString():"No deadline";
    return `<article class="request-card ${u.cls} ${r.status}" data-request-id="${escHTML(r.id)}">
      <div class="request-top"><div class="request-title">${escHTML(r.name)}</div><span class="request-floor-chip">F${floor}</span></div>
      <div class="request-meta"><span class="request-pill">${escHTML(categoryLabel(r.category))}</span><span class="request-pill urgent">${escHTML(u.label)}</span><span class="request-pill">${escHTML(deadline)}</span><span class="request-pill penalty">MISS −${fmtNumber(r.missPenalty)}</span><span class="request-pill reward">CLEAR +${fmtNumber(r.rewardPoints)} pts</span><span class="request-pill reward">${escHTML(typeof socialStatName==="function"?socialStatName(r.rewardStat):r.rewardStat)} +${Number(r.statReward)||0} XP</span></div>
      <div class="request-actions">${r.status==="active"?`<button class="request-clear" data-request-clear="${escHTML(r.id)}">Clear Request</button>`:""}${r.status==="failed"?`<button class="request-clear" data-request-late="${escHTML(r.id)}">Resolve Late</button>`:""}<button class="request-delete" data-request-delete="${escHTML(r.id)}">Remove</button></div>
    </article>`
  }
  function renderMementos(){
    const d=loadPersona();processMementosDeadlines(d,false);const requests=sortedRequests(d),active=requests.filter(r=>r.status==="active"),failed=requests.filter(r=>r.status==="failed");
    q("#mementoActive").textContent=active.length;q("#mementoLoss").textContent=`−${fmtNumber(active.reduce((s,r)=>s+r.missPenalty,0))}`;
    q("#mementoDeepest").textContent=active.length?`F${Math.max(...active.map(r=>floorForPenalty(r.missPenalty)))}`:"F0";
    q("#mementoUrgent").textContent=active.filter(r=>new Date(r.deadline).getTime()-Date.now()<=48*36e5).length;
    const depths=q("#mementosDepths");
    depths.innerHTML=[1,2,3,4,5,6].map(floor=>{
      const meta=FLOOR_META[floor],items=requests.filter(r=>["active","failed"].includes(r.status)&&floorForPenalty(r.missPenalty)===floor);
      return `<section class="mementos-floor" id="mementosFloor${floor}" data-floor="${floor}" style="--floor-index:${floor};--floor-color:${meta.color}"><div class="floor-marker"><small>Mementos</small><b>F${floor}</b><span>${meta.name}</span></div><div class="floor-body">${items.length?`<div class="request-grid">${items.map(requestCard).join("")}</div>`:`<div class="mementos-empty">No targets on this floor.</div>`}</div></section>`
    }).join("");
    const floorNav=q("#mementosFloorNav");
    if(floorNav)floorNav.innerHTML=[1,2,3,4,5,6].map(floor=>{const count=requests.filter(r=>["active","failed"].includes(r.status)&&floorForPenalty(r.missPenalty)===floor).length;return `<button type="button" class="floor-nav-stop" data-floor-jump="${floor}" aria-label="Jump to Mementos Floor ${floor}, ${count} ${count===1?"request":"requests"}"><span>F${floor}</span><small>${count||"—"}</small></button>`}).join("");
    observeMementosFloors();
    const archive=requests.filter(r=>r.status==="completed"||r.status==="completed-late").slice(0,20);
    q("#mementosCleared").innerHTML=archive.length?archive.map(r=>`<div class="cleared-request"><b>${escHTML(r.name)}</b><small>${r.status==="completed-late"?"Resolved late":"Cleared"} • F${floorForPenalty(r.missPenalty)} • ${r.completedAt?new Date(r.completedAt).toLocaleDateString():""}</small></div>`).join(""):`<div class="mementos-empty" style="min-width:100%">No cleared Requests yet.</div>`;
    if(failed.length&&document.body.dataset.lastMementoFailed!==failed[0].id)document.body.dataset.lastMementoFailed=failed[0].id
  }
  let floorObserver=null;
  function observeMementosFloors(){
    const root=q("#mementosPage");if(!root||!window.IntersectionObserver)return;
    floorObserver?.disconnect();
    floorObserver=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;const floor=visible.target.dataset.floor;
      qa(".floor-nav-stop",root).forEach(btn=>btn.classList.toggle("active",btn.dataset.floorJump===floor));
    },{root:null,rootMargin:"-22% 0px -58% 0px",threshold:[0,.15,.35,.6]});
    qa(".mementos-floor",root).forEach(floor=>floorObserver.observe(floor));
  }
  function processMementosDeadlines(existing=null,notify=true){
    const d=existing||loadPersona();let changed=false;const now=Date.now();
    for(const r of d.mementosRequests){
      if(r.status!=="active"||!r.deadline)continue;const t=new Date(r.deadline).getTime();
      if(Number.isFinite(t)&&t<=now){r.status="failed";r.failureDate=r.deadline.slice(0,10);r.penaltyApplied=true;changed=true;if(notify&&typeof showPersonaToast==="function")showPersonaToast("inbox","Mementos Request Missed",`${r.name} • −${fmtNumber(r.missPenalty)} ${categoryLabel(r.category)} points`,"!")}
    }
    if(changed){savePersona(d);try{renderMain()}catch{}try{renderStats()}catch{};if(q("#mementosPage.active"))renderMementos()}
    return changed
  }
  function addRequestFromForm(){
    const d=loadPersona(),category=q("#mementoCategory").value,penalty=Math.max(0,Number(q("#mementoPenalty").value)||0);
    const r={id:uid(),name:q("#mementoName").value.trim(),category,deadline:q("#mementoDeadline").value,missPenalty:penalty,rewardPoints:Math.max(0,Number(q("#mementoRewardPoints").value)||0),rewardStat:q("#mementoStat").value,statReward:Math.max(0,Math.round(Number(q("#mementoXP").value)||0)),status:"active",createdAt:new Date().toISOString(),completedAt:null,failureDate:null,penaltyApplied:false,completionTaskId:null};
    d.mementosRequests.push(r);savePersona(d);q("#mementosRequestDialog").close();renderMementos();if(typeof showPersonaToast==="function")showPersonaToast("inbox","Request Located",`${r.name} • Mementos Floor ${floorForPenalty(penalty)}`,"◆")
  }
  function clearRequest(id,late=false){
    const d=loadPersona(),r=d.mementosRequests.find(x=>x.id===id);if(!r||!(r.status==="active"||r.status==="failed"))return;
    const wasFailed=r.status==="failed";r.status=wasFailed||late?"completed-late":"completed";r.completedAt=new Date().toISOString();
    const date=typeof localKey==="function"?localKey():new Date().toISOString().slice(0,10);d.days=d.days||{};d.days[date]=d.days[date]||{tasks:[],notes:"",skippedRecurringIds:[]};d.days[date].tasks=d.days[date].tasks||[];
    if(!r.completionTaskId){
      const taskId=uid();r.completionTaskId=taskId;const stat=(typeof SOCIAL_STAT_KEYS!=="undefined"&&SOCIAL_STAT_KEYS.includes(r.rewardStat))?r.rewardStat:(typeof defaultSocialStatForCategory==="function"?defaultSocialStatForCategory(r.category):"knowledge");
      d.days[date].tasks.push({id:taskId,name:`Request: ${r.name}`,category:r.category,points:Number(r.rewardPoints)||0,socialStat:stat,socialXP:Number(r.statReward)||0,taskType:"check",done:true,mementosRequestId:r.id});
      d.socialStatLedger=d.socialStatLedger||{};d.socialStatLedger[`task:${date}:${taskId}`]={stat,xp:0,source:"mementos-task",date,at:new Date().toISOString()}
    }
    let award={awarded:false};if(typeof awardSocialStat==="function")award=awardSocialStat(d,`mementos:${r.id}`,r.rewardStat,r.statReward,"mementos",date);
    savePersona(d);try{renderMain()}catch{}try{renderStats()}catch{};renderMementos();if(typeof notifySocialAward==="function")notifySocialAward(award,r.name);showRequestCutin(r.name,wasFailed||late)
  }
  function deleteRequest(id){const d=loadPersona(),r=d.mementosRequests.find(x=>x.id===id);if(!r)return;if(!confirm(`Remove Mementos Request “${r.name}”? Recorded score penalties already caused by a missed deadline will also disappear.`))return;d.mementosRequests=d.mementosRequests.filter(x=>x.id!==id);savePersona(d);try{renderMain()}catch{}try{renderStats()}catch{};renderMementos()}
  function showRequestCutin(name,late){const el=q("#requestCutin");if(!el)return;q("#requestCutinName").textContent=name;el.classList.toggle("late",!!late);q(".request-cutin-copy b",el).textContent=late?"TARGET RESOLVED":"REQUEST COMPLETE";el.classList.remove("show");void el.offsetWidth;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),950)}
  function updateFloorPreview(){const p=Math.max(0,Number(q("#mementoPenalty")?.value)||0),f=floorForPenalty(p),meta=FLOOR_META[f],box=q("#mementoFloorPreview");if(box)box.innerHTML=`<b>Floor ${f} • ${meta.name}</b><span>−${fmtNumber(p)} point${p===1?"":"s"} if missed</span>`}

  function patchScoring(){
    if(typeof scores!=="function"||scores.__mementosPatched)return;
    core.scores=scores;
    const wrapped=function(day,key=null,data=null){
      const r=core.scores(day,key,data);if(!key)return r;const d=ensurePersonaData(data||load());
      for(const m of d.mementosRequests){if(m.status==="failed"||m.status==="completed-late"){if(m.failureDate===key&&r[m.category]!==undefined)r[m.category]-=Number(m.missPenalty)||0}}
      for(const k of ["school","home","health"])r[k]=Math.max(0,Math.min(6,Number(r[k])||0));
      return r
    };wrapped.__mementosPatched=true;
    try{window.scores=wrapped;scores=wrapped}catch{}
  }

  function renameProjectLabels(){
    const p=q("#projectsPage");if(!p)return;
    qa(".project-stat small",p).forEach((el,i)=>el.textContent=["Active Palaces","Treasures Stolen","Palace Stat XP"][i]||el.textContent);
    const cardTitle=qa(".card-title",p).find(x=>/Boss Projects|Projects/i.test(x.textContent));if(cardTitle)cardTitle.textContent="Palaces";
    const expl=qa(".settings-note",p).find(x=>/Projects are larger goals/i.test(x.textContent));if(expl)expl.textContent="Palaces are major multi-step goals. Clear every infiltration objective to secure a route, then send the Calling Card to finish the Palace and earn its Social Stat XP.";
    const add=q("#addProjectBtn");if(add)add.textContent="+ New Palace";
    const dialog=q("#projectDialog h2");if(dialog)dialog.textContent="New Palace";
  }
  function sortedProjects(d){const now=Date.now();return [...(d.projects||[])].sort((a,b)=>{if(a.status!==b.status)return a.status==="active"?-1:1;if(!a.deadline&&!b.deadline)return(b.createdAt||"").localeCompare(a.createdAt||"");if(!a.deadline)return 1;if(!b.deadline)return-1;return new Date(a.deadline)-new Date(b.deadline)})}
  function decoratePalaces(){
    renameProjectLabels();const list=q("#projectList");if(!list)return;const d=loadPersona(),projects=sortedProjects(d),cards=qa(".project-card",list);
    cards.forEach((card,i)=>{
      const p=projects[i];if(!p)return;card.dataset.palaceId=p.id;card.classList.add("palace-card");
      const statKey=String(p.socialStat||p.stat||"knowledge").toLowerCase();const palaceThemes={knowledge:"#31b7e8",guts:"#e60022",proficiency:"#ffd21f",kindness:"#55c878",charm:"#df66bb"};card.dataset.palaceStat=statKey;card.style.setProperty("--palace-accent",palaceThemes[statKey]||"#e60022");
      let identity=q(".palace-identity",card);if(!identity){identity=document.createElement("div");identity.className="palace-identity";q(".project-title",card)?.before(identity)}
      const statName=typeof socialStatName==="function"?socialStatName(statKey):statKey;identity.innerHTML=`<span class="palace-sigil" aria-hidden="true">${escHTML(statKey.slice(0,1).toUpperCase())}</span><span>${escHTML(statName)} DOMAIN</span>`;
      const progress=(p.subtasks||[]).length?((p.subtasks||[]).filter(s=>s.done).length/(p.subtasks||[]).length*100):(p.routeSecured||p.status==="completed"?100:0);
      const txt=q(".project-progress-text",card);if(txt)txt.textContent=p.status==="completed"?"TREASURE STOLEN":p.routeSecured?"ROUTE SECURED — Calling Card ready":`INFILTRATION ${Math.round(progress)}%`;
      let state=q(".palace-state",card);if(!state){state=document.createElement("div");state.className="palace-state";q(".project-meta",card)?.after(state)}
      state.className=`palace-state ${p.status==="completed"?"stolen":p.routeSecured?"secured":""}`;state.textContent=p.status==="completed"?"✓ Treasure secured":p.routeSecured?"⚠ Route secured":"Infiltration in progress";
      const actions=q(".project-actions",card);if(actions){
        const complete=q('[data-project-complete]',actions);if(complete)complete.style.display="none";
        q('[data-calling-card]',actions)?.remove();q('[data-secure-route]',actions)?.remove();
        if(p.status==="active"&&p.routeSecured){const b=document.createElement("button");b.className="calling-card-btn";b.dataset.callingCard=p.id;b.textContent="SEND CALLING CARD";actions.prepend(b)}
        else if(p.status==="active"&&(p.subtasks||[]).length===0){const b=document.createElement("button");b.dataset.secureRoute=p.id;b.textContent="Secure Route";actions.prepend(b)}
      }
    })
  }
  function setRouteSecured(projectId,secured=true){const d=loadPersona(),p=d.projects.find(x=>x.id===projectId);if(!p||p.status!=="active")return;p.routeSecured=secured;savePersona(d);if(typeof core.renderProjects==="function")core.renderProjects();decoratePalaces();if(secured&&typeof showPersonaToast==="function")showPersonaToast("achievement","ROUTE SECURED",`${p.name} • Calling Card is ready.`,"!")}
  function interceptProjectStep(e){
    const input=e.target.closest?.("[data-project-step]");if(!input)return;e.stopImmediatePropagation();
    const d=loadPersona(),p=d.projects.find(x=>x.id===input.dataset.projectStep),idx=Number(input.dataset.projectStepIndex);if(!p||p.status!=="active"||!p.subtasks?.[idx])return;p.subtasks[idx].done=input.checked;p.routeSecured=p.subtasks.length>0&&p.subtasks.every(s=>s.done);savePersona(d);core.renderProjects?.();decoratePalaces();if(p.routeSecured&&typeof showPersonaToast==="function")showPersonaToast("achievement","ROUTE SECURED",`${p.name} • Send the Calling Card when you’re ready.`,"!")
  }
  function showCallingCard(projectId){
    const d=loadPersona(),p=d.projects.find(x=>x.id===projectId);if(!p||p.status!=="active"||!p.routeSecured)return;
    const el=q("#callingCardOverlay");q("#callingCardName").textContent=p.name;el.classList.remove("show");void el.offsetWidth;el.classList.add("show");
    setTimeout(()=>{el.classList.remove("show");core.completeProject?.(p.id);decoratePalaces()},2100)
  }
  function hasLevelUp(award){
    if(!award)return false;if(typeof award==="string")return /rank\s*up|level\s*up/i.test(award);
    const seen=new Set(),visit=value=>{
      if(!value||typeof value!=="object"||seen.has(value))return false;seen.add(value);
      for(const [key,item] of Object.entries(value)){
        if(/^(leveledUp|levelUp|rankedUp|rankUp|didLevelUp)$/i.test(key)&&!!item)return true;
        if(/^(levelsGained|levelUps|rankUps)$/i.test(key)&&(Number(item)>0||(Array.isArray(item)&&item.length>0)))return true;
        if(item&&typeof item==="object"&&visit(item))return true;
      }return false
    };return visit(award)
  }
  function showSocialLevelUp(award,source=""){
    if(!hasLevelUp(award))return;const overlay=q("#socialRankCutin");if(!overlay)return;
    const stat=String(award?.stat||award?.socialStat||award?.key||"SOCIAL STAT");
    const portrait=q("#profileAvatar")||q("#introAvatar"),portraitWrap=q(".social-rank-portrait",overlay),portraitImg=q(".social-rank-portrait img",overlay);if(portraitImg&&portrait?.getAttribute("src")){portraitImg.src=portrait.currentSrc||portrait.src;portraitImg.hidden=false;portraitWrap.classList.add("has-photo");portraitImg.onerror=()=>{portraitWrap.classList.remove("has-photo");portraitImg.hidden=true}}
    q(".social-rank-stat",overlay).textContent=typeof socialStatName==="function"?socialStatName(stat):stat.replace(/[-_]/g," ").toUpperCase();
    q(".social-rank-source",overlay).textContent=source?`MILESTONE • ${source}`:"MILESTONE ACHIEVED";
    overlay.classList.remove("show");void overlay.offsetWidth;overlay.classList.add("show");setTimeout(()=>overlay.classList.remove("show"),1450)
  }
  function installSocialRankCutin(){
    if(q("#socialRankCutin"))return;const el=document.createElement("div");el.id="socialRankCutin";el.className="social-rank-cutin";el.setAttribute("role","status");el.setAttribute("aria-live","polite");
    el.innerHTML=`<div class="social-rank-sheet"><span class="social-rank-portrait" aria-hidden="true"><img alt="" hidden><i>M</i></span><small class="social-rank-source">MILESTONE ACHIEVED</small><b>RANK UP</b><span class="social-rank-stat">SOCIAL STAT</span></div>`;document.body.append(el)
  }
  function patchSocialAwardFeedback(){
    if(typeof notifySocialAward!=="function"||notifySocialAward.__personaRankCutin)return;core.notifySocialAward=notifySocialAward;
    const wrapped=function(award,source){const result=core.notifySocialAward(award,source);showSocialLevelUp(award,source);return result};wrapped.__personaRankCutin=true;
    try{window.notifySocialAward=wrapped;notifySocialAward=wrapped}catch{}
  }
  function installCallingCard(){
    if(q("#callingCardOverlay"))return;const el=document.createElement("div");el.id="callingCardOverlay";el.className="calling-card-overlay";el.innerHTML=`<div class="calling-card-sheet"><small>To the ruler of procrastination</small><h2>Calling Card</h2><p>Your distorted deadline has been located. The route is secured. We’re taking the treasure called <strong id="callingCardName"></strong>.</p><b>THE MOMENTUM THIEVES</b></div>`;document.body.append(el)
  }
  function patchProjectFunctions(){
    if(typeof addProjectStep==="function"&&!addProjectStep.__personaPatched){
      core.addProjectStep=addProjectStep;
      const wrapped=function(projectId,name){
        const d=loadPersona(),p=d.projects.find(x=>x.id===projectId);
        if(p&&p.status==="active"&&p.routeSecured){p.routeSecured=false;savePersona(d)}
        const result=core.addProjectStep(projectId,name);
        setTimeout(decoratePalaces,0);
        return result
      };
      wrapped.__personaPatched=true;
      try{window.addProjectStep=wrapped;addProjectStep=wrapped}catch{}
    }
  }
  function patchProjects(){
    core.renderProjects=typeof renderProjects==="function"?renderProjects:null;core.completeProject=typeof completeProject==="function"?completeProject:null;
    patchProjectFunctions();
    const list=q("#projectList");if(!list)return;
    list.addEventListener("change",interceptProjectStep,true);
    list.addEventListener("click",e=>{
      const cc=e.target.closest?.("[data-calling-card]");if(cc){e.preventDefault();e.stopImmediatePropagation();showCallingCard(cc.dataset.callingCard);return}
      const sr=e.target.closest?.("[data-secure-route]");if(sr){e.preventDefault();e.stopImmediatePropagation();setRouteSecured(sr.dataset.secureRoute,true);return}
      const old=e.target.closest?.("[data-project-complete]");if(old){e.preventDefault();e.stopImmediatePropagation();setRouteSecured(old.dataset.projectComplete,true)}
    },true);
    projectObserver=new MutationObserver(()=>requestAnimationFrame(decoratePalaces));projectObserver.observe(list,{childList:true,subtree:true});decoratePalaces()
  }

  function patchNavigation(){
    core.showPage=typeof showPage==="function"?showPage:null;
    if(core.showPage){const wrapped=function(id){core.showPage(id);if(id==="mementosPage")renderMementos();if(id==="projectsPage")setTimeout(decoratePalaces,0)};try{window.showPage=wrapped;showPage=wrapped}catch{}}
    document.addEventListener("click",e=>{
      const go=e.target.closest?.("[data-go],[data-mobile-go]");if(!go)return;const id=go.dataset.go||go.dataset.mobileGo;if(!id)return;
      if(id==="mementosPage"){e.preventDefault();showPage("mementosPage");q("#mobileMoreSheet")?.classList.remove("show")}
      const label=id==="mementosPage"?"MEMENTOS":id==="projectsPage"?"PALACES":(go.textContent||"MOMENTUM").trim();playTransition(label)
    },true)
  }

  function patchDailyOverlay(){
    if(typeof showDailyOverlay!=="function")return;core.showDailyOverlay=showDailyOverlay;
    const wrapped=function(mode="briefing"){
      core.showDailyOverlay(mode);try{
        const key=q("#datePicker")?.value||(typeof localKey==="function"?localKey():new Date().toISOString().slice(0,10)),d=loadPersona();
        const due=d.mementosRequests.filter(r=>r.status==="active"&&r.deadline?.slice(0,10)===key);const cleared=d.mementosRequests.filter(r=>(r.status==="completed"||r.status==="completed-late")&&r.completedAt?.slice(0,10)===key);const missed=d.mementosRequests.filter(r=>(r.status==="failed"||r.status==="completed-late")&&r.failureDate===key);const ready=(d.projects||[]).filter(p=>p.status==="active"&&p.routeSecured);
        const box=q("#dailyOverlayContent");if(box&&!q(".daily-extra-strip",box)){const extra=document.createElement("div");extra.className="daily-extra-strip";extra.innerHTML=mode==="results"?`<div class="daily-extra"><small>Requests Cleared</small><b>${cleared.length}</b></div><div class="daily-extra"><small>Mementos Misses</small><b>${missed.length}</b></div><div class="daily-extra"><small>Routes Secured</small><b>${ready.length}</b></div>`:`<div class="daily-extra"><small>Requests Due</small><b>${due.length}</b></div><div class="daily-extra"><small>Potential Loss</small><b>−${fmtNumber(due.reduce((s,r)=>s+r.missPenalty,0))}</b></div><div class="daily-extra"><small>Calling Cards Ready</small><b>${ready.length}</b></div>`;box.append(extra)}
      }catch(err){console.warn("[Momentum Persona] daily overlay extension failed",err)}
    };try{window.showDailyOverlay=wrapped;showDailyOverlay=wrapped}catch{}
  }

  function installEvents(){
    q("#addMementosRequest")?.addEventListener("click",()=>{
      const dlg=q("#mementosRequestDialog"),deadline=new Date(Date.now()+24*36e5);deadline.setMinutes(deadline.getMinutes()-deadline.getTimezoneOffset());q("#mementoDeadline").value=deadline.toISOString().slice(0,16);q("#mementoName").value="";q("#mementoPenalty").value="1";q("#mementoRewardPoints").value="1";q("#mementoXP").value="2";q("#mementoCategory").value="school";q("#mementoStat").value="knowledge";updateFloorPreview();dlg.showModal()
    });
    q("#cancelMemento")?.addEventListener("click",()=>q("#mementosRequestDialog")?.close());
    q("#mementoPenalty")?.addEventListener("input",()=>{updateFloorPreview();const p=q("#mementoPenalty"),r=q("#mementoRewardPoints");if(r?.dataset.manual!=="1")r.value=p.value});
    q("#mementoRewardPoints")?.addEventListener("input",e=>e.target.dataset.manual="1");
    q("#mementoCategory")?.addEventListener("change",e=>{if(typeof defaultSocialStatForCategory==="function")q("#mementoStat").value=defaultSocialStatForCategory(e.target.value)});
    q("#mementosRequestForm")?.addEventListener("submit",e=>{e.preventDefault();addRequestFromForm()});
    q("#mementosDepths")?.addEventListener("click",e=>{const c=e.target.closest("[data-request-clear]");if(c)return clearRequest(c.dataset.requestClear,false);const l=e.target.closest("[data-request-late]");if(l)return clearRequest(l.dataset.requestLate,true);const d=e.target.closest("[data-request-delete]");if(d)return deleteRequest(d.dataset.requestDelete)});
    q("#mementosFloorNav")?.addEventListener("click",e=>{const b=e.target.closest("[data-floor-jump]");if(!b)return;const floor=q(`#mementosFloor${Number(b.dataset.floorJump)}`);floor?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})});
  }

  function patchNotificationJobs(){
    // Extend the existing Supabase push scheduler so Request deadlines travel with the same cloud save.
    if(typeof desiredNotificationJobs==="function"&&!desiredNotificationJobs.__mementosPatched){
      core.desiredNotificationJobs=desiredNotificationJobs;
      const wrapped=function(data){
        const jobs=core.desiredNotificationJobs(data)||[];
        try{
          const d=ensurePersonaData(data||load());
          const uidValue=typeof cloudState!=="undefined"?cloudState.user?.id:null;
          if(uidValue){
            for(const r of d.mementosRequests){
              if(r.status!=="active"||!r.deadline)continue;
              const when=new Date(r.deadline);if(Number.isNaN(when.getTime()))continue;
              jobs.push({
                user_id:uidValue,id:`mementos:${r.id}`,
                title:"Mementos Request Deadline",
                body:`${r.name} • −${fmtNumber(r.missPenalty)} ${categoryLabel(r.category)} points if missed`,
                fire_at:when.toISOString(),kind:"mementos",url:"./#mementos",
                sent:false,source_updated_at:new Date().toISOString()
              })
            }
          }
        }catch(err){console.warn("[Momentum Persona] request push schedule extension failed",err)}
        return jobs
      };
      wrapped.__mementosPatched=true;
      try{window.desiredNotificationJobs=wrapped;desiredNotificationJobs=wrapped}catch{}
    }
    // In-app urgency warnings while Momentum is open.
    let lastWarnKey="";
    setInterval(()=>{try{const d=loadPersona(),now=Date.now(),soon=d.mementosRequests.filter(r=>r.status==="active"&&new Date(r.deadline).getTime()>now&&new Date(r.deadline).getTime()-now<=48*36e5).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));if(!soon.length)return;const r=soon[0],key=`${r.id}:${Math.floor((new Date(r.deadline)-now)/36e5)}`;if(key!==lastWarnKey&&[48,24,12,6,3,1].some(h=>Math.abs((new Date(r.deadline)-now)/36e5-h)<.08)){lastWarnKey=key;if(typeof showPersonaToast==="function")showPersonaToast("inbox","Mementos Deadline",`${r.name} • ${Math.max(1,Math.ceil((new Date(r.deadline)-now)/36e5))}h left • −${fmtNumber(r.missPenalty)} if missed`,"!")}}catch{}},300000)
  }

  function boot(){
    try{
      installIdentity();installLaunch();installTransition();insertNavigatorButtons();installMementosPage();installCallingCard();installSocialRankCutin();installMenuFeedback();patchSocialAwardFeedback();patchScoring();patchNavigation();patchProjects();patchDailyOverlay();installEvents();patchNotificationJobs();
      const d=loadPersona();savePersona(d);processMementosDeadlines(d,true);renameProjectLabels();decoratePalaces();
      setInterval(()=>processMementosDeadlines(null,true),15000);
      window.addEventListener("focus",()=>processMementosDeadlines(null,true));
      console.info(`[Momentum] Persona Overhaul ${VERSION} loaded`)
    }catch(err){console.error("[Momentum] Persona overhaul boot failed",err)}
  }
  ready(boot)
})();
