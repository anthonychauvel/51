/**
 * SAISIE — Gestion du stockage et lecture des heures complémentaires M5
 * Clés localStorage préfixées M5_
 */
(function(global) {
'use strict';

const K = {
  DATA:         y => 'M5_DATA_' + y,
  CONTRACT:     'M5_CONTRACT',
  USER_NAME:    'M5_USER_NAME',
  WELCOMED:     'M5_WELCOMED',
  ACTIVE_YEAR:  'M5_ACTIVE_YEAR',
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
function _save(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch(_) {}
}

// ── Format date ───────────────────────────────────────────────────
function localDK(d) {
  const dt = d || new Date();
  return dt.getFullYear() + '-'
    + String(dt.getMonth()+1).padStart(2,'0') + '-'
    + String(dt.getDate()).padStart(2,'0');
}

function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return localDK(d);
}

function isoWeekKey(dateStr) {
  const d   = new Date(dateStr + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7;
  const thu = new Date(d); thu.setDate(d.getDate() - dow + 3);
  const yS  = new Date(thu.getFullYear(), 0, 4);
  const wk  = 1 + Math.round(((thu - yS) / 86400000 - 3 + ((yS.getDay()+6)%7)) / 7);
  return thu.getFullYear() + '-W' + String(wk).padStart(2,'0');
}

// ── Contract API ──────────────────────────────────────────────────
const Contract = {
  get() {
    return _json(K.CONTRACT, {
      hoursBase:   0,
      hourlyRate:  0,
      idcc:        0,
      ccnNom:      '',
      cap:         0.10,
      rate1:       0.10,
      rate2:       0.25,
      threshold:   0.10,
    });
  },
  save(data) {
    _save(K.CONTRACT, data);
  },
  isSet() {
    const c = this.get();
    return c.hoursBase > 0;
  }
};

// ── Data API ──────────────────────────────────────────────────────
const DataStore = {
  getYear() {
    return _get(K.ACTIVE_YEAR, String(new Date().getFullYear()));
  },

  setYear(y) {
    _set(K.ACTIVE_YEAR, String(y));
  },

  // Lire toutes les entrées d'une année
  getAll(year) {
    return _json(K.DATA(year || this.getYear()), {});
  },

  // Lire une entrée journalière
  getDay(dateStr, year) {
    const data = this.getAll(year);
    return data[dateStr] || null;
  },

  // Sauvegarder une semaine
  saveWeek(mondayStr, workedH, year) {
    const yr   = year || this.getYear();
    const data = this.getAll(yr);
    data[mondayStr] = {
      worked:    Math.round(workedH * 100) / 100,
      savedAt:   new Date().toISOString(),
    };
    _save(K.DATA(yr), data);
  },

  // Supprimer une semaine
  deleteWeek(mondayStr, year) {
    const yr   = year || this.getYear();
    const data = this.getAll(yr);
    delete data[mondayStr];
    _save(K.DATA(yr), data);
  },

  // Récupérer les semaines triées chronologiquement
  getWeeksSorted(year) {
    const data = this.getAll(year);
    return Object.entries(data)
      .filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monday, v]) => ({ monday, ...v }));
  },

  // Récupérer les 12 dernières semaines
  getLast12Weeks(year) {
    return this.getWeeksSorted(year).slice(-12);
  },

  // Statistiques annuelles
  getAnnualStats(year, contractH, ccnRules) {
    const weeks = this.getWeeksSorted(year);
    if (!weeks.length) return null;

    let totalWorked   = 0;
    let totalComp     = 0;
    let totalComp1    = 0;
    let totalComp2    = 0;
    let weeksWithComp = 0;
    let maxWorked     = 0;

    weeks.forEach(w => {
      const wh = w.worked || 0;
      totalWorked += wh;
      if (wh > maxWorked) maxWorked = wh;
      if (wh > contractH) {
        const diff = wh - contractH;
        const th1  = contractH * (ccnRules.threshold || 0.10);
        const c1   = Math.min(diff, th1);
        const c2   = Math.max(0, diff - th1);
        totalComp  += diff;
        totalComp1 += c1;
        totalComp2 += c2;
        weeksWithComp++;
      }
    });

    const avgWorked = totalWorked / weeks.length;

    return {
      totalWeeks:    weeks.length,
      weeksWithComp,
      totalWorked:   Math.round(totalWorked  * 100) / 100,
      totalComp:     Math.round(totalComp    * 100) / 100,
      totalComp1:    Math.round(totalComp1   * 100) / 100,
      totalComp2:    Math.round(totalComp2   * 100) / 100,
      avgWorked:     Math.round(avgWorked    * 100) / 100,
      maxWorked:     Math.round(maxWorked    * 100) / 100,
      pctOverContract: weeks.length > 0 ? Math.round(weeksWithComp / weeks.length * 100) : 0,
    };
  },

  // Détecter semaine vacances M4 (lecture DTE_VACANCES_)
  isVacWeek(mondayStr, year) {
    try {
      const yr  = year || this.getYear();
      const vac = JSON.parse(localStorage.getItem('DTE_VACANCES_' + yr) || '{}');
      const today = localDK(new Date());
      for (let d = 0; d < 7; d++) {
        const dt = new Date(mondayStr + 'T12:00:00');
        dt.setDate(dt.getDate() + d);
        const dk = localDK(dt);
        if (dk > today) continue;
        if (vac[dk]) return true;
      }
    } catch(_) {}
    return false;
  },

  // Exporter toutes les données en JSON
  exportJSON(year) {
    return {
      year:     year || this.getYear(),
      contract: Contract.get(),
      weeks:    this.getWeeksSorted(year),
      exported: new Date().toISOString(),
    };
  }
};

// ── Utils ─────────────────────────────────────────────────────────
function getCurrentMonday() {
  const d   = new Date();
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return localDK(d);
}

function formatMonday(mondayStr) {
  const d  = new Date(mondayStr + 'T12:00:00');
  const dn = d.getDate();
  const mn = d.toLocaleDateString('fr-FR', { month: 'long' });
  const yn = d.getFullYear();
  const fn = new Date(mondayStr + 'T12:00:00');
  fn.setDate(fn.getDate() + 4);
  const ven = fn.getDate();
  return `${dn} → ${ven} ${mn} ${yn}`;
}

function getExistingYears() {
  const years = new Set();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('M5_DATA_')) {
        const y = k.replace('M5_DATA_', '');
        if (/^\d{4}$/.test(y)) years.add(y);
      }
    }
  } catch(_) {}
  if (!years.size) years.add(String(new Date().getFullYear()));
  return [...years].sort();
}

global.M5_Contract     = Contract;
global.M5_DataStore    = DataStore;
global.M5_getCurrentMonday = getCurrentMonday;
global.M5_formatMonday     = formatMonday;
global.M5_getExistingYears = getExistingYears;
global.M5_localDK          = localDK;

}(typeof window !== 'undefined' ? window : global));
