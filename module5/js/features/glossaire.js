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
];

const GLOSSAIRE_API = {
  getAll() { return GLOSSAIRE; },
  search(term) {
    if (!term || term.length < 2) return GLOSSAIRE;
    const t = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return GLOSSAIRE.filter(g => {
      const txt = (g.terme + ' ' + g.def + ' ' + g.tags.join(' ')).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      return txt.includes(t);
    });
  }
};

global.GLOSSAIRE_API = GLOSSAIRE_API;

}(typeof window !== 'undefined' ? window : global));
