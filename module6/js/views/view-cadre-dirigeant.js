/**
 * VIEW-CADRE-DIRIGEANT — Vue Cadre Dirigeant (L3111-2)
 * Aucun compteur d'heures — suivi CP + équilibre vie pro uniquement
 */
'use strict';

(function(global) {

const VCD = {
  _data: {},
  _year: new Date().getFullYear(),

  init(container) {
    this._container = container;
    try { this._data = JSON.parse(localStorage.getItem(`M6_CD_DATA_${this._year}`) || '{}'); } catch { this._data = {}; }
    this.render();
  },

  _saveData() { localStorage.setItem(`M6_CD_DATA_${this._year}`, JSON.stringify(this._data)); },

  render() {
    const cpPris = Object.values(this._data).filter(v => v.type === 'cp').length;
    const cpTotal = parseInt(localStorage.getItem('M6_CD_CP') || '25');
    const cpSolde = cpTotal - cpPris;

    this._container.innerHTML = `
    <div class="m6-main m6-fade-in">
      <div class="m6-ornement" style="margin-top:4px">
        <div class="m6-ornement-line"></div>
        <div class="m6-ornement-text">Cadre Dirigeant — ${this._year}</div>
        <div class="m6-ornement-line"></div>
      </div>

      <div class="m6-alert info" style="margin-bottom:16px">
        <span class="m6-alert-icon">⚖️</span>
        <div>
          <strong>Régime Cadre Dirigeant (L3111-2)</strong><br>
          <span style="font-size:0.77rem">Vous n'êtes pas soumis aux dispositions légales sur la durée du travail, les heures supplémentaires ou le repos compensateur. Seuls les congés payés s'appliquent.</span>
        </div>
      </div>

      <!-- CP -->
      <div class="m6-card">
        <div class="m6-card-header">
          <div class="m6-card-icon">✈️</div>
          <div><div class="m6-card-label">Congés payés ${this._year}</div>
          <div class="m6-card-title">Solde CP</div></div>
        </div>
        <div class="m6-card-body">
          <div class="m6-stats-grid" style="margin-bottom:12px">
            <div class="m6-stat-box">
              <div class="m6-stat-val">${cpTotal}</div>
              <div class="m6-stat-label">CP total</div>
            </div>
            <div class="m6-stat-box">
              <div class="m6-stat-val">${cpPris}</div>
              <div class="m6-stat-label">CP pris</div>
            </div>
            <div class="m6-stat-box" style="border-color:rgba(196,163,90,0.35)">
              <div class="m6-stat-val" style="color:var(--champagne-2)">${cpSolde}</div>
              <div class="m6-stat-label">CP restants</div>
            </div>
          </div>
          <div class="m6-field">
            <label>Jours de CP annuels contractuels</label>
            <input type="number" id="m6-cd-cp-total" value="${cpTotal}" min="25" max="50">
          </div>
          <button class="m6-btn m6-btn-ghost" id="m6-cd-save-cp" style="width:100%;font-size:0.8rem">Mettre à jour</button>
        </div>
      </div>

      <!-- Rappels légaux -->
      <div class="m6-card">
        <div class="m6-card-header">
          <div class="m6-card-icon">📋</div>
          <div><div class="m6-card-label">Droits maintenus</div>
          <div class="m6-card-title">Protections applicables</div></div>
        </div>
        <div class="m6-card-body">
          ${[
            ['Congés payés', '25 jours ouvrables minimum légal (L3141-3)', '✅'],
            ['Congé maternité/paternité', 'Protection complète maintenue', '✅'],
            ['Protection contre discrimination', 'Non-discrimination, harcèlement', '✅'],
            ['Médecine du travail', 'Suivi médical obligatoire', '✅'],
            ['Durée légale 35h', 'Non applicable', '—'],
            ['Heures supplémentaires', 'Non applicable (L3111-2)', '—'],
            ['Repos compensateur', 'Non applicable', '—'],
          ].map(([l, d, icon]) => `
            <div class="m6-row" style="align-items:flex-start;padding:8px 0">
              <div>
                <div style="font-size:0.8rem;font-weight:500;color:var(--charbon)">${l}</div>
                <div style="font-size:0.7rem;color:var(--pierre)">${d}</div>
              </div>
              <span style="font-size:1rem;flex-shrink:0;margin-left:8px">${icon}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>
    `;

    this._container.querySelector('#m6-cd-save-cp')?.addEventListener('click', () => {
      const val = parseInt(this._container.querySelector('#m6-cd-cp-total')?.value) || 25;
      localStorage.setItem('M6_CD_CP', val);
      this.render();
      M6_toast('✓ CP mis à jour');
    });
  }
};

global.VCD = VCD;

})(window);
