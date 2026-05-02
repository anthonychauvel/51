/**
 * VIEW-FORFAIT-JOURS — Vue principale Forfait Jours (218j/an)
 * Sections : Dashboard · Calendrier · Alertes · Simulation rachat
 */
'use strict';

(function(global) {

const VFJ = {

  // ── État interne ──────────────────────────────────────────────
  _contract: null,
  _data: {},
  _year: new Date().getFullYear(),
  _section: 'dashboard',
  _overlay: null,
  _pendingDate: null,

  // ── Init ──────────────────────────────────────────────────────
  init(container) {
    this._container = container;
    this._loadState();
    this.render();
    this._bindOverlay();
  },

  _loadState() {
    try {
      this._contract = JSON.parse(localStorage.getItem('M6_FJ_CONTRACT') || 'null');
      this._data     = JSON.parse(localStorage.getItem(`M6_FJ_DATA_${this._year}`) || '{}');
    } catch { this._contract = null; this._data = {}; }
  },

  _saveData() {
    localStorage.setItem(`M6_FJ_DATA_${this._year}`, JSON.stringify(this._data));
  },
  _saveContract() {
    localStorage.setItem('M6_FJ_CONTRACT', JSON.stringify(this._contract));
  },

  // ── Render principal ──────────────────────────────────────────
  render() {
    if (!this._contract) {
      this._container.innerHTML = this._tplSetup();
      this._bindSetup();
      return;
    }

    const analysis = M6_ForfaitJours.analyze(this._contract, this._data, this._year);

    this._container.innerHTML = `
      ${this._tplNav()}
      <div class="m6-main m6-fade-in" id="m6-fj-content">
        ${this._section === 'dashboard' ? this._tplDashboard(analysis) : ''}
        ${this._section === 'calendrier' ? this._tplCalendrier() : ''}
        ${this._section === 'alertes'    ? this._tplAlertes(analysis) : ''}
        ${this._section === 'simulation' ? this._tplSimulation(analysis) : ''}
      </div>
      ${this._tplOverlay()}
    `;

    this._overlay = this._container.querySelector('#m6-fj-overlay');
    this._bindNav();
    this._bindContent(analysis);
  },

  // ── Nav ───────────────────────────────────────────────────────
  _tplNav() {
    const tabs = [
      { id: 'dashboard', icon: '◈', label: 'Bilan' },
      { id: 'calendrier', icon: '◻', label: 'Calendrier' },
      { id: 'alertes',    icon: '◉', label: 'Alertes' },
      { id: 'simulation', icon: '◆', label: 'Simulation' },
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
    const moisCourant = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return `
    <div class="m6-config-summary" onclick="VFJ_editContract()">
      <span>📋 ${cfg.plafond||218}j · ${cfg.joursCPContrat||25}j CP</span>
      ${cfg.ccnLabel ? `<span style="color:var(--pierre)">· ${cfg.ccnLabel}</span>` : ''}
      <span class="m6-config-edit">Modifier ✎</span>
    </div>

    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Forfait ${cfg.plafond||218} jours — ${this._year}</div>
      <div class="m6-ornement-line"></div>
    </div>

    <!-- Jauge principale -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-body">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <div>
            <div class="m6-metric">
              <span class="m6-metric-val">${a.joursEffectifs}</span>
              <span class="m6-metric-unit">/ ${a.plafond} jours</span>
            </div>
            <div class="m6-metric-label">Jours travaillés (dont ${a.rachetes} rachetés)</div>
          </div>
          <span class="m6-badge ${pct>=100?'m6-badge-danger':pct>=90?'m6-badge-champagne':'m6-badge-ok'}">${pct}%</span>
        </div>
        <div class="m6-progress-wrap">
          <div class="m6-progress-bar ${barClass}" style="width:${Math.min(pct,100)}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--pierre);margin-top:4px">
          <span>0 jour</span>
          <span style="color:${pct>=100?'var(--alerte)':'var(--pierre)'}">Plafond ${a.plafond}j</span>
        </div>
      </div>
    </div>

    <!-- Stats RTT -->
    <div class="m6-stats-grid" style="margin-bottom:14px">
      <div class="m6-stat-box">
        <div class="m6-stat-val">${a.rttTheoriques}</div>
        <div class="m6-stat-label">RTT théoriques ${this._year}</div>
      </div>
      <div class="m6-stat-box" style="border-color:${a.rttSolde < 0 ? 'var(--alerte)' : 'rgba(196,163,90,0.35)'}">
        <div class="m6-stat-val" style="color:${a.rttSolde < 0 ? 'var(--alerte)' : 'var(--champagne-2)'}">
          ${a.rttSolde >= 0 ? '+' : ''}${a.rttSolde}
        </div>
        <div class="m6-stat-label">Solde RTT</div>
      </div>
      <div class="m6-stat-box">
        <div class="m6-stat-val">${a.rttPris}</div>
        <div class="m6-stat-label">RTT pris</div>
      </div>
      <div class="m6-stat-box">
        <div class="m6-stat-val">${a.feriesOuvres}</div>
        <div class="m6-stat-label">Fériés ouvrés</div>
      </div>
    </div>

    <!-- Détail jours -->
    <div class="m6-card">
      <div class="m6-card-header">
        <div class="m6-card-icon">📊</div>
        <div><div class="m6-card-label">Répartition</div><div class="m6-card-title">Détail de l'année</div></div>
      </div>
      <div class="m6-card-body">
        ${[
          ['Jours travaillés', a.joursEffectifs, a.rachetes > 0 ? `(dont ${a.rachetes} rachetés)` : ''],
          ['RTT pris', a.rttPris, ''],
          ['Congés payés pris', a.cpPris, `/ ${this._contract.joursCPContrat||25}j contractuels`],
          ['Jours de repos', a.reposPris, ''],
        ].map(([l, v, hint]) => `
          <div class="m6-row">
            <span class="m6-row-label">${l}</span>
            <span class="m6-row-val">${v} <small style="color:var(--pierre);font-weight:400">${hint}</small></span>
          </div>`).join('')}
      </div>
    </div>

    <!-- Alertes résumées -->
    ${a.alertes.length ? `
    <div class="m6-card">
      <div class="m6-card-header">
        <div class="m6-card-icon">⚠️</div>
        <div><div class="m6-card-label">Vigilance</div><div class="m6-card-title">${a.alertes.length} point${a.alertes.length>1?'s':''} à surveiller</div></div>
      </div>
      <div class="m6-card-body" style="padding-bottom:8px">
        ${a.alertes.map(al => `
          <div class="m6-alert ${al.niveau}" style="margin-bottom:8px">
            <span class="m6-alert-icon">${al.icon}</span>
            <div><strong>${al.titre}</strong><br><span style="font-size:0.77rem">${al.texte}</span></div>
          </div>`).join('')}
      </div>
    </div>` : `
    <div class="m6-alert success" style="margin-bottom:14px">
      <span class="m6-alert-icon">✅</span>
      <div><strong>Situation conforme</strong><br>Aucun dépassement ou alerte détecté pour ${this._year}.</div>
    </div>`}

    <!-- CTA saisie -->
    <button class="m6-btn m6-btn-primary" id="m6-fj-saisir">
      ＋ Saisir un jour
    </button>
    <div style="height:8px"></div>
    <button class="m6-btn m6-btn-ghost" onclick="VFJ_editContract()" style="width:100%">
      ⚙️ Modifier mon contrat
    </button>
    `;
  },

  // ── Calendrier ───────────────────────────────────────────────
  _tplCalendrier() {
    const mois = [];
    for (let m = 0; m < 12; m++) {
      mois.push(this._buildMois(this._year, m));
    }

    // Sélecteur de mois courant visible
    const moisCourant = new Date().getMonth();

    return `
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Calendrier ${this._year}</div>
      <div class="m6-ornement-line"></div>
    </div>

    <div class="m6-legend" style="margin-bottom:16px">
      <div class="m6-legend-item"><div class="m6-legend-dot" style="background:var(--charbon-2)"></div>Travail</div>
      <div class="m6-legend-item"><div class="m6-legend-dot" style="background:var(--champagne)"></div>RTT</div>
      <div class="m6-legend-item"><div class="m6-legend-dot" style="background:var(--succes)"></div>CP</div>
      <div class="m6-legend-item"><div class="m6-legend-dot" style="background:#3730A3"></div>Férié</div>
      <div class="m6-legend-item"><div class="m6-legend-dot" style="background:var(--pierre-2)"></div>Repos</div>
      <div class="m6-legend-item"><div class="m6-legend-dot" style="background:var(--alerte)"></div>Rachat</div>
    </div>

    ${mois.map((m, idx) => `
    <div class="m6-card" style="margin-bottom:12px">
      <div class="m6-card-header">
        <div style="flex:1">
          <div class="m6-card-label">${this._year}</div>
          <div class="m6-card-title">${m.label}</div>
        </div>
        <span class="m6-badge m6-badge-neutral">${m.travailles}j travaillés</span>
      </div>
      <div class="m6-card-body" style="padding:12px">
        <div class="m6-cal-grid">
          ${['L','M','M','J','V','S','D'].map(d=>`<div class="m6-cal-head">${d}</div>`).join('')}
          ${m.cells}
        </div>
      </div>
    </div>`).join('')}
    `;
  },

  _buildMois(year, mois) {
    const labels = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const feries = M6_Feries.getSet(year);
    const today  = new Date().toISOString().slice(0,10);

    const premier = new Date(year, mois, 1);
    // Lundi = 0, Dimanche = 6
    let dow = premier.getDay(); // 0=dim
    dow = dow === 0 ? 6 : dow - 1; // convertir en lundi=0

    const nbJours = new Date(year, mois + 1, 0).getDate();
    let cells = '';
    let travailles = 0;

    // Cases vides avant le 1er
    for (let i = 0; i < dow; i++) cells += `<div class="m6-cal-cell empty"></div>`;

    for (let j = 1; j <= nbJours; j++) {
      const dk = `${year}-${String(mois+1).padStart(2,'0')}-${String(j).padStart(2,'0')}`;
      const d  = new Date(year, mois, j);
      const dow2 = d.getDay();
      const isWE = dow2 === 0 || dow2 === 6;
      const isFerie = feries.has(dk);
      const entry = this._data[dk];
      let type = entry?.type;

      // WE/fériés sans saisie → repos / ferie implicite
      if (!type) {
        if (isFerie) type = 'ferie';
        else if (isWE) type = 'repos';
      }

      if (type === 'travail' || type === 'rachat') travailles++;

      const isToday = dk === today;

      cells += `<div class="m6-cal-cell${isToday?' today':''}" 
        data-type="${type||'restant'}" 
        data-dk="${dk}" 
        title="${this._typeLabel(type)}"
        onclick="VFJ_openSaisie('${dk}')"></div>`;
    }

    return { label: labels[mois], cells, travailles };
  },

  // ── Alertes ─────────────────────────────────────────────────
  _tplAlertes(a) {
    return `
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Points de vigilance</div>
      <div class="m6-ornement-line"></div>
    </div>

    ${a.alertes.length === 0 ? `
    <div class="m6-alert success">
      <span class="m6-alert-icon">✅</span>
      <div><strong>Aucune alerte pour ${this._year}</strong><br>
      Votre forfait jours est conforme aux dispositions légales.</div>
    </div>` : a.alertes.map(al => `
    <div class="m6-card" style="margin-bottom:12px">
      <div class="m6-card-body">
        <div class="m6-alert ${al.niveau}" style="margin-bottom:0">
          <span class="m6-alert-icon">${al.icon}</span>
          <div>
            <strong>${al.titre}</strong><br>
            <span style="font-size:0.78rem;line-height:1.5">${al.texte}</span>
            <br><span style="font-size:0.68rem;color:var(--pierre);margin-top:4px;display:block">Réf. Art. ${al.loi} Code du travail</span>
          </div>
        </div>
      </div>
    </div>`).join('')}

    <div class="m6-divider"></div>

    <!-- Rappels légaux permanents -->
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Rappels légaux</div>
      <div class="m6-ornement-line"></div>
    </div>

    <div class="m6-card">
      <div class="m6-card-body">
        ${[
          ['L3121-59', 'Rachat de jours', 'Au-delà du plafond, un avenant écrit est obligatoire avec majoration ≥ 10%.'],
          ['L3121-65', 'Entretien annuel', 'Votre employeur doit organiser au minimum un entretien/an sur votre charge de travail et équilibre vie pro/perso.'],
          ['L3131-1',  'Repos quotidien', 'Vous bénéficiez d\'un repos quotidien minimum de 11h consécutives.'],
          ['L3132-2',  'Repos hebdomadaire', 'Vous bénéficiez d\'un repos hebdomadaire de 35h consécutives minimum.'],
          ['L3121-62', 'Droit à la déconnexion', 'Votre CCN ou accord d\'entreprise doit prévoir des modalités de droit à la déconnexion.'],
        ].map(([loi, titre, texte]) => `
          <div class="m6-row" style="align-items:flex-start;padding:10px 0">
            <div>
              <div style="font-size:0.75rem;font-weight:500;color:var(--charbon);margin-bottom:2px">${titre}</div>
              <div style="font-size:0.72rem;color:var(--pierre);line-height:1.5">${texte}</div>
            </div>
            <span class="m6-badge m6-badge-neutral" style="margin-left:8px;flex-shrink:0">${loi}</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- Entretien annuel -->
    <div class="m6-card">
      <div class="m6-card-header">
        <div class="m6-card-icon">🗓️</div>
        <div><div class="m6-card-label">Suivi</div><div class="m6-card-title">Entretien annuel</div></div>
      </div>
      <div class="m6-card-body">
        <div class="m6-row">
          <span class="m6-row-label">Dernier entretien</span>
          <span class="m6-row-val">${a.entretienDate
            ? new Date(a.entretienDate).toLocaleDateString('fr-FR')
            : '<span style="color:var(--pierre)">Non renseigné</span>'}</span>
        </div>
        <div style="margin-top:10px">
          <button class="m6-btn m6-btn-ghost" id="m6-fj-entretien" style="width:100%;font-size:0.8rem">
            📝 Renseigner la date de l'entretien
          </button>
        </div>
      </div>
    </div>
    `;
  },

  // ── Simulation rachat ────────────────────────────────────────
  _tplSimulation(a) {
    const sr = a.simulRachat;
    const plafond = this._contract?.plafond || 218;

    return `
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Simulation — Rachat de jours</div>
      <div class="m6-ornement-line"></div>
    </div>

    <div class="m6-alert info" style="margin-bottom:16px">
      <span class="m6-alert-icon">ℹ️</span>
      <div>Le rachat de jours au-delà du plafond est soumis à un <strong>avenant écrit</strong> et une majoration <strong>≥ 10%</strong> (L3121-59). Saisissez vos paramètres ci-dessous.</div>
    </div>

    <div class="m6-card">
      <div class="m6-card-body">
        <div class="m6-field">
          <label>Taux journalier brut (€)</label>
          <input type="number" id="m6-sim-taux" min="0" step="10"
            value="${this._contract.tauxJournalier||''}" placeholder="ex : 350">
        </div>
        <div class="m6-field">
          <label>Taux de majoration rachat (%)</label>
          <input type="number" id="m6-sim-majoration" min="10" max="100" step="5"
            value="${this._contract.tauxMajorationRachat||10}" placeholder="10">
        </div>
        <div class="m6-field">
          <label>Jours à racheter</label>
          <input type="number" id="m6-sim-jours" min="1" max="50"
            value="${Math.max(1, a.joursEffectifs - plafond)||1}" placeholder="1">
        </div>
        <button class="m6-btn m6-btn-gold" id="m6-sim-calc">Calculer le rachat</button>
      </div>
    </div>

    <div id="m6-sim-result" style="display:none">
      <div class="m6-card" style="margin-top:14px">
        <div class="m6-card-header">
          <div class="m6-card-icon">💰</div>
          <div><div class="m6-card-label">Résultat</div><div class="m6-card-title">Simulation rachat</div></div>
        </div>
        <div class="m6-card-body" id="m6-sim-detail"></div>
      </div>
    </div>

    <div class="m6-divider"></div>

    <!-- Simulation RTT annuels -->
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Simulation RTT — Autre année</div>
      <div class="m6-ornement-line"></div>
    </div>

    <div class="m6-card">
      <div class="m6-card-body">
        <div class="m6-field">
          <label>Année à simuler</label>
          <select id="m6-sim-year">
            ${[this._year-1, this._year, this._year+1].map(y =>
              `<option value="${y}" ${y===this._year?'selected':''}>${y}</option>`
            ).join('')}
          </select>
        </div>
        <div class="m6-field">
          <label>Forfait jours (plafond)</label>
          <input type="number" id="m6-sim-plafond" value="${plafond}" min="150" max="235">
        </div>
        <button class="m6-btn m6-btn-primary" id="m6-sim-rtt">Simuler les RTT</button>
        <div id="m6-rtt-result" style="margin-top:14px"></div>
      </div>
    </div>
    `;
  },

  // ── Overlay saisie ────────────────────────────────────────────
  _tplOverlay() {
    return `
    <div class="m6-overlay" id="m6-fj-overlay">
      <div class="m6-sheet">
        <div class="m6-sheet-title" id="m6-fj-sheet-title">Saisir un jour</div>
        <div id="m6-fj-sheet-body"></div>
      </div>
    </div>`;
  },

  _bindOverlay() {},

  _openSaisie(dk) {
    if (!this._overlay) return;
    const d = new Date(dk + 'T12:00:00');
    const label = d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    const entry = this._data[dk] || {};
    const current = entry.type || '';

    this._container.querySelector('#m6-fj-sheet-title').textContent = label;
    this._container.querySelector('#m6-fj-sheet-body').innerHTML = `
      <div class="m6-type-grid">
        ${[
          { type:'travail', icon:'💼', label:'Travail' },
          { type:'rtt',     icon:'🌿', label:'RTT' },
          { type:'cp',      icon:'✈️',  label:'Congé' },
          { type:'ferie',   icon:'🎉', label:'Férié' },
          { type:'repos',   icon:'😴', label:'Repos' },
          { type:'rachat',  icon:'💰', label:'Rachat' },
        ].map(t => `
          <div class="m6-type-pill ${current===t.type?`selected-${t.type}`:''}"
               data-type="${t.type}">
            <span class="pill-icon">${t.icon}</span>${t.label}
          </div>`).join('')}
      </div>
      ${current === '' ? '' : `<button class="m6-btn m6-btn-ghost" id="m6-fj-del" style="width:100%;margin-bottom:10px;font-size:0.8rem">🗑️ Effacer ce jour</button>`}
      <button class="m6-btn m6-btn-primary" id="m6-fj-save">Enregistrer</button>
      <div style="height:8px"></div>
      <button class="m6-btn m6-btn-ghost" id="m6-fj-cancel" style="width:100%;font-size:0.8rem">Annuler</button>
    `;

    this._pendingDate = dk;
    this._pendingType = current;

    // Pills
    this._container.querySelectorAll('.m6-type-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this._container.querySelectorAll('.m6-type-pill').forEach(p => {
          p.className = 'm6-type-pill';
        });
        pill.className = `m6-type-pill selected-${pill.dataset.type}`;
        this._pendingType = pill.dataset.type;
      });
    });

    const del = this._container.querySelector('#m6-fj-del');
    if (del) del.addEventListener('click', () => {
      delete this._data[this._pendingDate];
      this._saveData();
      this._closeOverlay();
      this.render();
      M6_toast('Jour effacé');
    });

    this._container.querySelector('#m6-fj-save').addEventListener('click', () => {
      if (!this._pendingType) { M6_toast('Sélectionnez un type'); return; }
      this._data[this._pendingDate] = { type: this._pendingType };
      this._saveData();
      this._closeOverlay();
      this.render();
      M6_toast('✓ Jour enregistré');
    });

    this._container.querySelector('#m6-fj-cancel').addEventListener('click', () => this._closeOverlay());
    this._overlay.addEventListener('click', (e) => { if (e.target === this._overlay) this._closeOverlay(); });

    requestAnimationFrame(() => this._overlay.classList.add('open'));
  },

  _closeOverlay() {
    if (this._overlay) {
      this._overlay.classList.remove('open');
    }
  },

  // ── Bind content ─────────────────────────────────────────────
  _bindContent(analysis) {
    // Bouton saisir
    const btnSaisir = this._container.querySelector('#m6-fj-saisir');
    if (btnSaisir) btnSaisir.addEventListener('click', () => {
      const today = new Date().toISOString().slice(0,10);
      this._openSaisie(today);
    });

    // Calendrier cells
    this._container.querySelectorAll('[data-dk]').forEach(cell => {
      cell.addEventListener('click', () => {
        this._openSaisie(cell.dataset.dk);
      });
    });

    // Entretien
    const btnEntretien = this._container.querySelector('#m6-fj-entretien');
    if (btnEntretien) btnEntretien.addEventListener('click', () => this._openEntretien());

    // Simulation rachat
    const btnCalc = this._container.querySelector('#m6-sim-calc');
    if (btnCalc) btnCalc.addEventListener('click', () => this._simCalc());

    const btnRTT = this._container.querySelector('#m6-sim-rtt');
    if (btnRTT) btnRTT.addEventListener('click', () => this._simRTT());
  },

  _simCalc() {
    const taux = parseFloat(this._container.querySelector('#m6-sim-taux')?.value) || 0;
    const maj  = parseFloat(this._container.querySelector('#m6-sim-majoration')?.value) || 10;
    const jours = parseInt(this._container.querySelector('#m6-sim-jours')?.value) || 0;
    if (!taux || !jours) { M6_toast('Remplissez tous les champs'); return; }
    const base    = jours * taux;
    const majoré  = base * (1 + maj / 100);
    const gain    = majoré - base;
    const result = this._container.querySelector('#m6-sim-result');
    const detail = this._container.querySelector('#m6-sim-detail');
    result.style.display = 'block';
    detail.innerHTML = `
      <div class="m6-row"><span class="m6-row-label">Jours rachetés</span><span class="m6-row-val">${jours}j</span></div>
      <div class="m6-row"><span class="m6-row-label">Taux journalier</span><span class="m6-row-val">${taux.toFixed(2)} €</span></div>
      <div class="m6-row"><span class="m6-row-label">Base brute</span><span class="m6-row-val">${base.toFixed(2)} €</span></div>
      <div class="m6-row"><span class="m6-row-label">Majoration ${maj}%</span><span class="m6-row-val gold">+ ${gain.toFixed(2)} €</span></div>
      <div class="m6-row" style="font-size:1rem">
        <span class="m6-row-label" style="font-weight:600">Total brut</span>
        <span class="m6-row-val gold" style="font-family:var(--font-display);font-size:1.3rem">${majoré.toFixed(2)} €</span>
      </div>
      <div style="margin-top:8px;font-size:0.7rem;color:var(--pierre)">* Montant brut avant cotisations sociales. Exonération d'impôt sur le revenu possible (Loi TEPA 2007).</div>
    `;
    // Sauvegarder taux journalier
    if (!this._contract) return;
    this._contract.tauxJournalier = taux;
    this._contract.tauxMajorationRachat = maj;
    this._saveContract();
  },

  _simRTT() {
    const year    = parseInt(this._container.querySelector('#m6-sim-year')?.value) || this._year;
    const plafond = parseInt(this._container.querySelector('#m6-sim-plafond')?.value) || 218;
    const r = M6_ForfaitJours.calcRTT(year, plafond, this._contract?.joursCPContrat || 25);
    const el = this._container.querySelector('#m6-rtt-result');
    if (!el) return;
    el.innerHTML = `
      <div class="m6-alert info">
        <span class="m6-alert-icon">📅</span>
        <div>
          <strong>${r.rttTheoriques} jours de RTT pour ${year}</strong><br>
          <span style="font-size:0.77rem">
            ${r.joursCalendaires}j − ${r.WE}WE − ${r.joursCPContrat}CP − ${r.feriesOuvres}fériés ouvrés − ${r.joursTravailMax}j forfait = <strong>${r.rttTheoriques} RTT</strong>
          </span>
        </div>
      </div>`;
  },

  _openEntretien() {
    if (!this._overlay) return;
    const title = this._container.querySelector('#m6-fj-sheet-title');
    const body  = this._container.querySelector('#m6-fj-sheet-body');
    if (title) title.textContent = 'Entretien annuel';
    if (body) body.innerHTML = `
      <div class="m6-alert info" style="margin-bottom:16px">
        <span class="m6-alert-icon">ℹ️</span>
        <div>L'entretien annuel de suivi de charge de travail est <strong>obligatoire</strong> pour les cadres au forfait jours (Art. L3121-65).</div>
      </div>
      <div class="m6-field">
        <label>Date du dernier entretien</label>
        <input type="date" id="m6-entretien-date" value="${this._contract?.entretienDate||''}">
      </div>
      <button class="m6-btn m6-btn-primary" id="m6-entretien-save">Enregistrer</button>
      <div style="height:8px"></div>
      <button class="m6-btn m6-btn-ghost" id="m6-entretien-cancel" style="width:100%">Annuler</button>
    `;
    this._container.querySelector('#m6-entretien-save')?.addEventListener('click', () => {
      const val = this._container.querySelector('#m6-entretien-date')?.value;
      if (!val) { M6_toast('Saisissez une date'); return; }
      if (!this._contract) return;
      this._contract.entretienDate = val;
      this._saveContract();
      this._closeOverlay();
      this.render();
      M6_toast('✓ Entretien enregistré');
    });
    this._container.querySelector('#m6-entretien-cancel')?.addEventListener('click', () => this._closeOverlay());
    requestAnimationFrame(() => this._overlay.classList.add('open'));
  },

  // ── Setup initial (config contrat) ────────────────────────────
  _tplSetup() {
    return `
    <div style="padding:32px 20px;padding-top:calc(32px + env(safe-area-inset-top,0));min-height:100dvh;background:var(--ivoire)">
      <div class="m6-ornement" style="margin-top:0">
        <div class="m6-ornement-line"></div>
        <div class="m6-ornement-text">Configuration Forfait Jours</div>
        <div class="m6-ornement-line"></div>
      </div>

      <div class="m6-card">
        <div class="m6-card-body">
          <div class="m6-field">
            <label>Plafond annuel de jours travaillés</label>
            <input type="number" id="s-plafond" value="218" min="100" max="235" placeholder="218">
          </div>
          <div class="m6-field">
            <label>Jours de congés payés contractuels</label>
            <input type="number" id="s-cp" value="25" min="25" max="35" placeholder="25">
          </div>
          <div class="m6-field">
            <label>Taux journalier brut (€) — optionnel</label>
            <input type="number" id="s-taux" min="0" step="10" placeholder="ex : 350">
          </div>
          <div class="m6-field">
            <label>CCN applicable — optionnel</label>
            <input type="text" id="s-ccn" placeholder="ex : Syntec, Banque AFB…">
          </div>
          <div class="m6-field">
            <label>Date de prise de poste — optionnel</label>
            <input type="date" id="s-debut">
          </div>
          <button class="m6-btn m6-btn-gold" id="m6-fj-setup-save">Commencer le suivi →</button>
        </div>
      </div>
      <div style="height:20px"></div>
      <div class="m6-alert info">
        <span class="m6-alert-icon">ℹ️</span>
        <div>Le plafond légal est de <strong>218 jours</strong> (art. L3121-64). Votre CCN ou accord d'entreprise peut prévoir un plafond inférieur.</div>
      </div>
    </div>`;
  },

  _bindSetup() {
    this._container.querySelector('#m6-fj-setup-save')?.addEventListener('click', () => {
      const plafond = parseInt(this._container.querySelector('#s-plafond')?.value) || 218;
      const cp      = parseInt(this._container.querySelector('#s-cp')?.value) || 25;
      const taux    = parseFloat(this._container.querySelector('#s-taux')?.value) || 0;
      const ccn     = this._container.querySelector('#s-ccn')?.value.trim();
      const debut   = this._container.querySelector('#s-debut')?.value;
      this._contract = { plafond, joursCPContrat: cp, tauxJournalier: taux, ccnLabel: ccn, dateDebut: debut };
      this._saveContract();
      this.render();
    });
  },

  // ── Helpers ──────────────────────────────────────────────────
  _typeLabel(type) {
    return { travail:'Travail', rtt:'RTT', cp:'Congé payé', ferie:'Jour férié', repos:'Repos', rachat:'Rachat' }[type] || '—';
  }
};

// ── Fonctions globales (appelées depuis HTML inline) ──────────────
global.VFJ = VFJ;
global.VFJ_openSaisie = (dk) => VFJ._openSaisie(dk);
global.VFJ_editContract = () => {
  VFJ._contract = null;
  VFJ._loadState();
  VFJ._contract = null;
  localStorage.removeItem('M6_FJ_CONTRACT');
  VFJ.render();
};

})(window);
