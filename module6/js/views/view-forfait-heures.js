/**
 * VIEW-FORFAIT-HEURES — Vue principale Forfait Heures
 * Seuil personnalisable (38h30, 39h, 40h…) + HS + majorations + contingent
 * Sources : L3121-41 à L3121-48, Loi TEPA 2007 (exonération fiscale)
 */
'use strict';

(function(global) {

const VFH = {

  // ── État ──────────────────────────────────────────────────────
  _contract: null,
  _data: {},
  _year: new Date().getFullYear(),
  _section: 'dashboard',
  _overlay: null,

  // ── Init ──────────────────────────────────────────────────────
  init(container) {
    this._container = container;
    this._loadState();
    this.render();
  },

  _loadState() {
    try {
      this._contract = JSON.parse(localStorage.getItem('M6_FH_CONTRACT') || 'null');
      this._data     = JSON.parse(localStorage.getItem(`M6_FH_DATA_${this._year}`) || '{}');
    } catch { this._contract = null; this._data = {}; }
  },
  _saveData()     { localStorage.setItem(`M6_FH_DATA_${this._year}`, JSON.stringify(this._data)); },
  _saveContract() { localStorage.setItem('M6_FH_CONTRACT', JSON.stringify(this._contract)); },

  // ── Render ────────────────────────────────────────────────────
  render() {
    if (!this._contract) {
      this._container.innerHTML = this._tplSetup();
      this._bindSetup();
      return;
    }

    const analysis = M6_ForfaitHeures.analyze(this._contract, this._data, this._year);

    this._container.innerHTML = `
      ${this._tplNav()}
      <div class="m6-main m6-fade-in">
        ${this._section === 'dashboard' ? this._tplDashboard(analysis) : ''}
        ${this._section === 'semaines'  ? this._tplSemaines(analysis) : ''}
        ${this._section === 'alertes'   ? this._tplAlertes(analysis) : ''}
        ${this._section === 'droits'    ? this._tplDroits(analysis) : ''}
      </div>
      ${this._tplOverlay()}
    `;

    this._overlay = this._container.querySelector('#m6-fh-overlay');
    this._bindNav();
    this._bindContent(analysis);
  },

  // ── Nav ───────────────────────────────────────────────────────
  _tplNav() {
    const tabs = [
      { id: 'dashboard', icon: '◈', label: 'Bilan' },
      { id: 'semaines',  icon: '◻', label: 'Semaines' },
      { id: 'alertes',   icon: '◉', label: 'Alertes' },
      { id: 'droits',    icon: '◆', label: 'Droits & €' },
    ];
    return `<nav class="m6-bottom-nav">
      ${tabs.map(t => `
        <button class="m6-nav-item ${this._section===t.id?'active':''}" data-sec="${t.id}">
          <span class="nav-icon">${t.icon}</span>${t.label}
        </button>`).join('')}
    </nav>`;
  },
  _bindNav() {
    this._container.querySelectorAll('[data-sec]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._section = btn.dataset.sec;
        this.render();
      });
    });
  },

  // ── Dashboard ────────────────────────────────────────────────
  _tplDashboard(a) {
    const cfg = this._contract;
    const pct = a.tauxRemplissage;
    const barClass = pct >= 100 ? 'danger' : pct >= 90 ? '' : 'ok';

    return `
    <div class="m6-config-summary" onclick="VFH_editContract()">
      <span>⏱ Seuil <strong>${this._formatH(cfg.seuilHebdo)}</strong> · Contingent ${cfg.contingent}h</span>
      ${cfg.tauxHoraire > 0 ? `<span style="color:var(--pierre)">· ${cfg.tauxHoraire}€/h</span>` : ''}
      <span class="m6-config-edit">Modifier ✎</span>
    </div>

    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Forfait Heures — ${this._year}</div>
      <div class="m6-ornement-line"></div>
    </div>

    <!-- Jauge HS / contingent -->
    <div class="m6-card">
      <div class="m6-card-body">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <div>
            <div class="m6-metric">
              <span class="m6-metric-val">${a.totalHS}</span>
              <span class="m6-metric-unit">h HS / ${a.contingent}h</span>
            </div>
            <div class="m6-metric-label">Heures supplémentaires cumulées sur l'année</div>
          </div>
          <span class="m6-badge ${pct>=100?'m6-badge-danger':pct>=90?'m6-badge-champagne':'m6-badge-ok'}">${pct}%</span>
        </div>
        <div class="m6-progress-wrap">
          <div class="m6-progress-bar ${barClass}" style="width:${Math.min(pct,100)}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--pierre);margin-top:4px">
          <span>0h</span>
          <span>Contingent ${a.contingent}h</span>
        </div>
      </div>
    </div>

    <!-- Stats HS taux1/taux2 -->
    <div class="m6-stats-grid" style="margin-bottom:14px">
      <div class="m6-stat-box">
        <div class="m6-stat-val">${a.totalHSTaux1}h</div>
        <div class="m6-stat-label">HS à +${a.taux1}%</div>
      </div>
      <div class="m6-stat-box">
        <div class="m6-stat-val">${a.totalHSTaux2}h</div>
        <div class="m6-stat-label">HS à +${a.taux2}%</div>
      </div>
      <div class="m6-stat-box">
        <div class="m6-stat-val">${a.semaines}</div>
        <div class="m6-stat-label">Semaines saisies</div>
      </div>
      <div class="m6-stat-box" style="border-color:rgba(196,163,90,0.35)">
        <div class="m6-stat-val" style="color:var(--champagne-2)">
          ${a.tauxHoraire > 0 ? `${a.montantTotal.toFixed(0)}€` : '—'}
        </div>
        <div class="m6-stat-label">Montant brut HS</div>
      </div>
    </div>

    <!-- Exonération fiscale -->
    ${a.tauxHoraire > 0 ? `
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header">
        <div class="m6-card-icon">💶</div>
        <div><div class="m6-card-label">Loi TEPA 2007</div><div class="m6-card-title">Exonération fiscale estimée</div></div>
      </div>
      <div class="m6-card-body">
        <div class="m6-row">
          <span class="m6-row-label">Montant HS brut</span>
          <span class="m6-row-val">${a.montantTotal.toFixed(2)} €</span>
        </div>
        <div class="m6-row">
          <span class="m6-row-label">Exo IR plafonnée à 7 500€/an</span>
          <span class="m6-row-val ok">${a.exoFiscale.toFixed(2)} €</span>
        </div>
        <div style="font-size:0.7rem;color:var(--pierre);margin-top:8px">* Estimation. Les heures supplémentaires bénéficient d'une exonération d'impôt sur le revenu et d'une réduction de cotisations salariales (L241-17 CSS, Loi TEPA).</div>
      </div>
    </div>` : ''}

    <!-- Alertes -->
    ${a.alertes.length ? a.alertes.map(al => `
      <div class="m6-alert ${al.niveau}" style="margin-bottom:10px">
        <span class="m6-alert-icon">${al.icon}</span>
        <div><strong>${al.titre}</strong><br><span style="font-size:0.77rem">${al.texte}</span></div>
      </div>`).join('') : `
    <div class="m6-alert success" style="margin-bottom:10px">
      <span class="m6-alert-icon">✅</span>
      <div><strong>Contingent conforme</strong><br>Aucune alerte sur le contingent annuel pour ${this._year}.</div>
    </div>`}

    <!-- CTA -->
    <button class="m6-btn m6-btn-primary" id="m6-fh-saisir">
      ＋ Saisir une semaine
    </button>
    <div style="height:8px"></div>
    <button class="m6-btn m6-btn-ghost" onclick="VFH_editContract()" style="width:100%;font-size:0.8rem">
      ⚙️ Modifier mon contrat
    </button>
    `;
  },

  // ── Semaines ─────────────────────────────────────────────────
  _tplSemaines(a) {
    const entries = Object.entries(this._data)
      .filter(([k]) => k.startsWith(String(this._year)))
      .sort(([a],[b]) => b.localeCompare(a)); // plus récent d'abord

    const currentWk = M6_ForfaitHeures.isoWeek(new Date());

    return `
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Historique semaines</div>
      <div class="m6-ornement-line"></div>
    </div>

    <button class="m6-btn m6-btn-primary" id="m6-fh-saisir" style="margin-bottom:16px">
      ＋ Saisir une semaine
    </button>

    ${entries.length === 0 ? `
    <div class="m6-alert info">
      <span class="m6-alert-icon">📋</span>
      <div>Aucune semaine saisie pour ${this._year}. Commencez par la semaine en cours.</div>
    </div>` : ''}

    ${entries.map(([wk, v]) => {
      const h   = parseFloat(v.heures) || 0;
      const extra = Math.max(0, h - a.seuil);
      const hs1 = Math.min(extra, a.palier);
      const hs2 = Math.max(0, extra - a.palier);
      const isCurrent = wk === currentWk;
      const [y, wNum] = wk.split('-W');
      return `
      <div class="m6-card" style="margin-bottom:10px${isCurrent?';border-color:var(--champagne)':''}">
        <div class="m6-card-body" style="padding:12px 14px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--pierre);margin-bottom:2px">
                Semaine ${wNum} · ${y}${isCurrent?' <span class="m6-badge m6-badge-champagne">En cours</span>':''}
              </div>
              <div style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;color:var(--charbon)">
                ${this._formatH(h)}
              </div>
            </div>
            <div style="text-align:right">
              ${extra > 0 ? `
                <div style="font-size:0.78rem;color:var(--champagne-2);font-weight:500">+${this._formatH(extra)} HS</div>
                <div style="font-size:0.68rem;color:var(--pierre)">${hs1>0?`${this._formatH(hs1)} à +${a.taux1}%`:''}${hs2>0?` · ${this._formatH(hs2)} à +${a.taux2}%`:''}</div>
              ` : `<div style="font-size:0.78rem;color:var(--succes)">Conforme</div>`}
            </div>
            <button onclick="VFH_deleteSemaine('${wk}')" style="background:none;border:none;color:var(--pierre);font-size:1rem;cursor:pointer;padding:4px;margin-left:8px">✕</button>
          </div>
          ${v.note ? `<div style="font-size:0.72rem;color:var(--pierre);margin-top:6px;font-style:italic">${v.note}</div>` : ''}
        </div>
      </div>`;
    }).join('')}
    `;
  },

  // ── Alertes ─────────────────────────────────────────────────
  _tplAlertes(a) {
    return `
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Alertes & Vigilance</div>
      <div class="m6-ornement-line"></div>
    </div>

    ${a.alertes.length === 0 ? `
    <div class="m6-alert success">
      <span class="m6-alert-icon">✅</span>
      <div><strong>Aucune alerte pour ${this._year}</strong><br>Votre forfait heures est conforme.</div>
    </div>` : a.alertes.map(al => `
    <div class="m6-card" style="margin-bottom:12px">
      <div class="m6-card-body">
        <div class="m6-alert ${al.niveau}" style="margin-bottom:0">
          <span class="m6-alert-icon">${al.icon}</span>
          <div>
            <strong>${al.titre}</strong><br>
            <span style="font-size:0.78rem">${al.texte}</span>
            <br><span style="font-size:0.68rem;color:var(--pierre);margin-top:4px;display:block">Réf. Art. ${al.loi}</span>
          </div>
        </div>
      </div>
    </div>`).join('')}

    <!-- Maxima légaux semaine -->
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Maxima légaux hebdomadaires</div>
      <div class="m6-ornement-line"></div>
    </div>

    <div class="m6-card">
      <div class="m6-card-body">
        ${[
          ['48h sur 1 semaine', 'Maximum absolu (L3121-20)', 'L3121-20'],
          ['44h en moyenne sur 12 semaines', 'Maximum hebdomadaire moyen (L3121-22)', 'L3121-22'],
          ['${a.contingent}h de HS sur l\'année', 'Contingent conventionnel', 'L3121-33'],
          ['11h de repos quotidien', 'Repos entre deux journées (L3131-1)', 'L3131-1'],
          ['35h de repos hebdomadaire', 'Repos par semaine (L3132-2)', 'L3132-2'],
        ].map(([val, desc, loi]) => `
          <div class="m6-row" style="align-items:flex-start;padding:10px 0">
            <div>
              <div style="font-size:0.82rem;font-weight:500;color:var(--charbon)">${val.replace('${a.contingent}', a.contingent)}</div>
              <div style="font-size:0.72rem;color:var(--pierre)">${desc}</div>
            </div>
            <span class="m6-badge m6-badge-neutral" style="margin-left:8px;flex-shrink:0">${loi}</span>
          </div>`).join('')}
      </div>
    </div>
    `;
  },

  // ── Droits & Euros ───────────────────────────────────────────
  _tplDroits(a) {
    const cfg = this._contract;

    return `
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Droits & Calcul des majorations</div>
      <div class="m6-ornement-line"></div>
    </div>

    <!-- Config taux -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header">
        <div class="m6-card-icon">⚙️</div>
        <div><div class="m6-card-label">Paramètres</div><div class="m6-card-title">Taux horaire & majorations</div></div>
      </div>
      <div class="m6-card-body">
        <div class="m6-field">
          <label>Taux horaire brut (€)</label>
          <input type="number" id="m6-fh-taux" value="${cfg.tauxHoraire||''}" min="0" step="0.01" placeholder="ex : 25.50">
        </div>
        <div class="m6-field">
          <label>Taux majoration 1 (%)</label>
          <input type="number" id="m6-fh-taux1" value="${cfg.taux1||25}" min="10" max="100">
        </div>
        <div class="m6-field">
          <label>Taux majoration 2 (%)</label>
          <input type="number" id="m6-fh-taux2" value="${cfg.taux2||50}" min="25" max="200">
        </div>
        <button class="m6-btn m6-btn-gold" id="m6-fh-save-taux">Mettre à jour</button>
      </div>
    </div>

    <!-- Récap montants -->
    ${cfg.tauxHoraire > 0 ? `
    <div class="m6-card">
      <div class="m6-card-header">
        <div class="m6-card-icon">💶</div>
        <div><div class="m6-card-label">Résultat ${this._year}</div><div class="m6-card-title">Montant HS brut</div></div>
      </div>
      <div class="m6-card-body">
        <div class="m6-row">
          <span class="m6-row-label">${a.totalHSTaux1}h à +${a.taux1}%</span>
          <span class="m6-row-val">${a.montantHS1.toFixed(2)} €</span>
        </div>
        <div class="m6-row">
          <span class="m6-row-label">${a.totalHSTaux2}h à +${a.taux2}%</span>
          <span class="m6-row-val">${a.montantHS2.toFixed(2)} €</span>
        </div>
        <div class="m6-row" style="padding-top:10px">
          <span style="font-weight:600;font-size:0.9rem">Total brut HS</span>
          <span class="m6-row-val gold" style="font-family:var(--font-display);font-size:1.3rem">${a.montantTotal.toFixed(2)} €</span>
        </div>
        <div class="m6-divider"></div>
        <div class="m6-row">
          <span class="m6-row-label">Exonération IR (plaf. 7 500€)</span>
          <span class="m6-row-val ok">${a.exoFiscale.toFixed(2)} €</span>
        </div>
        <div style="font-size:0.7rem;color:var(--pierre);margin-top:6px;line-height:1.5">
          Les heures supplémentaires sont exonérées d'impôt sur le revenu et bénéficient d'une réduction de cotisations salariales dans la limite de 7 500 € par an (Loi TEPA — Art. L241-17 CSS, modifié Loi 2022-1158).
        </div>
      </div>
    </div>` : `
    <div class="m6-alert info">
      <span class="m6-alert-icon">ℹ️</span>
      <div>Renseignez votre taux horaire brut pour calculer les montants en euros.</div>
    </div>`}

    <!-- Détail par semaine -->
    ${a.detailSemaines.length > 0 ? `
    <div class="m6-ornement" style="margin-top:8px">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Détail par semaine</div>
      <div class="m6-ornement-line"></div>
    </div>
    <div class="m6-card">
      <div class="m6-card-body" style="padding:0">
        <table class="m6-table">
          <tr>
            <th>Semaine</th>
            <th>Heures</th>
            <th>HS (+${a.taux1}%)</th>
            <th>HS (+${a.taux2}%)</th>
          </tr>
          ${a.detailSemaines.slice().reverse().map(ds => `
          <tr>
            <td>${ds.semaine.replace('-W','·S')}</td>
            <td>${this._formatH(ds.heures)}</td>
            <td class="${ds.hs1>0?'gold':''}">${ds.hs1>0?this._formatH(ds.hs1):'—'}</td>
            <td class="${ds.hs2>0?'gold':''}">${ds.hs2>0?this._formatH(ds.hs2):'—'}</td>
          </tr>`).join('')}
        </table>
      </div>
    </div>` : ''}
    `;
  },

  // ── Overlay ──────────────────────────────────────────────────
  _tplOverlay() {
    return `
    <div class="m6-overlay" id="m6-fh-overlay">
      <div class="m6-sheet">
        <div class="m6-sheet-title" id="m6-fh-sheet-title">Saisir une semaine</div>
        <div id="m6-fh-sheet-body"></div>
      </div>
    </div>`;
  },

  _openSaisie(prefillWk) {
    if (!this._overlay) return;
    const currentWk = prefillWk || M6_ForfaitHeures.isoWeek(new Date());
    const entry = this._data[currentWk] || {};

    this._container.querySelector('#m6-fh-sheet-title').textContent = `Semaine ${currentWk.replace('-W','·S')}`;
    this._container.querySelector('#m6-fh-sheet-body').innerHTML = `
      <div class="m6-field">
        <label>Numéro de semaine ISO</label>
        <input type="week" id="m6-fh-wk" value="${currentWk}">
      </div>
      <div class="m6-field">
        <label>Heures travaillées (décimal — ex: 39.5)</label>
        <input type="number" id="m6-fh-h" min="0" max="80" step="0.25"
          value="${entry.heures||''}" placeholder="${this._contract?.seuilHebdo||39}">
      </div>
      <div class="m6-field">
        <label>Note optionnelle</label>
        <input type="text" id="m6-fh-note" value="${entry.note||''}" placeholder="ex : déplacement, astreinte…">
      </div>
      <button class="m6-btn m6-btn-primary" id="m6-fh-save">Enregistrer</button>
      <div style="height:8px"></div>
      <button class="m6-btn m6-btn-ghost" id="m6-fh-cancel" style="width:100%">Annuler</button>
    `;

    this._container.querySelector('#m6-fh-save').addEventListener('click', () => {
      const wk = this._container.querySelector('#m6-fh-wk')?.value;
      const h  = parseFloat(this._container.querySelector('#m6-fh-h')?.value);
      const note = this._container.querySelector('#m6-fh-note')?.value.trim();
      if (!wk || isNaN(h)) { M6_toast('Remplissez semaine et heures'); return; }
      this._data[wk] = { heures: h, note };
      this._saveData();
      this._closeOverlay();
      this.render();
      M6_toast('✓ Semaine enregistrée');
    });
    this._container.querySelector('#m6-fh-cancel').addEventListener('click', () => this._closeOverlay());
    this._overlay.addEventListener('click', (e) => { if (e.target === this._overlay) this._closeOverlay(); });

    requestAnimationFrame(() => this._overlay.classList.add('open'));
  },

  _closeOverlay() {
    this._overlay?.classList.remove('open');
  },

  // ── Bind content ─────────────────────────────────────────────
  _bindContent(analysis) {
    const btnSaisir = this._container.querySelector('#m6-fh-saisir');
    if (btnSaisir) btnSaisir.addEventListener('click', () => this._openSaisie());

    const btnSaveTaux = this._container.querySelector('#m6-fh-save-taux');
    if (btnSaveTaux) btnSaveTaux.addEventListener('click', () => {
      const taux  = parseFloat(this._container.querySelector('#m6-fh-taux')?.value) || 0;
      const taux1 = parseInt(this._container.querySelector('#m6-fh-taux1')?.value) || 25;
      const taux2 = parseInt(this._container.querySelector('#m6-fh-taux2')?.value) || 50;
      this._contract.tauxHoraire = taux;
      this._contract.taux1 = taux1;
      this._contract.taux2 = taux2;
      this._saveContract();
      this.render();
      M6_toast('✓ Taux mis à jour');
    });
  },

  // ── Setup ────────────────────────────────────────────────────
  _tplSetup() {
    return `
    <div style="padding:32px 20px;padding-top:calc(32px + env(safe-area-inset-top,0));min-height:100dvh;background:var(--ivoire)">
      <div class="m6-ornement" style="margin-top:0">
        <div class="m6-ornement-line"></div>
        <div class="m6-ornement-text">Configuration Forfait Heures</div>
        <div class="m6-ornement-line"></div>
      </div>
      <div class="m6-card">
        <div class="m6-card-body">
          <div class="m6-field">
            <label>Durée hebdomadaire contractuelle (heures)</label>
            <input type="number" id="fh-seuil" value="39" min="35" max="48" step="0.5" placeholder="39">
          </div>
          <div class="m6-field">
            <label>Palier majoration 1 — nombre d'heures (ex: 8h)</label>
            <input type="number" id="fh-palier" value="8" min="1" max="20" placeholder="8">
          </div>
          <div class="m6-field">
            <label>Taux majoration 1 (%)</label>
            <input type="number" id="fh-taux1" value="25" min="10" max="100">
          </div>
          <div class="m6-field">
            <label>Taux majoration 2 (%)</label>
            <input type="number" id="fh-taux2" value="50" min="25" max="200">
          </div>
          <div class="m6-field">
            <label>Contingent annuel HS (heures)</label>
            <input type="number" id="fh-contingent" value="220" min="100" max="500" placeholder="220">
          </div>
          <div class="m6-field">
            <label>Taux horaire brut (€) — optionnel</label>
            <input type="number" id="fh-tauxH" min="0" step="0.01" placeholder="ex : 25.50">
          </div>
          <button class="m6-btn m6-btn-gold" id="m6-fh-setup-save">Commencer le suivi →</button>
        </div>
      </div>
      <div style="height:16px"></div>
      <div class="m6-alert info">
        <span class="m6-alert-icon">ℹ️</span>
        <div>Votre CCN ou accord d'entreprise peut prévoir des seuils et taux différents du droit commun. Consultez votre contrat de travail.</div>
      </div>
    </div>`;
  },

  _bindSetup() {
    this._container.querySelector('#m6-fh-setup-save')?.addEventListener('click', () => {
      const seuil = parseFloat(this._container.querySelector('#fh-seuil')?.value) || 39;
      const palier = parseInt(this._container.querySelector('#fh-palier')?.value) || 8;
      const taux1 = parseInt(this._container.querySelector('#fh-taux1')?.value) || 25;
      const taux2 = parseInt(this._container.querySelector('#fh-taux2')?.value) || 50;
      const contingent = parseInt(this._container.querySelector('#fh-contingent')?.value) || 220;
      const tauxHoraire = parseFloat(this._container.querySelector('#fh-tauxH')?.value) || 0;
      this._contract = { seuilHebdo: seuil, palier1: palier, taux1, taux2, contingent, tauxHoraire };
      this._saveContract();
      this.render();
    });
  },

  // ── Helpers ──────────────────────────────────────────────────
  _formatH(h) {
    if (h === undefined || h === null || isNaN(h)) return '0h';
    const entier = Math.floor(h);
    const min    = Math.round((h - entier) * 60);
    return min > 0 ? `${entier}h${String(min).padStart(2,'0')}` : `${entier}h`;
  },

  deleteSemaine(wk) {
    delete this._data[wk];
    this._saveData();
    this.render();
    M6_toast('Semaine supprimée');
  }
};

global.VFH = VFH;
global.VFH_editContract = () => {
  localStorage.removeItem('M6_FH_CONTRACT');
  VFH._contract = null;
  VFH.render();
};
global.VFH_deleteSemaine = (wk) => VFH.deleteSemaine(wk);

})(window);
