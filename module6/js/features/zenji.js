/**
 * ZENJI — Personnage compagnon M6 Cadres
 * Kitsune à 9 queues, conseiller juridique & biologique des cadres dirigeants
 * Costume ivoire/or · Ton : cabinet exécutif, analytique, bienveillant
 *
 * Parallèle : Kitsune (M3) · Mizuki (M5) → Zenji (M6)
 * Zenji incarne la sagesse stratégique et la vigilance sur la santé des cadres
 */
'use strict';

(function(global) {

// ══════════════════════════════════════════════════════════════════
//  MESSAGES ZENJI — calibrés sur les données scientifiques
//  Structure : { phase, situation, texte, source? }
// ══════════════════════════════════════════════════════════════════

const ZENJI_MESSAGES = {

  // ── Accueil & onboarding ─────────────────────────────────────
  accueil: {
    bienvenue: [
      "Le forfait jours est un outil puissant — à condition de l'utiliser avec lucidité. Je suis Zenji, votre conseiller en charge de travail. Commençons par configurer votre contrat.",
      "Neuf queues, neuf angles d'analyse. Mon rôle : vous alerter avant que la situation ne devienne critique. Configurez votre forfait, je m'occupe du reste.",
      "Stratégie, Innovation, Influence — les piliers d'un cadre efficace. Mais aucun de ces trois ne tient sans une santé préservée. Je suis là pour ça.",
    ],
    setup_done: [
      "Contrat configuré. Je commence le suivi. Saisissez vos journées au fur et à mesure — plus les données sont précises, plus mon analyse est utile.",
      "Bien. Votre forfait est en place. Pensez à renseigner l'amplitude horaire lors de vos journées chargées — c'est là que les risques se cachent.",
    ]
  },

  // ── Bilan — commentaires selon le taux de remplissage ────────
  bilan: {
    vide: "Aucune journée saisie pour le moment. Commencez par enregistrer les journées de la semaine en cours — je vous donnerai mon analyse dès 10 jours de données.",
    debut: "Début de suivi. La précision de mon analyse augmentera avec le volume de données. Continuez à saisir régulièrement.",
    conforme_p1: [
      "Votre forfait est bien géré. Le rythme actuel est soutenable selon les critères INRS (Phase P1). Maintenant que le bilan est clair, regardons les RTT disponibles.",
      "Bonne maîtrise de la charge. Pensez à planifier vos RTT restants — Sonnentag 2022 confirme que le détachement régulier est plus efficace que les longues vacances rares.",
      "Situation conforme. Le risque CV est faible à ce stade. Continuez à respecter vos repos quotidiens — 11h minimum entre deux journées (Art. L3131-1).",
    ],
    attention_p2: [
      "Phase P2 détectée. La fatigue s'accumule de façon non-linéaire — le prochain cap est P3 et il arrive plus vite qu'on ne le pense. Planifiez des RTT.",
      "Le signal est là. Ahola et al. 2012 montrent que les télomères commencent à raccourcir significativement en phase d'épuisement. C'est réversible à ce stade — agissez maintenant.",
    ],
    surmenage_p3: [
      "Phase P3 — Surmenage. À ce niveau, Totterdell 2005 documente un cycle d'épuisement émotionnel chez les cadres difficile à briser sans action concrète. Parlez-en à votre manager.",
      "Données INRS P3. Je vous recommande de signaler la surcharge lors de votre prochain entretien individuel (Art. L3121-65). C'est votre droit et votre protection.",
    ],
    burnout_p4: [
      "Phase P4. Cette situation requiert une action immédiate. Consultez votre médecin du travail — Art. L4121-1. La Dresden Burnout Study 2025 confirme que l'inaction à ce stade génère un vieillissement épigénétique mesurable.",
    ],
    forfait_depasse: [
      "Le plafond de votre forfait est dépassé. Tout jour travaillé au-delà nécessite un avenant écrit avec majoration ≥10% (Art. L3121-59). Sans formalisation, ces jours ne sont pas opposables.",
      "Dépassement forfait. Je ne vais pas vous dire simplement 'd'arrêter' — je vous dis de formaliser. Chaque jour non formalisé est un risque juridique pour vous deux.",
    ],
    rtt_solde_negatif: "Solde RTT négatif. Cela arrive si vous avez pris plus de RTT que votre forfait n'en génère, ou si votre plafond a été mal configuré. Vérifiez les paramètres de votre contrat.",
    rachat_signal: [
      "Jours rachetés détectés. Le rachat est légal mais doit rester exceptionnel — la recherche montre que le rachat récurrent corrèle avec le stress chronique et le cortisol élevé (Dresden 2025).",
    ]
  },

  // ── Santé / Biologie ─────────────────────────────────────────
  sante: {
    p1_parfait: [
      "Bilan biologique excellent. Performance Pencavel élevée, récupération solide. Votre rythme actuel est dans la zone optimale OMS.",
      "Tous les indicateurs sont au vert. Continuez à respecter cette discipline — elle vous protège sur le long terme.",
    ],
    p2_alerte: [
      "La fatigue chronique s'installe. À ce niveau, Sonnentag 2022 recommande d'augmenter la fréquence du détachement, pas nécessairement sa durée. Un RTT par semaine vaut plus qu'une semaine de vacances par trimestre.",
      "Phase P2 confirmée. Le vieillissement épigénétique commence à s'accélérer selon les horloges DNAm (Dresden 2025). C'est réversible — mais seulement si vous agissez maintenant.",
    ],
    p3_urgent: [
      "Surmenage documenté. Kivimäki 2015 (603 838 individus) : à ce niveau d'exposition, le RR AVC s'approche de 1.33. Ce n'est pas une statistique abstraite — c'est votre profil actuel.",
      "Phase P3. Totterdell 2005 décrit exactement ce que vous vivez probablement : décrochage émotionnel, cynisme, fatigue irréductible. Le cycle se brise avec de l'aide — pas de la volonté seule.",
    ],
    p4_critique: [
      "Phase P4 — Burn-out. Arrêtez de lire ceci et consultez votre médecin du travail cette semaine. Art. L4121-1 : l'employeur a une obligation de résultat sur votre santé. Utilisez ce droit.",
    ],
    cv_risque_eleve: [
      "Risque cardiovasculaire significatif. La méta-analyse IPD-Work (Kivimäki 2015, Lancet) confirme la relation dose-réponse pour l'AVC. Ce n'est pas alarmiste — c'est de l'épidémiologie solide sur 603 838 personnes.",
      "Signal CV préoccupant. La composante inflammatoire (hsCRP) est probablement élevée à ce stade. Une prise de sang de contrôle n'est pas une mauvaise idée.",
    ],
    cognitif_risque: [
      "Risque cognitif détecté. Jang 2025 documente des altérations structurelles du gyrus frontal médian et de l'insula dès 52h équivalent par semaine. Ce sont les zones de la planification stratégique et de la régulation émotionnelle.",
      "Attention à votre capital cognitif. Frontiers 2025 montre un brain age gap augmenté chez les cadres à horaires irréguliers. Votre valeur ajoutée en tant que cadre dépend de ce capital.",
    ],
    telomere_alerte: [
      "Vieillissement biologique accéléré. Ahola 2012 (PLoS ONE) : l'épuisement sévère raccourcit les télomères leucocytaires de façon mesurable. Ce vieillissement cellulaire est réel — et partiellement réversible avec récupération.",
      "Signal épigénétique. La Dresden Burnout Study 2025 confirme que le cortisol capillaire accélère les horloges biologiques. La bonne nouvelle : c'est réversible en P2, plus difficile en P3.",
    ],
    bonne_recuperation: [
      "Votre capacité de récupération est solide. Continuez à prendre des RTT réguliers — la méta-analyse de Sonnentag 2022 confirme que ce sont les courtes pauses fréquentes qui font la différence, pas les longues vacances rares.",
    ],
    pas_de_rtt: [
      "Aucun RTT pris. Sonnentag 2022 est formel : le détachement psychologique régulier est le prédicteur le plus fort de la récupération. Les RTT non pris sont une dette biologique, pas une épargne.",
      "RTT = zéro. La méta-analyse 'I Need a Vacation' 2023 confirme l'effet bien-être des vacances, mais aussi leur fade-out rapide (2-4 semaines). Il faut des pauses courtes et fréquentes, pas rares et longues.",
    ],
    amplitude_violation: [
      "Amplitude horaire excessive. L'Art. L3131-1 impose 11h de repos quotidien consécutif. Ce n'est pas une suggestion — c'est une garantie légale que vous pouvez opposer à votre employeur.",
      "Journées à >13h détectées. Hakola & Härmä 2001 documentent la perturbation du rythme circadien dès 11h d'amplitude. Les études IRM 2024 confirment l'atrophie hippocampique avec la privation de sommeil.",
    ],
    pas_entretien: [
      "L'entretien annuel n'est pas renseigné. Il est obligatoire (Art. L3121-65) et son absence peut entraîner la nullité de votre convention de forfait (Cass. Soc. 29 juin 2011). Planifiez-le et documentez-le ici.",
    ]
  },

  // ── Entretien annuel ─────────────────────────────────────────
  entretien: {
    intro: [
      "L'entretien annuel est votre arme légale la plus puissante. Documenté, il protège vos droits. Non tenu, il peut invalider votre forfait. Utilisez-le.",
      "Art. L3121-65 : l'employeur est obligé d'organiser cet entretien. Si ce n'est pas fait, vous pouvez saisir les prud'hommes pour demander la requalification de votre forfait.",
    ],
    apres_entretien: [
      "Entretien enregistré. Ce compte-rendu peut servir de preuve en cas de litige sur la charge de travail. Générez le PDF depuis l'onglet Export.",
      "Bien. La traçabilité est votre meilleure protection. Conservez une copie du PDF.",
    ]
  },

  // ── Export & conformité ──────────────────────────────────────
  export: {
    pas_de_sauvegarde: [
      "Aucune sauvegarde fichier. En cas de réinitialisation accidentelle ou de changement d'appareil, vous perdrez tout. Exportez maintenant.",
    ],
    sauvegarde_ok: [
      "Sauvegarde à jour. Bien joué — la valeur probante de vos données dépend de leur conservation régulière.",
    ],
    pdf_conseil: [
      "Le PDF mensuel avec bloc signature peut servir de preuve en cas de contrôle. Faites-le valider par votre manager — c'est votre protection et la sienne.",
    ]
  },

  // ── Glossaire ────────────────────────────────────────────────
  glossaire: {
    bienvenue: [
      "Le Code du travail est mon domaine. Posez vos questions — chaque terme que vous maîtrisez est un droit que vous pouvez exercer.",
      "Connaître ses droits, c'est la première étape pour les faire respecter. Explorez le glossaire.",
    ]
  }
};

// ══════════════════════════════════════════════════════════════════
//  MOTEUR ZENJI — sélection contextuelle de messages
// ══════════════════════════════════════════════════════════════════
const M6_Zenji = {

  _seenKeys: new Set(), // éviter de répéter le même message dans la session

  /**
   * Retourne le message Zenji adapté à l'analyse en cours.
   * @param {string}  section  — 'bilan' | 'sante' | 'entretien' | 'export' | 'glossaire'
   * @param {object}  analysis — résultat M6_ForfaitJours.analyze()
   * @param {object}  bio      — résultat M6_BioEngine.analyzeForfaitJours()
   * @param {object}  contract — contrat
   * @returns {string} texte du message
   */
  getContextMessage(section, analysis, bio, contract) {
    try {
      if (section === 'bilan')    return this._bilanMessage(analysis, bio, contract);
      if (section === 'sante')    return this._santeMessage(bio, analysis);
      if (section === 'entretien')return this._pick(ZENJI_MESSAGES.entretien.intro);
      if (section === 'export')   return this._exportMessage(analysis, contract);
      if (section === 'glossaire')return this._pick(ZENJI_MESSAGES.glossaire.bienvenue);
      return '';
    } catch(_) { return ''; }
  },

  _bilanMessage(a, bio, c) {
    if (!a || !a.joursEffectifs) return this._pick(ZENJI_MESSAGES.bilan.vide);
    if (a.joursEffectifs < 10)   return this._pick(ZENJI_MESSAGES.bilan.debut);
    if (bio?.phase?.code === 'P4') return this._pick(ZENJI_MESSAGES.bilan.burnout_p4);
    if (bio?.phase?.code === 'P3') return this._pick(ZENJI_MESSAGES.bilan.surmenage_p3);
    if (bio?.phase?.code === 'P2') return this._pick(ZENJI_MESSAGES.bilan.attention_p2);
    if (a.joursEffectifs > a.plafond) return this._pick(ZENJI_MESSAGES.bilan.forfait_depasse);
    if (a.rachetes > 5)            return this._pick(ZENJI_MESSAGES.bilan.rachat_signal);
    if (a.rttSolde < -2)           return ZENJI_MESSAGES.bilan.rtt_solde_negatif;
    return this._pick(ZENJI_MESSAGES.bilan.conforme_p1);
  },

  _santeMessage(bio, a) {
    if (!bio?.hasData) return this._pick(ZENJI_MESSAGES.bilan.vide);
    if (bio.phase?.code === 'P4') return this._pick(ZENJI_MESSAGES.sante.p4_critique);
    if (bio.phase?.code === 'P3') return this._pick(ZENJI_MESSAGES.sante.p3_urgent);
    if (bio.cvRisk >= 35)         return this._pick(ZENJI_MESSAGES.sante.cv_risque_eleve);
    if (bio.agingRisk >= 50)      return this._pick(ZENJI_MESSAGES.sante.telomere_alerte);
    if (bio.cogRisk >= 40)        return this._pick(ZENJI_MESSAGES.sante.cognitif_risque);
    if (bio.phase?.code === 'P2') return this._pick(ZENJI_MESSAGES.sante.p2_alerte);
    if (a?.rttPris === 0 && a?.joursEffectifs > 30) return this._pick(ZENJI_MESSAGES.sante.pas_de_rtt);
    if (!a?.contract?.entretienDate) return this._pick(ZENJI_MESSAGES.sante.pas_entretien);
    if (bio.recovery >= 75)       return this._pick(ZENJI_MESSAGES.sante.bonne_recuperation);
    return this._pick(ZENJI_MESSAGES.sante.p1_parfait);
  },

  _exportMessage(a, contract) {
    const fileSave = M6_Storage?.getFileSaveDate?.('forfait_jours', new Date().getFullYear());
    if (!fileSave) return this._pick(ZENJI_MESSAGES.export.pas_de_sauvegarde);
    return this._pick(ZENJI_MESSAGES.export.pdf_conseil);
  },

  _pick(arr) {
    if (!Array.isArray(arr)) return arr || '';
    // Rotation non répétitive dans la session
    const unseen = arr.filter((_, i) => !this._seenKeys.has(arr[i]));
    const pool   = unseen.length > 0 ? unseen : arr;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    this._seenKeys.add(chosen);
    if (this._seenKeys.size > 20) this._seenKeys.clear(); // reset pour les longues sessions
    return chosen;
  },

  /**
   * Génère la carte Zenji HTML complète.
   * @param {string}  message   — texte du message
   * @param {string}  phase     — 'P1'|'P2'|'P3'|'P4' pour la couleur de bordure
   * @param {boolean} compact   — version mini pour le header
   */
  renderCard(message, phase, compact = false) {
    if (!message) return '';

    const phaseColors = {
      P1: { border:'#4A7C6F', badge:'#E8F5F0', badgeText:'#2D5A4E' },
      P2: { border:'#C4853A', badge:'#FFF7E6', badgeText:'#8B5A1A' },
      P3: { border:'#B85C50', badge:'#FFF0EE', badgeText:'#7A3028' },
      P4: { border:'#9B2C2C', badge:'#FBEAEA', badgeText:'#9B2C2C' },
    };
    const pc = phaseColors[phase] || phaseColors.P1;

    if (compact) {
      return `<div class="zenji-card-compact" style="
        display:flex;align-items:flex-start;gap:10px;
        background:var(--ivoire);border-radius:var(--radius);
        padding:10px 12px;margin-bottom:14px;
        border-left:3px solid ${pc.border}">
        <img src="../module6/images/Cadre.png" alt="Zenji"
          style="width:36px;height:36px;object-fit:cover;object-position:top center;border-radius:50%;flex-shrink:0;border:2px solid ${pc.border}">
        <div>
          <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:${pc.border};font-weight:600;margin-bottom:3px">Zenji — Conseiller M6</div>
          <div style="font-size:0.8rem;color:var(--charbon-3);line-height:1.5">${message}</div>
        </div>
      </div>`;
    }

    return `<div class="zenji-card" style="
      background:#fff;border-radius:var(--radius-lg);
      border:1px solid var(--grey-line);border-top:3px solid ${pc.border};
      margin-bottom:16px;overflow:hidden;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:var(--grey-line)">
        <div style="position:relative;width:54px;height:54px;flex-shrink:0">
          <img src="../module6/images/Cadre.png" alt="Zenji"
            style="width:54px;height:54px;object-fit:cover;object-position:top center;
                   border-radius:50%;border:2px solid ${pc.border}">
          <div style="position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;
                      background:${pc.border};border-radius:50%;border:2px solid #fff;
                      display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:#fff">
            ${phase==='P4'?'🔴':phase==='P3'?'🟠':phase==='P2'?'🟡':'🟢'}
          </div>
        </div>
        <div>
          <div style="font-family:var(--font-display);font-size:1rem;font-weight:600;color:var(--charbon)">Zenji</div>
          <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:${pc.border}">Conseiller · Forfait Cadres</div>
        </div>
        <div style="margin-left:auto">
          <span style="font-size:0.6rem;background:${pc.badge};color:${pc.badgeText};
                       border-radius:99px;padding:2px 8px;font-weight:600">Phase ${phase||'P1'}</span>
        </div>
      </div>
      <div style="padding:12px 14px">
        <div style="font-size:0.83rem;color:var(--charbon-3);line-height:1.65;
                    font-style:italic;border-left:3px solid ${pc.border};
                    padding-left:10px;margin:0">"${message}"</div>
      </div>
    </div>`;
  },

  /**
   * Carte intro plein écran — affichée à la première ouverture de M6
   */
  renderIntro(onContinue) {
    return `
    <div style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;text-align:center">
      <div style="position:relative;margin-bottom:20px">
        <img src="../module6/images/Cadre.png" alt="Zenji"
          style="width:180px;height:180px;object-fit:cover;object-position:top 5% center;
                 border-radius:50%;border:3px solid var(--champagne);
                 box-shadow:0 8px 32px rgba(196,163,90,0.25)">
        <div style="position:absolute;bottom:0;right:0;background:var(--champagne);
                    border-radius:99px;padding:4px 10px;font-size:0.65rem;
                    font-weight:700;color:var(--charbon);border:2px solid #fff;
                    letter-spacing:0.06em">M6 CADRES</div>
      </div>

      <div style="font-family:var(--font-display);font-size:1.8rem;font-weight:600;
                  color:var(--charbon);margin-bottom:6px">Zenji</div>
      <div style="font-size:0.72rem;color:var(--champagne-2);letter-spacing:0.1em;
                  text-transform:uppercase;margin-bottom:20px">
        Conseiller · Forfait Cadres · Neuf queues de sagesse
      </div>

      <div style="background:var(--ivoire);border-radius:var(--radius-lg);
                  padding:18px;margin-bottom:20px;border-left:4px solid var(--champagne);
                  text-align:left;max-width:340px">
        <div style="font-size:0.85rem;color:var(--charbon-3);line-height:1.7;font-style:italic">
          "Le forfait jours vous donne de l'autonomie. Mon rôle est de s'assurer que cette autonomie
          ne se retourne pas contre vous — ni juridiquement, ni biologiquement.
          Stratégie, conformité, santé : je surveille les trois."
        </div>
        <div style="font-size:0.65rem;color:var(--pierre);margin-top:8px;text-align:right">— Zenji</div>
      </div>

      <div style="font-size:0.72rem;color:var(--pierre);margin-bottom:20px;line-height:1.6;max-width:300px">
        Basé sur Kivimäki 2015 · Sonnentag 2022 · Pencavel 2014<br>
        Ahola 2012 · Dresden 2025 · INRS · Code du travail
      </div>
    </div>`;
  },

  /**
   * Badge Zenji minimal — pour les alertes inline
   */
  renderBadge(message, color = 'var(--champagne-2)') {
    return `<div style="display:flex;align-items:flex-start;gap:8px;font-size:0.8rem;color:var(--charbon-3);line-height:1.5">
      <img src="../module6/images/Cadre.png" alt="Zenji"
        style="width:24px;height:24px;object-fit:cover;object-position:top center;
               border-radius:50%;flex-shrink:0;margin-top:1px;border:1px solid ${color}">
      <span><strong style="color:${color}">Zenji :</strong> ${message}</span>
    </div>`;
  }
};

// ── Initialisation onboarding ──────────────────────────────────
const M6_ZenjiOnboarding = {
  isFirstVisit() {
    return !localStorage.getItem('M6_ZENJI_SEEN');
  },
  markSeen() {
    localStorage.setItem('M6_ZENJI_SEEN', '1');
  },
  reset() {
    localStorage.removeItem('M6_ZENJI_SEEN');
  }
};

global.M6_Zenji         = M6_Zenji;
global.M6_ZenjiMessages = ZENJI_MESSAGES;
global.M6_ZenjiOnboarding = M6_ZenjiOnboarding;

})(window);
