/**
 * BIO-ENGINE M6 — Jumeau numérique Cadres
 * Adapté du DTE M4 pour le contexte Forfait Jours / Forfait Heures
 *
 * ═══ SOURCES SCIENTIFIQUES ════════════════════════════════════════
 * [1] WHO/ILO 2021 — Pega F. : ≥55h → RR=1.35 AVC
 * [2] Pencavel J. 2014 (Stanford) : productivité chute >50h, effondrement >55h
 * [3] Sonnentag 2003 : récupération psychologique — RTT non pris = dette
 * [4] Kivimäki M. 2015 (Lancet) : 603 838 individus, effet dose-temps CV
 * [5] INRS/ANACT : fatigue cumulative 4 phases (P1→P4)
 * [6] Hakola & Härmä 2001 : amplitude horaire et perturbation circadienne
 * [7] Totterdell 2005 : cadres — surcharge cognitive et décrochage émotionnel
 * ═════════════════════════════════════════════════════════════════
 */
'use strict';

(function(global) {

// ── CONSTANTES ────────────────────────────────────────────────────
const BIO = {
  // Plafonds Forfait Jours
  FJ_PLAFOND_REF:    218,   // référence légale
  FJ_AMPLITUDE_STD:  8.5,   // heures/jour "normales" cadre
  FJ_AMPLITUDE_LONG: 11,    // seuil amplitude longue (Hakola 2001)
  // Seuils de fatigue INRS (phases P1→P4)
  P1_MAX: 35, P2_MAX: 60, P3_MAX: 80,
  // Pencavel — seuils hebdomadaires
  H_OPTIMAL: 40, H_LEGAL: 48, H_OCDE: 50, H_CV: 55,
  // Récupération
  RTT_RECUP_FACTOR:  0.08,  // 1 RTT pris → -8% fatigue
  VAC_RECUP_FACTOR:  0.15,  // 1 semaine vacances → -15% fatigue
  // Stress / entretien
  ENTRETIEN_MANQUANT_STRESS: 12, // +12 stress si pas d'entretien annuel
  RACHAT_STRESS_PAR_JOUR:     4, // +4 stress par jour racheté
};

// ── PENCAVEL adapté Forfait Jours ─────────────────────────────────
// Pour FJ, on convertit les jours en équivalent heures hebdomadaires moyennes.
function _pencavelPerf(weeklyH) {
  if (weeklyH <= 35) return 1.000;
  if (weeklyH <= 40) return 1.000 - (weeklyH - 35) * 0.003;
  if (weeklyH <= 48) return 0.985 - (weeklyH - 40) * 0.016;
  if (weeklyH <= 50) return 0.857 - (weeklyH - 48) * 0.030;
  if (weeklyH <= 55) return 0.797 - (weeklyH - 50) * 0.055;
  if (weeklyH <= 70) return 0.522 - (weeklyH - 55) * 0.022;
  return 0.192;
}

// ── RISQUE CV (OMS/OIT 2021 + Kivimäki 2015) ─────────────────────
function _cvRisk(weeklyH, cumulMonths) {
  let acute = 0;
  if (weeklyH >= 48) acute = Math.min(weeklyH - 48, 20) * 0.028;
  let cumul = Math.min(0.25, cumulMonths * 0.02);
  if (weeklyH < 40)      cumul *= 0.60;
  else if (weeklyH < 48) cumul *= 0.85;
  return Math.min(1, acute + cumul);
}

// ── MOTEUR PRINCIPAL ──────────────────────────────────────────────
const M6_BioEngine = {

  /**
   * Analyse biologique pour Forfait Jours.
   * @param {object} contract  — { plafond, joursCPContrat, tauxJournalier }
   * @param {object} data      — { "YYYY-MM-DD": { type, amplitude? } }
   * @param {number} year
   * @param {string} entretienDate — date dernier entretien
   */
  analyzeForfaitJours(contract, data, year) {
    const plafond = contract.plafond || 218;
    const today = new Date().toISOString().slice(0,10);
    const entries = Object.entries(data)
      .filter(([k]) => k.startsWith(String(year)) && k <= today)
      .sort(([a],[b]) => a.localeCompare(b));

    // ── Compteurs ─────────────────────────────────────────────────
    let joursTotal = 0, rachetes = 0, rttPris = 0, cpPris = 0;
    let amplitudeLongue = 0;     // jours avec amplitude > 11h
    let semSurcharge = 0;        // semaines avec >5 jours travaillés
    let cumulSurcharge = 0;      // accumulation pour CV risk

    // Grouper par semaine ISO
    const semaines = {};
    for (const [dk, v] of entries) {
      const wk = this._isoWeek(new Date(dk + 'T12:00:00'));
      if (!semaines[wk]) semaines[wk] = [];
      semaines[wk].push({ dk, ...v });

      const t = v.type || 'travail';
      if (t === 'travail') joursTotal++;
      if (t === 'rachat')  { joursTotal++; rachetes++; }
      if (t === 'rtt')     rttPris++;
      if (t === 'cp')      cpPris++;
      if (v.amplitude && parseFloat(v.amplitude) >= BIO.FJ_AMPLITUDE_LONG) amplitudeLongue++;
    }

    // Analyse semaines
    const wkKeys = Object.keys(semaines).sort();
    for (const wk of wkKeys) {
      const jTravailles = semaines[wk].filter(j => ['travail','rachat'].includes(j.type||'travail')).length;
      if (jTravailles >= 5) { semSurcharge++; cumulSurcharge += jTravailles - 4; }
      else if (jTravailles <= 3 && (semaines[wk].some(j => j.type==='rtt') || semaines[wk].some(j => j.type==='cp'))) {
        cumulSurcharge = Math.max(0, cumulSurcharge - 0.5);
      }
    }

    // ── Scores biologiques ────────────────────────────────────────
    // Fatigue de base : proportionnelle au taux de remplissage du forfait
    const tauxForfait = Math.min(1.2, joursTotal / (plafond * (wkKeys.length / 52)));
    let fatigue = Math.min(100, Math.round(
      20                                              // baseline
      + tauxForfait * 18                              // charge forfait
      + (rachetes / Math.max(1, plafond)) * 60        // rachat → surcharge forte
      + amplitudeLongue * 2                           // amplitudes longues
      + semSurcharge * 1.5                            // semaines à 5j+
      - rttPris * BIO.RTT_RECUP_FACTOR * 100          // RTT pris → récupération
      - cpPris   * BIO.VAC_RECUP_FACTOR * 100 / 5    // CP pris (5j/semaine)
    ));

    // Stress
    const entretienDone = contract.entretienDate && 
      new Date(contract.entretienDate).getFullYear() >= year;
    let stress = Math.min(100, Math.round(
      10
      + (rachetes > 0 ? rachetes * BIO.RACHAT_STRESS_PAR_JOUR : 0)
      + (!entretienDone ? BIO.ENTRETIEN_MANQUANT_STRESS : 0)
      + semSurcharge * 2
      + amplitudeLongue * 1.5
    ));

    // Performance (Pencavel) — estimé via jours equivalents heures
    const hEquivMoyen = joursTotal > 0
      ? Math.min(55, 35 + (rachetes + Math.max(0, joursTotal - plafond)) * 0.8)
      : 40;
    const perfBase  = Math.round(_pencavelPerf(hEquivMoyen) * 100);
    const perfFinal = Math.max(30, perfBase - Math.round(fatigue * 0.15));

    // Récupération (Sonnentag 2003)
    const nbSemaines = wkKeys.length || 1;
    const ratioRTT = rttPris / Math.max(1, nbSemaines);
    const recovery  = Math.min(100, Math.max(20, Math.round(
      85 - fatigue * 0.35 + ratioRTT * 40
    )));

    // CV Risk (Kivimäki)
    const cumulMonths = cumulSurcharge / 4;
    const cvRiskScore = Math.round(_cvRisk(hEquivMoyen, cumulMonths) * 100);

    // Cognitif (Jang 2025 — charges >52h eq.)
    const cogRisk = Math.min(100, Math.max(0, Math.round(
      (hEquivMoyen > 52 ? (hEquivMoyen - 52) * 4 : 0)
      + fatigue * 0.20
      + stress * 0.15
    )));

    // ── Alertes bio ───────────────────────────────────────────────
    const alertesBio = this._buildAlertesBio({
      fatigue, stress, recovery, perfFinal, cvRiskScore, cogRisk,
      rachetes, amplitudeLongue, semSurcharge,
      entretienDone, rttPris, plafond, joursTotal
    });

    return {
      fatigue, stress, recovery, performance: perfFinal,
      cvRisk: cvRiskScore, cogRisk,
      details: { rachetes, amplitudeLongue, semSurcharge, cumulSurcharge, rttPris, cpPris, joursTotal },
      phase: this._phase(fatigue),
      alertesBio,
      hasData: entries.length > 0
    };
  },

  /**
   * Analyse biologique pour Forfait Heures.
   * @param {object} contract — { seuilHebdo, contingent }
   * @param {object} data     — { "YYYY-Www": { heures } }
   * @param {number} year
   */
  analyzeForfaitHeures(contract, data, year) {
    const seuil = contract.seuilHebdo || 39;
    const entries = Object.entries(data)
      .filter(([k]) => k.startsWith(String(year)))
      .sort(([a],[b]) => a.localeCompare(b));

    if (!entries.length) return { hasData: false };

    const heuresArr = entries.map(([,v]) => parseFloat(v.heures) || 0);
    const n = heuresArr.length;
    const mean = heuresArr.reduce((s,h) => s+h,0) / n;

    // Semaines de surcharge (>seuil + 20%)
    const surcharge = heuresArr.filter(h => h > seuil * 1.2).length;
    let cumul = 0;
    heuresArr.forEach(h => { cumul += Math.max(0, h - seuil) / seuil; });

    const fatigue = Math.min(100, Math.round(
      15 + _pencavelPerf(mean) < 0.85 ? 50 : 25
      + surcharge * 3
      + cumul * 8
    ));

    const perfFinal = Math.max(30, Math.round(_pencavelPerf(mean) * 100 - fatigue * 0.10));
    const recovery  = Math.min(100, Math.max(20, Math.round(90 - fatigue * 0.4)));
    const stress    = Math.min(100, Math.round(10 + surcharge * 4 + Math.max(0, mean - 48) * 3));
    const cvRiskScore = Math.round(_cvRisk(mean, cumul / 4) * 100);
    const cogRisk   = Math.min(100, Math.round(mean > 52 ? (mean - 52) * 4 : 0 + fatigue * 0.15));

    return {
      fatigue, stress, recovery, performance: perfFinal,
      cvRisk: cvRiskScore, cogRisk,
      details: { mean: Math.round(mean * 10) / 10, surcharge, cumul: Math.round(cumul*10)/10, n },
      phase: this._phase(fatigue),
      alertesBio: this._buildAlertesBio({ fatigue, stress, recovery, perfFinal, cvRiskScore, cogRisk }),
      hasData: true
    };
  },

  // ── Helpers ───────────────────────────────────────────────────
  _phase(fat) {
    if (fat <= BIO.P1_MAX) return { code:'P1', label:'Adaptation',     color:'#2D6A4F' };
    if (fat <= BIO.P2_MAX) return { code:'P2', label:'Fatigue chronique', color:'#D4A017' };
    if (fat <= BIO.P3_MAX) return { code:'P3', label:'Surmenage',      color:'#E07B2A' };
    return                          { code:'P4', label:'Burn-out',       color:'#9B2C2C' };
  },

  _buildAlertesBio(s) {
    const a = [];
    if (s.fatigue >= 80) a.push({ niv:'danger', titre:'Phase burn-out (P4)', texte:'Fatigue critique. Consultation médecin du travail recommandée — Art. L4121-1.' });
    else if (s.fatigue >= 60) a.push({ niv:'warning', titre:'Surmenage (P3)', texte:'Niveau INRS P3. Signalez la surcharge à votre manager et au médecin du travail.' });
    if (s.cvRiskScore >= 30) a.push({ niv:'warning', titre:'Risque cardiovasculaire élevé', texte:`Exposition prolongée. RR AVC = 1.35 (OMS/OIT 2021). Bilan de santé conseillé.` });
    if (s.rachetes > 5) a.push({ niv:'warning', titre:`${s.rachetes} jours rachetés`, texte:'Rachat récurrent → charge cognitive et stress chronique. (Totterdell 2005)' });
    if (s.rttPris === 0 && s.joursTotal > 30) a.push({ niv:'info', titre:'Aucun RTT pris', texte:'La récupération psychologique nécessite des pauses régulières. (Sonnentag 2003)' });
    if (!s.entretienDone) a.push({ niv:'info', titre:'Entretien annuel non enregistré', texte:'L\'entretien de suivi de charge de travail est obligatoire (L3121-65).' });
    if (s.amplitudeLongue > 5) a.push({ niv:'warning', titre:`${s.amplitudeLongue} journées longues`, texte:'Amplitude >11h : perturbation circadienne documentée. (Hakola & Härmä 2001)' });
    return a;
  },

  _isoWeek(d) {
    const dt = new Date(d);
    dt.setHours(12,0,0,0);
    dt.setDate(dt.getDate() + 4 - (dt.getDay() || 7));
    const y = dt.getFullYear();
    const w = Math.ceil(((dt - new Date(y,0,1))/86400000+1)/7);
    return `${y}-W${String(w).padStart(2,'0')}`;
  }
};

global.M6_BioEngine = M6_BioEngine;

})(window);
