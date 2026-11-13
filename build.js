// Wraps app.html into an installable offline web app in ./docs (index.html + sw.js + manifest).
// Run: node build.js   then push; GitHub Pages serves ./docs.
const fs = require('fs'), d = __dirname + '/docs';
fs.mkdirSync(d, { recursive: true });
fs.writeFileSync(d + '/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Prep"><meta name="theme-color" content="#1f6b4f">
<link rel="manifest" href="manifest.webmanifest"></head><body>
${fs.readFileSync(__dirname + '/app.html', 'utf8')}
</body></html>`);
fs.writeFileSync(d + '/manifest.webmanifest', JSON.stringify({ name: 'Aldi Prep Planner', short_name: 'Prep',
  start_url: './', display: 'standalone', background_color: '#f3f6f4', theme_color: '#1f6b4f' }));
// Cache-first so it opens with no signal; refreshes the cache in the background when online.
fs.writeFileSync(d + '/sw.js', `const C='prep-v2';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','manifest.webmanifest'])))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(caches.open(C).then(async c=>{const hit=await c.match(e.request,{ignoreSearch:true});
  const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>hit);return hit||net}))});`);
console.log('built ' + d);
