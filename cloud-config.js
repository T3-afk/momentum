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

/* Momentum Persona Overhaul v24 loader.
   Kept outside the monolithic index.html so the visual/system layer can evolve safely. */
(()=>{
  const VERSION="24.0.0";
  if(!document.querySelector('link[data-momentum-persona]')){
    const css=document.createElement("link");
    css.rel="stylesheet";
    css.href=`./persona-overhaul.css?v=${VERSION}`;
    css.dataset.momentumPersona=VERSION;
    document.head.appendChild(css);
  }
  if(!document.querySelector('script[data-momentum-persona]')){
    const js=document.createElement("script");
    js.src=`./persona-overhaul.js?v=${VERSION}`;
    js.async=false;
    js.dataset.momentumPersona=VERSION;
    document.head.appendChild(js);
  }
})();
