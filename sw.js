const CACHE="momentum-pwa-v15-6-free-amount-push";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./cloud-config.js",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(url.pathname.endsWith("/cloud-config.js")){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .then(response=>{
          const clone=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,clone));
          return response
        })
        .catch(()=>caches.match(event.request))
    );
    return
  }

  if(event.request.mode==="navigate"){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          const clone=response.clone();
          caches.open(CACHE).then(cache=>cache.put("./index.html",clone));
          return response
        })
        .catch(()=>caches.match("./index.html"))
    );
    return
  }

  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached)return cached;
      return fetch(event.request).then(response=>{
        if(event.request.method==="GET"&&response.ok){
          const clone=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,clone))
        }
        return response
      })
    })
  );
});

self.addEventListener("push",event=>{
  let payload={};
  try{payload=event.data?.json()||{}}catch{
    payload={body:event.data?.text()||"Momentum notification"}
  }
  const title=payload.title||"Momentum";
  const options={
    body:payload.body||"",
    icon:payload.icon||"./icon-192.png",
    badge:payload.badge||"./icon-192.png",
    tag:payload.tag||"momentum",
    renotify:true,
    data:{url:payload.url||"./"}
  };
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title,options),
      self.registration.setAppBadge ? self.registration.setAppBadge(1) : Promise.resolve()
    ])
  )
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||"./",self.location.origin).href;
  event.waitUntil(
    clients.matchAll({type:"window",includeUncontrolled:true}).then(windows=>{
      for(const client of windows){
        if(client.url.startsWith(self.location.origin))return client.focus()
      }
      return clients.openWindow(target)
    })
  )
});
