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

/* Momentum Persona Overhaul + Motion v27 loader.
   Kept outside the monolithic index.html so the visual/system layer can evolve safely. */
(()=>{
  const VERSION="27.1.0";
  const files=[["persona-overhaul","momentumPersona"],["persona-motion","momentumMotion"]];
  for(const [name,flag] of files){
    if(!document.querySelector(`link[data-${flag==="momentumPersona"?"momentum-persona":"momentum-motion"}]`)){
      const css=document.createElement("link");
      css.rel="stylesheet";
      css.href=`./${name}.css?v=${VERSION}`;
      css.dataset[flag]=VERSION;
      document.head.appendChild(css);
    }
  }
  for(const [name,flag] of files){
    if(!document.querySelector(`script[data-${flag==="momentumPersona"?"momentum-persona":"momentum-motion"}]`)){
      const js=document.createElement("script");
      js.src=`./${name}.js?v=${VERSION}`;
      js.async=false;
      js.dataset[flag]=VERSION;
      document.head.appendChild(js);
    }
  }
})();
