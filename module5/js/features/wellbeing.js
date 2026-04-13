/**
 * WELLBEING ENGINE — Module Bien-être M5 Mizuki
 * Modèle biologique temps partiel
 *
 * Sources scientifiques :
 * - Higgins et al. 2010 : imprévisibilité horaire → pic cortisol
 * - Karasek 1979 (Job Demand-Control) : ratio demande/contrôle → stress chronique
 * - Sonnentag 2003 : récupération psychologique hors travail
 * - Voydanoff 2005 : temps partiel choisi vs subi
 */
(function(global) {
'use strict';

// ── CONSTANTES SCIENTIFIQUES ──────────────────────────────────────
const HIGGINS_VARIANCE_SEUIL  = 4.0;  // h — écart-type > 4h = imprévisibilité critique
const KARASEK_RATIO_OPTIMAL   = 0.10; // < 10% HC = zone verte
const KARASEK_RATIO_TENSION   = 0.25; // > 25% HC = tension chronique
const SONNENTAG_RECOVERY_MIN  = 0.30; // au moins 30% de semaines < contrat = récupération réelle

const M5_Wellbeing = {

  /**
   * Calcul complet du score bien-être
   * @param {Array}  weeks    — [{monday, worked}] semaines de l'exercice
   * @param {number} contractH — heures contractuelles
   * @param {object} contract  — contrat complet (pour rate1/rate2/cap)
   * @returns {object} scores et interprétations
   */
  compute(weeks, contractH, contract) {
    if (!weeks || weeks.length < 2) {
      return { available: false, reason: 'Pas assez de données (minimum 2 semaines).' };
    }

    const worked = weeks.map(w => w.worked || 0);
    const n = worked.length;

    // ── 1. SCORE STABILITÉ (Higgins 2010) ────────────────────────
    // Mesure la variance des heures d'une semaine à l'autre
    const mean = worked.reduce((s,h) => s+h, 0) / n;
    const variance = worked.reduce((s,h) => s + Math.pow(h - mean, 2), 0) / n;
    const ecartType = Math.sqrt(variance);

    // Score stabilité : 100 si ecartType=0, 0 si ecartType >= seuil critique
    const scoreStabilite = Math.max(0, Math.round(
      100 * (1 - Math.min(ecartType / HIGGINS_VARIANCE_SEUIL, 1))
    ));

    // ── 2. SCORE INTENSITÉ (Karasek 1979) ────────────────────────
    // Ratio moyen des heures complémentaires par rapport au contrat
    const totalComp = worked.reduce((s,h) => s + Math.max(0, h - contractH), 0);
    const ratioMoyen = totalComp / (n * contractH);

    let scoreIntensite;
    if (ratioMoyen <= KARASEK_RATIO_OPTIMAL) {
      scoreIntensite = 100;
    } else if (ratioMoyen >= KARASEK_RATIO_TENSION) {
      scoreIntensite = 0;
    } else {
      scoreIntensite = Math.round(
        100 * (1 - (ratioMoyen - KARASEK_RATIO_OPTIMAL) /
          (KARASEK_RATIO_TENSION - KARASEK_RATIO_OPTIMAL))
      );
    }

    // ── 3. SCORE RÉCUPÉRATION (Sonnentag 2003) ───────────────────
    // Proportion de semaines réellement sous le contrat (vraies semaines légères)
    const semainesLegeres = worked.filter(h => h < contractH).length;
    const ratioRecup = semainesLegeres / n;
    const scoreRecup = Math.min(100, Math.round(
      (ratioRecup / SONNENTAG_RECOVERY_MIN) * 100
    ));

    // ── 4. SCORE CHOIX (Voydanoff 2005) ──────────────────────────
    // Temps partiel choisi si heures réelles << plafond légal
    // Temps partiel subi si on approche systématiquement le plafond
    const cap = contract.cap || 0.10;
    const plafondH = contractH * (1 + cap);
    const semainesProchePlafond = worked.filter(h => h >= plafondH * 0.85).length;
    const ratioSubi = semainesProchePlafond / n;
    const scoreChoix = Math.round(100 * (1 - Math.min(ratioSubi * 2, 1)));

    // ── 5. SCORE GLOBAL ───────────────────────────────────────────
    // Pondération selon les études :
    // Stabilité 35% (impact cortisol immédiat — Higgins)
    // Intensité 30% (tension chronique — Karasek)
    // Récupération 20% (restauration psychologique — Sonnentag)
    // Choix 15% (sens et autonomie — Voydanoff)
    const scoreGlobal = Math.round(
      scoreStabilite * 0.35 +
      scoreIntensite * 0.30 +
      scoreRecup     * 0.20 +
      scoreChoix     * 0.15
    );

    // ── INTERPRÉTATIONS ──────────────────────────────────────────
    const niveau = scoreGlobal >= 75 ? 'bon'
                 : scoreGlobal >= 50 ? 'moyen'
                 : scoreGlobal >= 25 ? 'tendu'
                 : 'critique';

    const emoji = { bon:'🟢', moyen:'🟡', tendu:'🟠', critique:'🔴' };

    // Identifier le facteur le plus dégradé
    const scores = [
      { nom:'Stabilité', val:scoreStabilite, ref:'Higgins 2010' },
      { nom:'Intensité', val:scoreIntensite, ref:'Karasek 1979' },
      { nom:'Récupération', val:scoreRecup, ref:'Sonnentag 2003' },
      { nom:'Choix', val:scoreChoix, ref:'Voydanoff 2005' },
    ];
    const plusFaible = [...scores].sort((a,b)=>a.val-b.val)[0];

    // Messages contextuels
    const messages = this._buildMessages(
      scoreGlobal, niveau, ecartType, ratioMoyen,
      ratioRecup, ratioSubi, contractH, mean
    );

    return {
      available: true,
      scoreGlobal,
      niveau,
      emoji: emoji[niveau],
      scores,
      plusFaible,
      messages,
      stats: {
        n,
        mean: Math.round(mean * 10) / 10,
        ecartType: Math.round(ecartType * 10) / 10,
        ratioMoyen: Math.round(ratioMoyen * 100),
        semainesLegeres,
        semainesProchePlafond,
      }
    };
  },

  _buildMessages(global, niveau, ecartType, ratioMoyen, ratioRecup, ratioSubi, contractH, mean) {
    const msgs = [];

    // Message principal
    if (niveau === 'bon') {
      msgs.push({ type:'ok', text:`Ton rythme de travail est équilibré. Tes heures sont stables et tu bénéficies de vraies périodes de récupération.` });
    } else if (niveau === 'moyen') {
      msgs.push({ type:'warn', text:`Ton rythme de travail montre quelques signaux à surveiller. Rien d'urgent, mais quelques ajustements amélioreraient ton équilibre.` });
    } else if (niveau === 'tendu') {
      msgs.push({ type:'alerte', text:`Ton rythme de travail est sous tension. Les études montrent que ce type de schéma maintenu plusieurs mois affecte la qualité de récupération.` });
    } else {
      msgs.push({ type:'critique', text:`Ton schéma de travail s'apparente à un temps partiel subi. Le niveau d'imprévisibilité et d'intensité est comparable à un temps plein, sans les protections associées.` });
    }

    // Messages spécifiques par composante
    if (ecartType >= HIGGINS_VARIANCE_SEUIL) {
      msgs.push({ type:'warn', ref:'Higgins 2010',
        text:`Tes heures varient de ${ecartType.toFixed(1)}h d'une semaine à l'autre. Au-delà de 4h d'écart-type, la recherche montre un pic de cortisol comparable à un temps plein surchargé.` });
    } else if (ecartType >= 2) {
      msgs.push({ type:'info', ref:'Higgins 2010',
        text:`Une légère variabilité horaire (${ecartType.toFixed(1)}h). Dans les limites raisonnables, mais à surveiller si ça augmente.` });
    } else {
      msgs.push({ type:'ok', ref:'Higgins 2010',
        text:`Tes heures sont très stables (écart-type ${ecartType.toFixed(1)}h). Cette prévisibilité est protectrice selon Higgins et al.` });
    }

    if (ratioMoyen >= KARASEK_RATIO_TENSION) {
      msgs.push({ type:'alerte', ref:'Karasek 1979',
        text:`En moyenne ${Math.round(ratioMoyen*100)}% d'heures complémentaires par semaine. Ce niveau est associé à une tension chronique selon le modèle Demande-Contrôle de Karasek.` });
    } else if (ratioMoyen >= KARASEK_RATIO_OPTIMAL) {
      msgs.push({ type:'warn', ref:'Karasek 1979',
        text:`${Math.round(ratioMoyen*100)}% d'HC en moyenne. Tu travailles souvent au-delà du contrat — surveille que ça reste ponctuel.` });
    }

    if (ratioRecup < SONNENTAG_RECOVERY_MIN) {
      msgs.push({ type:'warn', ref:'Sonnentag 2003',
        text:`Seulement ${Math.round(ratioRecup*100)}% de semaines sous ton contrat. Sonnentag montre qu'en dessous de 30% de semaines légères, la récupération psychologique est insuffisante.` });
    } else {
      msgs.push({ type:'ok', ref:'Sonnentag 2003',
        text:`${Math.round(ratioRecup*100)}% de tes semaines sont sous ton contrat. Ces périodes légères permettent une vraie récupération psychologique.` });
    }

    if (ratioSubi >= 0.5) {
      msgs.push({ type:'alerte', ref:'Voydanoff 2005',
        text:`Plus de la moitié de tes semaines approchent le plafond légal. Voydanoff montre que ce schéma caractérise un temps partiel subi, avec les mêmes effets négatifs sur la santé que le temps plein.` });
    }

    return msgs;
  },

  /**
   * Texte court pour Mizuki (bulle accueil)
   */
  getMizukiText(result, name) {
    const n = name ? name + ' ! ' : '';
    if (!result.available) return null;
    const { niveau, plusFaible, stats } = result;
    if (niveau === 'bon') return `🦊 ${n}Ton bien-être au travail est bon cette période. Continue comme ça !`;
    if (niveau === 'moyen') return `🦊 ${n}Bien-être moyen — le point à surveiller : ${plusFaible.nom.toLowerCase()} (${plusFaible.ref}).`;
    if (niveau === 'tendu') return `🦊 ${n}Ton rythme est sous tension. Tes heures varient beaucoup (${stats.ecartType}h d'écart). C'est ce qui fatigue le plus selon Higgins 2010.`;
    return `🦊 ${n}Signal d'alerte bien-être. Ton temps partiel ressemble à un temps plein non déclaré. Garde cet historique.`;
  }
};

global.M5_Wellbeing = M5_Wellbeing;
}(typeof window !== 'undefined' ? window : global));
