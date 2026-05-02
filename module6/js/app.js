/**
 * APP.JS — Orchestrateur M6 Cadres
 * Router interne : sélecteur de régime → vue dédiée
 * Régimes : forfait_jours | forfait_heures | cadre_dirigeant
 */
'use strict';

(function() {

const M6_KEY_REGIME = 'M6_REGIME';

// ── Toast global ──────────────────────────────────────────────────
function M6_toast(msg) {
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
  el._t = setTimeout(() => el.classList.remove('show'), 2400);
}
window.M6_toast = M6_toast;

// ── Router principal ─────────────────────────────────────────────
const M6_Router = {

  _regime: null,
  _container: null,
  _header: null,

  init() {
    this._header    = document.getElementById('m6-app-header');
    this._container = document.getElementById('m6-app-root');
    this._regime    = localStorage.getItem(M6_KEY_REGIME) || null;

    if (!this._regime) {
      this._showRegimeSelector();
    } else {
      this._loadView(this._regime);
    }
  },

  _setRegime(regime) {
    this._regime = regime;
    localStorage.setItem(M6_KEY_REGIME, regime);
    this._updateHeader(regime);
    this._loadView(regime);
  },

  _updateHeader(regime) {
    const titles = {
      forfait_jours:    ['⚖ Forfait Jours', 'Suivi des 218 jours'],
      forfait_heures:   ['⏱ Forfait Heures', 'Compteur d\'heures supplémentaires'],
      cadre_dirigeant:  ['◈ Cadre Dirigeant', 'Congés & équilibre vie pro'],
    };
    const [title, sub] = titles[regime] || ['M6 Cadres', ''];
    const t = document.querySelector('.m6-header-title');
    const s = document.querySelector('.m6-header-sub');
    if (t) t.textContent = title;
    if (s) s.textContent = sub;

    // Bouton changer régime
    const btn = document.getElementById('m6-regime-switch');
    if (btn) {
      btn.style.display = 'flex';
      btn.addEventListener('click', () => {
        if (confirm('Changer de régime ? Votre configuration sera conservée.')) {
          this._regime = null;
          localStorage.removeItem(M6_KEY_REGIME);
          this._updateHeader(null);
          this._showRegimeSelector();
        }
      });
    }
  },

  _loadView(regime) {
    this._updateHeader(regime);
    this._container.innerHTML = '';
    switch (regime) {
      case 'forfait_jours':
        if (window.VFJ) VFJ.init(this._container);
        break;
      case 'forfait_heures':
        if (window.VFH) VFH.init(this._container);
        break;
      case 'cadre_dirigeant':
        if (window.VCD) VCD.init(this._container);
        break;
      default:
        this._showRegimeSelector();
    }
  },

  _showRegimeSelector() {
    // Cacher header navigation
    const btnSwitch = document.getElementById('m6-regime-switch');
    if (btnSwitch) btnSwitch.style.display = 'none';

    this._container.innerHTML = `
    <div class="m6-regime-screen">
      <div class="m6-regime-logo">M6 — Cadres</div>
      <div class="m6-regime-subtitle">Quel est votre régime de temps de travail ?</div>

      <div class="m6-regime-card" data-regime="forfait_jours" style="width:100%;max-width:360px">
        <div class="m6-regime-card-badge">Le plus répandu</div>
        <div class="m6-regime-card-title">Forfait Jours</div>
        <div class="m6-regime-card-sub">Votre travail est décompté en journées (souvent 218 par an). Pas d'horaires imposés. Suivi RTT, alertes garde-fous, simulation rachat.</div>
      </div>

      <div class="m6-regime-card" data-regime="forfait_heures" style="width:100%;max-width:360px">
        <div class="m6-regime-card-badge">39h · 38h30…</div>
        <div class="m6-regime-card-title">Forfait Heures</div>
        <div class="m6-regime-card-sub">Votre contrat prévoit une durée fixe (ex: 39h/semaine) avec heures supplémentaires intégrées. Compteur HS, majorations, contingent.</div>
      </div>

      <div class="m6-regime-card" data-regime="cadre_dirigeant" style="width:100%;max-width:360px">
        <div class="m6-regime-card-badge">L3111-2</div>
        <div class="m6-regime-card-title">Cadre Dirigeant</div>
        <div class="m6-regime-card-sub">Vous bénéficiez d'une large autonomie et n'êtes pas soumis à la durée légale. Seuls les congés payés et protections fondamentales s'appliquent.</div>
      </div>

      <div style="margin-top:24px;text-align:center;font-size:0.7rem;color:var(--pierre)">
        Vous pourrez changer de régime à tout moment via le menu.
      </div>
    </div>
    `;

    this._container.querySelectorAll('[data-regime]').forEach(card => {
      card.addEventListener('click', () => {
        this._setRegime(card.dataset.regime);
      });
    });
  }
};

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  M6_Router.init();
});

window.M6_Router = M6_Router;

})();
