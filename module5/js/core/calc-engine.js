/**
 * CALC-ENGINE — Moteur de calcul heures complémentaires (temps partiel)
 * Inspiré du travail du dev, adapté à l'architecture Simulheures
 * Base : Code du travail Art. L3123-9 à L3123-28
 */
(function(global) {
'use strict';

const LEGAL_FULL_TIME = 35; // plafond légal absolu

const CalcEngine = {

  /**
   * Calculer les heures complémentaires d'une semaine
   * @param {number} contractH  - heures contractuelles hebdo
   * @param {number} workedH    - heures réellement travaillées
   * @param {object} ccnRules   - règles CCN { cap, rate1, rate2, threshold }
   * @param {number} hourlyRate - taux horaire brut
   * @returns {object} résultat détaillé
   */
  calcWeek(contractH, workedH, ccnRules, hourlyRate = 0) {
    const cap       = ccnRules.cap       || 0.10;
    const rate1     = ccnRules.rate1     || 0.10;
    const rate2     = ccnRules.rate2     || 0.25;
    const threshold = ccnRules.threshold || 0.10;

    const maxAllowed    = contractH * (1 + cap);
    const threshold1H   = contractH * threshold; // heures à rate1
    const alerts        = [];

    let baseH    = Math.min(workedH, contractH);
    let compH1   = 0; // heures majorées rate1
    let compH2   = 0; // heures majorées rate2
    let isLegal  = true;

    if (workedH > contractH) {
      let diff = workedH - contractH;

      // Alerte : risque requalification temps plein
      if (workedH >= LEGAL_FULL_TIME) {
        alerts.push({
          level: 'critique',
          code: 'REQUALIFICATION',
          msg: `Tu as atteint ${workedH}h cette semaine. Au-delà de ${LEGAL_FULL_TIME}h, ton employeur risque une requalification de ton contrat en temps plein.`
        });
        isLegal = false;
      }

      // Alerte : dépassement plafond CCN
      if (workedH > maxAllowed) {
        alerts.push({
          level: 'alerte',
          code: 'PLAFOND_CCN',
          msg: `Tu dépasses le plafond autorisé par ta convention (${Math.round(cap * 100)}% du contrat = max ${maxAllowed.toFixed(1)}h).`
        });
        isLegal = false;
      }

      // Alerte : approche du temps plein
      if (workedH >= LEGAL_FULL_TIME - 1 && workedH < LEGAL_FULL_TIME) {
        alerts.push({
          level: 'vigilance',
          code: 'PROCHE_TEMPS_PLEIN',
          msg: `Attention : tu es à ${(LEGAL_FULL_TIME - workedH).toFixed(1)}h du temps plein. Sois vigilante.`
        });
      }

      // Répartition paliers
      if (diff <= threshold1H) {
        compH1 = diff;
      } else {
        compH1 = threshold1H;
        compH2 = diff - threshold1H;
      }
    }

    // Calcul montants
    const baseAmount  = baseH    * hourlyRate;
    const comp1Amount = compH1   * hourlyRate * (1 + rate1);
    const comp2Amount = compH2   * hourlyRate * (1 + rate2);
    const totalAmount = baseAmount + comp1Amount + comp2Amount;
    const expectedAmount = baseH * hourlyRate + compH1 * hourlyRate * (1 + rate1) + compH2 * hourlyRate * (1 + rate2);

    return {
      contractH,
      workedH,
      baseH,
      compH1: Math.round(compH1 * 100) / 100,
      compH2: Math.round(compH2 * 100) / 100,
      totalCompH: Math.round((compH1 + compH2) * 100) / 100,
      baseAmount:    Math.round(baseAmount    * 100) / 100,
      comp1Amount:   Math.round(comp1Amount   * 100) / 100,
      comp2Amount:   Math.round(comp2Amount   * 100) / 100,
      totalAmount:   Math.round(totalAmount   * 100) / 100,
      expectedAmount:Math.round(expectedAmount* 100) / 100,
      rate1, rate2, cap,
      maxAllowed:    Math.round(maxAllowed    * 100) / 100,
      alerts,
      isLegal,
    };
  },

  /**
   * Calculer sur une période (tableau de semaines)
   */
  calcPeriod(weeks, contractH, ccnRules, hourlyRate = 0) {
    const results = weeks.map(w => this.calcWeek(contractH, w.worked || 0, ccnRules, hourlyRate));
    return {
      weeks: results,
      totalBase:   results.reduce((s, r) => s + r.baseH,    0),
      totalComp1:  results.reduce((s, r) => s + r.compH1,   0),
      totalComp2:  results.reduce((s, r) => s + r.compH2,   0),
      totalComp:   results.reduce((s, r) => s + r.totalCompH, 0),
      totalAmount: results.reduce((s, r) => s + r.totalAmount, 0),
      allAlerts:   results.flatMap(r => r.alerts),
    };
  },

  /**
   * Détecter la règle des 12 semaines (Art. L3123-13)
   * Si l'horaire moyen dépasse de +2h/sem pendant 12 sem consécutives
   * → contrat doit être modifié (sauf opposition salarié)
   */
  check12WeeksRule(weeklyData, contractH) {
    // weeklyData = tableau chronologique { worked: number }
    if (weeklyData.length < 12) return { triggered: false, count: weeklyData.length };

    let consecCount = 0;
    let maxConsec   = 0;
    let triggerStart = null;

    for (let i = 0; i < weeklyData.length; i++) {
      const w = weeklyData[i];
      if ((w.worked || 0) >= contractH + 2) {
        consecCount++;
        if (consecCount > maxConsec) maxConsec = consecCount;
        if (consecCount >= 12 && !triggerStart) triggerStart = i - 11;
      } else {
        consecCount = 0;
      }
    }

    return {
      triggered:    maxConsec >= 12,
      maxConsec,
      triggerStart,
      msg: maxConsec >= 12
        ? `Tu dépasses ton contrat de +2h/sem depuis ${maxConsec} semaines consécutives. Ton employeur doit proposer une augmentation de ton contrat (Art. L3123-13).`
        : maxConsec >= 8
          ? `${maxConsec} semaines consécutives au-dessus du contrat. Encore ${12 - maxConsec} semaines avant que la règle des 12 semaines s'applique.`
          : null
    };
  },

  /**
   * Vérifier le délai de prévenance
   * @param {Date|string} notifDate - date de notification par l'employeur
   * @param {Date|string} shiftDate - date de début du service demandé
   * @param {number} requiredDays   - délai requis (défaut 3j ouvrés)
   */
  checkNotice(notifDate, shiftDate, requiredDays = 3) {
    const n = new Date(notifDate);
    const s = new Date(shiftDate);
    // Calcul jours ouvrés (lun-ven)
    let ouvrés = 0;
    const cur = new Date(n);
    while (cur < s) {
      cur.setDate(cur.getDate() + 1);
      const dow = cur.getDay();
      if (dow >= 1 && dow <= 5) ouvrés++;
    }
    return {
      ok: ouvrés >= requiredDays,
      ouvrés,
      msg: ouvrés < requiredDays
        ? `Délai de prévenance insuffisant : ${ouvrés} jour(s) ouvré(s) au lieu de ${requiredDays}. Tu peux refuser ces heures sans sanction.`
        : null
    };
  },

  /**
   * Calculer le plafond annuel d'heures complémentaires
   */
  calcAnnualCap(contractH, ccnRules) {
    const cap = ccnRules.cap || 0.10;
    return {
      weekly:  Math.round(contractH * cap * 10) / 10,
      monthly: Math.round(contractH * 52 / 12 * cap * 10) / 10,
      annual:  Math.round(contractH * 52 * cap * 10) / 10,
    };
  },

  /**
   * Estimer le net (défiscalisation heures complémentaires depuis 2019)
   * Taux d'abattement charges salariales ~11.31% sur les heures comp.
   */
  estimateNet(grossComp) {
    const chargesReduction = 0.1131; // réduction forfaitaire charges salariales
    return Math.round(grossComp * (1 - chargesReduction) * 100) / 100;
  }
};

global.CalcEngine = CalcEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = { CalcEngine };

}(typeof window !== 'undefined' ? window : global));
