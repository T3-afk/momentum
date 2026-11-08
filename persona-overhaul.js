/* Momentum Persona Overhaul v21
   Loaded after the original single-file app. Existing save + Supabase structure stays intact. */
(()=>{
  "use strict";
  const VERSION="21.0.0";
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
    d.personaOverhaulVersion=Math.max(Number(d.personaOverhaulVersion)||0,21);
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
    document.body.append(el);setTimeout(()=>el.remove(),2200)
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