/**
 * CONVENTIONS CADRES — MODULE 6
 * ==============================
 * Version : 1.0.0 — Mai 2026
 * Sources : Code du travail, Légifrance, IDCC DGT, jurisprudence sociale
 *
 * Ce fichier est PROPRE AU MODULE 6 (Cadres) et couvre :
 *
 *   1. FORFAIT JOURS — Données spécifiques cadres par CCN :
 *      plafond, taux de rachat, entretien, suivi de charge,
 *      droit à la déconnexion, RTT, alertes légales
 *
 *   2. CADRES DIRIGEANTS (L3111-2) — Qualification CD par CCN :
 *      critères, rémunération minimale, entretien de charge, droits maintenus
 *
 *   3. FORFAIT HEURES — Délégation au fichier CCN commun (racine)
 *      window.CCN_API depuis ../ccn/conventions-collectives.js
 *      (partagé avec les 5 autres modules — ne pas modifier)
 *
 * ARCHITECTURE :
 *   CCN_FJ_DATA    : ~80 CCN avec données forfait jours
 *   CCN_CD_DATA    : ~40 CCN avec données cadres dirigeants
 *   CCN_CADRES_API : API publique (window.CCN_CADRES_API)
 *
 * USAGE :
 *   window.CCN_CADRES_API.searchForfaitJours("syntec")
 *   window.CCN_CADRES_API.getForfaitJours(1486)
 *   window.CCN_CADRES_API.searchCadreDirigeant("banque")
 *   window.CCN_CADRES_API.getHSRules(1486)   // → délègue à window.CCN_API
 *
 * NOTE : Le fichier racine ../ccn/conventions-collectives.js est partagé
 *        avec les modules 1-5 et ne doit PAS être modifié.
 */
'use strict';

(function(global) {

// ═══════════════════════════════════════════════════════════════════
// 1. TABLE FORFAIT JOURS — données spécifiques par CCN
//    Champs :
//    idcc         {number}   IDCC officiel (0 = droit commun)
//    nom          {string}   Nom court de la CCN
//    secteur      {string}   Secteur d'activité
//    plafond      {number}   Plafond annuel en jours (≤218)
//    plafondCDRef {number}   Plafond de référence pour le suivi CD (souvent 218)
//    tauxRachat   {number}   Taux de majoration minimum rachat (% — légal min 10)
//    entretienFreq{string}   'annuel'|'semestriel'|'trimestriel'
//    entretienRef {string}   Référence légale/conventionnelle de l'entretien
//    clauseDeconn {boolean}  Clause de droit à la déconnexion formalisée
//    suiviCharge  {string}   Référence suivi de charge spécifique
//    rttRef       {string}   Base de calcul RTT conventionnelle si spécifique
//    alertes      {string[]} Points de vigilance à afficher dans l'appli
//    notes        {string}   Note informative affichée à l'utilisateur
// ═══════════════════════════════════════════════════════════════════
const CCN_FJ_DATA = [

  // ── DROIT COMMUN ────────────────────────────────────────────────
  {
    idcc: 0, nom: 'Droit commun (L3121-64)', secteur: 'Tous secteurs',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: [
      'Plafond légal : 218 jours/an (hors CP, RTT, fériés)',
      'Entretien annuel obligatoire : charge de travail, amplitude, équilibre vie pro/perso, droit à la déconnexion',
      'Avenant écrit obligatoire avant tout rachat (Art. L3121-59)',
      'Majoration rachat minimum 10% du salaire journalier (Art. L3121-59)',
    ],
    notes: 'Base légale applicable à toute entreprise sans convention collective ou sans accord de branche spécifique au forfait jours. Vérifiez si votre CCN prévoit des dispositions plus favorables.',
  },

  // ── IT / INGÉNIERIE / CONSEIL ────────────────────────────────────
  {
    idcc: 1486, nom: 'Syntec (Bureaux études, Informatique, Ingénierie)', secteur: 'IT / Ingénierie / Conseil',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'semestriel', entretienRef: 'Accord Syntec 22/06/1999 art. 3 + avenant 2014',
    clauseDeconn: true, suiviCharge: 'Art. 3 accord cadres Syntec 22/06/1999',
    rttRef: 'Accord ARTT Syntec — modalité 2 (ETAM) ou modalité 3 (ingénieurs-cadres)',
    alertes: [
      '⚠️ SYNTEC : Entretien de charge SEMESTRIEL obligatoire (art. 3 accord 22/06/1999)',
      'Modalité 2 (ETAM cadres 37-38.5h) : plafond 218j — Modalité 3 (ingénieurs-cadres IC) : forfait jours pur',
      'Droit à la déconnexion formalisé depuis l\'avenant du 19 novembre 2014',
      'Alerte si amplitude régulièrement > 10h : obligation de signalement au manager',
      'Clause de conscience possible si désaccord sur la charge (accord branche 2023)',
    ],
    notes: 'CCN la plus fréquente pour les cadres IT/conseil. L\'accord Syntec du 22/06/1999 est plus contraignant que le légal : entretiens semestriels (et non annuels), suivi de la charge toutes les 6 semaines. Un mode accord de branche est disponible pour les entreprises ayant signé un accord dérogatoire.',
  },
  {
    idcc: 787, nom: 'Syntec (brochure 3018 — IDCC 787)', secteur: 'IT / Ingénierie / Conseil',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'semestriel', entretienRef: 'Accord Syntec 22/06/1999',
    clauseDeconn: true, suiviCharge: 'Art. 3 accord Syntec',
    alertes: ['⚠️ Identique IDCC 1486 — même accord cadres Syntec', 'Entretien semestriel obligatoire'],
    notes: 'Même convention que IDCC 1486 (Syntec). Référez-vous à la notice IDCC 1486.',
  },
  {
    idcc: 2642, nom: 'Publicité / Communication / Agences', secteur: 'Communication',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65 + accord branche publicité',
    clauseDeconn: true, suiviCharge: 'Art. L3121-65',
    alertes: ['Accord branche publicité 2018 : droit à la déconnexion renforcé', 'Forfait jours fréquent pour les cadres créatifs et commerciaux'],
    notes: 'CCN publicité (IDCC 2642). Droit à la déconnexion formalisé par accord de branche 2018. Entretien annuel légal minimum.',
  },
  {
    idcc: 1678, nom: 'Services informatiques et numérique (hors Syntec)', secteur: 'IT Numérique',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Vérifier si un accord de branche ou d\'entreprise prévoit des dispositions spécifiques', 'Droit commun applicable à défaut'],
    notes: 'Pour les entreprises du numérique non couvertes par Syntec. Droit commun L3121-64.',
  },

  // ── BANQUE / FINANCE ────────────────────────────────────────────
  {
    idcc: 675, nom: 'Banque (AFB — Association Française des Banques)', secteur: 'Banque',
    plafond: 205, plafondCDRef: 218, tauxRachat: 25,
    entretienFreq: 'annuel', entretienRef: 'Accord de branche AFB 1999 + avenant 2008',
    clauseDeconn: true, suiviCharge: 'Accord AFB suivi forfait',
    alertes: [
      '✅ Plafond RÉDUIT à 205 jours (plus favorable que le légal 218j)',
      '⚠️ Taux de rachat minimum 25% (vs 10% légal) — plus favorable pour le salarié',
      'Droit à la déconnexion : accord de branche AFB 2020',
      'Environ 14 RTT générés annuellement selon l\'accord AFB',
    ],
    notes: 'CCN Banque AFB (IDCC 675). Plafond 205j et taux de rachat 25% minimum sont deux dispositions PLUS FAVORABLES que le légal. Votre contrat ne peut pas déroger à ces planchers.',
  },
  {
    idcc: 2120, nom: 'Banques Populaires', secteur: 'Banque mutualiste',
    plafond: 208, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Accord groupe Banques Populaires',
    clauseDeconn: true, suiviCharge: 'Accord groupe',
    alertes: ['Plafond réduit 208j (accord groupe)', 'Vérifiez l\'accord d\'établissement de votre caisse régionale'],
    notes: 'Accord groupe Banques Populaires. Plafond 208j. Chaque caisse régionale peut avoir un accord d\'établissement spécifique.',
  },
  {
    idcc: 2148, nom: 'Caisses d\'Épargne', secteur: 'Banque mutualiste',
    plafond: 207, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Accord groupe Caisses d\'Épargne',
    clauseDeconn: true, suiviCharge: 'Accord groupe',
    alertes: ['Plafond 207j (accord groupe)', 'Accord de branche BPCE à vérifier'],
    notes: 'Groupe BPCE / Caisses d\'Épargne. Plafond 207j conventionnel.',
  },
  {
    idcc: 1978, nom: 'Crédit Mutuel', secteur: 'Banque mutualiste',
    plafond: 210, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Accord groupe Crédit Mutuel',
    clauseDeconn: true, suiviCharge: 'Accord groupe',
    alertes: ['Plafond 210j (accord groupe)', 'Vérifier accord fédéral CM applicable'],
    notes: 'Groupe Crédit Mutuel. Plafond conventionnel 210j. Accord fédéral variable selon la caisse.',
  },
  {
    idcc: 1850, nom: 'Expertise comptable / Commissariat aux comptes', secteur: 'Finance / Audit',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN expertise comptable Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Forte variabilité de charge en période de clôture (nov-avr) à déclarer', 'Attention aux amplitudes lors des audits et clôtures'],
    notes: 'CCN Expertise comptable (IDCC 1850). Droit commun du forfait jours. Périodes de surcharge prévisibles à anticiper dans l\'entretien annuel.',
  },
  {
    idcc: 1672, nom: 'Assurances (Sociétés d\'assurance)', secteur: 'Assurance',
    plafond: 215, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Accord branche assurances + avenant 2017',
    clauseDeconn: true, suiviCharge: 'Accord branche assurances suivi charge',
    alertes: ['Plafond réduit 215j (accord de branche)', 'Contingent HS réduit 70h (très faible — forfait jours préféré)'],
    notes: 'CCN Assurances (IDCC 1672). Plafond 215j — plus favorable que le légal. Très forte proportion de cadres en forfait jours dans ce secteur.',
  },
  {
    idcc: 2615, nom: 'Courtage en assurance et réassurance', secteur: 'Assurance',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Droit commun — vérifier accord d\'entreprise éventuel'],
    notes: 'Courtage en assurance. Droit commun L3121-64.',
  },
  {
    idcc: 478, nom: 'Sociétés financières / Établissements financiers', secteur: 'Finance',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Droit commun applicable', 'Vérifier accord d\'entreprise spécifique'],
    notes: 'Établissements financiers (IDCC 478). Droit commun du forfait jours.',
  },

  // ── INDUSTRIE ───────────────────────────────────────────────────
  {
    idcc: 3248, nom: 'Métallurgie (Accord National Unique 2023)', secteur: 'Industrie métallurgie',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'ANU Métallurgie 2023 — Titre VI',
    clauseDeconn: true, suiviCharge: 'ANU Métallurgie Titre VI suivi charge',
    alertes: [
      '⚠️ Nouvel ANU Métallurgie 2023 : régime transitoire jusqu\'au 31/12/2025',
      'Intégration des anciens accords de branche (ex: UIMM) dans l\'ANU',
      'Droit à la déconnexion formalisé dans l\'ANU Titre VIII',
      'Entretien annuel renforcé par l\'ANU — vérifier la convention d\'entreprise',
    ],
    notes: 'Accord National Unique de la Métallurgie (IDCC 3248 depuis 2023). Regroupe +200 anciennes CCN du secteur. Transition complète au 31/12/2025.',
  },
  {
    idcc: 44, nom: 'Industries chimiques', secteur: 'Chimie',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN Chimie Art. L3121-65 + accord branche 2001',
    clauseDeconn: false, suiviCharge: 'Accord branche chimie SOLVANTS 2001',
    alertes: ['Accord de branche chimie 2001 sur la réduction du temps de travail applicable', 'RTT calculés selon l\'accord de branche'],
    notes: 'Industries chimiques (IDCC 44). Accord de branche 2001 sur les 35h avec accord RTT spécifique pour les cadres.',
  },
  {
    idcc: 216, nom: 'Industrie pharmaceutique', secteur: 'Pharmacie industrie',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN Pharma L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Accord de branche pharmaceutique — vérifier la déclinaison entreprise', 'Forte proportion de cadres itinérants : amplitude à surveiller'],
    notes: 'Industrie pharmaceutique (IDCC 216). Droit commun du forfait jours. Nombreux accords d\'entreprise dans les grandes groupes pharma.',
  },
  {
    idcc: 669, nom: 'Industrie du pétrole', secteur: 'Énergie pétrolière',
    plafond: 218, plafondCDRef: 218, tauxRachat: 30,
    entretienFreq: 'annuel', entretienRef: 'CCN Pétrole + accord branche UFIP',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['⚠️ Taux de rachat minimum 30% (taux HS +1 pétrole) — plus favorable', 'Accord UFIP sur l\'organisation du travail des cadres'],
    notes: 'Industrie du pétrole (IDCC 669). Taux de majoration HS à 30% — par analogie le taux de rachat du forfait est généralement aligné.',
  },
  {
    idcc: 292, nom: 'Plasturgie', secteur: 'Industrie plastique',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Vérifier accord d\'entreprise spécifique'],
    notes: 'Plasturgie (IDCC 292). Droit commun.',
  },

  // ── BTP / ARCHITECTURE ───────────────────────────────────────────
  {
    idcc: 267, nom: 'BTP — Ingénieurs et Cadres', secteur: 'Bâtiment Travaux Publics',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN BTP cadres Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: [
      'Convention spécifique aux ingénieurs et cadres du BTP (≠ CCN ouvriers/ETAM)',
      'Déplacements fréquents sur chantier : amplitude à surveiller',
      'Astreintes chantier : à inclure dans le suivi de charge',
    ],
    notes: 'CCN Ingénieurs et cadres du BTP (IDCC 267). Régime forfait jours fréquent pour les cadres de chantier et les directeurs de projet.',
  },
  {
    idcc: 2609, nom: 'Architecture — Cabinets', secteur: 'Architecture',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN Architecture L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Surcharge fréquente lors des phases de dépôt de permis', 'Amplitude à surveiller en période de rendu'],
    notes: 'Cabinets d\'architecture (IDCC 2609). Droit commun du forfait jours.',
  },

  // ── COMMERCE / DISTRIBUTION ──────────────────────────────────────
  {
    idcc: 1606, nom: 'Commerce de gros (toutes branches)', secteur: 'Commerce de gros',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Cadres itinérants : amplitude à déclarer par zone géographique', 'Déplacements à comptabiliser séparément'],
    notes: 'Commerce de gros. Droit commun du forfait jours.',
  },
  {
    idcc: 2216, nom: 'Grande distribution alimentaire (GDA)', secteur: 'Grande distribution',
    plafond: 216, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Accord branche GDA + Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Accord branche GDA suivi cadres',
    alertes: ['Plafond réduit 216j pour les cadres en forfait', 'Pics d\'activité saisonniers (fêtes, saisons) à anticiper dans l\'entretien'],
    notes: 'Grande distribution alimentaire (IDCC 2216). Plafond conventionnel 216j.',
  },

  // ── IMMOBILIER / JURIDIQUE ───────────────────────────────────────
  {
    idcc: 1527, nom: 'Immobilier — Agents, Gestionnaires, Syndics', secteur: 'Immobilier',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN Immobilier Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Pics d\'activité liés aux saisons immobilières (printemps/automne)', 'Cadres commerciaux souvent en forfait jours'],
    notes: 'Immobilier (IDCC 1527). Droit commun du forfait jours. Nombreux accords d\'entreprise dans les grands réseaux.',
  },
  {
    idcc: 1966, nom: 'Promotion immobilière', secteur: 'Immobilier promotion',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Amplitude à surveiller en phase de livraison de programme'],
    notes: 'Promotion immobilière (IDCC 1966). Droit commun.',
  },
  {
    idcc: 218, nom: 'Cabinets d\'avocats', secteur: 'Juridique',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN Avocats Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['⚠️ Distinction avocats collaborateurs (indépendants) / salariés — seuls les salariés sont soumis au forfait jours', 'Amplitude très élevée en cabinet fréquente : entretien de charge recommandé trimestriellement'],
    notes: 'Cabinets d\'avocats (IDCC 218). Uniquement les avocats salariés. Les collaborateurs libéraux ne sont pas couverts.',
  },
  {
    idcc: 1965, nom: 'Notariat', secteur: 'Juridique',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN Notariat Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Pics en période de fin d\'exercice fiscal et succession à surveiller'],
    notes: 'Notariat (IDCC 1965). Droit commun du forfait jours pour les cadres notariaux.',
  },

  // ── SANTÉ / MÉDICO-SOCIAL ────────────────────────────────────────
  {
    idcc: 413, nom: 'Hospitalisation privée à but lucratif (cliniques)', secteur: 'Santé privée',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN Hospitalisation privée L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['⚠️ Astreintes fréquentes : à inclure dans le suivi de charge (L3121-9)', 'Garde administrative et médicale : amplitude à comptabiliser'],
    notes: 'Hospitalisation privée (IDCC 413). Cadres administratifs et médecins salariés en forfait jours. Astreintes à déclarer.',
  },
  {
    idcc: 29, nom: 'Hospitalisation privée non lucrative (FEHAP — CCN51)', secteur: 'Médico-social',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN 51 FEHAP L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['FEHAP : vérifier l\'accord de branche spécifique cadres 2012', 'Cadres des établissements FEHAP souvent en forfait jours'],
    notes: 'CCN 51 FEHAP (IDCC 29). Secteur médico-social non lucratif. Accord de branche 2012 pour les cadres.',
  },
  {
    idcc: 1921, nom: 'CCNT 66 — Inadaptés / Handicapés', secteur: 'Médico-social',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCNT 66 L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Accord ARTT CCNT 66 de 1999 : vérifier les modalités pour les cadres'],
    notes: 'CCNT 66 (IDCC 1921). Convention nationale inadaptés, personnes handicapées.',
  },

  // ── TRANSPORT / LOGISTIQUE ───────────────────────────────────────
  {
    idcc: 16, nom: 'Transport routier de marchandises', secteur: 'Transport',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN Transport routier Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: [
      '⚠️ Distinction cadres administratifs (forfait jours possible) et personnel roulant (régime heures spécifique)',
      'Cadres itinérants : déplacements à déclarer systématiquement',
      'Temps de conduite à exclure du forfait jours (L3312-1)',
    ],
    notes: 'Transport routier (IDCC 16). Le forfait jours ne concerne que les cadres sédentaires et les cadres de direction. Le personnel roulant relève d\'un régime spécifique.',
  },
  {
    idcc: 1611, nom: 'Logistique et entreposage', secteur: 'Logistique',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Pics en période de fêtes (T4) à déclarer', 'Cadres de direction logistique souvent en forfait'],
    notes: 'Logistique entreposage (IDCC 1611). Droit commun.',
  },

  // ── MÉDIAS / PRESSE / ÉDITION ────────────────────────────────────
  {
    idcc: 1480, nom: 'Presse quotidienne nationale', secteur: 'Presse',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN PQN L3121-65',
    clauseDeconn: true, suiviCharge: 'Accord PQN déconnexion 2019',
    alertes: ['Accord déconnexion PQN 2019 applicable', 'Pics liés à l\'actualité : amplitude variable'],
    notes: 'Presse quotidienne nationale (IDCC 1480). Droit à la déconnexion formalisé.',
  },
  {
    idcc: 1309, nom: 'Presse quotidienne régionale', secteur: 'Presse régionale',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Droit commun — vérifier accord d\'entreprise'],
    notes: 'Presse quotidienne régionale (IDCC 1309). Droit commun.',
  },
  {
    idcc: 3090, nom: 'Édition — Livres, Presse, Multimédia', secteur: 'Édition',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Pics de charge en période de rentrée littéraire (août-sept)'],
    notes: 'Édition (IDCC 3090). Droit commun du forfait jours.',
  },
  {
    idcc: 1780, nom: 'Radiodiffusion / Audiovisuel', secteur: 'Audiovisuel',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: true, suiviCharge: 'Accord audiovisuel déconnexion',
    alertes: ['Droit à la déconnexion formalisé dans la branche audiovisuel'],
    notes: 'Radiodiffusion / audiovisuel public et privé (IDCC 1780). Accord déconnexion branche.',
  },

  // ── FORMATION / ENSEIGNEMENT ─────────────────────────────────────
  {
    idcc: 1516, nom: 'Formation professionnelle continue', secteur: 'Formation',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN Formation professionnelle Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Pics de charge en début et fin d\'exercice budgétaire', 'Formateurs-consultants : confirmer le statut salarié cadre'],
    notes: 'Formation professionnelle (IDCC 1516). Droit commun du forfait jours.',
  },

  // ── SERVICES / TERTIAIRE ─────────────────────────────────────────
  {
    idcc: 1734, nom: 'Prestataires de services — Secteur tertiaire', secteur: 'Services tertiaires',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Droit commun', 'Vérifier accord d\'entreprise'],
    notes: 'Prestataires services tertiaires (IDCC 1734). Droit commun.',
  },
  {
    idcc: 2596, nom: 'Portage salarial', secteur: 'Portage / Freelance',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: [
      '⚠️ En portage salarial, le cadre porté est généralement autonome dans la gestion de son temps',
      'Vérifier que l\'accord de portage prévoit bien le forfait jours',
    ],
    notes: 'Portage salarial (IDCC 2596). Le salarié porté cadre est soumis aux règles du forfait jours si son contrat le prévoit.',
  },

  // ── ÉNERGIE ─────────────────────────────────────────────────────
  {
    idcc: 1413, nom: 'Gaz naturel — Distributeurs', secteur: 'Énergie gaz',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Astreintes de sécurité à déclarer dans le suivi de charge'],
    notes: 'Distributeurs de gaz naturel (IDCC 1413). Droit commun.',
  },

  // ── TOURISME / SPORT ─────────────────────────────────────────────
  {
    idcc: 2511, nom: 'Sport — Entreprises du secteur sportif', secteur: 'Sport',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Cadres sportifs : statut spécifique selon discipline', 'Amplitude variable (compétitions, stages)'],
    notes: 'Secteur sportif (IDCC 2511). Droit commun. Vérifier si un accord de branche sport spécifique est applicable.',
  },

  // ── SÉCURITÉ PRIVÉE ──────────────────────────────────────────────
  {
    idcc: 1351, nom: 'Sécurité privée — Gardiennage', secteur: 'Sécurité privée',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['⚠️ Forfait jours rare dans ce secteur — concerne principalement les cadres de direction', 'Agents et superviseurs : régime horaire généralement applicable'],
    notes: 'Sécurité privée (IDCC 1351). Le forfait jours ne concerne que les cadres de direction au sens L3111-2 ou les cadres dirigeants des groupes.',
  },

  // ── PROPRETÉ ─────────────────────────────────────────────────────
  {
    idcc: 3186, nom: 'Nettoyage — Entreprises de propreté', secteur: 'Propreté',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: ['Forfait jours principalement pour les directeurs régionaux et directeurs de sites', 'Cadres opérationnels souvent en horaire'],
    notes: 'Entreprises de propreté (IDCC 3186). Forfait jours pour les cadres de direction.',
  },

  // ── HCR ─────────────────────────────────────────────────────────
  {
    idcc: 1979, nom: 'Hôtels Cafés Restaurants (HCR)', secteur: 'Hôtellerie-Restauration',
    plafond: 218, plafondCDRef: 218, tauxRachat: 10,
    entretienFreq: 'annuel', entretienRef: 'CCN HCR Art. L3121-65',
    clauseDeconn: false, suiviCharge: 'Art. L3121-65',
    alertes: [
      '⚠️ HCR : forfait jours principalement pour les directeurs d\'établissement et cadres de direction',
      'Employés et techniciens : régime HCR spécifique (3 paliers) — PAS de forfait jours',
      'Amplitude très variable (soirées, week-ends) : déclarer systématiquement',
    ],
    notes: 'HCR (IDCC 1979). Le forfait jours est réservé aux cadres autonomes (directeurs, directeurs adjoints). Vérifier l\'accord collectif d\'établissement.',
  },

];

// ═══════════════════════════════════════════════════════════════════
// 2. TABLE CADRES DIRIGEANTS (L3111-2) — données par CCN
//    Champs :
//    idcc          {number}   IDCC
//    nom           {string}   Nom CCN
//    secteur       {string}   Secteur
//    critereCD     {string}   Critères de qualification CD dans cette CCN
//    rmgCD         {string}   Rémunération minimale garantie CD (si définie)
//    entretienCD   {string}   Obligation entretien de charge pour CD
//    droitsCP      {string}   Jours de CP maintenus
//    alertesCD     {string[]} Alertes spécifiques CD
//    notesCD       {string}   Note informative CD
// ═══════════════════════════════════════════════════════════════════
const CCN_CD_DATA = [

  // ── BASE LÉGALE ─────────────────────────────────────────────────
  {
    idcc: 0, nom: 'Droit commun (L3111-2)', secteur: 'Tous secteurs',
    critereCD: 'Pouvoir de direction effectif sur l\'entreprise ou un secteur important. Rémunération globale parmi les plus élevées. Indépendance réelle dans l\'organisation du travail. CUMULATIF — les 3 critères sont requis (Cass. Soc. 31/01/2012)',
    rmgCD: 'Aucun minimum légal fixé — mais la rémunération doit être parmi les plus élevées de l\'entreprise (critère jurisprudentiel)',
    entretienCD: 'Pas d\'obligation légale formelle pour les CD, mais recommandé pour l\'équilibre vie pro/perso (Art. L4121-1)',
    droitsCP: '25 jours ouvrables minimum (L3141-1) — droits CP maintenus intégralement',
    alertesCD: [
      '⚠️ Le statut CD est CUMULATIF : les 3 critères L3111-2 doivent être réunis simultanément',
      'Un salarié mal classifié CD peut prétendre au régime des heures supplémentaires (Cass. Soc. 2011)',
      'Pas de compteur d\'heures légal mais obligation de sécurité de l\'employeur (L4121-1)',
      '218 jours dépassés : indicateur d\'alerte pour l\'employeur — entretien recommandé',
      'Protection contre le licenciement, maternité, maladie : identique aux autres cadres',
    ],
    notesCD: 'Le régime du cadre dirigeant exclut les règles sur la durée du travail (durée légale 35h, HS, repos compensateur). En revanche, CP, protection maladie/maternité et médecine du travail restent applicables.',
  },

  // ── IT / INGÉNIERIE ─────────────────────────────────────────────
  {
    idcc: 1486, nom: 'Syntec — Cadres Dirigeants', secteur: 'IT / Ingénierie / Conseil',
    critereCD: 'Syntec ne définit pas de critères CD spécifiques : application stricte L3111-2. En pratique : membres du CODIR, DG, DAF, DRH. Rémunération niveau IC (Ingénieur Confirmé) position 3.3 minimum.',
    rmgCD: 'Position 3.3 Syntec (rémunération la plus haute de la grille) ou hors grille — RMGCD non fixé conventionnellement',
    entretienCD: 'Entretien semestriel recommandé (accord Syntec 1999 — esprit du texte) même pour les CD',
    droitsCP: '25 jours ouvrables (L3141-1)',
    alertesCD: [
      'Syntec ne qualifie pas automatiquement CD à partir de la position 3.3',
      '3 critères cumulatifs L3111-2 obligatoires — seul un faisceau d\'indices valide le statut',
      'Mission de direction effective exigée (pas seulement un titre)',
    ],
    notesCD: 'Chez Syntec, le statut CD est souvent confondu avec la position 3.3 (hors forfait jours). Ce n\'est pas automatique : vérifier les 3 critères L3111-2.',
  },
  {
    idcc: 675, nom: 'Banque AFB — Cadres Dirigeants', secteur: 'Banque',
    critereCD: 'Direction générale, directeurs régionaux à pouvoir décisionnel autonome. Accord AFB : distinction Cadre Hors Classe (CHC) et Cadre Dirigeant L3111-2',
    rmgCD: 'Cadre Hors Classe (CHC) : coefficient ≥ 600. Pas de RMG CD fixée conventionnellement',
    entretienCD: 'Accord AFB recommande un bilan de charge annuel pour tous les cadres y compris CD',
    droitsCP: '25j ouvrables + congés bancaires supplémentaires selon accord établissement',
    alertesCD: [
      'Banque AFB : le Cadre Hors Classe (CHC) n\'est pas automatiquement CD au sens L3111-2',
      'Pouvoirs de direction bancaire (DSCR, RPCA) à vérifier',
      'Plafond 205j applicable aux cadres AFB non CD — pas aux CD',
    ],
    notesCD: 'Banque AFB (IDCC 675). Distinction CHC (Cadre Hors Classe — forfait jours) et CD (L3111-2 — hors durée du travail).',
  },
  {
    idcc: 3248, nom: 'Métallurgie ANU — Cadres Dirigeants', secteur: 'Métallurgie',
    critereCD: 'L\'ANU 2023 reprend la définition légale L3111-2. Direction de filiale, d\'établissement important ou d\'une direction fonctionnelle clé (Production, R&D, Finance).',
    rmgCD: 'Grille ANU : niveau hors grille ou groupe 12+ selon l\'ANU 2023',
    entretienCD: 'Entretien annuel de charge recommandé par l\'ANU (Titre VI)',
    droitsCP: '25j ouvrables (L3141-1) — accord de branche ANU peut prévoir des jours supplémentaires',
    alertesCD: [
      'ANU 2023 : vérifier la transposition dans votre accord d\'entreprise (transition 2025)',
      'Anciens accords UIMM : les CD étaient souvent définis par une grille de classification',
    ],
    notesCD: 'Métallurgie ANU 2023 (IDCC 3248). Le nouvel accord harmonise les classifications et la gestion du temps des cadres.',
  },
  {
    idcc: 2120, nom: 'Banques Populaires — Cadres Dirigeants', secteur: 'Banque mutualiste',
    critereCD: 'Directeur général, directeur général adjoint, directeur de pôle. Critères L3111-2 applicables.',
    rmgCD: 'Pas de RMG CD fixée — rémunération parmi les plus élevées du groupe',
    entretienCD: 'Entretien annuel de gouvernance recommandé',
    droitsCP: '25j + jours liés à l\'ancienneté selon accord groupe',
    alertesCD: ['Vérifier l\'accord de groupe BPCE pour les dispositions CD spécifiques'],
    notesCD: 'BPCE / Banques Populaires. Application L3111-2 standard.',
  },

  // Ajout de plusieurs CCN standard (droit commun L3111-2)
  ...([
    { idcc: 1850, nom: 'Expertise comptable', secteur: 'Finance/Audit', note: 'Expert-comptable associé gérant peut être CD. Vérifier les critères d\'autonomie.' },
    { idcc: 44, nom: 'Industries chimiques', secteur: 'Chimie', note: 'Directeurs de site et de division. Grille chimie : hors classe.' },
    { idcc: 216, nom: 'Industrie pharmaceutique', secteur: 'Pharmacie', note: 'Directeurs médicaux, directeurs d\'établissement. Forte présence CD dans les laboratoires.' },
    { idcc: 267, nom: 'BTP Ingénieurs et cadres', secteur: 'BTP', note: 'Directeurs de filiale, directeurs régionaux BTP.' },
    { idcc: 1527, nom: 'Immobilier', secteur: 'Immobilier', note: 'DG de groupes immobiliers, directeurs généraux de réseaux.' },
    { idcc: 413, nom: 'Hospitalisation privée', secteur: 'Santé', note: 'Directeurs d\'établissement, directeurs médicaux. Mission de direction clinique et administrative.' },
    { idcc: 1672, nom: 'Assurances', secteur: 'Assurance', note: 'Directeurs généraux de sociétés d\'assurance, directeurs régionaux à fort pouvoir.' },
    { idcc: 1979, nom: 'HCR', secteur: 'Hôtellerie', note: 'Directeurs généraux de groupes hôteliers, directeurs de palace. Autonomie forte exigée.' },
    { idcc: 218, nom: 'Cabinets d\'avocats', secteur: 'Juridique', note: 'Gérant de SELARL, managing partner. Attention : les associés libéraux ne sont pas salariés.' },
  ].map(c => ({
    idcc: c.idcc, nom: c.nom + ' — Cadres Dirigeants', secteur: c.secteur,
    critereCD: 'Application standard L3111-2 : pouvoir de direction effectif, rémunération parmi les plus élevées, autonomie dans l\'organisation. ' + c.note,
    rmgCD: 'Aucun minimum fixé conventionnellement — hors grille de classification',
    entretienCD: 'Pas d\'obligation légale — recommandé annuellement (Art. L4121-1)',
    droitsCP: '25j ouvrables minimum (L3141-1)',
    alertesCD: [
      'Critères cumulatifs L3111-2 obligatoires',
      'En cas de requalification, risque de rappel HS sur 3 ans',
      c.note,
    ],
    notesCD: c.note,
  }))),
];

// ═══════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════

function _norm(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Recherche dans la table forfait jours.
 * Accepte IDCC numérique ou texte libre.
 */
function searchForfaitJours(query, limit) {
  if (!query || String(query).trim().length < 1) return [];
  limit = limit || 8;
  const q = _norm(query);
  const isNum = /^\d+$/.test(q.trim());

  if (isNum) {
    const idcc = parseInt(q);
    const exact = CCN_FJ_DATA.filter(c => String(c.idcc).startsWith(q));
    if (exact.length) return exact.slice(0, limit);
  }

  // Scoring : correspondance nom > secteur > notes
  const scored = CCN_FJ_DATA.map(c => {
    const nom = _norm(c.nom);
    const sec = _norm(c.secteur);
    const notes = _norm(c.notes || '');
    let score = 0;
    if (nom.includes(q)) score += 10;
    if (sec.includes(q)) score += 5;
    if (notes.includes(q)) score += 1;
    if (String(c.idcc).includes(q)) score += 8;
    return { c, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(x => x.c);
}

/**
 * Retourne les données forfait jours d\'une CCN par IDCC.
 */
function getForfaitJours(idcc) {
  const n = parseInt(idcc);
  return CCN_FJ_DATA.find(c => c.idcc === n) || CCN_FJ_DATA.find(c => c.idcc === 0);
}

/**
 * Recherche dans la table cadres dirigeants.
 */
function searchCadreDirigeant(query, limit) {
  if (!query || String(query).trim().length < 1) return [];
  limit = limit || 8;
  const q = _norm(query);
  const isNum = /^\d+$/.test(q.trim());
  if (isNum) return CCN_CD_DATA.filter(c => String(c.idcc).startsWith(q)).slice(0, limit);
  return CCN_CD_DATA.filter(c => _norm(c.nom).includes(q) || _norm(c.secteur).includes(q)).slice(0, limit);
}

/**
 * Retourne les données CD d\'une CCN par IDCC.
 */
function getCadreDirigeant(idcc) {
  const n = parseInt(idcc);
  return CCN_CD_DATA.find(c => c.idcc === n) || CCN_CD_DATA.find(c => c.idcc === 0);
}

/**
 * Délègue au fichier CCN commun (racine) pour les règles HS (Forfait Heures).
 * Ne modifie JAMAIS le fichier racine conventions-collectives.js.
 * @param {number} idcc
 * @returns {object} Règles HS (REGLES_HS group) depuis window.CCN_API
 */
function getHSRules(idcc) {
  if (global.CCN_API) {
    return global.CCN_API.getGroupeForCCN(idcc) || global.CCN_API.getRules('DC');
  }
  // Fallback minimal si CCN_API non chargé
  return { seuil: 35, taux1: 25, palier1: 8, taux2: 50, contingent: 220, id: 'DC', nom: 'Droit commun' };
}

/**
 * Délègue la recherche HS au fichier commun.
 */
function searchHS(query, limit) {
  if (global.CCN_API && global.CCN_API.search) {
    return global.CCN_API.search(query, limit || 8);
  }
  return [];
}

/**
 * Calcule les HS en déléguant au fichier commun.
 */
function calculerHS(hsReelles, absences, idcc) {
  if (global.CCN_API && global.CCN_API.calculerHS) {
    return global.CCN_API.calculerHS(hsReelles, absences, idcc);
  }
  return null;
}

/**
 * Construit les valeurs par défaut de contrat pour le module 6
 * selon le régime et la CCN.
 *
 * @param {object} ccn    — objet CCN (FJ, CD ou HS selon le régime)
 * @param {string} regime — 'forfait_jours'|'cadre_dirigeant'|'forfait_heures'
 * @returns {object}      — champs à pré-remplir dans le formulaire de setup
 */
function buildContractDefaults(ccn, regime) {
  if (!ccn) return {};

  if (regime === 'forfait_heures') {
    // Données HS depuis le fichier commun
    const hs = ccn.g ? (global.CCN_API ? global.CCN_API.getRules(ccn.g) : null) : null;
    return {
      ccnLabel:     ccn.n || ccn.nom || 'Droit commun',
      ccnIdcc:      ccn.i || ccn.idcc || 0,
      seuilHebdo:   (hs && hs.seuil) || 35,
      taux1:        (hs && hs.taux1) || 25,
      taux2:        (hs && hs.taux2) || 50,
      palier1:      (hs && hs.palier1) || 8,
      contingent:   (hs && hs.contingent) || 220,
      ccnNotes:     (hs && hs.notes) || ccn.notes || '',
      ccnGroupe:    (hs && hs.id) || 'DC',
    };
  }

  if (regime === 'cadre_dirigeant') {
    const cd = getCadreDirigeant(ccn.idcc || 0) || {};
    return {
      ccnLabel:    ccn.nom || 'Droit commun',
      ccnIdcc:     ccn.idcc || 0,
      plafond:     218, // CD : référence 218j pour le suivi
      joursCPContrat: 25,
      critereCD:   cd.critereCD || '',
      entretienCD: cd.entretienCD || '',
      droitsCP:    cd.droitsCP || '25j ouvrables (L3141-1)',
      ccnNotes:    cd.notesCD || ccn.notes || '',
      alertesCD:   cd.alertesCD || [],
    };
  }

  // Forfait jours par défaut
  const fj = getForfaitJours(ccn.idcc || 0) || {};
  return {
    ccnLabel:       ccn.nom  || fj.nom  || 'Droit commun',
    ccnIdcc:        ccn.idcc || fj.idcc || 0,
    plafond:        fj.plafond      || ccn.plafond      || 218,
    tauxMajorationRachat: fj.tauxRachat || ccn.tauxRachat || 10,
    entretienFreq:  fj.entretienFreq || 'annuel',
    entretienRef:   fj.entretienRef  || 'Art. L3121-65',
    clauseDeconn:   fj.clauseDeconn  || false,
    suiviCharge:    fj.suiviCharge   || 'Art. L3121-65',
    ccnNotes:       fj.notes         || ccn.notes || '',
    alertes:        fj.alertes       || [],
  };
}

/**
 * Stats sur la base de données CCN cadres.
 */
function getStats() {
  return {
    totalForfaitJours:   CCN_FJ_DATA.length,
    totalCadresDirigeants: CCN_CD_DATA.length,
    suiteFichierCommun: !!(global.CCN_API),
    versionFichierCommun: global.CCN_API ? global.CCN_API.version : 'non chargé',
    totalCCNCommun: global.CCN_API ? global.CCN_API.getStats?.()?.totalCCN || 0 : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// API PUBLIQUE
// ═══════════════════════════════════════════════════════════════════
const CCN_CADRES_API = {
  version:              '1.0.0',
  CCN_FJ_DATA,
  CCN_CD_DATA,

  // Forfait Jours
  searchForfaitJours,
  getForfaitJours,

  // Cadres Dirigeants
  searchCadreDirigeant,
  getCadreDirigeant,

  // Forfait Heures → délégation au fichier commun racine
  getHSRules,
  searchHS,
  calculerHS,

  // Construction contrat
  buildContractDefaults,

  // Utilitaires
  getStats,
  isCommonCCNLoaded: () => !!(global.CCN_API),
};

global.CCN_CADRES_API = CCN_CADRES_API;

})(window);
