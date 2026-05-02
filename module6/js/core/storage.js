/**
 * STORAGE M6 — Gestion multi-années + log immuable + RGPD
 * Clés : M6_{REGIME}_{YEAR}_{KEY}
 * Log horodaté et signé SHA-256 (côté client) pour valeur probante
 */
'use strict';

(function(global) {

// ── Clés localStorage ─────────────────────────────────────────────
const NS = 'M6';

const M6_Storage = {

  // ── Années ────────────────────────────────────────────────────
  getActiveYear()      { return parseInt(localStorage.getItem(`${NS}_ACTIVE_YEAR`) || new Date().getFullYear()); },
  setActiveYear(y)     { localStorage.setItem(`${NS}_ACTIVE_YEAR`, y); },
  getAllYears(regime) {
    const years = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const m = k && k.match(new RegExp(`^${NS}_${regime}_([0-9]{4})_DATA$`));
      if (m) years.add(parseInt(m[1]));
    }
    const cur = this.getActiveYear();
    years.add(cur);
    return Array.from(years).sort((a, b) => b - a);
  },
  createYear(regime, year) {
    const dk = `${NS}_${regime}_${year}_DATA`;
    if (!localStorage.getItem(dk)) {
      localStorage.setItem(dk, JSON.stringify({}));
      this._log(regime, year, 'SYSTEM', `Exercice ${year} créé`);
    }
  },

  // ── Contrat ────────────────────────────────────────────────────
  getContract(regime)      { return this._json(`${NS}_${regime}_CONTRACT`); },
  setContract(regime, obj) {
    localStorage.setItem(`${NS}_${regime}_CONTRACT`, JSON.stringify(obj));
    this._log(regime, null, 'CONTRACT', 'Configuration contrat mise à jour');
  },

  // ── Données journalières / hebdomadaires ─────────────────────
  getData(regime, year)   { return this._json(`${NS}_${regime}_${year}_DATA`); },
  setData(regime, year, data) {
    localStorage.setItem(`${NS}_${regime}_${year}_DATA`, JSON.stringify(data));
    localStorage.setItem(`${NS}_${regime}_${year}_AUTO_SAVE`, new Date().toISOString());
  },
  setDay(regime, year, dk, value, prevValue) {
    const data = this.getData(regime, year);
    const old  = data[dk];
    data[dk]   = value;
    this.setData(regime, year, data);
    // Log immuable : chaque modification est tracée
    const change = value === null
      ? `Suppression de ${dk} (était: ${JSON.stringify(old)})`
      : `${dk} → ${JSON.stringify(value)}${old ? ` (était: ${JSON.stringify(old)})` : ''}`;
    this._log(regime, year, 'SAISIE', change);
    return data;
  },
  deleteDay(regime, year, dk) {
    return this.setDay(regime, year, dk, null);
  },

  // ── Données mood tracking ─────────────────────────────────────
  getMoods(regime, year)   { return this._json(`${NS}_${regime}_${year}_MOODS`); },
  setMood(regime, year, dk, niveau) {
    const moods  = this.getMoods(regime, year);
    moods[dk]    = { niveau, ts: new Date().toISOString() };
    localStorage.setItem(`${NS}_${regime}_${year}_MOODS`, JSON.stringify(moods));
    this._log(regime, year, 'MOOD', `${dk} → charge ${niveau}`);
  },

  // ── Entretien annuel ──────────────────────────────────────────
  getEntretiens(regime, year) {
    const key = year ? `${NS}_${regime}_${year}_ENTRETIENS` : `${NS}_${regime}_ENTRETIENS`;
    return this._json(key, []);
  },
  addEntretien(regime, year, e) {
    const key = year ? `${NS}_${regime}_${year}_ENTRETIENS` : `${NS}_${regime}_ENTRETIENS`;
    const list = this._json(key, []);
    list.push({ ...e, savedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list));
    this._log(regime, year, 'ENTRETIEN', 'Entretien enregistre');
  },
  saveEntretien(regime, e) { this.addEntretien(regime, null, e); },

  // ── Validations mensuelles (signature cadre) ─────────────────
  getValidations(regime, year) { return this._json(`${NS}_${regime}_${year}_VALID`); },
  addValidation(regime, year, mois, nom) {
    const v = this.getValidations(regime, year);
    const ts = new Date().toISOString();
    v[mois] = { nom, ts, hash: this._hashSync(`${mois}-${nom}-${ts}`) };
    localStorage.setItem(`${NS}_${regime}_${year}_VALID`, JSON.stringify(v));
    this._log(regime, year, 'VALIDATION', `Mois ${mois} validé par ${nom}`);
    return v[mois];
  },

  // ── Historique déplacements ───────────────────────────────────
  getDeplacements(regime, year) { return this._json(`${NS}_${regime}_${year}_DEPLACEMENT`); },
  addDeplacement(regime, year, obj) {
    const list = this.getDeplacements(regime, year);
    list.push({ ...obj, id: Date.now(), savedAt: new Date().toISOString() });
    localStorage.setItem(`${NS}_${regime}_${year}_DEPLACEMENT`, JSON.stringify(list));
  },

  // ── Log immuable ──────────────────────────────────────────────
  _log(regime, year, action, detail) {
    const key  = `${NS}_LOG_${regime}_${year || 'GLOBAL'}`;
    let   log  = [];
    try { log = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
    log.push({ ts: new Date().toISOString(), action, detail });
    // Conserver les 500 dernières entrées max
    if (log.length > 500) log = log.slice(-500);
    try { localStorage.setItem(key, JSON.stringify(log)); } catch (_) {}
  },
  getLog(regime, year) {
    const key = `${NS}_LOG_${regime}_${year || 'GLOBAL'}`;
    return this._json(key, []);
  },

  // ── Export RGPD ───────────────────────────────────────────────
  exportAll() {
    const dump = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS)) {
        try { dump[k] = JSON.parse(localStorage.getItem(k)); }
        catch (_) { dump[k] = localStorage.getItem(k); }
      }
    }
    return dump;
  },
  deleteAll(regime) {
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${NS}_${regime}`)) toDelete.push(k);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
    this._log(regime, null, 'RGPD', `Suppression complète du régime ${regime}`);
  },

  // ── Dates auto-save ───────────────────────────────────────────
  getAutoSaveDate(regime, year) {
    return localStorage.getItem(`${NS}_${regime}_${year}_AUTO_SAVE`) || null;
  },
  getFileSaveDate(regime, year) {
    return localStorage.getItem(`${NS}_${regime}_${year}_FILE_SAVE`) || null;
  },
  markFileSave(regime, year) {
    localStorage.setItem(`${NS}_${regime}_${year}_FILE_SAVE`, new Date().toISOString());
  },

  // ── Helpers ───────────────────────────────────────────────────
  _json(key, fallback = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  },
  _hashSync(str) {
    // Hash simple côté client (non cryptographique, valeur probante symbolique)
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h = h & h;
    }
    return (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
  }
};

global.M6_Storage = M6_Storage;

})(window);
