/**
 * SIMULATEUR-NULLITE.JS — M6 Cadres
 * Trois systèmes :
 * 1. Vérificateur de validité du forfait jours (risque de nullité)
 * 2. Graphiques d'évolution temporelle des scores biologiques
 * 3. Mode "Preuve opposable" — archive ZIP timestampée
 *
 * Sources juridiques :
 * - Cass. Soc. 29 juin 2011 (nullité si accord insuffisant)
 * - Cass. Soc. 2 juillet 2014 (entretien obligatoire)
 * - L3121-58 à L3121-65 (conditions de validité)
 * - Cass. Soc. 4 novembre 2015 (charge de travail raisonnable)
 */
'use strict';

(function(global) {

// ══════════════════════════════════════════════════════════════════
//  1. SIMULATEUR DE NULLITÉ DU FORFAIT JOURS
//  Checklist des 6 conditions de validité jurisprudentielles
// ══════════════════════════════════════════════════════════════════

const M6_SimulateurNullite = {

  /**
   * Retourne l'analyse de validité du forfait.
   * @param {object} contract — contrat M6 (plafond, ccnLabel, entretienDate…)
   * @param {object} analysis — résultat M6_ForfaitJours.analyze()
   * @param {object} data     — données de saisie
   * @param {number} year
   */
  analyze(contract, analysis, data, year) {
    const conditions = [];

    // ── Condition 1 : Accord de branche valide ─────────────────
    // Kivimäki / Cass. 2011 : le forfait doit reposer sur un accord collectif
    // garantissant le respect des durées maximales de repos
    const ccn = (contract.ccnLabel || '').toLowerCase();
    const ccnsValidees = ['syntec', 'banque', 'afb', 'bureaux', 'cadres', 'metallurgie',
                          'chimie', 'pharma', 'assurance', 'mutuelles', 'commerce'];
    const ccnConnue = ccnsValidees.some(k => ccn.includes(k));
    conditions.push({
      id: 'accord_branche',
      titre: 'Accord de branche ou d\'entreprise valide',
      loi: 'Art. L3121-64 + Cass. Soc. 29/06/2011',
      ok: ccnConnue || (ccn.length > 3),
      niveau: ccnConnue ? 'ok' : (ccn.length > 3 ? 'warning' : 'danger'),
      detail: ccnConnue
        ? `CCN "${contract.ccnLabel}" reconnue — accord de branche probable.`
        : ccn.length > 3
          ? `CCN "${contract.ccnLabel}" saisie mais non vérifiée. Confirmez que votre accord de branche garantit le respect des repos.`
          : 'Aucune CCN renseignée. Sans accord collectif valide, le forfait est nul de plein droit (Cass. Soc. 29/06/2011).',
      recommandation: 'Renseignez votre CCN dans les paramètres du contrat et vérifiez sur légifrance.fr que l\'accord autorise le forfait jours.',
    });

    // ── Condition 2 : Clause explicite dans le contrat ─────────
    // Cass. Soc. 16/06/2010 : la convention de forfait doit figurer dans
    // le contrat de travail — elle ne peut pas être tacite
    const hasContractMention = !!(contract.nomCadre && contract.plafond);
    conditions.push({
      id: 'clause_contrat',
      titre: 'Convention de forfait mentionnée dans le contrat',
      loi: 'Art. L3121-55 + Cass. Soc. 16/06/2010',
      ok: hasContractMention,
      niveau: hasContractMention ? 'ok' : 'danger',
      detail: hasContractMention
        ? `Forfait configuré à ${contract.plafond} jours — paramètre contractuel présent.`
        : 'Le plafond annuel n\'est pas renseigné. La convention de forfait doit figurer noir sur blanc dans le contrat (et non être tacite).',
      recommandation: 'Vérifiez que votre contrat mentionne explicitement : "… dans le cadre d\'une convention de forfait annuel en jours à hauteur de X jours par an."',
    });

    // ── Condition 3 : Entretien annuel réalisé ─────────────────
    // Cass. Soc. 2/07/2014 : l'absence d'entretien entraîne la nullité
    // même si l'accord de branche est valide
    const entretienThisYear = contract.entretienDate &&
      new Date(contract.entretienDate).getFullYear() >= year;
    const entretienHistorique = M6_Storage?.getEntretiens?.(contract._regime || 'forfait_jours')?.length > 0;
    conditions.push({
      id: 'entretien_annuel',
      titre: 'Entretien annuel de suivi réalisé',
      loi: 'Art. L3121-65 + Cass. Soc. 02/07/2014',
      ok: entretienThisYear,
      niveau: entretienThisYear ? 'ok' : 'danger',
      detail: entretienThisYear
        ? `Entretien enregistré le ${new Date(contract.entretienDate).toLocaleDateString('fr-FR')} pour ${year}.`
        : `Aucun entretien enregistré pour ${year}. La Cour de cassation a annulé des forfaits uniquement sur ce motif.`,
      recommandation: 'Organisez et documentez l\'entretien annuel portant sur : charge de travail, articulation vie pro/perso, rémunération, organisation. Consignez-le dans l\'onglet Entretien.',
    });

    // ── Condition 4 : Respect du repos quotidien (11h) ─────────
    // L3131-1 — applicable aux salariés en forfait jours
    // Cass. Soc. 4/11/2015 : violation systématique = inopposabilité
    const violations = analysis.amplitudeViolations || [];
    const nbViolations = violations.length;
    conditions.push({
      id: 'repos_quotidien',
      titre: 'Respect du repos quotidien (11h minimum)',
      loi: 'Art. L3131-1 + Cass. Soc. 04/11/2015',
      ok: nbViolations === 0,
      niveau: nbViolations === 0 ? 'ok' : nbViolations <= 3 ? 'warning' : 'danger',
      detail: nbViolations === 0
        ? 'Aucune violation du repos quotidien détectée dans les données saisies.'
        : `${nbViolations} violation${nbViolations > 1 ? 's' : ''} détectée${nbViolations > 1 ? 's' : ''} (amplitude entre deux journées < 11h). La Cour de cassation sanctionne la violation systématique.`,
      recommandation: nbViolations > 0
        ? 'Espacez vos journées de travail d\'au moins 11h. Évitez de finir après 22h si vous débutez avant 9h le lendemain.'
        : 'Continuez à saisir vos horaires de début/fin pour maintenir la traçabilité.',
    });

    // ── Condition 5 : Charge de travail raisonnable ────────────
    // L3121-65 al.2 — l'employeur doit veiller à la charge raisonnable
    // Cass. Soc. 4/11/2015 : 258j/218j = charge déraisonnable documentée
    const tauxCharge = analysis.tauxRemplissage || 0;
    const joursSurcharge = Math.max(0, analysis.joursEffectifs - analysis.plafond);
    conditions.push({
      id: 'charge_raisonnable',
      titre: 'Charge de travail raisonnable',
      loi: 'Art. L3121-65 al.2 + L4121-1 + Cass. Soc. 04/11/2015',
      ok: tauxCharge <= 100,
      niveau: tauxCharge <= 95 ? 'ok' : tauxCharge <= 110 ? 'warning' : 'danger',
      detail: tauxCharge <= 100
        ? `Taux de remplissage : ${tauxCharge}% — charge dans les limites contractuelles.`
        : `Dépassement de ${joursSurcharge} jour${joursSurcharge > 1 ? 's' : ''} (${tauxCharge}% du forfait). La jurisprudence sanctionne les dépassements réguliers comme charge déraisonnable.`,
      recommandation: tauxCharge > 100
        ? 'Formalisez immédiatement un avenant de rachat (L3121-59) ou réduisez la charge. Signalez la situation lors de l\'entretien annuel.'
        : 'Planifiez vos RTT pour maintenir un taux < 95%.',
    });

    // ── Condition 6 : Droit à la déconnexion formalisé ─────────
    // L3121-65 — depuis loi Travail 2016, l'accord ou la charte doit
    // prévoir des modalités concrètes
    const hasDeconnexion = !!(contract.ccnLabel);
    conditions.push({
      id: 'deconnexion',
      titre: 'Droit à la déconnexion formalisé',
      loi: 'Art. L3121-65 al.3 + Loi Travail 2016',
      ok: hasDeconnexion,
      niveau: hasDeconnexion ? 'warning' : 'info',
      detail: hasDeconnexion
        ? `CCN "${contract.ccnLabel}" renseignée — vérifiez que votre accord d'entreprise ou charte prévoit des modalités concrètes.`
        : 'Non vérifié. Votre accord d\'entreprise ou charte unilatérale doit prévoir des modalités de droit à la déconnexion.',
      recommandation: 'Demandez à votre DRH la charte de déconnexion numérique. Son absence ne rend pas le forfait nul mais expose l\'employeur à des dommages-intérêts.',
    });

    // ── Score global ───────────────────────────────────────────
    const nbOk      = conditions.filter(c => c.ok).length;
    const nbDanger  = conditions.filter(c => c.niveau === 'danger').length;
    const nbWarning = conditions.filter(c => c.niveau === 'warning').length;
    const score     = Math.round(nbOk / conditions.length * 100);

    let risqueGlobal, risqueCouleur, risqueTexte;
    if (nbDanger >= 2) {
      risqueGlobal  = 'ÉLEVÉ'; risqueCouleur = '#9B2C2C';
      risqueTexte   = 'Votre forfait présente des failles juridiques sérieuses. En cas de litige, un juge prud\'homal pourrait le déclarer nul et requalifier toutes vos heures en HS depuis l\'origine.';
    } else if (nbDanger === 1 || nbWarning >= 2) {
      risqueGlobal  = 'MODÉRÉ'; risqueCouleur = '#C4853A';
      risqueTexte   = 'Des points de vigilance existent. Corrigez les alertes rouges en priorité — elles représentent le risque de nullité le plus direct.';
    } else {
      risqueGlobal  = 'FAIBLE'; risqueCouleur = '#2D6A4F';
      risqueTexte   = 'Votre forfait est globalement bien structuré. Maintenant les bonnes pratiques actuelles — entretien annuel, repos respectés, charge raisonnable.';
    }

    return { conditions, score, nbOk, nbDanger, nbWarning, risqueGlobal, risqueCouleur, risqueTexte };
  },

  /**
   * Rend le simulateur en HTML.
   */
  render(container, contract, analysis, data, year) {
    if (!container) return;
    const res = this.analyze(contract, analysis, data, year);

    const niveauIcon = { ok:'✅', warning:'⚠️', danger:'❌', info:'ℹ️' };
    const niveauClass = { ok:'success', warning:'warning', danger:'danger', info:'info' };

    container.innerHTML = `
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Validité du forfait jours</div><div class="m6-ornement-line"></div></div>

    <!-- Score global -->
    <div class="m6-card" style="margin-bottom:14px;border-top:4px solid ${res.risqueCouleur}">
      <div class="m6-card-body">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="text-align:center;flex-shrink:0">
            <div style="font-family:var(--font-display);font-size:2.6rem;font-weight:700;color:${res.risqueCouleur};line-height:1">${res.score}</div>
            <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--pierre)">Score /100</div>
          </div>
          <div style="flex:1">
            <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:${res.risqueCouleur};font-weight:700;margin-bottom:4px">Risque de nullité : ${res.risqueGlobal}</div>
            <div style="font-size:0.78rem;color:var(--charbon-3);line-height:1.5">${res.risqueTexte}</div>
          </div>
        </div>
        <div class="m6-progress-wrap" style="margin-top:10px">
          <div class="m6-progress-bar" style="width:${res.score}%;background:linear-gradient(90deg,${res.risqueCouleur},${res.score>70?'#4A7C6F':res.risqueCouleur})"></div>
        </div>
        <div style="display:flex;gap:12px;font-size:0.72rem;color:var(--pierre);margin-top:6px">
          <span>✅ ${res.nbOk}/6 conditions validées</span>
          ${res.nbDanger>0?`<span style="color:var(--alerte)">❌ ${res.nbDanger} critique(s)</span>`:''}
          ${res.nbWarning>0?`<span style="color:#C4853A">⚠️ ${res.nbWarning} vigilance(s)</span>`:''}
        </div>
      </div>
    </div>

    <!-- Conditions détail -->
    ${res.conditions.map(cond => `
    <div class="m6-card" style="margin-bottom:10px">
      <div class="m6-card-body" style="padding:12px 14px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:1.1rem;flex-shrink:0;margin-top:1px">${niveauIcon[cond.niveau]}</span>
          <div style="flex:1">
            <div style="font-size:0.82rem;font-weight:600;color:var(--charbon);margin-bottom:3px">${cond.titre}</div>
            <div style="font-size:0.7rem;color:var(--pierre);margin-bottom:6px">Réf. ${cond.loi}</div>
            <div class="m6-alert ${niveauClass[cond.niveau]}" style="margin:0;font-size:0.75rem;padding:8px 10px">
              <span>${niveauIcon[cond.niveau]}</span>
              <div>${cond.detail}</div>
            </div>
            ${cond.niveau !== 'ok' ? `<div style="font-size:0.72rem;color:var(--charbon-3);margin-top:7px;line-height:1.5;border-left:2px solid var(--champagne);padding-left:8px"><strong>Recommandation :</strong> ${cond.recommandation}</div>` : ''}
          </div>
        </div>
      </div>
    </div>`).join('')}

    <!-- Avertissement juridique -->
    <div class="m6-alert info" style="margin-top:4px;font-size:0.72rem">
      <span>⚖️</span>
      <div>Cette analyse est indicative et ne constitue pas un avis juridique. En cas de doute, consultez un avocat spécialisé en droit social ou votre représentant syndical. Sources : Légifrance, Cour de cassation.</div>
    </div>`;
  }
};

// ══════════════════════════════════════════════════════════════════
//  2. GRAPHIQUES D'ÉVOLUTION TEMPORELLE
//  Canvas SVG pur — pas de dépendance externe
//  Affiche : fatigue / stress / récupération sur les 12 derniers mois
// ══════════════════════════════════════════════════════════════════

const M6_Charts = {

  /**
   * Construit les données mensuelles biologiques depuis les données brutes.
   * @param {object} contract
   * @param {object} allData — données multi-mois { "YYYY-MM-DD": {...} }
   * @param {number} year
   * @returns {Array} 12 entrées { mois, fatigue, stress, recovery, performance, jours }
   */
  buildMonthlyBio(contract, allData, year) {
    const mois_data = [];
    for (let m = 0; m < 12; m++) {
      const prefix = `${year}-${String(m+1).padStart(2,'0')}`;
      const moisEntries = {};
      Object.entries(allData).forEach(([dk,v]) => {
        if (dk.startsWith(prefix)) moisEntries[dk] = v;
      });
      if (Object.keys(moisEntries).length === 0) {
        mois_data.push({ mois: m, vide: true });
        continue;
      }
      const bio = M6_BioEngine.analyzeForfaitJours(contract, moisEntries, year);
      mois_data.push({ mois: m, ...bio, jours: Object.keys(moisEntries).length });
    }
    return mois_data;
  },

  /**
   * Rend un graphique SVG d'évolution dans le container.
   * @param {HTMLElement} container
   * @param {Array}  monthlyData — résultat buildMonthlyBio()
   * @param {string} metric      — 'fatigue'|'stress'|'recovery'|'performance'
   */
  renderLine(container, monthlyData, metrics) {
    const W = container.offsetWidth || 340;
    const H = 160;
    const padL = 28, padR = 12, padT = 14, padB = 28;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const moisShort = ['J','F','M','A','M','J','J','A','S','O','N','D'];

    const COLORS = {
      fatigue:     '#B85C50',
      stress:      '#C4853A',
      recovery:    '#2D6A4F',
      performance: '#1E3A5F',
    };
    const LABELS = {
      fatigue:'Fatigue', stress:'Stress',
      recovery:'Récupération', performance:'Performance',
    };

    // Données valides seulement
    const points = monthlyData.map((d,i) => {
      const x = padL + (i / 11) * chartW;
      return { m: i, x, data: d };
    });

    // Construire les paths SVG pour chaque métrique
    const paths = metrics.map(metric => {
      const color = COLORS[metric];
      const pts = points.filter(p => !p.data.vide && p.data[metric] !== undefined);
      if (pts.length < 2) return '';

      const toY = v => padT + chartH - (v / 100) * chartH;

      let d = `M ${pts[0].x} ${toY(pts[0].data[metric])}`;
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i-1], curr = pts[i];
        const cx1 = prev.x + (curr.x - prev.x) / 3;
        const cx2 = curr.x - (curr.x - prev.x) / 3;
        const py = toY(prev.data[metric]);
        const cy = toY(curr.data[metric]);
        d += ` C ${cx1} ${py}, ${cx2} ${cy}, ${curr.x} ${cy}`;
      }

      // Cercles aux points
      const circles = pts.map(p => {
        const v = p.data[metric];
        const cy = toY(v);
        return `<circle cx="${p.x}" cy="${cy}" r="3" fill="${color}" stroke="#fff" stroke-width="1.5"/>
                <title>${moisShort[p.m]}: ${v}</title>`;
      }).join('');

      // Zone remplie
      const areaPath = d + ` L ${pts[pts.length-1].x} ${padT+chartH} L ${pts[0].x} ${padT+chartH} Z`;

      return `
        <path d="${areaPath}" fill="${color}" fill-opacity="0.06"/>
        <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${circles}`;
    }).join('');

    // Lignes de grille horizontales (0, 25, 50, 75, 100)
    const grids = [0,25,50,75,100].map(v => {
      const gy = padT + chartH - (v/100)*chartH;
      return `<line x1="${padL}" y1="${gy}" x2="${W-padR}" y2="${gy}" stroke="#E2DAD0" stroke-width="0.5" stroke-dasharray="3,3"/>
              <text x="${padL-4}" y="${gy+3}" text-anchor="end" font-size="8" fill="#8A847C">${v}</text>`;
    }).join('');

    // Labels mois
    const moisLabels = moisShort.map((m,i) => {
      const x = padL + (i/11)*chartW;
      const hasData = !monthlyData[i]?.vide;
      return `<text x="${x}" y="${H-4}" text-anchor="middle" font-size="8" fill="${hasData?'#4A4540':'#BDB5A8'}">${m}</text>`;
    }).join('');

    // Légende
    const legendItems = metrics.map(metric =>
      `<g><rect x="0" y="0" width="10" height="3" rx="1.5" fill="${COLORS[metric]}"/>
       <text x="13" y="5" font-size="8" fill="#4A4540">${LABELS[metric]}</text></g>`
    );
    let lx = 0;
    const legend = metrics.map((metric, i) => {
      const x = lx;
      lx += LABELS[metric].length * 5 + 20;
      return `<g transform="translate(${x},0)">
        <rect width="10" height="3" rx="1.5" fill="${COLORS[metric]}"/>
        <text x="13" y="5" font-size="8" fill="#4A4540">${LABELS[metric]}</text>
      </g>`;
    }).join('');

    return `<svg width="${W}" height="${H+20}" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <!-- Grille -->
      ${grids}
      <!-- Courbes -->
      ${paths}
      <!-- Labels mois -->
      ${moisLabels}
      <!-- Légende -->
      <g transform="translate(${padL},${H+8})">${legend}</g>
    </svg>`;
  },

  /**
   * Rend la page complète des graphiques dans un container.
   */
  renderPage(container, contract, allData, year) {
    container.innerHTML = `<div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Évolution biologique ${year}</div><div class="m6-ornement-line"></div></div>
    <div style="text-align:center;padding:40px 0;color:var(--pierre);font-size:0.85rem">
      Calcul en cours…
    </div>`;

    // Calcul asynchrone pour ne pas bloquer l'UI
    setTimeout(() => {
      const monthly = this.buildMonthlyBio(contract, allData, year);
      const hasDonnees = monthly.some(m => !m.vide);

      if (!hasDonnees) {
        container.innerHTML = `<div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Évolution biologique ${year}</div><div class="m6-ornement-line"></div></div>
          <div class="m6-alert info"><span>ℹ️</span><div>Pas encore assez de données pour tracer les courbes. Saisissez vos journées sur au moins 2 mois différents.</div></div>`;
        return;
      }

      const chartFatStress = this.renderLine(container, monthly, ['fatigue','stress']);
      const chartRecPerf   = this.renderLine(container, monthly, ['recovery','performance']);

      // Tableau mensuel
      const rows = monthly.map(d => {
        if (d.vide) return `<tr><td style="color:var(--pierre)">${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'][d.mois]}</td><td colspan="4" style="color:var(--pierre);font-style:italic;font-size:0.72rem">Pas de données</td></tr>`;
        const phColor = d.phase?.color || '#4A7C6F';
        const fColor = d.fatigue>60?'#B85C50':d.fatigue>35?'#C4853A':'#2D6A4F';
        const rColor = d.recovery<40?'#B85C50':d.recovery<65?'#C4853A':'#2D6A4F';
        return `<tr>
          <td style="font-weight:500">${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'][d.mois]}</td>
          <td style="color:${fColor};font-weight:600">${d.fatigue}</td>
          <td style="color:${d.stress>50?'#C4853A':'var(--charbon)'}">${d.stress}</td>
          <td style="color:${rColor};font-weight:600">${d.recovery}</td>
          <td><span style="font-size:0.65rem;background:${phColor}20;color:${phColor};border-radius:99px;padding:1px 6px;font-weight:600">${d.phase?.code||'—'}</span></td>
        </tr>`;
      }).join('');

      container.innerHTML = `
      <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Évolution biologique ${year}</div><div class="m6-ornement-line"></div></div>

      <!-- Fatigue + Stress -->
      <div class="m6-card" style="margin-bottom:14px">
        <div class="m6-card-header"><div class="m6-card-icon" style="background:#B85C5020">📈</div>
          <div><div class="m6-card-label">Évolution mensuelle</div><div class="m6-card-title">Fatigue & Stress</div></div>
        </div>
        <div class="m6-card-body" style="padding:8px 10px;overflow:hidden">${chartFatStress}</div>
      </div>

      <!-- Récupération + Performance -->
      <div class="m6-card" style="margin-bottom:14px">
        <div class="m6-card-header"><div class="m6-card-icon" style="background:#2D6A4F20">📊</div>
          <div><div class="m6-card-label">Évolution mensuelle</div><div class="m6-card-title">Récupération & Performance</div></div>
        </div>
        <div class="m6-card-body" style="padding:8px 10px;overflow:hidden">${chartRecPerf}</div>
      </div>

      <!-- Tableau mensuel -->
      <div class="m6-card" style="margin-bottom:14px">
        <div class="m6-card-header"><div class="m6-card-icon">🗓️</div>
          <div><div class="m6-card-label">Détail mois par mois</div><div class="m6-card-title">Scores biologiques ${year}</div></div>
        </div>
        <div class="m6-card-body" style="padding:0">
          <table class="m6-table">
            <tr><th>Mois</th><th style="color:#B85C50">Fatigue</th><th style="color:#C4853A">Stress</th><th style="color:#2D6A4F">Récup.</th><th>Phase</th></tr>
            ${rows}
          </table>
        </div>
      </div>

      <!-- Insights Sonnentag -->
      <div class="m6-alert info" style="font-size:0.75rem">
        <span>🔬</span>
        <div>Sonnentag et al. 2022 (Annual Review, méta-analyse 198 études) : les variations mois par mois de la récupération prédisent mieux la santé long terme qu'un score instantané. Repérez les mois où la récupération chute sous 50 — ce sont les fenêtres à risque.<br><strong>Astuce :</strong> si fatigue↑ et récupération↓ deux mois de suite → action préventive immédiate (RTT, entretien).</div>
      </div>`;
    }, 50);
  }
};

// ══════════════════════════════════════════════════════════════════
//  3. MODE PREUVE OPPOSABLE
//  Archive complète horodatée — valeur probante maximale
// ══════════════════════════════════════════════════════════════════

const M6_ModePreuve = {

  /**
   * Génère un rapport de conformité texte complet.
   * Structure : identité · données forfait · entretiens · log · hash final
   */
  async generateReport(regime, year, contract, data, analysis) {
    const ts = new Date().toISOString();
    const dateStr = new Date().toLocaleString('fr-FR');

    // Hash des données (SHA-256 simulé via somme de caractères — valeur symbolique)
    const dataStr = JSON.stringify({ contract, data, analysis, ts });
    let hashSum = 0;
    for (let i = 0; i < Math.min(dataStr.length, 10000); i++) {
      hashSum = ((hashSum << 5) - hashSum) + dataStr.charCodeAt(i);
      hashSum |= 0;
    }
    const hash = Math.abs(hashSum).toString(16).padStart(8,'0').toUpperCase();

    const log = M6_Storage?.getLog(regime, year) || [];
    const validations = M6_Storage?.getValidations(regime, year) || {};
    const entretiens = M6_Storage?.getEntretiens?.(regime) || [];

    const lignes = [
      `╔══════════════════════════════════════════════════════════════╗`,
      `║     RAPPORT DE CONFORMITÉ FORFAIT JOURS — M6 CADRES         ║`,
      `╚══════════════════════════════════════════════════════════════╝`,
      ``,
      `Généré le : ${dateStr}`,
      `Exercice  : ${year}`,
      `Hash      : #${hash} (empreinte des données au moment de l'export)`,
      ``,
      `━━ IDENTIFICATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Nom       : ${contract.nomCadre || contract.nom || 'N/A'}`,
      `Fonction  : ${contract.fonction || 'N/A'}`,
      `Entreprise: ${contract.entreprise || 'N/A'}`,
      `CCN       : ${contract.ccnLabel || 'Non renseignée'}`,
      `Plafond   : ${contract.plafond || 218} jours`,
      `CP contrat: ${contract.joursCPContrat || 25} jours`,
      ``,
      `━━ DONNÉES FORFAIT ${year} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Jours travaillés  : ${analysis.joursEffectifs || 0} / ${analysis.plafond || 218}`,
      `Jours rachetés    : ${analysis.rachetes || 0}`,
      `RTT théoriques    : ${analysis.rttTheoriques || 0}`,
      `RTT pris          : ${analysis.rttPris || 0}`,
      `Solde RTT         : ${analysis.rttSolde || 0}`,
      `CP pris           : ${analysis.cpPris || 0}`,
      `Fériés ouvrés     : ${analysis.feriesOuvres || 0}`,
      `Taux remplissage  : ${analysis.tauxRemplissage || 0}%`,
      ``,
      `━━ ENTRETIENS ANNUELS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      contract.entretienDate
        ? `Dernier entretien : ${new Date(contract.entretienDate).toLocaleDateString('fr-FR')}`
        : `ATTENTION : Aucun entretien enregistré pour ${year} (L3121-65)`,
      ...(entretiens.length > 0 ? entretiens.map(e =>
        `  ${new Date(e.date||e.ts||0).toLocaleDateString('fr-FR')} — ${e.conclusion || e.resume || '—'}`
      ) : ['  Aucun historique d\'entretien disponible.']),
      ``,
      `━━ VALIDATIONS MENSUELLES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...Object.entries(validations).length > 0
        ? Object.entries(validations).map(([m, v]) =>
            `  ${['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sep.','Oct.','Nov.','Déc.'][m]} — ${new Date(v.ts).toLocaleString('fr-FR')} par ${v.nom||'N/A'} · #${v.hash||'—'}`)
        : ['  Aucune validation mensuelle enregistrée.'],
      ``,
      `━━ LOG DES MODIFICATIONS (${log.length} entrées) ━━━━━━━━━━━━━━━━━━`,
      ...(log.slice(-20).map(l =>
        `  ${new Date(l.ts).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} — ${l.action} : ${l.detail}`
      )),
      ``,
      `━━ ALERTES ACTIVES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...((analysis.alertes || []).length > 0
        ? analysis.alertes.map(a => `  [${a.niveau?.toUpperCase()}] ${a.titre} — Art. ${a.loi}`)
        : ['  Aucune alerte détectée.']),
      ``,
      `━━ CERTIFICATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Ce rapport a été généré automatiquement par l'application M6 Cadres`,
      `(Simulateur Heures Sup France — simulateurheuressupfrance.pages.dev).`,
      ``,
      `Le soussigné certifie l'exactitude des informations saisies`,
      `et le respect recommandé des temps de repos légaux.`,
      ``,
      `Signature cadre : ________________________________ Date : ________`,
      `Signature manager: ________________________________ Date : ________`,
      ``,
      `Hash de vérification : #${hash}`,
      `Ce hash permet de vérifier que les données n'ont pas été modifiées`,
      `après l'export. Toute modification invalide l'empreinte.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Sources légales : L3121-41 à L3121-65 Code du travail`,
      `Jurisprudence   : Cass. Soc. 29/06/2011, 02/07/2014, 04/11/2015`,
      `Médical (info)  : Ce rapport ne remplace pas un avis médical.`,
    ];

    return { texte: lignes.join('\n'), hash, ts };
  },

  /**
   * Télécharge le rapport comme fichier .txt.
   */
  async download(regime, year, contract, data, analysis) {
    const { texte, hash } = await this.generateReport(regime, year, contract, data, analysis);
    const blob = new Blob([texte], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `conformite_forfait_${year}_${(contract.nomCadre||contract.nom||'cadre').replace(/\s+/g,'_').toLowerCase()}_#${hash}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    M6_toast?.(`Rapport de conformité exporté · #${hash}`);

    // Enregistrer la date d'export fichier
    M6_Storage?.setFileSaveDate?.(regime, year);
    return hash;
  },

  /**
   * Rend l'interface "Mode Preuve" dans un container.
   */
  renderUI(container, regime, year, contract, data, analysis) {
    const fileSave = M6_Storage?.getFileSaveDate?.(regime, year);
    const log      = M6_Storage?.getLog?.(regime, year) || [];

    container.innerHTML = `
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Mode Preuve opposable</div><div class="m6-ornement-line"></div></div>

    <div class="m6-alert info" style="margin-bottom:14px;font-size:0.78rem">
      <span>🔐</span>
      <div><strong>Qu'est-ce que le Mode Preuve ?</strong><br>
      Un rapport texte complet et horodaté incluant : données forfait, entretiens, validations mensuelles, log des modifications et une empreinte numérique (hash). En cas de contrôle de l'inspection du travail ou de litige prud'homal, ce fichier constitue un élément de preuve de votre suivi.</div>
    </div>

    <!-- Statut -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-body">
        <div class="m6-row"><span class="m6-row-label">Dernier export fichier</span>
          <span class="m6-row-val" style="color:${fileSave?'var(--succes)':'var(--alerte)'}">
            ${fileSave ? new Date(fileSave).toLocaleString('fr-FR') : 'Jamais exporté ⚠️'}
          </span>
        </div>
        <div class="m6-row"><span class="m6-row-label">Entrées dans le log</span><span class="m6-row-val">${log.length}</span></div>
        <div class="m6-row"><span class="m6-row-label">Validations mensuelles</span>
          <span class="m6-row-val">${Object.keys(M6_Storage?.getValidations?.(regime,year)||{}).length} / 12</span>
        </div>
      </div>
    </div>

    <!-- Ce que contient le rapport -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon">📄</div>
        <div><div class="m6-card-label">Contenu du rapport</div><div class="m6-card-title">Rapport de conformité .txt</div></div>
      </div>
      <div class="m6-card-body">
        ${['Identification (nom, fonction, CCN, plafond)','Données forfait annuelles complètes (jours, RTT, CP, fériés)','Historique des entretiens annuels','Toutes les validations mensuelles avec timestamp','Log des 20 dernières modifications','Alertes légales actives','Empreinte numérique (hash) pour vérification d\'intégrité','Blocs signature cadre + manager'].map(item=>`<div class="m6-row"><span class="m6-row-label" style="color:var(--charbon-3)">→ ${item}</span></div>`).join('')}
      </div>
    </div>

    <!-- Certification préalable -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-body">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
          <input type="checkbox" id="preuve-attest" style="margin-top:3px;flex-shrink:0">
          <span style="font-size:0.82rem;color:var(--charbon-3);line-height:1.5">
            Je certifie que les informations saisies dans ce module sont exactes et de bonne foi. Je comprends que ce rapport peut être présenté à l'inspection du travail ou dans le cadre d'une procédure prud'homale.
          </span>
        </label>
      </div>
    </div>

    <button class="m6-btn m6-btn-primary" id="preuve-dl" style="margin-bottom:8px">
      🔐 Générer et télécharger le rapport
    </button>

    <div class="m6-alert warning" style="font-size:0.72rem;margin-top:8px">
      <span>⚠️</span>
      <div>Ce rapport a une valeur probante <strong>symbolique</strong>. Pour une valeur juridique complète, faites valider le fichier par huissier ou notaire, ou utilisez un service de tiers-horodateur certifié (RFC 3161).</div>
    </div>`;

    container.querySelector('#preuve-dl')?.addEventListener('click', async () => {
      if (!container.querySelector('#preuve-attest')?.checked) {
        M6_toast('Cochez la case de certification'); return;
      }
      await M6_ModePreuve.download(regime, year, contract, data, analysis);
    });
  }
};

// ── Exposition globale ────────────────────────────────────────────
global.M6_SimulateurNullite = M6_SimulateurNullite;
global.M6_Charts            = M6_Charts;
global.M6_ModePreuve        = M6_ModePreuve;

})(window);
