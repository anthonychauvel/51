/**
 * CCN_PARTIEL — Base de données conventions collectives pour heures complémentaires
 * Secteurs les plus concernés par le temps partiel en France
 * Source : Code du travail Art. L3123-9 à L3123-28 + accords de branche
 */
(function(global) {
'use strict';

// Règles par défaut (droit commun sans accord de branche)
const DEFAULT_RULES = {
  cap: 0.10,          // plafond 10% de la durée contractuelle
  rate1: 0.10,        // majoration 10% jusqu'au 1/10e
  rate2: 0.25,        // majoration 25% au-delà
  threshold: 0.10,    // seuil de bascule entre rate1 et rate2
  notice: 3,          // délai de prévenance en jours ouvrés
};

const CCN_PARTIEL_DB = [
  // ── COMMERCE ────────────────────────────────────────────────────
  {
    idcc: 1505, nom: 'Commerce de détail non alimentaire',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'commerce'
  },
  {
    idcc: 2216, nom: 'Commerce de détail alimentaire',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'commerce'
  },
  {
    idcc: 1147, nom: 'Grande distribution (hypermarchés)',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'commerce'
  },
  {
    idcc: 2120, nom: 'Commerce de gros',
    cap: 0.10, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'commerce'
  },
  // ── HÔTELLERIE RESTAURATION ─────────────────────────────────────
  {
    idcc: 1979, nom: 'Hôtels, Cafés, Restaurants (HCR)',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'hcr'
  },
  {
    idcc: 2264, nom: 'Restauration rapide',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'hcr'
  },
  {
    idcc: 1501, nom: 'Boulangeries-pâtisseries artisanales',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'hcr'
  },
  // ── SERVICES À LA PERSONNE ───────────────────────────────────────
  {
    idcc: 3239, nom: 'Particuliers employeurs et emploi à domicile',
    cap: 0.10, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'services'
  },
  {
    idcc: 2941, nom: 'Aide à domicile (BAD)',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'services'
  },
  {
    idcc: 2770, nom: 'Aide à domicile (AAMD)',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'services'
  },
  // ── NETTOYAGE ────────────────────────────────────────────────────
  {
    idcc: 3043, nom: 'Entreprises de propreté et nettoyage',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'nettoyage'
  },
  // ── SANTÉ / MÉDICO-SOCIAL ────────────────────────────────────────
  {
    idcc: 51, nom: 'Hospitalisation privée (FEHAP)',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'sante'
  },
  {
    idcc: 2264, nom: 'Établissements pour personnes handicapées (SNAPEI)',
    cap: 0.33, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'sante'
  },
  {
    idcc: 2128, nom: 'Pharmacies d\'officine',
    cap: 0.10, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'sante'
  },
  // ── TRANSPORT ────────────────────────────────────────────────────
  {
    idcc: 16, nom: 'Transports routiers',
    cap: 0.10, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'transport'
  },
  // ── INTÉRIM / TRAVAIL TEMPORAIRE ─────────────────────────────────
  {
    idcc: 1413, nom: 'Travail temporaire',
    cap: 0.10, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'interim'
  },
  // ── BUREAUX D'ÉTUDES / SYNTEC ────────────────────────────────────
  {
    idcc: 1486, nom: 'Bureaux d\'études techniques (Syntec)',
    cap: 0.10, rate1: 0.25, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'bureau'
  },
  // ── AUTRE ────────────────────────────────────────────────────────
  {
    idcc: 0, nom: 'Droit commun (sans accord de branche)',
    cap: 0.10, rate1: 0.10, rate2: 0.25, threshold: 0.10, notice: 3,
    secteur: 'autre'
  },
];

const CCN_PARTIEL_API = {
  getAll() { return CCN_PARTIEL_DB; },

  getById(idcc) {
    return CCN_PARTIEL_DB.find(c => c.idcc === parseInt(idcc)) || null;
  },

  getRules(idcc) {
    const ccn = this.getById(idcc);
    return ccn || { ...DEFAULT_RULES, idcc: 0, nom: 'Droit commun', secteur: 'autre' };
  },

  getBySecteur(secteur) {
    return CCN_PARTIEL_DB.filter(c => c.secteur === secteur);
  },

  getSecteurs() {
    return [
      { id: 'commerce',   label: 'Commerce & Distribution',    icon: '🛒' },
      { id: 'hcr',        label: 'Hôtellerie & Restauration',  icon: '🍽️' },
      { id: 'services',   label: 'Services à la personne',     icon: '🏠' },
      { id: 'nettoyage',  label: 'Propreté & Nettoyage',       icon: '🧹' },
      { id: 'sante',      label: 'Santé & Médico-social',      icon: '🏥' },
      { id: 'transport',  label: 'Transport',                   icon: '🚛' },
      { id: 'interim',    label: 'Intérim',                    icon: '📋' },
      { id: 'bureau',     label: 'Bureaux d\'études',          icon: '💻' },
      { id: 'autre',      label: 'Autre / Droit commun',       icon: '⚖️' },
    ];
  }
};

global.CCN_PARTIEL_API = CCN_PARTIEL_API;
global.CCN_PARTIEL_DB  = CCN_PARTIEL_DB;

}(typeof window !== 'undefined' ? window : global));
