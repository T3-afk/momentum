/*
  Momentum Cloud configuration.
  These are PUBLIC browser values and may be committed to a public GitHub Pages repo.
  Never put a Supabase secret/service-role key or VAPID private key in this file.
*/
window.MOMENTUM_CLOUD_CONFIG = {
  supabaseUrl: "https://rcvkqonsqejkgrjuwcis.supabase.co",
  supabasePublishableKey: "sb_publishable_fXBW5cXeTBsjXBlkmvru9A_gQVFr6a4",
  vapidPublicKey: "BEsvlzrudDN9eptzeY3BEGI2kDyZPvGIeH5rnmoRxc7GiCfArb42XVA5BwZPL0xPvRgDqyUSl7nBO2L3Ng8S_WA"
};
(()=>{
  const v="21.0.0";
  if(!document.querySelector("link[data-momentum-persona]")){
    const l=document.createElement("link");l.rel="stylesheet";l.href="./persona-overhaul.css?v="+v;l.dataset.momentumPersona=v;document.head.append(l)
  }
  if(!document.querySelector("script[data-momentum-persona]")){
    const s=document.createElement("script");s.src="./persona-overhaul.js?v="+v;s.async=false;s.dataset.momentumPersona=v;document.head.append(s)
  }
})();