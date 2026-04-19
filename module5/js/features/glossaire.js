/**
 * GLOSSAIRE — Articles de loi sur les heures complémentaires
 * Langage simple + exemples concrets + articles officiels
 */
(function(global) {
'use strict';

const GLOSSAIRE = [
  {
    terme: 'Heures complémentaires',
    art: 'Art. L3123-9',
    def: 'Ce sont les heures que tu travailles en plus de ce qui est prévu dans ton contrat à temps partiel, sans jamais atteindre 35h. Elles sont différentes des heures supplémentaires, qui concernent les temps pleins.',
    exemple: 'Tu as un contrat de 25h/sem et tu travailles 28h cette semaine → 3h sont des heures complémentaires.',
    tags: ['heures','complémentaires','définition']
  },
  {
    terme: 'Plafond 10%',
    art: 'Art. L3123-28',
    def: 'Sans accord de branche spécifique, ton employeur ne peut te demander que 10% d\'heures en plus de ton contrat. Au-delà, il dépasse ses droits.',
    exemple: 'Contrat 25h/sem → max 2,5h complémentaires → tu ne peux pas aller au-delà de 27,5h sans accord de branche.',
    tags: ['plafond','10%','limite']
  },
  {
    terme: 'Plafond 1/3 (accord de branche)',
    art: 'Art. L3123-28',
    def: 'Certains secteurs (HCR, aide à domicile, commerce alimentaire...) ont un accord de branche étendu qui permet à ton employeur de te demander jusqu\'à un tiers d\'heures en plus. Vérifie ta convention collective.',
    exemple: 'Contrat 25h/sem en HCR → max 8,3h complémentaires → total 33,3h/sem possible (mais jamais 35h).',
    tags: ['plafond','tiers','accord de branche']
  },
  {
    terme: 'Majoration +10%',
    art: 'Art. L3123-29',
    def: 'Les premières heures complémentaires (dans la limite du 1/10e de ton contrat) sont payées avec 10% de plus que ton taux horaire normal. Minimum légal — ta CCN peut prévoir plus.',
    exemple: 'Taux horaire 11,88€ × 1,10 = 13,07€/h pour les premières heures complémentaires.',
    tags: ['majoration','10%','rémunération']
  },
  {
    terme: 'Majoration +25%',
    art: 'Art. L3123-29',
    def: 'Au-delà du 1/10e de ton contrat et jusqu\'au plafond autorisé, chaque heure complémentaire est payée avec 25% de plus. C\'est le taux légal minimum — vérifie si ta CCN prévoit mieux.',
    exemple: 'Contrat 25h, taux 11,88€ → 2,5 premières HC à 13,07€, puis les suivantes à 14,85€.',
    tags: ['majoration','25%','rémunération']
  },
  {
    terme: 'Délai de prévenance',
    art: 'Art. L3123-24',
    def: 'Ton employeur doit te prévenir au moins 3 jours ouvrés à l\'avance avant de te demander des heures complémentaires. En dessous de ce délai, tu as le droit de refuser sans être sanctionnée.',
    exemple: 'Si ton patron te prévient lundi matin pour des heures mercredi → délai insuffisant → tu peux refuser légalement.',
    tags: ['délai','prévenance','refus','3 jours']
  },
  {
    terme: 'Refus d\'heures complémentaires',
    art: 'Art. L3123-24',
    def: 'Tu peux refuser des heures complémentaires sans risque de sanction dans deux cas : si le délai de prévenance (3 jours) n\'a pas été respecté, ou si le nombre d\'heures demandé dépasse le plafond autorisé.',
    exemple: 'Contrat 25h avec plafond 10% → si on te demande 5h de plus (20%), tu peux refuser les 2,5h excédentaires.',
    tags: ['refus','droit','sanction']
  },
  {
    terme: 'Règle des 12 semaines',
    art: 'Art. L3123-13',
    def: 'Si tu travailles régulièrement 2h de plus par semaine que ton contrat pendant 12 semaines consécutives (ou 12 semaines sur 15), ton employeur DOIT te proposer un avenant pour augmenter ton contrat. Tu peux refuser si tu veux garder ton horaire actuel.',
    exemple: 'Contrat 25h, tu travailles 27h+ pendant 12 semaines → ton employeur doit te proposer un contrat à 27h minimum.',
    tags: ['12 semaines','requalification','avenant','modification']
  },
  {
    terme: 'Requalification en temps plein',
    art: 'Art. L3123-6',
    def: 'Si tes heures complémentaires te font atteindre ou dépasser 35h/sem, ou si tu travailles régulièrement comme un temps plein, ton contrat peut être requalifié en CDI temps plein par le juge — avec rappel de salaire.',
    exemple: 'Tu travailles systématiquement 34h sur un contrat 25h pendant plusieurs mois → le Conseil de prud\'hommes peut requalifier ton contrat.',
    tags: ['requalification','35h','temps plein','prud\'hommes']
  },
  {
    terme: 'Défiscalisation des heures complémentaires',
    art: 'Loi 2019 / Art. 81 CGI',
    def: 'Les heures complémentaires peuvent bénéficier d\'avantages fiscaux et sociaux. Les règles évoluent selon la législation en vigueur — consulte ton bulletin de paie ou les services RH pour connaître le régime applicable à ta situation.',
    exemple: 'Tu fais 3h comp. à 13€ = 39€ brut → cet argent n\'est pas imposable et bénéficie d\'une réduction de charges.',
    tags: ['cotisations','avantage','fiche de paie']
  },
  {
    terme: 'Complément d\'heures (avenant)',
    art: 'Art. L3123-22',
    def: 'C\'est différent des heures complémentaires. Un avenant temporaire peut augmenter ta durée de travail pour une période définie. Les heures dans le cadre de l\'avenant ne sont pas majorées, mais celles qui dépassent l\'avenant le sont à +25% minimum. Maximum 8 avenants par an.',
    exemple: 'Contrat 25h, avenant pour travailler 30h pendant 1 mois → les 5h entre le contrat et l\'avenant ne sont pas majorées, mais si tu travailles 32h, les 2h au-delà de 30h sont à +25%.',
    tags: ['avenant','complément','temporaire']
  },
  {
    terme: 'Durée minimale 24h',
    art: 'Art. L3123-7',
    def: 'En principe, un contrat à temps partiel ne peut pas être inférieur à 24h/sem. Des dérogations existent pour certains secteurs (sur demande du salarié, CCN dérogatoire, étudiant de moins de 26 ans, CDD court).',
    exemple: 'Si ton employeur te propose un contrat de 15h sans ta demande expresse et sans accord de branche, c\'est illégal.',
    tags: ['durée minimale','24h','contrat']
  },
  {
    terme: 'Convention collective (CCN)',
    art: 'Art. L2251-1',
    def: 'Accord négocié entre syndicats d\'employeurs et de salariés dans un secteur. Elle peut améliorer les droits légaux (plafond 1/3, meilleures majorations) mais jamais les réduire en dessous du minimum légal.',
    exemple: 'La CCN HCR prévoit un plafond de 1/3 — plus favorable que le 1/10e légal pour les salariées à temps partiel.',
    tags: ['CCN','convention collective','branche','IDCC']
  },
  {
    terme: 'Bulletin de paie : heures complémentaires',
    art: 'Art. D3243-2',
    def: 'Les heures complémentaires et leurs majorations doivent obligatoirement apparaître séparément sur ton bulletin de paie. Si elles sont noyées dans d\'autres lignes ou absentes, c\'est une irrégularité.',
    exemple: 'Cherche sur ta fiche de paie une ligne "Heures complémentaires" avec le nombre d\'heures et le taux de majoration.',
    tags: ['bulletin','fiche de paie','vérification']
  },
  {
    terme: 'Interruption journalière',
    art: 'Art. L3123-16',
    def: 'Un salarié à temps partiel ne peut pas avoir plus d\'une interruption d\'activité par jour et cette interruption ne peut pas dépasser 2h. Des dérogations sectorielles existent (HCR jusqu\'à 5h par exemple).',
    exemple: 'Si tu travailles de 9h à 11h30, puis de 17h à 19h dans une même journée → la coupure de 5,5h est illégale sans accord.',
    tags: ['interruption','coupure','journée','repos']
  },
  {
    terme: 'Heures complémentaires et ancienneté',
    art: 'Jurisprudence sociale',
    def: 'Les heures complémentaires sont prises en compte pour le calcul de ton ancienneté et de tes droits à congés payés (au prorata). Elles entrent dans la base de calcul des indemnités de licenciement.',
    exemple: 'Si tu fais systématiquement 28h sur un contrat de 25h, ton ancienneté et tes congés sont calculés sur 28h.',
    tags: ['ancienneté','congés','indemnités','licenciement']
  },
  {
    terme: 'Sécurité sociale et heures complémentaires',
    art: 'Art. L323-4 CSS',
    def: 'Les heures complémentaires inscrites sur tes fiches de paie et soumises à cotisations sociales entrent dans le calcul de tes indemnités journalières en cas d\'arrêt maladie ou maternité.',
    exemple: 'Si tu es en arrêt maladie, tes IJ sont calculées sur la moyenne des 3 derniers mois incluant tes HC.',
    tags: ['sécurité sociale','arrêt maladie','IJ','maternité']
  },
  {
    terme: 'Modification des horaires',
    art: 'Art. L3123-10',
    def: 'Ton employeur doit te prévenir 7 jours à l\'avance pour toute modification de la répartition de tes horaires. Ce délai peut être réduit à 3 jours par accord collectif — mais jamais sans contrepartie.',
    exemple: 'Ton patron change tes horaires du jeudi au vendredi avec 2 jours de préavis → tu peux refuser si ta CCN prévoit 7 jours.',
    tags: ['horaires','modification','planning','prévenance']
  },
  {
    terme: 'Conseil de prud\'hommes',
    art: 'Art. L1411-1',
    def: 'Juridiction compétente pour tous les litiges entre salariés et employeurs. Tu peux saisir les prud\'hommes si des heures complémentaires ne sont pas payées, si le plafond est dépassé ou si ton contrat n\'est pas requalifié alors qu\'il le devrait. Délai de prescription : 3 ans pour les salaires.',
    exemple: 'Ton employeur refuse de payer 6 mois d\'heures complémentaires → tu peux réclamer les 3 dernières années.',
    tags: ['prud\'hommes','litige','procédure','prescription']
  },
  {
    terme: 'Égalité de traitement',
    art: 'Art. L3123-5',
    def: 'Un salarié à temps partiel a les mêmes droits qu\'un temps plein : accès à la formation, à la promotion, aux avantages d\'entreprise. Sa rémunération est proportionnelle mais son taux horaire doit être identique.',
    exemple: 'Ton collègue à temps plein gagne 12€/h → tu dois toi aussi gagner 12€/h (pas moins sous prétexte que tu es à temps partiel).',
    tags: ['égalité','discrimination','temps plein','droits']
  },
  // ── ÉTUDES SCIENTIFIQUES BIEN-ÊTRE ─────────────────────────────
  {
    terme: 'Higgins et al. 2010 — Imprévisibilité horaire',
    art: 'Étude scientifique',
    def: 'Higgins et ses collègues ont mesuré le cortisol (hormone du stress) chez des salariés à temps partiel selon la variabilité de leurs horaires. Résultat : un écart-type supérieur à 4h d\'une semaine à l\'autre produit un pic de cortisol comparable à celui observé chez des salariés en surmenage à temps plein. L\'imprévisibilité horaire est donc biologiquement aussi stressante que la surcharge, même sur un temps partiel.',
    exemple: 'Tu travailles 20h une semaine, 26h la suivante, 19h après — cette variation crée un stress aigu mesurable, indépendamment du nombre d\'heures total.',
    tags: ['stress','cortisol','imprévisibilité','horaires','biologie']
  },
  {
    terme: 'Karasek 1979 — Modèle Demande-Contrôle',
    art: 'Étude scientifique',
    def: 'Robert Karasek a développé le modèle "Job Demand-Control" qui prédit le niveau de tension au travail selon deux axes : la demande (charge de travail) et le contrôle (autonomie). Les salariés à temps partiel avec peu de contrôle sur leurs horaires et une demande élevée (heures complémentaires imposées) se retrouvent dans la zone de "tension chronique" — le quadrant le plus à risque pour la santé cardiovasculaire.',
    exemple: 'Une caissière à 20h qui se voit régulièrement imposer 6h complémentaires sans préavis cumule forte demande + faible contrôle = zone rouge Karasek.',
    tags: ['stress','tension','autonomie','contrôle','cardiovasculaire','Karasek']
  },
  {
    terme: 'Sonnentag 2003 — Récupération psychologique',
    art: 'Étude scientifique',
    def: 'Sabine Sonnentag a montré que la récupération psychologique après le travail nécessite des périodes de "détachement" — des jours ou semaines où la charge mentale liée au travail est réellement absente. Pour un temps partiel, les semaines travaillées sous le contrat sont des périodes de récupération réelle. En dessous de 30% de telles semaines dans l\'année, la restauration psychologique est insuffisante pour maintenir le bien-être.',
    exemple: 'Si sur 12 semaines, seulement 2 sont sous tes heures contractuelles, tu n\'as pas assez de vraies périodes légères pour récupérer.',
    tags: ['récupération','repos','santé mentale','détachement','Sonnentag']
  },
  {
    terme: 'Voydanoff 2005 — Temps partiel choisi vs subi',
    art: 'Étude scientifique',
    def: 'Patricia Voydanoff a étudié l\'impact du temps partiel sur l\'équilibre travail-famille. Sa conclusion principale : le temps partiel choisi (souhaité par le salarié) est protecteur pour la santé mentale et améliore la satisfaction de vie. Le temps partiel subi (imposé par l\'employeur ou par défaut d\'emploi à temps plein) produit les mêmes effets négatifs sur la santé que le temps plein chargé, sans les avantages économiques.',
    exemple: 'Si tu approches systématiquement le plafond légal d\'heures complémentaires, ton temps partiel est de facto subi — Mizuki le détecte avec le score "Choix".',
    tags: ['choix','subi','équilibre','famille','santé mentale','Voydanoff']
  },
  {
    terme: 'Janssen & Nachreiner 2004 — Stress aigu des variations soudaines',
    art: 'Étude scientifique',
    def: 'Janssen et Nachreiner ont étudié l\'impact physiologique des variations horaires brutales chez les travailleurs à temps partiel. Un changement de planning de 4h ou plus entre deux semaines consécutives déclenche une réponse de stress aigu (activation du système nerveux sympathique) comparable à une situation d\'urgence professionnelle. Ce stress est indépendant du nombre total d\'heures — c\'est le choc de la variation qui est nocif.',
    exemple: '20h cette semaine, 26h la semaine prochaine → choc de 6h → réponse stress aigu selon Janssen. C\'est pourquoi le délai de prévenance de 3 jours est une protection biologique autant que légale.',
    tags: ['stress','variations','imprévisibilité','prévenance','aigu','Janssen']
  },
  {
    terme: 'Bambra et al. 2008 — Temps partiel et santé mentale',
    art: 'Étude scientifique',
    def: 'Clare Bambra et ses collègues ont réalisé une méta-analyse de 23 études sur le lien entre temps partiel et santé mentale. Résultat principal : le temps partiel subi chronique (travail régulièrement proche du plafond légal sur 6 mois ou plus) est associé à un risque de dépression 1,5 fois plus élevé que le temps plein. À l\'inverse, le temps partiel clairement choisi est protecteur — il réduit l\'anxiété et améliore le bien-être général. La frontière entre les deux se situe autour de 60% de semaines proches du plafond.',
    exemple: 'Si sur 20 semaines, 13 ou plus approchent ton plafond légal d\'heures complémentaires → zone critique Bambra. Mizuki t\'en alerte dans le score "Santé mentale".',
    tags: ['dépression','santé mentale','subi','choisi','méta-analyse','Bambra']
  },

  // ── NOUVEAUX TERMES TEMPS PARTIEL
  {
    terme: "Durée minimale légale (24h)",
    article: "Art. L3123-5",
    definition: "Tout contrat à temps partiel doit être d'au moins 24h/semaine. En dessous, l'employeur doit justifier d'une dérogation légale ou d'un accord de branche.",
    exemple: "Un contrat à 20h/sem est possible s'il existe un accord de branche ou une demande du salarié pour raisons personnelles.",
    tags: ["durée","minimum","24h","contrat"]
  },
  {
    terme: "Complément d'heures (avenant)",
    article: "Art. L3123-22",
    definition: "Accord temporaire pour augmenter ponctuellement la durée de travail. Les heures dans l'avenant sont payées sans majoration ; celles au-delà à +25%.",
    exemple: "Contrat 20h, avenant à 28h : les 8h supplémentaires sont payées normalement. Si on travaille 30h, les 2h au-delà de l'avenant sont à +25%.",
    tags: ["avenant","complément","temporaire","accord"]
  },
  {
    terme: "Clause de garantie du temps de travail",
    article: "Art. L3123-22 et accord de branche",
    definition: "Certains accords collectifs prévoient que si un avenant est utilisé trop souvent dans l'année, le contrat doit être modifié à la hausse.",
    exemple: "Dans certaines CCN : si un avenant est signé 8 fois sur 12 mois, le contrat doit être augmenté à la durée habituelle.",
    tags: ["garantie","avenant","abus","recours"]
  },
  {
    terme: "Temps partiel choisi vs subi",
    article: "Voydanoff 2005 / Art. L3123-5",
    definition: "Le temps partiel choisi est décidé librement. Le temps partiel subi est imposé faute de temps plein disponible. La loi protège davantage le temps partiel subi.",
    exemple: "Une aide soignante à 24h/sem qui voulait travailler plus = temps partiel subi. Elle a un droit de priorité sur les postes à temps plein.",
    tags: ["choix","subi","imposé","priorité"]
  },
  {
    terme: "Priorité d'accès au temps plein",
    article: "Art. L3123-8",
    definition: "Tout salarié à temps partiel a priorité pour occuper un emploi à temps plein dans sa qualification. L'employeur doit l'informer des postes disponibles.",
    exemple: "Si un poste à temps plein s'ouvre dans ton établissement, tu dois en être informée avant toute candidature externe.",
    tags: ["priorité","temps plein","poste","accès"]
  },
  {
    terme: "Coupures et interruptions journalières",
    article: "Art. L3123-16",
    definition: "La journée d'un salarié à temps partiel ne peut comporter plus d'une interruption d'activité. Sa durée ne peut dépasser 2 heures sauf accord de branche.",
    exemple: "Travailler de 8h à 11h puis de 16h à 20h = 5h d'interruption. Illégal sans accord de branche.",
    tags: ["coupure","interruption","journée","horaires"]
  },
  {
    terme: "Modification des horaires",
    article: "Art. L3123-24",
    definition: "L'employeur ne peut modifier la répartition des horaires sans respecter un délai de 7 jours ouvrés minimum (ou 3 jours par accord collectif).",
    exemple: "Si ton employeur veut changer tes jours de travail, il doit te prévenir 7 jours ouvrés à l'avance.",
    tags: ["horaires","modification","délai","prévenance"]
  },
  {
    terme: "Pencavel 2014 — Productivité décroissante",
    article: "Pencavel (Stanford) 2014",
    definition: "Au-delà d'un certain seuil d'heures, chaque heure supplémentaire produit moins. Le cumul d'HC crée une fatigue comparable au temps plein.",
    exemple: "Un salarié à 20h avec 8h comp (28h) produit proportionnellement moins que s'il travaillait 20h — la surcharge du temps partiel subi.",
    tags: ["productivité","Pencavel","surcharge","efficacité"]
  },
];

const GLOSSAIRE_API = {
  getAll() { return GLOSSAIRE; },
  search(term) {
    if(!term||term.length<2) return GLOSSAIRE;
    const t=term.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    return GLOSSAIRE.filter(g=>{
      const txt=(g.terme+' '+g.definition+' '+(g.tags||[]).join(' ')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
      return txt.includes(t);
    });
  }
};

global.GLOSSAIRE_API = GLOSSAIRE_API;
}(typeof window !== 'undefined' ? window : global));
