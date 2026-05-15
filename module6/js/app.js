/**
 * APP.JS — Router M6 Cadres
 * - Toast global
 * - M6_Header : gestion centralisée du header unique
 * - Router : sélection régime → vue
 */
'use strict';
(function() {

// ══════════════════════════════════════════════════════════════════
//  TOAST GLOBAL
// ══════════════════════════════════════════════════════════════════
function M6_toast(msg, duration) {
  let el = document.getElementById('m6-toast-global');
  if (!el) {
    el = document.createElement('div');
    el.id = 'm6-toast-global';
    el.className = 'm6-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration || 2400);
}
window.M6_toast = M6_toast;

// ══════════════════════════════════════════════════════════════════
//  M6_HEADER — Gestionnaire centralisé du header unique
//  Les vues appellent M6_Header.set(...) au lieu d'injecter leur propre header
// ══════════════════════════════════════════════════════════════════
const M6_Header = {
  /**
   * Met à jour le header global.
   * @param {object} opts
   *   title      {string}   — titre principal
   *   sub        {string}   — sous-titre (CCN, régime…)
   *   showReset  {boolean}  — afficher bouton ⚙ reset/wizard
   *   onReset    {function} — callback du bouton ⚙
   *   showSwitch {boolean}  — afficher bouton ⇄ régime
   *   yearPicker {string}   — HTML d'un <select> d'année (optionnel)
   */
  set({ title, sub, showReset, onReset, showSwitch, yearPicker } = {}) {
    const t  = document.getElementById('m6-header-title');
    const s  = document.getElementById('m6-header-sub');
    const rb = document.getElementById('m6-reset-btn');
    const sw = document.getElementById('m6-regime-switch');

    if (t  && title) t.textContent = title;
    if (s  && sub  ) s.textContent = sub;

    if (rb) {
      rb.style.display = showReset ? 'flex' : 'none';
      rb.onclick = null;
      if (showReset && onReset) rb.addEventListener('click', onReset, { once: true });
    }
    if (sw) {
      sw.style.display = showSwitch ? 'flex' : 'none';
    }

    // Year picker : injecté à côté du titre si fourni
    const brand = document.querySelector('.m6-header-brand');
    const existing = document.getElementById('m6-header-year-picker');
    if (existing) existing.remove();
    if (yearPicker && brand) {
      const wrap = document.createElement('div');
      wrap.id = 'm6-header-year-picker';
      wrap.style.cssText = 'margin-top:2px';
      wrap.innerHTML = yearPicker;
      brand.appendChild(wrap);
    }
  },

  /**
   * Réinitialise le header au state sélecteur (avant connexion d'une vue).
   */
  reset() {
    this.set({ title:'M6 — Cadres', sub:'Forfait Jours · Forfait Heures',
               showReset:false, showSwitch:false });
    const existing = document.getElementById('m6-header-year-picker');
    if (existing) existing.remove();
  }
};
window.M6_Header = M6_Header;

// ══════════════════════════════════════════════════════════════════
//  ROUTER
// ══════════════════════════════════════════════════════════════════
const M6_Router = {
  _regime: null,
  _root: null,

  init() {
    this._root   = document.getElementById('m6-app-root');
    this._regime = localStorage.getItem('M6_REGIME') || null;

    // Bouton ⇄ Régime
    const sw = document.getElementById('m6-regime-switch');
    if (sw) sw.addEventListener('click', () => {
      // Overlay inline — pas de confirm() qui peut boucler sur Android/iOS
      if (document.getElementById('m6-regime-confirm')) return; // anti-double
      const ov = document.createElement('div');
      ov.id = 'm6-regime-confirm';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(26,23,20,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px';
      ov.innerHTML = `<div style="background:var(--ivoire);border-radius:16px;padding:24px 20px;max-width:320px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.3)">
        <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;margin-bottom:8px">Changer de régime ?</div>
        <div style="font-size:0.8rem;color:var(--pierre);margin-bottom:20px;line-height:1.5">Votre configuration et vos données sont conservées. Vous pourrez revenir à tout moment.</div>
        <div style="display:flex;gap:10px">
          <button id="m6rc-cancel" class="m6-btn m6-btn-ghost" style="flex:1">Annuler</button>
          <button id="m6rc-ok" class="m6-btn m6-btn-gold" style="flex:1">Changer</button>
        </div>
      </div>`;
      document.body.appendChild(ov);
      const cleanup = () => ov.remove();
      ov.querySelector('#m6rc-cancel').addEventListener('click', cleanup);
      ov.querySelector('#m6rc-ok').addEventListener('click', () => {
        cleanup();
        this._regime = null;
        localStorage.removeItem('M6_REGIME');
        M6_Header.reset();
        this._showSelector();
      });
    });

    if (!this._regime) { this._showSelector(); }
    else               { this._load(this._regime); }
  },

  _set(regime) {
    // Anti-boucle : ignorer si même régime déjà chargé avec vue active
    if (this._regime === regime && document.querySelector('.m6-bottom-nav')) return;
    this._regime = regime;
    localStorage.setItem('M6_REGIME', regime);
    this._load(regime);
  },

  _load(regime) {
    this._root.innerHTML = '';

    // Premier lancement → page de bienvenue Zenji, PUIS wizard de configuration
    if (window.M6_ZenjiOnboarding && M6_ZenjiOnboarding.isFirstVisit()) {
      this._showWelcome(regime);
      return;
    }
    this._loadView(regime);
  },

  _showWelcome(regime) {
    M6_Header.set({ title: 'M6 — Cadres', sub: 'Bienvenue', showReset: false, showSwitch: false });
    this._root.innerHTML = `
    <div style="background:var(--ivoire);min-height:calc(100dvh - 52px);padding:0 0 calc(32px + env(safe-area-inset-bottom,0))">
      <div style="padding:16px 0">
        ${window.M6_Zenji?.renderIntro ? M6_Zenji.renderIntro() : ''}
      </div>
      <div style="padding:0 16px">
        <button id="zenji-start" class="m6-btn m6-btn-gold" style="width:100%;font-size:0.95rem;margin-bottom:10px">
          Configurer mon contrat →
        </button>
        <button id="zenji-skip" class="m6-btn m6-btn-ghost" style="width:100%;font-size:0.78rem">
          Passer — utiliser les valeurs par défaut
        </button>
      </div>
    </div>`;
    this._root.querySelector('#zenji-start')?.addEventListener('click', () => {
      this._showWizard(regime);
    });
    this._root.querySelector('#zenji-skip')?.addEventListener('click', () => {
      M6_ZenjiOnboarding.markSeen();
      this._loadView(regime);
    });
  },

  _loadView(regime) {
    this._root.innerHTML = '';
    // Afficher le bouton switch régime
    M6_Header.set({ showSwitch: true });

    if      (regime === 'forfait_jours'   && window.VFJ) VFJ.init(this._root);
    else if (regime === 'forfait_heures'  && window.VFH) VFH.init(this._root);
    else if (regime === 'cadre_dirigeant' && window.VCD) VCD.init(this._root);
    else    this._showSelector();
  },

  _showSelector() {
    M6_Header.reset();
    this._root.innerHTML = `
    <div style="min-height:calc(100dvh - 52px);background:var(--charbon);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 20px;padding-bottom:calc(24px + env(safe-area-inset-bottom,0))">
      <div style="font-family:var(--font-display);font-size:2rem;font-weight:600;color:var(--ivoire);text-align:center;margin-bottom:4px">M6 — Cadres</div>
      <div style="font-size:0.7rem;color:var(--champagne);letter-spacing:0.12em;text-transform:uppercase;text-align:center;margin-bottom:32px">Quel est votre régime de temps de travail ?</div>
      ${[
        {r:'forfait_jours',  badge:'Le plus répandu', title:'Forfait Jours',   sub:'Décompte en journées (218/an) · RTT · Rachat · Entretien L3121-65'},
        {r:'forfait_heures', badge:'39h · 38h30…',   title:'Forfait Heures',  sub:'Durée hebdo fixe + HS · Contingent · Réduction cotisations & exonération fiscale (TEPA)'},
        {r:'cadre_dirigeant',badge:'L3111-2',         title:'Cadre Dirigeant', sub:'Pas de compteur d\'heures · CP + protections légales · Projets & missions'},
      ].map(c=>`
        <div onclick="M6_Router._set('${c.r}')"
          style="width:100%;max-width:360px;background:rgba(247,243,237,0.06);border:1px solid rgba(196,163,90,0.35);border-radius:14px;padding:18px 20px;cursor:pointer;margin-bottom:12px;transition:background 0.2s;-webkit-tap-highlight-color:transparent">
          <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--champagne);border:1px solid rgba(196,163,90,0.35);border-radius:99px;padding:2px 8px;display:inline-block;margin-bottom:8px">${c.badge}</div>
          <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:600;color:var(--ivoire);margin-bottom:4px">${c.title}</div>
          <div style="font-size:0.75rem;color:var(--pierre);line-height:1.4">${c.sub}</div>
        </div>`).join('')}
      <div style="margin-top:16px;font-size:0.7rem;color:var(--pierre);text-align:center">Changez de régime via le bouton ⇄ en haut à droite.</div>
    </div>`;
  },

  _showWizard(regime) {
    // Wizard de bienvenue : paramétrage du contrat avant affichage de la vue
    M6_Header.set({ title: 'Bienvenue', sub: 'Configuration initiale', showReset: false, showSwitch: false });
    const steps = ['Régime', 'Exercice', 'Contrat'];
    let step = 0;
    const render = () => {
      this._root.innerHTML = `
      <div class="m6-wizard-step" style="padding:24px 16px;max-width:480px;margin:0 auto;padding-bottom:calc(40px + env(safe-area-inset-bottom,0))">
        <div class="m6-wizard-progress">${steps.map((_,i)=>`<div class="m6-wizard-dot ${i<=step?'active':''}"></div>`).join('')}</div>
        <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--champagne);margin-bottom:8px">Étape ${step+1}/${steps.length} — ${steps[step]}</div>
        ${step===0 ? `
          <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:600;color:var(--charbon);margin-bottom:8px">Votre régime</div>
          <p style="font-size:0.82rem;color:var(--pierre);margin-bottom:20px">Confirmez votre régime pour personnaliser l'application.</p>
          <div style="background:var(--ivoire-2);border-radius:var(--radius-lg);padding:14px 16px;margin-bottom:20px">
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:600">${regime==='forfait_jours'?'Forfait Jours':regime==='forfait_heures'?'Forfait Heures':'Cadre Dirigeant'}</div>
            <div style="font-size:0.75rem;color:var(--pierre);margin-top:4px">${regime==='forfait_jours'?'Art. L3121-58 — Plafond 218 jours par an':regime==='forfait_heures'?'Durée hebdomadaire fixe + heures supplémentaires':'Art. L3111-2 — Hors durée légale du travail'}</div>
          </div>
          <button class="m6-btn m6-btn-gold" id="wiz-next" style="width:100%">Confirmer et continuer →</button>
          <button class="m6-btn m6-btn-ghost" id="wiz-back" style="width:100%;margin-top:8px;font-size:0.78rem">← Changer de régime</button>
        ` : step===1 ? `
          <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:600;color:var(--charbon);margin-bottom:8px">Votre exercice</div>
          <p style="font-size:0.82rem;color:var(--pierre);margin-bottom:20px">Définissez la période de suivi (peut chevaucher deux années civiles).</p>
          <div class="m6-card"><div class="m6-card-body">
            <div class="m6-field"><label>Début de l'exercice</label><input type="date" id="wiz-debut" value="${new Date().getFullYear()}-01-01" style="font-size:16px"></div>
            <div class="m6-field"><label>Fin de l'exercice</label><input type="date" id="wiz-fin" value="${new Date().getFullYear()}-12-31" style="font-size:16px"></div>
            <div class="m6-field"><label>Votre nom (pour les exports PDF)</label><input type="text" id="wiz-nom" placeholder="Prénom NOM" style="font-size:16px"></div>
          </div></div>
          <button class="m6-btn m6-btn-gold" id="wiz-next" style="width:100%">Continuer →</button>
          <button class="m6-btn m6-btn-ghost" id="wiz-prev" style="width:100%;margin-top:8px;font-size:0.78rem">← Précédent</button>
        ` : `
          <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:600;color:var(--charbon);margin-bottom:8px">Votre contrat</div>
          <p style="font-size:0.82rem;color:var(--pierre);margin-bottom:20px">Ces données permettent les calculs réglementaires. Modifiables à tout moment.</p>
          <div class="m6-card"><div class="m6-card-body">
            ${regime==='forfait_jours'?`
              <div class="m6-field"><label>Plafond annuel (défaut : 218j)</label><input type="number" id="wiz-plafond" value="218" min="100" max="235" style="font-size:16px"></div>
              <div class="m6-field"><label>Congés payés contractuels (ex: 25, 25.5)</label><input type="number" id="wiz-cp" value="25" min="25" max="40" step="0.5" style="font-size:16px"></div>
              <div class="m6-field"><label>Taux journalier brut (€)</label><input type="number" id="wiz-tj" step="10" placeholder="ex : 350" style="font-size:16px"></div>
              <div class="m6-field" style="position:relative">
                <label>CCN applicable — tapez pour chercher</label>
                <input type="text" id="wiz-ccn" placeholder="ex : Syntec, 1486, Banque AFB…" style="font-size:16px" autocomplete="off">
                <div id="wiz-ccn-drop" style="display:none;position:absolute;left:0;right:0;top:100%;background:#fff;border:1px solid var(--ivoire-3);border-radius:var(--radius);z-index:200;box-shadow:0 4px 16px rgba(0,0,0,0.15);max-height:220px;overflow-y:auto"></div>
                <div id="wiz-ccn-info" style="margin-top:6px"></div>
              </div>
            `:regime==='forfait_heures'?`
              <div class="m6-field"><label>Durée hebdo contractuelle (h)</label><input type="number" id="wiz-seuil" value="39" min="35" max="48" step="0.5" style="font-size:16px"></div>
              <div class="m6-field">
                <label>Contingent annuel HS (h) <span style="font-weight:400;font-size:0.75rem;color:var(--pierre)">— légal : 220h, ou défini par votre CCN</span></label>
                <input type="number" id="wiz-cont" value="220" min="100" max="500" style="font-size:16px">
                <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
                  <input type="checkbox" id="wiz-prorata-cont" style="width:16px;height:16px">
                  <label for="wiz-prorata-cont" style="font-size:0.78rem;color:var(--pierre);cursor:pointer">Appliquer un prorata si j'arrive en cours d'année</label>
                </div>
              </div>
              <div class="m6-field"><label>Taux horaire brut (€, optionnel)</label><input type="number" id="wiz-tauxH" step="0.01" placeholder="25.50" style="font-size:16px"></div>
            `:`
              <div class="m6-field"><label>Plafond jours à surveiller (défaut : 218)</label><input type="number" id="wiz-plafond" value="218" min="100" max="300" style="font-size:16px"></div>
            `}
            <div class="m6-field"><label>Email manager (copie exports)</label><input type="email" id="wiz-email-mgr" placeholder="manager@entreprise.fr" style="font-size:16px"></div>
          </div></div>
          <button class="m6-btn m6-btn-gold" id="wiz-finish" style="width:100%">Commencer →</button>
          <button class="m6-btn m6-btn-ghost" id="wiz-prev" style="width:100%;margin-top:8px;font-size:0.78rem">← Précédent</button>
        `}
      </div>`;

      this._root.querySelector('#wiz-next')?.addEventListener('click', () => {
        if (step === 1) {
          const debut    = this._root.querySelector('#wiz-debut')?.value;
          const fin      = this._root.querySelector('#wiz-fin')?.value;
          if (debut && fin && debut > fin) { M6_toast('La date de fin doit être après le début'); return; }
          this._wizData = { ...this._wizData, debut, fin, nom: this._root.querySelector('#wiz-nom')?.value.trim() };
        }
        step++; render();
      });
      // Bind autocomplete CCN dans le wizard si on est à l'étape contrat
      if (step === 2 && regime === 'forfait_jours' && window.M6_CCN_Adapter) {
        const wInp  = this._root.querySelector('#wiz-ccn');
        const wDrop = this._root.querySelector('#wiz-ccn-drop');
        const wInfo = this._root.querySelector('#wiz-ccn-info');
        if (wInp && wDrop) {
          M6_CCN_Adapter.bindAutocomplete(wInp, wDrop, (ccn) => {
            // Sauvegarder l'IDCC pour la validation
            wInp.dataset.idcc = ccn.idcc || '';
            // Pré-remplir plafond si différent de 218
            const defs = M6_CCN_Adapter.buildContractDefaults?.(ccn, 'forfait_jours');
            if (defs?.plafond && defs.plafond !== 218) {
              const pEl = this._root.querySelector('#wiz-plafond');
              if (pEl) pEl.value = defs.plafond;
            }
            // Afficher la carte CCN
            if (wInfo) {
              wInfo.innerHTML = M6_CCN_Adapter.renderCCNCard(ccn, 'forfait_jours');
            }
          }, 'forfait_jours');
        }
      }
      this._root.querySelector('#wiz-prev')?.addEventListener('click', () => { step--; render(); });
      this._root.querySelector('#wiz-back')?.addEventListener('click', () => { this._regime = null; localStorage.removeItem('M6_REGIME'); M6_Header.reset(); this._showSelector(); });
      this._root.querySelector('#wiz-finish')?.addEventListener('click', () => {
        let contract = { nomCadre: this._wizData?.nom||'', emailManager: this._root.querySelector('#wiz-email-mgr')?.value.trim()||'', dateDebutExercice: this._wizData?.debut||null, dateFinExercice: this._wizData?.fin||null, dateArrivee: this._wizData?.arrivee||null };
        if (regime === 'forfait_jours') {
          contract = { ...contract, plafond: parseInt(this._root.querySelector('#wiz-plafond')?.value)||218, joursCPContrat: parseFloat(this._root.querySelector('#wiz-cp')?.value)||25, tauxJournalier: parseFloat(this._root.querySelector('#wiz-tj')?.value)||0, ccnLabel: this._root.querySelector('#wiz-ccn')?.value.trim()||'',
                  ccnIdcc: parseInt(this._root.querySelector('#wiz-ccn')?.dataset.idcc||'0')||0,
                  tauxMajorationRachat: 10 };
        } else if (regime === 'forfait_heures') {
          contract = { ...contract,
                  seuilHebdo:    parseFloat(this._root.querySelector('#wiz-seuil')?.value)||39,
                  contingent:    parseInt(this._root.querySelector('#wiz-cont')?.value)||220,
                  prorataContingent: !!(this._root.querySelector('#wiz-prorata-cont')?.checked),
                  tauxHoraire:   parseFloat(this._root.querySelector('#wiz-tauxH')?.value)||0,
                  taux1: 25, taux2: 50, palier1: 8 };
        } else {
          contract = { ...contract, plafond: parseInt(this._root.querySelector('#wiz-plafond')?.value)||218 };
        }
        if (window.M6_Storage) {
          M6_Storage.setContract(regime, contract);
          M6_Storage.createYear(regime, new Date().getFullYear());
        }
        M6_ZenjiOnboarding?.markSeen();
        this._loadView(regime);
      });
    };
    this._wizData = {};
    render();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  M6_Router.init();

  // ── Notifications vendredi — demande in-app (pas RGPD) ────────
  const _notifKey = 'M6_NOTIF_ASKED';
  if (!localStorage.getItem(_notifKey) && 'Notification' in window) {
    // Attendre 30s après l'ouverture pour ne pas déranger
    setTimeout(() => {
      if (Notification.permission === 'default') {
        // Bannière in-app d'invitation (pas de popup navigateur direct)
        const banner = document.createElement('div');
        banner.id = 'm6-notif-banner';
        banner.style.cssText = 'position:fixed;bottom:calc(76px + env(safe-area-inset-bottom,0));left:12px;right:12px;background:var(--charbon);color:var(--ivoire);border-radius:12px;padding:14px 16px;z-index:400;box-shadow:var(--shadow-lg);display:flex;align-items:center;gap:12px;font-size:0.8rem;animation:m6FadeIn 0.4s ease-out';
        banner.innerHTML = `
          <span style="font-size:1.4rem;flex-shrink:0">🔔</span>
          <div style="flex:1;line-height:1.4">Activer les rappels vendredi ?<br><span style="font-size:0.7rem;color:var(--pierre-2)">100% local — aucune donnée envoyée</span></div>
          <button id="m6-notif-yes" style="background:var(--champagne);color:var(--charbon);border:none;border-radius:8px;padding:8px 14px;font-size:0.8rem;cursor:pointer;font-weight:600;white-space:nowrap">Oui</button>
          <button id="m6-notif-no" style="background:none;border:1px solid rgba(196,163,90,0.3);color:var(--pierre-2);border-radius:8px;padding:8px 10px;font-size:0.75rem;cursor:pointer">Non</button>`;
        document.body.appendChild(banner);
        document.getElementById('m6-notif-yes')?.addEventListener('click', () => {
          Notification.requestPermission().then(p => {
            localStorage.setItem(_notifKey, '1');
            banner.remove();
            if (p === 'granted') M6_toast?.('🔔 Rappels vendredi activés !');
          });
        });
        document.getElementById('m6-notif-no')?.addEventListener('click', () => {
          localStorage.setItem(_notifKey, '0'); banner.remove();
        });
      } else {
        localStorage.setItem(_notifKey, '1');
      }
    }, 30000);
  }
});
window.M6_Router = M6_Router;

// ══════════════════════════════════════════════════════════════════
//  R1 — MINI-TUTORIEL ONBOARDING
//  Affiche 4 bulles contextuelles à la 1ère visite de chaque section.
//  Stocké dans M6_TUTO_SEEN (clé globale, transverse aux régimes).
// ══════════════════════════════════════════════════════════════════
window.M6_Tuto = {
  STEPS: [
    { sel:'.m6-bottom-nav', titre:'Navigation rapide',
      texte:'Toutes les fonctions sont accessibles ici. <strong>Bilan</strong> pour l\'aperçu, <strong>Calendrier/Semaines</strong> pour saisir, <strong>Santé</strong> pour vos indicateurs bio, <strong>Validité</strong> pour le contrôle juridique, <strong>Export</strong> pour les PDF.' },
    { sel:'#m6-reset-btn', titre:'Reconfigurer le contrat',
      texte:'Le bouton ⚙ permet de modifier votre contrat à tout moment. Vos données saisies sont conservées.' },
    { sel:'#m6-regime-switch', titre:'Changer de régime',
      texte:'Le bouton ⇄ permet de basculer entre Forfait Jours, Forfait Heures et Cadre Dirigeant.' },
  ],
  show() {
    if (localStorage.getItem('M6_TUTO_SEEN') === '1') return;
    let step = 0;
    const overlay = document.createElement('div');
    overlay.id = 'm6-tuto-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(26,23,20,0.78);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;animation:m6FadeIn 0.3s';
    const render = () => {
      const s = this.STEPS[step];
      overlay.innerHTML = `
      <div style="background:#fff;border-radius:14px;max-width:380px;width:100%;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,0.4)">
        <div style="display:flex;gap:6px;margin-bottom:12px">
          ${this.STEPS.map((_,i)=>`<div style="flex:1;height:3px;border-radius:2px;background:${i<=step?'#C4A35A':'#E2DAD0'}"></div>`).join('')}
        </div>
        <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:600;color:#1A1714;margin-bottom:10px">${s.titre}</div>
        <div style="font-size:0.86rem;color:#4A4540;line-height:1.55;margin-bottom:18px">${s.texte}</div>
        <div style="display:flex;gap:8px">
          ${step>0?`<button id="tuto-prev" style="flex:1;background:transparent;border:1px solid #E2DAD0;border-radius:8px;padding:10px;font-size:0.85rem;cursor:pointer">← Précédent</button>`:''}
          <button id="tuto-skip" style="flex:1;background:transparent;border:1px solid #E2DAD0;border-radius:8px;padding:10px;font-size:0.85rem;cursor:pointer;color:#8A847C">Passer</button>
          <button id="tuto-next" style="flex:1;background:#1A1714;color:#F7F3ED;border:none;border-radius:8px;padding:10px;font-size:0.88rem;font-weight:500;cursor:pointer">${step<this.STEPS.length-1?'Suivant →':'Commencer'}</button>
        </div>
        <div style="font-size:0.65rem;color:#8A847C;text-align:center;margin-top:10px">Étape ${step+1} / ${this.STEPS.length}</div>
      </div>`;
      overlay.querySelector('#tuto-next').onclick = () => {
        if (step < this.STEPS.length-1) { step++; render(); }
        else { localStorage.setItem('M6_TUTO_SEEN','1'); overlay.remove(); }
      };
      overlay.querySelector('#tuto-prev')?.addEventListener('click', () => { step--; render(); });
      overlay.querySelector('#tuto-skip').onclick = () => { localStorage.setItem('M6_TUTO_SEEN','1'); overlay.remove(); };
    };
    render();
    document.body.appendChild(overlay);
  },
  reset() { try{localStorage.removeItem('M6_TUTO_SEEN');}catch(_){} }
};

// Lancer le tuto une fois après le chargement initial (1.5s pour laisser la nav apparaître)
setTimeout(() => {
  if (document.querySelector('.m6-bottom-nav')) {
    // Si M6_Coach disponible, son maybeAutoShow gère déjà l'auto-trigger par section
    // Sinon fallback sur le tuto navigation basique
    if (!window.M6_Coach && localStorage.getItem('M6_TUTO_SEEN') !== '1') {
      window.M6_Tuto.show();
    }
  }
}, 1500);

})();
