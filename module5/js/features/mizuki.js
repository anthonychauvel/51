/**
 * MIZUKI — Compagne de Kitsune, guide des salariées à temps partiel
 * Ton : doux, bienveillant, amical. Féminin. Pas de jargon juridique brut.
 * Architecture inspirée de kitsuneNarrateOvertime (M3) mais autonome.
 */
(function(global) {
'use strict';

// ── Clés localStorage ────────────────────────────────────────────
const K = {
  MSG_IDX:     'M5_MIZUKI_MSG_IDX',
  POPUP_CACHE: 'M5_POPUP_DAILY',
  USER_NAME:   'M5_USER_NAME',
};

function _get(k, def = '') {
  try { return localStorage.getItem(k) ?? def; } catch(_) { return def; }
}
function _set(k, v) {
  try { localStorage.setItem(k, String(v)); } catch(_) {}
}
function _json(k, def = {}) {
  try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch(_) { return def; }
}

// ── Messages Mizuki ──────────────────────────────────────────────
const MSGS_NORMAL = [
  n => `🦊 Bonjour ${n}! Aucun dépassement cette semaine — tu es dans tes droits. Continue à noter chaque heure.`,
  n => `🦊 ${n}Tout va bien cette semaine. Mizuki surveille tes heures pour toi — tu n'as rien à faire de plus.`,
  n => `🦊 ${n}Semaine conforme à ton contrat. Garde une trace de tout, même quand tout va bien.`,
  n => `🦊 ${n}Aucune heure complémentaire cette semaine. C'est parfait — ton contrat est respecté.`,
  n => `🦊 ${n}Tout est en ordre ! Si tu as une semaine chargée à venir, note-la dès maintenant.`,
];

const MSGS_COMP_LOW = [
  (n, h, r1) => `🦊 ${n}Tu as fait ${h}h complémentaires cette semaine, majorées à +${Math.round(r1*100)}%. Mizuki a tout noté pour toi.`,
  (n, h, r1) => `🦊 ${n}${h}h en plus de ton contrat — majorées à +${Math.round(r1*100)}% comme prévu par la loi. Vérifie ta prochaine fiche de paie.`,
  (n, h)     => `🦊 ${n}Quelques heures complémentaires cette semaine (${h}h). Elles doivent apparaître sur ton bulletin avec majoration.`,
];

const MSGS_COMP_HIGH = [
  (n, h) => `🦊 ${n}${h}h complémentaires cette semaine — les premières à +10%, les suivantes à +25%. Garde cet historique.`,
  (n, h) => `🦊 ${n}Semaine chargée avec ${h}h au-delà de ton contrat. Mizuki a calculé les majorations pour toi.`,
];

const MSGS_ALERT_PROCHE = [
  (n, h) => `🦊 ${n}Tu as travaillé ${h}h cette semaine. C'est proche des 35h légales — sois attentive la semaine prochaine.`,
];

const MSGS_ALERT_REQUALIF = [
  (n, h) => `🦊 ${n}ATTENTION : ${h}h cette semaine, c'est le seuil du temps plein. Ton contrat pourrait être requalifié automatiquement.`,
];

const MSGS_12_SEMAINES = [
  (n, c) => `🦊 ${n}Tu dépasses ton contrat depuis ${c} semaines consécutives. La loi oblige ton employeur à te proposer un nouveau contrat.`,
];

const MSGS_VACANCES = [
  n => `🦊 ${n}Semaine de congés — profite du repos ! Mizuki surveille ton historique pendant ton absence.`,
  n => `🦊 ${n}Tu es en vacances cette semaine. Tes données restent intactes. Déconnecte vraiment !`,
];

// ── Rotation messages ─────────────────────────────────────────────
function _nextIdx(pool) {
  let idx = parseInt(_get(K.MSG_IDX, '0'));
  const today = new Date().getDate();
  const result = (today * 7 + idx) % pool.length;
  _set(K.MSG_IDX, String((idx + 1) % 9999));
  return result;
}

// ── API Mizuki ────────────────────────────────────────────────────
const Mizuki = {

  getBubbleText(analysis) {
    const name = _get(K.USER_NAME, '');
    const pr   = name ? name + ' ! ' : '';
    const { weekResult, rule12, isVacWeek } = analysis || {};

    if (isVacWeek) {
      const pool = MSGS_VACANCES;
      return pool[_nextIdx(pool)](pr);
    }

    if (!weekResult || weekResult.workedH <= weekResult.contractH) {
      const pool = MSGS_NORMAL;
      return pool[_nextIdx(pool)](pr);
    }

    const alerts = weekResult.alerts || [];
    const hasRequalif = alerts.some(a => a.code === 'REQUALIFICATION');
    const hasProche   = alerts.some(a => a.code === 'PROCHE_TEMPS_PLEIN');
    const has12sem    = rule12 && rule12.triggered;

    if (hasRequalif) {
      const pool = MSGS_ALERT_REQUALIF;
      return pool[_nextIdx(pool)](pr, weekResult.workedH);
    }
    if (has12sem) {
      const pool = MSGS_12_SEMAINES;
      return pool[_nextIdx(pool)](pr, rule12.maxConsec);
    }
    if (hasProche) {
      const pool = MSGS_ALERT_PROCHE;
      return pool[_nextIdx(pool)](pr, weekResult.workedH);
    }

    const totalComp = weekResult.totalCompH || 0;
    if (weekResult.compH2 > 0) {
      const pool = MSGS_COMP_HIGH;
      return pool[_nextIdx(pool)](pr, totalComp);
    }
    if (totalComp > 0) {
      const pool = MSGS_COMP_LOW;
      return pool[_nextIdx(pool)](pr, totalComp, weekResult.rate1);
    }

    const pool = MSGS_NORMAL;
    return pool[_nextIdx(pool)](pr);
  },

  getPopupContent(analysis) {
    const { weekResult, rule12, isVacWeek, annualStats } = analysis || {};
    const name = _get(K.USER_NAME, '');
    const pr   = name ? name : 'toi';

    // Cache popup (1 recalcul par semaine ou si heures changent)
    const today = new Date().toISOString().slice(0,10);
    const workedKey = weekResult ? Math.round((weekResult.workedH||0)*10) : 0;
    const cacheKey = `${today}_${workedKey}`;
    const cached   = _json(K.POPUP_CACHE, {});
    if (cached.key === cacheKey && cached.msg) return cached.msg;

    let msg;

    if (isVacWeek) {
      msg = {
        titre:   '🌴 Semaine de congés',
        icon:    '🌴',
        level:   'ok',
        message: `Mizuki détecte que tu es en congé cette semaine. Tes heures complémentaires ne s'accumulent pas pendant tes vacances. Profite du repos — tes données restent intactes.`,
        actions: ['Déconnecte vraiment', 'Reviens reposée !'],
        alerte:  null,
      };
    } else if (!weekResult || weekResult.workedH <= weekResult.contractH) {
      msg = {
        titre:   '✅ Semaine conforme',
        icon:    '✅',
        level:   'ok',
        message: `Cette semaine, ${pr} respecte les heures prévues au contrat. Aucune heure complémentaire détectée. Continue à saisir chaque semaine pour que Mizuki puisse surveiller les 12 semaines consécutives.`,
        actions: ['Saisir la semaine prochaine', 'Vérifier son historique'],
        alerte:  null,
      };
    } else {
      const alerts = weekResult.alerts || [];
      const hasRequalif = alerts.some(a => a.code === 'REQUALIFICATION');
      const has12sem    = rule12 && rule12.triggered;
      const hasCap      = alerts.some(a => a.code === 'PLAFOND_CCN');

      if (hasRequalif) {
        msg = {
          titre:   '🚨 Risque de requalification',
          icon:    '🚨',
          level:   'critique',
          message: `Cette semaine tu as travaillé ${weekResult.workedH}h, soit ${LEGAL_FULL_TIME}h ou plus. La loi interdit à un employeur de faire travailler un salarié à temps partiel au niveau du temps plein sans modifier son contrat. Garde cet historique — c'est important.`,
          actions: ['Garder une trace écrite', 'Comparer avec ta fiche de paie', 'Consulter un délégué du personnel'],
          alerte: { niveau: 'critique', texte: `${weekResult.workedH}h = seuil temps plein atteint` },
        };
      } else if (has12sem) {
        msg = {
          titre:   '⚖️ Règle des 12 semaines',
          icon:    '⚖️',
          level:   'alerte',
          message: `Tu dépasses ton contrat de plus de 2h/semaine depuis ${rule12.maxConsec} semaines consécutives. D'après l'Art. L3123-13, ton employeur doit te proposer une modification de ton contrat pour augmenter ta durée de travail habituelle. Tu peux accepter ou refuser.`,
          actions: ['Demander une modification de contrat', 'Garder l\'historique des 12 semaines', 'En parler à ton employeur'],
          alerte: { niveau: 'alerte', texte: `${rule12.maxConsec} semaines consécutives > contrat +2h` },
        };
      } else if (hasCap) {
        msg = {
          titre:   '⚠️ Plafond CCN dépassé',
          icon:    '⚠️',
          level:   'vigilance',
          message: `Le nombre d'heures complémentaires dépasse la limite autorisée par ta convention collective (${Math.round((weekResult.cap||0.10)*100)}% de ton contrat). Ces heures au-delà du plafond peuvent entraîner des droits supplémentaires pour toi.`,
          actions: ['Vérifier ta fiche de paie', 'Comparer avec le plafond de ta CCN'],
          alerte: { niveau: 'vigilance', texte: `Dépassement plafond ${Math.round((weekResult.cap||0.10)*100)}%` },
        };
      } else {
        const totalComp = weekResult.totalCompH || 0;
        const comp1Amt  = weekResult.comp1Amount || 0;
        const comp2Amt  = weekResult.comp2Amount || 0;
        msg = {
          titre:   `🟡 ${totalComp}h complémentaires cette semaine`,
          icon:    '🟡',
          level:   'info',
          message: `Tu as effectué ${totalComp}h au-delà de ton contrat. ${weekResult.compH1 > 0 ? `${weekResult.compH1}h à +${Math.round((weekResult.rate1||0.10)*100)}%` : ''}${weekResult.compH2 > 0 ? ` et ${weekResult.compH2}h à +${Math.round((weekResult.rate2||0.25)*100)}%` : ''}. ${weekResult.totalAmount > 0 ? `Montant estimé : ${weekResult.totalAmount.toFixed(2)} € brut.` : ''} Vérifie que ces heures apparaissent bien sur ta prochaine fiche de paie.`,
          actions: ['Vérifier ta fiche de paie', 'Garder une trace de ces heures', 'Surveiller le cumul annuel'],
          alerte: null,
        };
      }
    }

    try { localStorage.setItem(K.POPUP_CACHE, JSON.stringify({ key: cacheKey, msg })); } catch(_) {}
    return msg;
  },

  clearCache() {
    try { localStorage.removeItem(K.POPUP_CACHE); } catch(_) {}
  }
};

const LEGAL_FULL_TIME = 35;
global.Mizuki = Mizuki;

}(typeof window !== 'undefined' ? window : global));
