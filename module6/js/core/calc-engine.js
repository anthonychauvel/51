/**
 * CALC-ENGINE M6 — Cadres
 * Moteur commun : Forfait Jours (218j) + Forfait Heures (seuil variable)
 * Sources : Code du travail L3121-41 à L3121-65, ANI 2001, Cass.Soc.
 */
'use strict';

(function(global) {

// ══════════════════════════════════════════════════════════════════
//  JOURS FÉRIÉS FRANCE — générateur annuel
// ══════════════════════════════════════════════════════════════════
const M6_Feries = {
  /** Calcul Pâques (algorithme de Meeus) */
  paques(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day   = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  },

  /**
   * Retourne un Set de chaînes "YYYY-MM-DD" pour tous les fériés de l'année.
   * Alsace-Moselle non inclus par défaut (ajout optionnel par CCN).
   */
  getSet(year) {
    const p = this.paques(year);
    const add = (d) => {
      const dt = new Date(d);
      const m  = String(dt.getMonth()+1).padStart(2,'0');
      const dd = String(dt.getDate()).padStart(2,'0');
      return `${dt.getFullYear()}-${m}-${dd}`;
    };
    const lundi = (d) => { const dt = new Date(d); dt.setDate(dt.getDate()+1); return dt; };
    const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt; };

    return new Set([
      `${year}-01-01`, // Jour de l'an
      add(lundi(p)),   // Lundi de Pâques
      `${year}-05-01`, // Fête du travail
      `${year}-05-08`, // Victoire 1945
      add(addDays(p, 39)), // Ascension
      add(lundi(addDays(p, 49))), // Lundi de Pentecôte
      `${year}-07-14`, // Fête nationale
      `${year}-08-15`, // Assomption
      `${year}-11-01`, // Toussaint
      `${year}-11-11`, // Armistice
      `${year}-12-25`, // Noël
    ]);
  }
};

// ══════════════════════════════════════════════════════════════════
//  MOTEUR FORFAIT JOURS
// ══════════════════════════════════════════════════════════════════
const M6_ForfaitJours = {

  /**
   * Calcule le nombre de RTT théoriques pour l'année.
   * Formule : 365/366 − WE − CP(25) − fériés ouvrés − plafond = RTT
   * @param {number} year
   * @param {number} plafond — jours de travail max (souvent 218)
   * @param {number} joursCPContrat — CP contractuels (défaut 25)
   * @returns {object} { rttTheoriques, feriesOuvres, joursTravailMax, joursCalendaires, WE }
   */
  calcRTT(year, plafond = 218, joursCPContrat = 25) {
    const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const joursCalendaires = isLeap(year) ? 366 : 365;
    const feries = M6_Feries.getSet(year);

    let WE = 0, feriesOuvres = 0;
    const start = new Date(year, 0, 1);
    for (let i = 0; i < joursCalendaires; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dow = d.getDay(); // 0=dim, 6=sam
      const key = d.toISOString().slice(0,10);
      if (dow === 0 || dow === 6) { WE++; }
      else if (feries.has(key)) { feriesOuvres++; }
    }

    const rttTheoriques = Math.max(0, joursCalendaires - WE - joursCPContrat - feriesOuvres - plafond);
    return { rttTheoriques, feriesOuvres, joursTravailMax: plafond, joursCalendaires, WE, joursCPContrat };
  },

  /**
   * Analyse complète de l'année à partir des données saisies.
   * @param {object} contract — { plafond, ccnIdcc, joursCPContrat }
   * @param {object} data — { "YYYY-MM-DD": { type: 'travail'|'rtt'|'cp'|'ferie'|'repos'|'rachat' } }
   * @param {number} year
   */
  analyze(contract, data, year) {
    const plafond = contract.plafond || 218;
    const cpContrat = contract.joursCPContrat || 25;
    const recap = this.calcRTT(year, plafond, cpContrat);
    const feries = M6_Feries.getSet(year);
    const today = new Date().toISOString().slice(0,10);

    let travailles = 0, rachetes = 0, rttPris = 0, cpPris = 0, reposPris = 0;
    const alertes = [];

    // Trier les données par date
    const entries = Object.entries(data)
      .filter(([k]) => k.startsWith(String(year)))
      .sort(([a],[b]) => a.localeCompare(b));

    // Boucle sur les jours saisis
    for (const [dk, v] of entries) {
      const type = v.type || 'travail';
      switch(type) {
        case 'travail':  travailles++; break;
        case 'rachat':   travailles++; rachetes++; break;
        case 'rtt':      rttPris++;    break;
        case 'cp':       cpPris++;     break;
        case 'repos':    reposPris++;  break;
        case 'ferie':    break; // décompté séparément via feries
      }
    }

    // Jours travaillés effectifs (travail + rachat)
    const joursEffectifs = travailles;

    // Dépassement plafond → alerte rachat
    if (joursEffectifs > plafond) {
      const excedent = joursEffectifs - plafond;
      alertes.push({
        niveau: 'danger',
        icon: '⚠️',
        titre: `Dépassement du forfait — ${excedent} jour${excedent > 1 ? 's' : ''} en trop`,
        texte: `Vous avez travaillé ${joursEffectifs} jours sur ${plafond} maximum. Un avenant de rachat avec majoration ≥ 10% est obligatoire (L3121-59).`,
        loi: 'L3121-59'
      });
    }

    // Approche du plafond (≥ 90%)
    if (joursEffectifs >= Math.floor(plafond * 0.9) && joursEffectifs < plafond) {
      const restants = plafond - joursEffectifs;
      alertes.push({
        niveau: 'warning',
        icon: '📅',
        titre: `Approche du plafond — ${restants} jour${restants > 1 ? 's' : ''} restant${restants > 1 ? 's' : ''}`,
        texte: `Vous approchez de votre plafond de ${plafond} jours. Planifiez vos RTT restants.`,
        loi: 'L3121-41'
      });
    }

    // RTT non pris à fin d'année (si on est en décembre)
    const rttTheo = recap.rttTheoriques;
    const rttSolde = rttTheo - rttPris;

    // Vérification entretien annuel
    const entretienDate = (contract.entretienDate && new Date(contract.entretienDate) > new Date(`${year}-01-01`))
      ? contract.entretienDate : null;
    const aujourd = new Date();
    const anniversaire = contract.dateDebut
      ? new Date(contract.dateDebut)
      : null;

    if (anniversaire) {
      const prochaineAnniv = new Date(anniversaire);
      prochaineAnniv.setFullYear(aujourd.getFullYear());
      if (prochaineAnniv < aujourd) prochaineAnniv.setFullYear(aujourd.getFullYear() + 1);
      const joursAvant = Math.round((prochaineAnniv - aujourd) / 86400000);
      if (joursAvant <= 30 && !entretienDate) {
        alertes.push({
          niveau: 'info',
          icon: '🗓️',
          titre: `Entretien annuel dans ${joursAvant} jours`,
          texte: `L'entretien de suivi de charge de travail est obligatoire (L3121-65). Pensez à le planifier avec votre manager.`,
          loi: 'L3121-65'
        });
      }
    }

    // Simulation rachat
    const simulRachat = this._simuleRachat(contract, joursEffectifs, plafond);

    return {
      joursEffectifs,
      rachetes,
      rttPris,
      cpPris,
      reposPris,
      rttTheoriques: rttTheo,
      rttSolde,
      plafond,
      tauxRemplissage: Math.min(100, Math.round(joursEffectifs / plafond * 100)),
      feriesOuvres: recap.feriesOuvres,
      alertes,
      simulRachat,
      entretienDate
    };
  },

  /**
   * Simule la majoration pour rachat de jours au-delà du plafond.
   * Majoration légale minimale : 10% (L3121-59) ou taux CCN si supérieur.
   */
  _simuleRachat(contract, joursEffectifs, plafond) {
    const tauxJournalier = contract.tauxJournalier || 0;
    const tauxMajoration = contract.tauxMajorationRachat || 10;
    const joursRachetes = Math.max(0, joursEffectifs - plafond);
    if (!joursRachetes || !tauxJournalier) return null;
    const montantBase = joursRachetes * tauxJournalier;
    const montantMajoré = montantBase * (1 + tauxMajoration / 100);
    return {
      joursRachetes,
      montantBase: Math.round(montantBase * 100) / 100,
      montantMajoré: Math.round(montantMajoré * 100) / 100,
      majoration: tauxMajoration,
      gainBrut: Math.round((montantMajoré - montantBase) * 100) / 100
    };
  },

  /**
   * Vérifie les garde-fous légaux sur une semaine (amplitude, repos).
   * @param {string[]} joursTravailles — dates ISO de la semaine
   * @param {object} checkIns — { "YYYY-MM-DD": { debut: "HH:MM", fin: "HH:MM" } } (optionnel)
   */
  verifierGardefous(joursTravailles, checkIns = {}) {
    const alertes = [];
    if (joursTravailles.length > 5) {
      alertes.push({
        niveau: 'danger',
        icon: '🔴',
        titre: 'Repos hebdomadaire insuffisant',
        texte: 'Vous devez bénéficier d\'au moins 35h de repos consécutif par semaine (L3132-2).',
        loi: 'L3132-2'
      });
    }
    // Repos quotidien via check-ins
    const dates = Object.keys(checkIns).sort();
    for (let i = 1; i < dates.length; i++) {
      const prev = checkIns[dates[i-1]];
      const curr = checkIns[dates[i]];
      if (!prev?.fin || !curr?.debut) continue;
      const finPrev = this._timeToMin(prev.fin);
      const debutCurr = this._timeToMin(curr.debut);
      const joursGap = (new Date(dates[i]) - new Date(dates[i-1])) / 86400000;
      const reposMin = joursGap * 24 * 60 - finPrev + debutCurr;
      // 11h = 660 min
      if (reposMin < 660) {
        alertes.push({
          niveau: 'danger',
          icon: '🔴',
          titre: 'Repos quotidien insuffisant',
          texte: `Repos de ${Math.round(reposMin/60*10)/10}h entre le ${dates[i-1]} et ${dates[i]} — minimum légal : 11h (L3131-1).`,
          loi: 'L3131-1'
        });
      }
    }
    return alertes;
  },

  _timeToMin(hhmm) {
    if (!hhmm) return 0;
    const [h,m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }
};

// ══════════════════════════════════════════════════════════════════
//  MOTEUR FORFAIT HEURES
// ══════════════════════════════════════════════════════════════════
const M6_ForfaitHeures = {

  /**
   * Analyse hebdomadaire + annuelle pour un cadre en forfait heures.
   * @param {object} contract — { seuilHebdo, seuil1, taux1, seuil2, taux2, tauxHoraire, contingent }
   * @param {object} data — { "YYYY-Www": { heures: 39.5, absent: 0 } }
   * @param {number} year
   */
  analyze(contract, data, year) {
    const seuil   = contract.seuilHebdo  || 39;
    const taux1   = contract.taux1       || 25;
    const palier  = contract.palier1     || 8;   // heures HS au taux1
    const taux2   = contract.taux2       || 50;
    const tauxH   = contract.tauxHoraire || 0;
    const contingent = contract.contingent || 220;

    let totalHSTaux1 = 0, totalHSTaux2 = 0, totalHeures = 0;
    let semaines = 0;
    const detailSemaines = [];
    const alertes = [];

    const entries = Object.entries(data)
      .filter(([k]) => k.startsWith(String(year)))
      .sort(([a],[b]) => a.localeCompare(b));

    for (const [wk, v] of entries) {
      const h = parseFloat(v.heures) || 0;
      totalHeures += h;
      semaines++;
      const extra = Math.max(0, h - seuil);
      const hs1 = Math.min(extra, palier);
      const hs2 = Math.max(0, extra - palier);
      totalHSTaux1 += hs1;
      totalHSTaux2 += hs2;
      detailSemaines.push({ semaine: wk, heures: h, hs1, hs2 });
    }

    const totalHS = totalHSTaux1 + totalHSTaux2;

    // Contingent
    if (totalHS >= contingent * 0.9) {
      alertes.push({
        niveau: 'warning',
        icon: '📊',
        titre: `Contingent annuel — ${Math.round(totalHS)}h / ${contingent}h`,
        texte: `Vous approchez du contingent annuel. Au-delà, chaque heure nécessite l'accord du CSE et déclenche une contrepartie obligatoire en repos (L3121-33).`,
        loi: 'L3121-33'
      });
    }
    if (totalHS > contingent) {
      alertes.push({
        niveau: 'danger',
        icon: '⚠️',
        titre: `Contingent dépassé — ${Math.round(totalHS - contingent)}h au-delà`,
        texte: `Dépassement du contingent annuel de ${contingent}h. Contrepartie obligatoire en repos et accord CSE requis (L3121-33, L3121-38).`,
        loi: 'L3121-38'
      });
    }

    // Calcul montants
    let montantHS1 = 0, montantHS2 = 0;
    if (tauxH > 0) {
      montantHS1 = totalHSTaux1 * tauxH * (1 + taux1 / 100);
      montantHS2 = totalHSTaux2 * tauxH * (1 + taux2 / 100);
    }

    // Exonération fiscale L241-17 CSS (Loi TEPA 2007)
    // Plafond annuel exo = 7 500 € depuis 2023
    const montantTotal = montantHS1 + montantHS2;
    const exoFiscale = Math.min(montantTotal, 7500);

    return {
      totalHeures,
      semaines,
      totalHS: Math.round(totalHS * 10) / 10,
      totalHSTaux1: Math.round(totalHSTaux1 * 10) / 10,
      totalHSTaux2: Math.round(totalHSTaux2 * 10) / 10,
      montantHS1: Math.round(montantHS1 * 100) / 100,
      montantHS2: Math.round(montantHS2 * 100) / 100,
      montantTotal: Math.round(montantTotal * 100) / 100,
      exoFiscale: Math.round(exoFiscale * 100) / 100,
      tauxRemplissage: Math.min(100, Math.round(totalHS / contingent * 100)),
      detailSemaines,
      alertes,
      seuil, taux1, taux2, palier, contingent
    };
  },

  /**
   * Retourne le numéro de semaine ISO pour une date.
   */
  isoWeek(date) {
    const d = new Date(date);
    d.setHours(12,0,0,0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const y = d.getFullYear();
    const w = Math.ceil(((d - new Date(y, 0, 1)) / 86400000 + 1) / 7);
    return `${y}-W${String(w).padStart(2,'0')}`;
  }
};

// ══════════════════════════════════════════════════════════════════
//  EXPOSITION GLOBALE
// ══════════════════════════════════════════════════════════════════
global.M6_Feries      = M6_Feries;
global.M6_ForfaitJours  = M6_ForfaitJours;
global.M6_ForfaitHeures = M6_ForfaitHeures;

})(window);
