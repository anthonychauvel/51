/**
 * APP.JS — Router M6 Cadres + Toast global
 */
'use strict';
(function() {
function M6_toast(msg, duration) {
  let el = document.getElementById('m6-toast-global');
  if (!el) { el = document.createElement('div'); el.id='m6-toast-global'; el.className='m6-toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), duration||2400);
}
window.M6_toast = M6_toast;

const M6_Router = {
  _regime: null, _root: null,
  init() {
    this._root   = document.getElementById('m6-app-root');
    this._regime = localStorage.getItem('M6_REGIME') || null;
    if (!this._regime) this._showSelector(); else this._load(this._regime);
  },
  _set(regime) {
    this._regime = regime; localStorage.setItem('M6_REGIME', regime);
    const sw = document.getElementById('m6-regime-switch'); if (sw) sw.style.display='flex';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#1A1714');
    this._load(regime);
  },
  _load(regime) {
    this._root.innerHTML = '';

    // ── Intro Zenji au premier lancement ──────────────────────
    if (window.M6_ZenjiOnboarding && M6_ZenjiOnboarding.isFirstVisit()
        && (regime === 'forfait_jours' || regime === 'forfait_heures')) {
      this._root.innerHTML = `
        <div style="background:var(--ivoire);min-height:100dvh;padding:0 0 80px">
          <div style="background:var(--charbon);padding:14px 16px;padding-top:calc(14px + env(safe-area-inset-top,0))">
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;color:var(--ivoire)">M6 — Cadres</div>
            <div style="font-size:0.65rem;color:var(--champagne);letter-spacing:0.06em;text-transform:uppercase">Votre conseiller vous accueille</div>
          </div>
          <div style="padding:0 0 16px">
            ${M6_Zenji.renderIntro ? M6_Zenji.renderIntro() : ''}
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
    if (regime==='forfait_jours'   && window.VFJ) VFJ.init(this._root);
    else if (regime==='forfait_heures'  && window.VFH) VFH.init(this._root);
    else if (regime==='cadre_dirigeant' && window.VCD) VCD.init(this._root);
    else this._showSelector();
  },
  _showSelector() {
    const sw = document.getElementById('m6-regime-switch'); if (sw) sw.style.display='none';
    this._root.innerHTML = `
    <div style="min-height:100dvh;background:var(--charbon);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;padding-top:calc(32px + env(safe-area-inset-top,0));padding-bottom:calc(32px + env(safe-area-inset-bottom,0))">
      <div style="font-family:var(--font-display);font-size:2.2rem;font-weight:600;color:var(--ivoire);text-align:center;margin-bottom:4px">M6 — Cadres</div>
      <div style="font-size:0.7rem;color:var(--champagne);letter-spacing:0.12em;text-transform:uppercase;text-align:center;margin-bottom:44px">Quel est votre régime ?</div>
      ${[{r:'forfait_jours',badge:'Le plus répandu',title:'Forfait Jours',sub:'Décompte en journées (218/an) · RTT · Rachat · Entretien L3121-65'},{r:'forfait_heures',badge:'39h · 38h30…',title:'Forfait Heures',sub:'Durée hebdo fixe + HS · Contingent · Exonération TEPA'},{r:'cadre_dirigeant',badge:'L3111-2',title:'Cadre Dirigeant',sub:'Pas de compteur d\'heures · CP + protections fondamentales'}].map(c=>`<div onclick="M6_Router._set('${c.r}')" style="width:100%;max-width:360px;background:rgba(247,243,237,0.06);border:1px solid rgba(196,163,90,0.35);border-radius:14px;padding:20px;cursor:pointer;margin-bottom:12px"><div style="display:inline-block;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--champagne);border:1px solid rgba(196,163,90,0.35);border-radius:99px;padding:2px 8px;margin-bottom:8px">${c.badge}</div><div style="font-family:var(--font-display);font-size:1.2rem;font-weight:600;color:var(--ivoire);margin-bottom:4px">${c.title}</div><div style="font-size:0.75rem;color:var(--pierre);line-height:1.4">${c.sub}</div></div>`).join('')}
      <div style="margin-top:20px;font-size:0.7rem;color:var(--pierre);text-align:center">Changez de régime via le bouton ⇄ en haut à droite.</div>
      <a href="../menu.html" style="display:block;margin-top:16px;font-size:0.75rem;color:var(--pierre);text-align:center">← Menu principal</a>
    </div>`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  M6_Router.init();
  const sw = document.getElementById('m6-regime-switch');
  if (sw) sw.addEventListener('click', () => {
    if (confirm('Changer de régime ? Votre config est conservée.')) {
      M6_Router._regime = null; localStorage.removeItem('M6_REGIME'); M6_Router._showSelector();
    }
  });
});
window.M6_Router = M6_Router;
})();
