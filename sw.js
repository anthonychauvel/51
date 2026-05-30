/**
 * Service Worker — Simulateur Heures Sup & RPG Fox
 * Version : 8.1.0 — Cloudflare Pages (Google Play compliance : disclaimers non-gouv + sources)
 */

const CACHE_NAME = "heuressup-cache-v8.3.2"; // +Lumina CCN 2026
const OFFLINE_URL = "./menu.html";

const FILES_TO_CACHE = [
  "./", "./index.html", "./menu.html", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "./glossaire.js", "./ccn/conventions-collectives.js",
  "./heures/index.html",
  "./paye/index.html",
  "./fox/index.html", "./fox/css/style.css",
  "./fox/js/config.js", "./fox/js/assets-config.js", "./fox/js/safety.js",
  "./fox/js/modes.js", "./fox/js/xp-system.js", "./fox/js/leagues.js",
  "./fox/js/badges.js", "./fox/js/milestones.js", "./fox/js/rpg-system.js",
  "./fox/js/quests.js", "./fox/js/combat.js", "./fox/js/skills.js",
  "./fox/js/inventory.js", "./fox/js/module-loader.js",
  "./fox/js/scenarios-fox-data.js", "./fox/js/scenarios-fox.js",
  "./fox/js/scenarios-ai.js",
  "./fox/js/legal-engine.js", "./fox/js/module-reader.js",
  "./fox/js/module3.js", "./fox/js/data-bridge.js", "./fox/js/storage.js",
  "./fox/js/snapshot-system.js", "./fox/js/export-rtf.js",
  "./fox/js/ai-integration.js", "./fox/js/main-rpg.js",
  "./fox/js/vue-pro.js", "./fox/js/articles-loi.js",
  "./module4/index.html", "./module4/js/app.js",
  "./module4/js/core/dte-engine.js", "./module4/js/core/dte-simulator.js",
  "./module4/js/core/dte-risks.js", "./module4/js/core/dte-learning.js",
  "./module4/js/features/ai-advisor.js", "./module4/js/features/checkin.js",
  "./module4/js/features/lifestyle.js", "./module4/js/features/notifications.js",
  "./module4/js/features/dte-glossary.js", "./module4/js/features/dte-scenarios.js",
  "./module4/js/features/schedule.js", "./module4/js/features/vacances.js",
  "./module4/js/features/pdf-report.js",
  "./module4/js/ui/dashboard.js", "./module4/js/ui/heatmap.js",
  "./module4/js/ui/whatif-panel.js", "./module4/js/ui/twin-body.js",
  "./module4/js/ui/animus-boot.js", "./module4/js/ui/radar-chart.js",
  "./module4/js/ui/timeline-chart.js",
  "./module4/css/main.css", "./module4/css/dashboard.css",
  "./module4/css/components.css", "./module4/css/charts.css",
  "./module4/css/twin-body.css",
  "./module4/assets/favicon.svg", "./module4/assets/icon-192.svg",
  "./module4/assets/logo-dte.svg",
  // === Module 5 — Temps partiel (Mizuki) ===
  "./module5/index.html",
  "./module5/css/main.css",
  "./module5/assets/mizuki.svg",
  "./module5/js/app.js",
  "./module5/js/core/calc-engine.js",
  "./module5/js/data/ccn-partiel.js",
  "./module5/js/features/glossaire.js",
  "./module5/js/features/mizuki.js",
  "./module5/js/features/pdf-report.js",
  "./module5/js/features/saisie.js",
  "./module5/js/features/wellbeing.js",
  // === Module 6 — Cadres (Zenji) ===
  "./module6/index.html",
  "./module6/css/main.css",
  "./module6/images/Cadre.png",
  "./module6/js/app.js",
  // Core
  "./module6/js/core/bio-engine.js",
  "./module6/js/core/calc-engine.js",
  "./module6/js/core/safe-boot.js",
  "./module6/js/core/storage.js",
  // Data
  "./module6/js/data/ccn-adapter.js",
  "./module6/js/data/glossaire-cadres.js",
  // Features
  "./module6/js/features/calendar.js",
  "./module6/js/features/charts.js",
  "./module6/js/features/coach.js",
  "./module6/js/features/entretien-glossaire.js",
  "./module6/js/features/import-export.js",
  "./module6/js/features/nullite-checker.js",
  "./module6/js/features/pdf-report.js",
  "./module6/js/features/rupture-calculateur.js",
  "./module6/js/features/simulateur-nullite.js",
  "./module6/js/features/validite-heures-cd.js",
  "./module6/js/features/zenji-popup.js",
  "./module6/js/features/zenji.js",
  // Views
  "./module6/js/views/view-cadre-dirigeant.js",
  "./module6/js/views/view-forfait-heures.js",
  "./module6/js/views/view-forfait-jours.js",
  // CCN
  "./module6/ccn/coefficients-grilles.js",
  "./module6/ccn/conventions-cadres.js",
  // Image Mizuki (préchargée pour M5)
  "./images/Mizuki.PNG",
  "./images/renard-annuel.png.jpg", "./images/renard-mensuel.png.jpg",
  "./images/renard-central.png.jpg",

  // Décors saisonniers Fox (dans images/)
  "./images/fox-bg.PNG",
  "./images/fox-bg-2.jpg",
  "./images/fox-bg-3.jpg",
  "./images/fox-bg-4.jpg",

  // PNJ Fox (dans images/)
  "./images/foxplayer.PNG",
  "./images/foxplayer-2.PNG",
  "./images/foxplayer-3.PNG",
  "./images/foxplayer-4.PNG",
  "./images/foxplayer-5.PNG",
  "./images/foxplayer-6.PNG",
  "./images/foxplayer-7.PNG",
  "./images/foxplayer-8.PNG",
  "./images/foxplayer-9.PNG",
  "./images/foxplayer-10.PNG",

  // Images Fox (dans images/)
  "./images/foxpredit.jpg",
  // === Lumina — Grilles Salariales CCN 2026 ===
  "./GrillePaye/index.html",
  "./GrillePaye/ccn-data.json"
];

// ── INSTALL ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      
      let ok = 0, fail = 0;
      for (const url of FILES_TO_CACHE) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            // Lire le body complet avant de mettre en cache (fix Cloudflare content-length:0)
            const body = await res.arrayBuffer();
            const headers = new Headers();
            res.headers.forEach((val, key) => {
              if (!['cf-cache-status','cf-ray','age','x-cache','nel','report-to'].includes(key.toLowerCase())) {
                headers.append(key, val);
              }
            });
            // Forcer Content-Length avec la vraie taille du body décompressé
            headers.set('content-length', body.byteLength.toString());
            headers.delete('content-encoding'); // supprimer gzip/br — body déjà décompressé
            headers.delete('transfer-encoding');
            const cleanRes = new Response(body, { status: res.status, statusText: res.statusText, headers });
            await cache.put(url, cleanRes);
            ok++;
          } else {
            fail++;
          }
        } catch(err) {
          fail++;
          console.error("  ❌ [CACHE FAIL]", url, "— erreur:", err.message);
        }
      }
      
      
      // Lister le contenu du cache après installation
      const keys = await cache.keys();
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  
  event.waitUntil(
    caches.keys().then(async (keys) => {
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
        }
      }
    })
  );
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // === Stale-While-Revalidate + ETag pour TOUS les fichiers ===
  // 1. Sert le cache immédiatement (zéro latence)
  // 2. Revalide via ETag/304 en arrière-plan — re-télécharge SEULEMENT si modifié
  // 3. Offline : cache intact
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);

      const revalidate = (async () => {
        try {
          // Requête conditionnelle avec ETag ou Last-Modified
          const reqHeaders = new Headers(event.request.headers);
          if (cached) {
            const etag = cached.headers.get('etag');
            const lastMod = cached.headers.get('last-modified');
            if (etag) reqHeaders.set('if-none-match', etag);
            else if (lastMod) reqHeaders.set('if-modified-since', lastMod);
          }

          const res = await fetch(new Request(event.request, { headers: reqHeaders }));

          if (res.status === 304) {
            // Pas de changement → cache valide, 0 octet téléchargé
            return cached;
          }

          if (res.ok) {
            // Contenu modifié → mettre en cache proprement
            // Fix Cloudflare : reconstruire la réponse sans headers qui bloquent le cache
            const body = await res.arrayBuffer();
            const cleanHeaders = new Headers();
            res.headers.forEach((val, key) => {
              if (!['cf-cache-status','cf-ray','age','x-cache','nel','report-to'].includes(key.toLowerCase())) {
                cleanHeaders.append(key, val);
              }
            });
            cleanHeaders.set('content-length', body.byteLength.toString());
            cleanHeaders.delete('content-encoding');
            cleanHeaders.delete('transfer-encoding');
            const cleanRes = new Response(body, {
              status: res.status,
              statusText: res.statusText,
              headers: cleanHeaders
            });
            await cache.put(event.request, cleanRes.clone());
            return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
          }

          return cached || res;
        } catch {
          // Offline ou erreur réseau → retourner le cache
          return cached || caches.match(event.request).then(r => {
            if (!r) {
              const isNav = event.request.mode === "navigate" ||
                event.request.headers.get("accept")?.includes("text/html");
              if (isNav) return caches.match(OFFLINE_URL);
            }
            return r;
          });
        }
      })();

      // Cache dispo → servir immédiatement + revalider en arrière-plan
      if (cached) {
        revalidate.then(fresh => {
          // Si contenu changé, le cache est déjà mis à jour — visible au prochain chargement
        });
        return cached;
      }

      // Pas de cache → attendre le réseau (premier chargement)
      return revalidate;
    })
  );
});

// ── SYNC ──────────────────────────────────────────────────────────────────────
self.addEventListener("sync", (e) => {
});

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "update-cache") {
    e.waitUntil(
      caches.open(CACHE_NAME).then((c) =>
        Promise.all(FILES_TO_CACHE.map((u) => c.add(u).catch(() => {})))
      )
    );
  }
});

self.addEventListener("push", (e) => {
  const d = e.data?.json() ?? { title: "Heures Sup", body: "Notification" };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "./icon-192.png" }));
});

self.addEventListener("message", (e) => {
  if (e.data?.type === "GEO_NOTIFY") {
    const { action, distance } = e.data;
    self.registration.showNotification(action === "in" ? "📍 Arrivée" : "🏁 Départ", {
      body: action === "in" ? `Zone à ${Math.round(distance)}m` : "Sortie de zone",
      icon: "./icon-192.png", tag: "geo-punch",
      actions: [{ action: "punch", title: "Pointer" }, { action: "dismiss", title: "Fermer" }],
      data: { action }
    });
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  if (e.action === "dismiss") return;
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const action = e.notification.data?.action || "in";
      for (const c of list) {
        if (c.url.includes("paye/index.html") && "focus" in c) {
          c.postMessage({ type: "DO_PUNCH", action }); return c.focus();
        }
      }
      return clients.openWindow("./paye/index.html").then((w) => {
        if (w) setTimeout(() => w.postMessage({ type: "DO_PUNCH", action }), 1500);
      });
    })
  );
});
