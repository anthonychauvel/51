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
      if (confirm('Changer de régime ? Votre configuration est conservée.')) {
        this._regime = null;
        localStorage.removeItem('M6_REGIME');
        M6_Header.reset();
        this._showSelector();
      }
    });

    if (!this._regime) { this._showSelector(); }
    else               { this._load(this._regime); }
  },

  _set(regime) {
    this._regime = regime;
    localStorage.setItem('M6_REGIME', regime);
    this._load(regime);
  },

  _load(regime) {
    this._root.innerHTML = '';

    // Onboarding Zenji au premier lancement
    if (window.M6_ZenjiOnboarding && M6_ZenjiOnboarding.isFirstVisit()
        && regime !== 'cadre_dirigeant') {
      M6_Header.set({ title:'M6 — Cadres', sub:'Bienvenue', showReset:false, showSwitch:false });
      this._root.innerHTML = `
        <div style="background:var(--ivoire);min-height:calc(100dvh - 58px);padding:0 0 80px">
          <div style="padding:16px 0">
            ${window.M6_Zenji?.renderIntro ? M6_Zenji.renderIntro() : ''}
          </div>
          <div style="padding:0 16px">
            <button id="zenji-start" class="m6-btn m6-btn-gold" style="width:100%;font-size:0.95rem">
              Commencer avec Zenji →
            </button>
          </div>
        </div>`;
      this._root.querySelector('#zenji-start')?.addEventListener('click', () => {
        M6_ZenjiOnboarding.markSeen();
        this._loadView(regime);
      });
      return;
    }
    this._loadView(regime);
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
    <div style="min-height:calc(100dvh - 58px);background:var(--charbon);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 20px;padding-bottom:calc(24px + env(safe-area-inset-bottom,0))">
      <div style="font-family:var(--font-display);font-size:2rem;font-weight:600;color:var(--ivoire);text-align:center;margin-bottom:4px">M6 — Cadres</div>
      <div style="font-size:0.7rem;color:var(--champagne);letter-spacing:0.12em;text-transform:uppercase;text-align:center;margin-bottom:40px">Quel est votre régime de temps de travail ?</div>
      ${[
        {r:'forfait_jours',  badge:'Le plus répandu', title:'Forfait Jours',   sub:'Décompte en journées (218/an) · RTT · Rachat · Entretien L3121-65'},
        {r:'forfait_heures', badge:'39h · 38h30…',   title:'Forfait Heures',  sub:'Durée hebdo fixe + HS · Contingent · Exonération TEPA'},
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
  }
};

document.addEventListener('DOMContentLoaded', () => M6_Router.init());
window.M6_Router = M6_Router;

})();
