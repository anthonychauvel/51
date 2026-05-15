/**
 * CHARTS M6 — Graphiques évolution temporelle
 * Canvas natif (sans dépendance externe)
 * Courbes : Fatigue · Stress · Récupération · Performance · Consommation forfait
 */
'use strict';

(function(global) {

const PALETTE = {
  fatigue:     '#B85C50',
  stress:      '#C4853A',
  recovery:    '#2D6A4F',
  performance: '#3730A3',
  forfait:     '#C4A35A',
  grid:        'rgba(26,23,20,0.08)',
  text:        '#8A847C',
  bg:          '#FFFFFF',
};

const M6_Charts = {

  /**
   * Graphique d'évolution mensuelle des scores bio (12 mois ou depuis le début).
   * Calcule les scores mois par mois en rejouant le moteur bio sur les données cumulées.
   *
   * @param {HTMLCanvasElement|string} canvas  — canvas DOM ou id
   * @param {object}  contract
   * @param {object}  data       — { "YYYY-MM-DD": {...} }
   * @param {object}  moods
   * @param {number}  year
   * @param {string[]} metrics   — ['fatigue','stress','recovery','performance']
   */
  drawBioEvolution(canvas, contract, data, moods, year, metrics = ['fatigue', 'stress', 'recovery', 'performance']) {
    const cv = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2); // plafonner à 2x pour perf mobile
    // Lire la largeur CSS réelle (getBoundingClientRect > offsetWidth sur mobile)
    const rect = cv.getBoundingClientRect();
    const W = Math.floor(rect.width || cv.parentElement?.getBoundingClientRect()?.width || 320);
    const H = cv.offsetHeight || 180;
    // Forcer les attributs de taille (sans ça le canvas déborde)
    cv.style.width  = '100%';
    cv.style.maxWidth = '100%';
    cv.style.height = H + 'px';
    cv.width  = W * DPR;
    cv.height = H * DPR;
    ctx.scale(DPR, DPR);

    // ── Calculer les scores par mois ──────────────────────────
    const monthScores = []; // [{mois, fatigue, stress, recovery, performance}]
    const monthNames  = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    // Trouver tous les mois qui ont au moins une saisie
    // (pas de limite à aujourd'hui : les saisies rétroactives doivent s'afficher)
    const moisAvecData = new Set();
    for (const dk of Object.keys(data)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dk)) {
        const mois = parseInt(dk.slice(5,7)) - 1;
        moisAvecData.add(mois);
      }
    }
    // Calculer aussi les mois intermédiaires (pour une courbe continue)
    const minMois = moisAvecData.size ? Math.min(...moisAvecData) : 0;
    const maxMois = moisAvecData.size ? Math.max(...moisAvecData) : 11;

    for (let m = minMois; m <= maxMois; m++) {
      // Données cumulées jusqu'à ce mois (inclut saisies rétroactives)
      const dataCumul = {};
      for (const [dk, v] of Object.entries(data)) {
        if (dk.startsWith(String(year))) {
          const mois = parseInt(dk.slice(5,7)) - 1;
          if (mois <= m) dataCumul[dk] = v;
        }
      }
      if (Object.keys(dataCumul).length === 0) continue;

      const bio = window.M6_BioEngine?.analyzeForfaitJours
        ? M6_BioEngine.analyzeForfaitJours(contract, dataCumul, year)
        : null;

      if (!bio?.hasData) continue;
      monthScores.push({
        mois: m, label: monthNames[m],
        fatigue:     bio.fatigue,
        stress:      bio.stress,
        recovery:    bio.recovery,
        performance: bio.performance,
        cvRisk:      bio.cvRisk,
        agingRisk:   bio.agingRisk,
      });
    }

    if (monthScores.length < 2) {
      this._drawNoData(ctx, W, H, 'Données insuffisantes\n(min. 2 mois)');
      return;
    }

    // ── Dessin ────────────────────────────────────────────────
    const PAD = { top: 16, right: 16, bottom: 32, left: 36 };
    const CW  = W - PAD.left - PAD.right;
    const CH  = H - PAD.top  - PAD.bottom;

    // Fond
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    // Grille horizontale (0, 25, 50, 75, 100)
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(val => {
      const y = PAD.top + CH * (1 - val / 100);
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + CW, y); ctx.stroke();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `${9 * DPR / DPR}px system-ui`;
      ctx.textAlign = 'right';
      ctx.fillText(val, PAD.left - 4, y + 3);
    });
    ctx.setLineDash([]);

    // Étiquettes mois
    ctx.fillStyle = PALETTE.text;
    ctx.font = `${9 * DPR / DPR}px system-ui`;
    ctx.textAlign = 'center';
    const step = CW / Math.max(1, monthScores.length - 1);
    monthScores.forEach((ms, i) => {
      const x = PAD.left + i * step;
      ctx.fillText(ms.label, x, H - 8);
    });

    // Courbes
    metrics.forEach(metric => {
      if (!PALETTE[metric]) return;
      ctx.strokeStyle = PALETTE[metric];
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      monthScores.forEach((ms, i) => {
        const x = PAD.left + i * step;
        const y = PAD.top + CH * (1 - (ms[metric] || 0) / 100);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Points
      monthScores.forEach((ms, i) => {
        const x = PAD.left + i * step;
        const y = PAD.top + CH * (1 - (ms[metric] || 0) / 100);
        ctx.fillStyle = PALETTE[metric];
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      });
    });
  },

  /**
   * Graphique consommation du forfait jours (barre mensuelle vs courbe cumulative).
   */
  drawForfaitEvolution(canvas, data, analysis, year) {
    const cv = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    const W = Math.floor(rect.width || cv.parentElement?.getBoundingClientRect()?.width || 320);
    const H = cv.offsetHeight || 150;
    cv.style.width  = '100%';
    cv.style.maxWidth = '100%';
    cv.style.height = H + 'px';
    cv.width  = W * DPR;
    cv.height = H * DPR;
    ctx.scale(DPR, DPR);

    const monthNames = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    const plafond    = analysis?.plafond || 218;
    const today      = new Date();
    const maxMois    = today.getFullYear() === year ? today.getMonth() : 11;

    // Compter les jours par mois
    const parMois = Array(12).fill(0);
    for (const [dk, v] of Object.entries(data)) {
      if (!dk.startsWith(String(year))) continue;
      const m = parseInt(dk.slice(5,7)) - 1;
      const t = v.type || 'travail';
      if (t === 'travail') parMois[m]++;
      else if (t === 'rachat') parMois[m]++;
      else if (t === 'demi') parMois[m] += 0.5;
    }

    // Cumulatif
    const cumul = [];
    let runningTotal = 0;
    for (let m = 0; m <= maxMois; m++) {
      runningTotal += parMois[m];
      cumul.push(runningTotal);
    }

    if (cumul.every(v => v === 0)) {
      this._drawNoData(ctx, W, H, 'Aucune donnée saisie');
      return;
    }

    const PAD = { top: 12, right: 12, bottom: 28, left: 32 };
    const CW  = W - PAD.left - PAD.right;
    const CH  = H - PAD.top  - PAD.bottom;
    const barW = Math.max(4, CW / 12 * 0.55);

    ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, W, H);

    // Axe Y — max = plafond
    ctx.setLineDash([2, 4]); ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
    [0, Math.round(plafond/4), Math.round(plafond/2), Math.round(plafond*3/4), plafond].forEach(val => {
      const y = PAD.top + CH * (1 - val / plafond);
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + CW, y); ctx.stroke();
      ctx.fillStyle = PALETTE.text; ctx.font = '9px system-ui'; ctx.textAlign = 'right';
      ctx.fillText(val, PAD.left - 3, y + 3);
    });
    ctx.setLineDash([]);

    // Barres mensuelles
    for (let m = 0; m <= maxMois; m++) {
      const x = PAD.left + (m / 11) * CW - barW / 2;
      const barH = CH * (parMois[m] / plafond);
      const y = PAD.top + CH - barH;
      const pct = cumul[m] / plafond;
      ctx.fillStyle = pct >= 1 ? '#9B2C2C' : pct >= 0.9 ? '#C4853A' : 'rgba(196,163,90,0.45)';
      ctx.beginPath();
      ctx.roundRect?.(x, y, barW, barH, [2, 2, 0, 0]) || ctx.rect(x, y, barW, barH);
      ctx.fill();

      ctx.fillStyle = PALETTE.text; ctx.font = '8px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(monthNames[m], PAD.left + (m / 11) * CW, H - 6);
    }

    // Ligne cumulative
    ctx.strokeStyle = PALETTE.forfait; ctx.lineWidth = 2;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let m = 0; m <= maxMois; m++) {
      const x = PAD.left + (m / 11) * CW;
      const y = PAD.top + CH * (1 - cumul[m] / plafond);
      m === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Ligne plafond
    ctx.strokeStyle = '#9B2C2C'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    const yPlafond = PAD.top;
    ctx.beginPath(); ctx.moveTo(PAD.left, yPlafond); ctx.lineTo(PAD.left + CW, yPlafond); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#9B2C2C'; ctx.font = '8px system-ui'; ctx.textAlign = 'right';
    ctx.fillText(`${plafond}j`, PAD.left - 3, yPlafond + 3);
  },

  /**
   * Mini-graphique radar des 4 scores (Fatigue/Stress/Recovery/Performance).
   * Rendu dans un carré H×H.
   */
  drawRadar(canvas, bio) {
    const cv = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    if (!cv || !bio?.hasData) return;
    const ctx = cv.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    const S   = Math.min(cv.offsetWidth, cv.offsetHeight) || 160;
    cv.width = S * DPR; cv.height = S * DPR;
    ctx.scale(DPR, DPR);

    const cx = S / 2, cy = S / 2;
    const R  = S / 2 - 20;

    const metrics = [
      { key: 'performance', label: 'Perf',    angle: -Math.PI/2,          val: bio.performance || 0 },
      { key: 'recovery',    label: 'Récup',   angle: -Math.PI/2 + Math.PI*2/4, val: bio.recovery || 0 },
      { key: 'stress',      label: 'Stress',  angle: -Math.PI/2 + Math.PI*4/4, invert: true, val: 100 - (bio.stress || 0) },
      { key: 'fatigue',     label: 'Fatigue', angle: -Math.PI/2 + Math.PI*6/4, invert: true, val: 100 - (bio.fatigue || 0) },
    ];

    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S);

    // Toiles
    [25,50,75,100].forEach(ring => {
      ctx.beginPath();
      metrics.forEach((m, i) => {
        const r = R * ring / 100;
        const x = cx + r * Math.cos(m.angle);
        const y = cy + r * Math.sin(m.angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1; ctx.stroke();
    });

    // Axes
    ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
    metrics.forEach(m => {
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(m.angle), cy + R * Math.sin(m.angle));
      ctx.stroke();
    });

    // Polygone données
    ctx.beginPath();
    metrics.forEach((m, i) => {
      const r = R * m.val / 100;
      const x = cx + r * Math.cos(m.angle);
      const y = cy + r * Math.sin(m.angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(196,163,90,0.18)'; ctx.fill();
    ctx.strokeStyle = PALETTE.forfait; ctx.lineWidth = 2; ctx.stroke();

    // Points + labels
    metrics.forEach(m => {
      const r = R * m.val / 100;
      ctx.fillStyle = PALETTE[m.key] || PALETTE.forfait;
      ctx.beginPath(); ctx.arc(cx + r * Math.cos(m.angle), cy + r * Math.sin(m.angle), 4, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = PALETTE.text; ctx.font = `${9*DPR/DPR}px system-ui`; ctx.textAlign = 'center';
      const lx = cx + (R + 13) * Math.cos(m.angle);
      const ly = cy + (R + 13) * Math.sin(m.angle) + 3;
      ctx.fillText(m.label, lx, ly);
    });
  },

  /** Message "pas de données" */
  _drawNoData(ctx, W, H, msg) {
    ctx.fillStyle = '#F7F3ED'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#BDB5A8'; ctx.font = '12px system-ui'; ctx.textAlign = 'center';
    const lines = msg.split('\n');
    lines.forEach((l, i) => ctx.fillText(l, W/2, H/2 - (lines.length-1)*8 + i*16));
  },

  /**
   * Génère la section HTML complète avec canvases.
   * À injecter dans la vue Santé ou Bilan.
   */
  renderSection(analysis, bio, data, contract, year) {
    return `
    <div style="width:100%;box-sizing:border-box;overflow-x:hidden">
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Évolution &amp; Tendances</div><div class="m6-ornement-line"></div></div>

    <div class="m6-card" style="margin-bottom:14px;overflow:hidden">
      <div class="m6-card-header"><div class="m6-card-icon">🎯</div>
        <div><div class="m6-card-label">Score instantané</div><div class="m6-card-title">Tableau de bord</div></div></div>
      <div class="m6-card-body" style="display:flex;justify-content:center;overflow:hidden">
        <canvas id="m6-radar" style="width:180px;height:180px;max-width:100%"></canvas>
      </div>
    </div>

    <div class="m6-card" style="margin-bottom:14px;overflow:hidden">
      <div class="m6-card-header"><div class="m6-card-icon">📈</div>
        <div><div class="m6-card-label">Tendances biologiques</div><div class="m6-card-title">Évolution mensuelle ${year}</div></div></div>
      <div class="m6-card-body" style="overflow:hidden;padding:12px 8px">
        <div class="m6-legend" style="margin-bottom:10px;flex-wrap:wrap;gap:4px">
          ${[['Fatigue','fatigue'],['Stress','stress'],['Récup.','recovery'],['Perf.','performance']].map(([l,k])=>`<div class="m6-legend-item"><div class="m6-legend-dot" style="background:${PALETTE[k]}"></div>${l}</div>`).join('')}
        </div>
        <div style="width:100%;max-width:100%;overflow:hidden">
          <canvas id="m6-bio-chart" style="width:100%;height:180px;display:block;max-width:100%;box-sizing:border-box"></canvas>
        </div>
        <div style="font-size:0.68rem;color:var(--pierre);margin-top:6px;text-align:center">Scores recalculés mois par mois</div>
      </div>
    </div>

    <div class="m6-card" style="margin-bottom:14px;overflow:hidden">
      <div class="m6-card-header"><div class="m6-card-icon">📊</div>
        <div><div class="m6-card-label">Consommation</div><div class="m6-card-title">Jours travaillés / mois</div></div></div>
      <div class="m6-card-body" style="overflow:hidden;padding:12px 8px">
        <div style="width:100%;max-width:100%;overflow:hidden">
          <canvas id="m6-forfait-chart" style="width:100%;height:150px;display:block;max-width:100%;box-sizing:border-box"></canvas>
        </div>
        <div class="m6-legend" style="margin-top:8px;flex-wrap:wrap;gap:4px">
          <div class="m6-legend-item"><div class="m6-legend-dot" style="background:rgba(196,163,90,0.45)"></div>Jours/mois</div>
          <div class="m6-legend-item"><div class="m6-legend-dot" style="background:${PALETTE.forfait}"></div>Cumulatif</div>
          <div class="m6-legend-item"><div class="m6-legend-dot" style="background:#9B2C2C"></div>Plafond (${analysis?.plafond||218}j)</div>
        </div>
      </div>
    </div>
    </div>`;
  },

  /**
   * renderPage — injection complète de la section Tendances dans un container.
   * Compatible mobile : canvas 100% width, overflow hidden, padding adapté.
   * @param {HTMLElement} container
   * @param {object}      contract
   * @param {object}      data
   * @param {number}      year
   */
  renderPage(container, contract, data, year) {
    if (!container) return;
    const analysis = window.M6_ForfaitJours?.analyze
      ? M6_ForfaitJours.analyze(contract, data, year)
      : (window.M6_ForfaitHeures?.analyze ? M6_ForfaitHeures.analyze(contract, data, year) : null);
    const bio = window.M6_BioEngine?.analyzeForfaitJours
      ? M6_BioEngine.analyzeForfaitJours(contract, data, year)
      : null;

    // HTML responsive — box-sizing + overflow:hidden sur chaque card
    container.style.cssText = (container.style.cssText||'') + ';box-sizing:border-box;overflow-x:hidden;width:100%';
    container.innerHTML = this.renderSection(analysis, bio, data, contract, year);

    // Forcer tous les canvases à prendre la largeur du container parent
    // en attendant que le RAF recalcule les dims
    container.querySelectorAll('canvas').forEach(cv => {
      cv.style.maxWidth = '100%';
      cv.style.boxSizing = 'border-box';
    });

    // Laisser le layout se stabiliser avant de dessiner
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.drawRadar('m6-radar', bio);
        this.drawBioEvolution('m6-bio-chart', contract, data, {}, year,
          ['fatigue','stress','recovery','performance']);
        this.drawForfaitEvolution('m6-forfait-chart', data, analysis, year);
      });
    });
  },

  /** À appeler après que renderSection() soit dans le DOM */
  bindCharts(analysis, bio, data, contract, year) {
    requestAnimationFrame(() => {
      this.drawRadar('m6-radar', bio);
      this.drawBioEvolution('m6-bio-chart', contract, data, {}, year,
        ['fatigue','stress','recovery','performance']);
      this.drawForfaitEvolution('m6-forfait-chart', data, analysis, year);
    });
  }
};

global.M6_Charts = M6_Charts;

})(window);
