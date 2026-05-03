/**
 * CCN-ADAPTER M6 — Pont vers conventions-collectives.js
 * Adapte les règles CCN (plafond forfait, contingent HS, taux majorations)
 * au contexte cadres du module 6.
 *
 * Utilise window.CCN_API si disponible (chargé depuis ../ccn/conventions-collectives.js)
 * Sinon, fallback sur une table interne des 20 CCN cadres les plus fréquentes.
 *
 * Sources : Code du travail L3121-41 à L3121-65, Légifrance, IDCC officiels
 */
'use strict';

(function(global) {

// ── Table interne fallback — CCN cadres fréquentes ───────────────
// Format : { idcc, nom, plafond, contingentHS, taux1, taux2, palier1, notes }
const CCN_CADRES_FALLBACK = [
  // ── Informatique / Ingénierie ────────────────────────────────
  { idcc: 787,  nom: 'Syntec',               plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Modalité 2 (forfait jours) ou Modalité 3. Entretien annuel obligatoire. Droit à la déconnexion formalisé.' },
  { idcc: 1486, nom: 'Bureaux études techniques (Syntec étendu)', plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Extension du champ Syntec. Mêmes modalités forfait.' },
  // ── Banque / Finance ─────────────────────────────────────────
  { idcc: 675,  nom: 'Banque (AFB)',          plafond: 205, contingentHS: 200, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Plafond 205j plus favorable que le légal. 14 RTT environ. Avantages bancaires spécifiques.' },
  { idcc: 2120, nom: 'Banque Populaire',      plafond: 208, contingentHS: 200, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Plafond 208j. Accord de branche avec dispositions spécifiques cadres.' },
  { idcc: 2148, nom: 'Caisse Epargne',        plafond: 207, contingentHS: 200, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Plafond 207j. Accord groupe.' },
  // ── Assurance / Mutuelles ────────────────────────────────────
  { idcc: 1867, nom: 'Assurance',             plafond: 215, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Plafond 215j. Nombreux cadres au forfait jours.' },
  { idcc: 2847, nom: 'Mutuelles',             plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Droit commun. Vérifier accord de branche mutualiste.' },
  // ── Commerce / Distribution ──────────────────────────────────
  { idcc: 1606, nom: 'Commerce de gros',      plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Droit commun. Cadres itinérants souvent en forfait.' },
  { idcc: 1505, nom: 'Grande distribution',   plafond: 216, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Accord branche. Plafond légèrement réduit.' },
  // ── Industrie ────────────────────────────────────────────────
  { idcc: 2216, nom: 'Metallurgie (accord national 2024)', plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Nouvel accord national 2024. Forfait jours harmonisé.' },
  { idcc: 44,   nom: 'Chimie',                plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Accord de branche chimie.' },
  { idcc: 176,  nom: 'Pharmacie',             plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Accord branche pharmacie.' },
  // ── Conseil / Cabinet ────────────────────────────────────────
  { idcc: 1880, nom: 'Cabinets conseils economiques', plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Cadres de conseil. Forfait jours fréquent.' },
  { idcc: 567,  nom: 'Avocats salaries',      plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Accord spécifique avocats.' },
  // ── Sante / Social ───────────────────────────────────────────
  { idcc: 51,   nom: 'Hospitalisation privee (FEHAP)', plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Cadres de santé. Accord de branche spécifique.' },
  { idcc: 2941, nom: 'Sante (Médecins salariés)', plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Médecins salariés non hospitaliers.' },
  // ── Immobilier / BTP ─────────────────────────────────────────
  { idcc: 1527, nom: 'Immobilier',            plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Accord branche immobilier.' },
  { idcc: 1596, nom: 'BTP cadres',            plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Convention spécifique cadres BTP.' },
  // ── Médias / Communication ───────────────────────────────────
  { idcc: 2265, nom: 'Presse hebdomadaire',   plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Journalistes et cadres de presse.' },
  // ── Défaut légal ─────────────────────────────────────────────
  { idcc: 0,    nom: 'Droit commun (L3121-64)', plafond: 218, contingentHS: 220, taux1: 25, taux2: 50, palier1: 8,
    notes: 'Valeurs légales minimales. Votre CCN peut prévoir des dispositions plus favorables.' },
];

// ── API interne ──────────────────────────────────────────────────
const M6_CCN_Adapter = {

  /**
   * Recherche une CCN par texte libre (nom ou IDCC).
   * Utilise CCN_API du projet parent si disponible, sinon la table fallback.
   * @param {string} query — texte libre ex: "Syntec", "787", "banque afb"
   * @returns {Array} liste de CCN matchantes { idcc, nom, plafond, contingentHS, taux1, taux2, notes }
   */
  search(query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();

    // Essayer CCN_API du projet parent
    if (window.CCN_API) {
      try {
        const results = window.CCN_API.search?.(q) || [];
        if (results.length > 0) {
          return results.slice(0, 8).map(r => this._normalize(r));
        }
      } catch(e) {}
    }

    // Fallback table interne
    return CCN_CADRES_FALLBACK.filter(ccn =>
      ccn.nom.toLowerCase().includes(q) ||
      String(ccn.idcc).includes(q)
    ).slice(0, 6);
  },

  /**
   * Retourne la CCN correspondant à un label/IDCC exact, ou le droit commun.
   * @param {string|number} labelOrIdcc
   */
  get(labelOrIdcc) {
    if (!labelOrIdcc) return this._getDroitCommun();

    const q = String(labelOrIdcc).toLowerCase().trim();

    // Essayer CCN_API
    if (window.CCN_API) {
      try {
        const idcc = parseInt(q);
        if (!isNaN(idcc) && idcc > 0) {
          const r = window.CCN_API.getByIdcc?.(idcc);
          if (r) return this._normalize(r);
        }
        const r = window.CCN_API.search?.(q)?.[0];
        if (r) return this._normalize(r);
      } catch(e) {}
    }

    // Fallback
    const found = CCN_CADRES_FALLBACK.find(c =>
      c.nom.toLowerCase().includes(q) || String(c.idcc) === q
    );
    return found || this._getDroitCommun();
  },

  /**
   * Construit les paramètres de contrat M6 depuis une CCN.
   * Utilisé pour pré-remplir le formulaire de setup.
   */
  buildContractDefaults(ccn) {
    return {
      plafond:          ccn.plafond      || 218,
      contingentHS:     ccn.contingentHS || 220,
      taux1:            ccn.taux1        || 25,
      taux2:            ccn.taux2        || 50,
      palier1:          ccn.palier1      || 8,
      ccnLabel:         ccn.nom          || 'Droit commun',
      ccnIdcc:          ccn.idcc         || 0,
      ccnNotes:         ccn.notes        || '',
    };
  },

  /**
   * Retourne les alertes CCN-spécifiques pour un forfait donné.
   */
  getAlertes(ccnLabel, joursEffectifs, plafond) {
    const ccn = this.get(ccnLabel);
    const alertes = [];

    if (ccn.plafond && ccn.plafond < plafond) {
      alertes.push({
        niveau: 'warning',
        titre:  `CCN ${ccn.nom} — plafond réduit`,
        texte:  `Votre CCN prévoit un plafond de ${ccn.plafond}j (inférieur au légal de 218j). Votre contrat doit respecter ce plafond plus favorable.`,
        loi:    'L3121-64 al.1',
      });
    }
    if (ccn.notes) {
      alertes.push({
        niveau: 'info',
        titre:  `Information CCN ${ccn.nom}`,
        texte:  ccn.notes,
        loi:    `IDCC ${ccn.idcc}`,
      });
    }
    return alertes;
  },

  /**
   * Rend un autocomplete CCN dans un container.
   * @param {HTMLElement} inputEl  — champ texte
   * @param {HTMLElement} dropEl   — div dropdown
   * @param {function}    onSelect — callback(ccn)
   */
  bindAutocomplete(inputEl, dropEl, onSelect) {
    if (!inputEl || !dropEl) return;
    let timer;
    inputEl.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const q = inputEl.value;
        const results = this.search(q);
        if (!results.length) { dropEl.style.display = 'none'; return; }
        dropEl.innerHTML = results.map((r, i) =>
          `<div data-idx="${i}" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--ivoire-2);font-size:0.82rem">
            <div style="font-weight:500">${r.nom}</div>
            <div style="font-size:0.7rem;color:var(--pierre)">IDCC ${r.idcc} · Plafond ${r.plafond}j · Contingent ${r.contingentHS}h</div>
          </div>`
        ).join('');
        dropEl.style.display = 'block';
        dropEl.querySelectorAll('[data-idx]').forEach(el => {
          el.addEventListener('click', () => {
            const ccn = results[parseInt(el.dataset.idx)];
            inputEl.value = ccn.nom;
            dropEl.style.display = 'none';
            onSelect(ccn);
          });
          el.addEventListener('mouseover', () => el.style.background = 'var(--ivoire)');
          el.addEventListener('mouseout',  () => el.style.background = '');
        });
      }, 200);
    });
    document.addEventListener('click', e => {
      if (!dropEl.contains(e.target) && e.target !== inputEl) dropEl.style.display = 'none';
    });
  },

  // ── Helpers privés ───────────────────────────────────────────
  _normalize(r) {
    // Convertir un objet CCN_API (projet parent) au format M6
    return {
      idcc:         r.idcc || r.IDCC || 0,
      nom:          r.libelle || r.nom || r.title || 'Convention collective',
      plafond:      r.forfaitJoursPlafond || r.plafond || 218,
      contingentHS: r.contingent || r.contingentHS || 220,
      taux1:        r.taux1 || 25,
      taux2:        r.taux2 || 50,
      palier1:      r.palier1 || 8,
      notes:        r.notes || r.info || '',
    };
  },

  _getDroitCommun() {
    return CCN_CADRES_FALLBACK.find(c => c.idcc === 0);
  },
};

global.M6_CCN_Adapter       = M6_CCN_Adapter;
global.M6_CCN_CADRES_TABLE  = CCN_CADRES_FALLBACK;

})(window);
