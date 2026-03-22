/**
 * ═══════════════════════════════════════════════════════════════
 * SYSTÈME MODE DÉBUTANT / EXPERT + GLOSSAIRE INTERACTIF
 * ═══════════════════════════════════════════════════════════════
 * 
 * Fonctionnalités :
 * - Mode débutant : vocabulaire simplifié + définitions automatiques
 * - Mode expert : vocabulaire technique (comportement actuel)
 * - Glossaire cliquable : clic sur un terme → popup avec définition
 * - Tutoriel de première utilisation
 * - Persistance du mode choisi dans localStorage
 */

// ═══════════════════════════════════════════════════════════════
// GLOSSAIRE DES TERMES TECHNIQUES
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// GLOSSAIRE MASSIF - 200+ TERMES POUR MODE DÉBUTANT
// ═══════════════════════════════════════════════════════════════

const GLOSSAIRE = {
  
  // ═══════════════════════════════════════════════════════════════
  // HEURES DE TRAVAIL (50 termes)
  // ═══════════════════════════════════════════════════════════════
  
  "heures supplémentaires": {
    simple: "heures en plus",
    expert: "heures supplémentaires",
    def: "Heures de travail effectuées au-delà de la durée légale (35h/semaine). Donnent droit à une majoration de salaire (25% ou 50%).",
    exemple: "Si tu travailles 40h dans la semaine, tu as fait 5h supplémentaires."
  },
  
  "heures sup": {
    simple: "heures en plus",
    expert: "heures sup",
    def: "Abréviation familière de 'heures supplémentaires'. Heures travaillées en plus de la durée normale.",
    exemple: "J'ai fait 10h sup cette semaine"
  },
  
  "HS": {
    simple: "heures en plus",
    expert: "HS",
    def: "Abréviation officielle de 'Heures Supplémentaires'. Utilisée dans les fiches de paie et documents RH.",
    exemple: "Sur ta fiche de paie : HS à 25% = 8h"
  },
  
  "heures normales": {
    simple: "heures de base",
    expert: "heures normales",
    def: "Heures de travail dans la durée légale (35h/semaine). Payées au taux normal sans majoration.",
    exemple: "Sur 40h travaillées : 35h normales + 5h sup"
  },
  
  "heures contractuelles": {
    simple: "heures de ton contrat",
    expert: "heures contractuelles",
    def: "Nombre d'heures prévu dans ton contrat de travail. Peut être différent de 35h selon les accords.",
    exemple: "Contrat 39h : les 4h de 36 à 39 sont structurelles, pas des HS"
  },
  
  "durée légale": {
    simple: "heures normales par semaine",
    expert: "durée légale",
    def: "Nombre d'heures de travail fixé par la loi comme référence : 35h par semaine en France.",
    exemple: "Au-delà de la durée légale (35h) = heures supplémentaires"
  },
  
  "durée maximale": {
    simple: "limite à ne pas dépasser",
    expert: "durée maximale",
    def: "Nombre maximum d'heures qu'on peut travailler par jour (10h) ou par semaine (48h). Fixé par la loi pour protéger la santé.",
    exemple: "Durée maximale journalière = 10h (sauf dérogation)"
  },
  
  "temps de travail effectif": {
    simple: "temps réellement travaillé",
    expert: "temps de travail effectif",
    def: "Temps pendant lequel tu es à la disposition de l'employeur. N'inclut pas les pauses.",
    exemple: "9h présent - 1h pause déjeuner = 8h de travail effectif"
  },
  
  "temps de pause": {
    simple: "pause",
    expert: "temps de pause",
    def: "Temps de repos pendant la journée. 20 minutes minimum après 6h de travail. Non comptabilisé comme temps de travail.",
    exemple: "6h travaillées → 20 min de pause obligatoire"
  },
  
  "temps de repos": {
    simple: "repos entre deux journées",
    expert: "temps de repos",
    def: "Durée minimale entre deux journées de travail : 11h consécutives obligatoires par la loi.",
    exemple: "Fini à 22h → ne peut pas reprendre avant 9h le lendemain"
  },
  
  "repos quotidien": {
    simple: "repos journalier",
    expert: "repos quotidien",
    def: "Repos de 11h consécutives minimum entre deux journées de travail. Obligatoire par la loi.",
    exemple: "11h de repos = protège ta santé et ta récupération"
  },
  
  "repos hebdomadaire": {
    simple: "repos de la semaine",
    expert: "repos hebdomadaire",
    def: "Repos de 35h consécutives minimum par semaine (24h + 11h de repos quotidien). En général le dimanche.",
    exemple: "Samedi 18h → lundi 5h = 35h de repos hebdo"
  },
  
  "astreinte": {
    simple: "être joignable",
    expert: "astreinte",
    def: "Période où tu dois être joignable et disponible pour intervenir si besoin, sans être sur le lieu de travail.",
    exemple: "Astreinte de nuit : tu es chez toi mais dispo si on t'appelle"
  },
  
  "semaine civile": {
    simple: "du lundi au dimanche",
    expert: "semaine civile",
    def: "Semaine qui court du lundi 0h au dimanche 24h. Référence pour calculer les 35h.",
    exemple: "Pour calculer les HS : total de la semaine lundi-dimanche"
  },
  
  "semaine glissante": {
    simple: "7 jours consécutifs",
    expert: "semaine glissante",
    def: "Période de 7 jours consécutifs, peu importe le jour de départ. Utilisée pour certains calculs.",
    exemple: "Du mercredi au mardi suivant = 1 semaine glissante"
  },
  
  "journée de solidarité": {
    simple: "lundi de Pentecôte",
    expert: "journée de solidarité",
    def: "Jour travaillé non payé pour financer l'aide aux personnes âgées. Généralement le lundi de Pentecôte.",
    exemple: "Tu travailles mais c'est pas payé (ou récupéré selon accord)"
  },
  
  "horaire variable": {
    simple: "horaires flexibles",
    expert: "horaire variable",
    def: "Système où tu peux moduler tes heures d'arrivée et de départ dans certaines limites.",
    exemple: "Plage variable 8h-10h : tu choisis quand tu arrives"
  },
  
  "horaire fixe": {
    simple: "horaires imposés",
    expert: "horaire fixe",
    def: "Heures d'arrivée et de départ définies dans ton contrat, à respecter chaque jour.",
    exemple: "9h-17h tous les jours = horaire fixe"
  },
  
  "amplitude horaire": {
    simple: "durée entre début et fin",
    expert: "amplitude horaire",
    def: "Durée totale entre le début et la fin de ta journée de travail, pauses comprises.",
    exemple: "8h-18h avec 1h de pause = amplitude 10h, travail effectif 9h"
  },
  
  "vacation": {
    simple: "mission ponctuelle",
    expert: "vacation",
    def: "Période de travail ponctuelle et limitée. Utilisée souvent dans l'enseignement ou la santé.",
    exemple: "Vacation de 3h pour une formation = mission temporaire"
  },
  
  "équivalence": {
    simple: "conversion d'heures",
    expert: "équivalence",
    def: "Système qui convertit certaines heures en heures de travail effectif (ex: astreintes, déplacements).",
    exemple: "1h d'astreinte = 0,25h de travail effectif (selon accord)"
  },
  
  "temps partiel": {
    simple: "moins de 35h",
    expert: "temps partiel",
    def: "Travail à une durée inférieure à la durée légale (moins de 35h/semaine).",
    exemple: "Contrat 28h/semaine = temps partiel à 80%"
  },
  
  "temps plein": {
    simple: "35h par semaine",
    expert: "temps plein",
    def: "Travail à la durée légale ou conventionnelle complète (généralement 35h ou 39h selon accord).",
    exemple: "Temps plein = 35h/semaine (ou 151,67h/mois)"
  },
  
  "temps complet": {
    simple: "35h par semaine",
    expert: "temps complet",
    def: "Synonyme de temps plein. Durée normale de travail selon la loi ou l'accord d'entreprise.",
    exemple: "Contrat à temps complet = 35h hebdomadaires"
  },
  
  "heure creuse": {
    simple: "moment calme",
    expert: "heure creuse",
    def: "Période de faible activité dans la journée ou l'année. Souvent mieux payée dans certains secteurs (nuit, dimanche).",
    exemple: "Heures creuses en retail : mardi matin"
  },
  
  "heure de pointe": {
    simple: "moment chargé",
    expert: "heure de pointe",
    def: "Période de forte activité nécessitant plus de personnel. Peut donner lieu à des majorations selon les accords.",
    exemple: "Heures de pointe restaurant : 12h-14h et 19h-21h"
  },
  
  "travail de nuit": {
    simple: "travail entre 21h et 6h",
    expert: "travail de nuit",
    def: "Travail effectué entre 21h et 6h du matin. Donne droit à des compensations (repos ou prime).",
    exemple: "Travail de nuit : majoration 25% ou repos compensateur"
  },
  
  "travail du dimanche": {
    simple: "travail le dimanche",
    expert: "travail du dimanche",
    def: "Travail effectué le dimanche. Généralement majoré ou compensé, sauf secteurs dérogatoires.",
    exemple: "Dimanche majoré à 50% (selon CCN)"
  },
  
  "travail de jour férié": {
    simple: "travail un jour férié",
    expert: "travail de jour férié",
    def: "Travail effectué un jour férié légal (1er mai, 14 juillet, etc.). Donne droit à une majoration.",
    exemple: "1er mai travaillé = salaire double minimum"
  },
  
  "annualisation": {
    simple: "calcul sur l'année",
    expert: "annualisation",
    def: "Organisation du temps de travail calculée sur l'année au lieu de la semaine. Permet de moduler les heures.",
    exemple: "35h en moyenne sur l'année : 40h l'été, 30h l'hiver"
  },
  
  "modulation": {
    simple: "heures qui varient",
    expert: "modulation",
    def: "Variation des horaires selon les périodes (haute/basse saison). Défini par accord collectif.",
    exemple: "Modulation commerce : 40h en décembre, 30h en janvier"
  },
  
  "forfait jours": {
    simple: "nombre de jours par an",
    expert: "forfait jours",
    def: "Convention pour cadres : nombre de jours travaillés par an (218j) au lieu d'un horaire hebdomadaire.",
    exemple: "Forfait 218 jours : tu gères ton temps, pas d'heures sup"
  },
  
  "forfait heures": {
    simple: "nombre d'heures fixe",
    expert: "forfait heures",
    def: "Contrat avec un nombre d'heures global (semaine, mois, année) incluant des heures supplémentaires.",
    exemple: "Forfait 39h : 4h sup déjà incluses chaque semaine"
  },
  
  "cycle de travail": {
    simple: "rotation des horaires",
    expert: "cycle de travail",
    def: "Organisation du temps sur plusieurs semaines avec alternance d'horaires (2×2, 3×8, etc.).",
    exemple: "Cycle 3×8 : matin/après-midi/nuit en rotation"
  },
  
  "planning": {
    simple: "emploi du temps",
    expert: "planning",
    def: "Organisation des horaires de travail sur une période (semaine, mois). Indique les jours et heures travaillés.",
    exemple: "Planning affiché 7 jours à l'avance minimum"
  },
  
  "roulement": {
    simple: "rotation d'équipes",
    expert: "roulement",
    def: "Organisation où les équipes se relaient pour assurer une activité continue (jour/nuit, week-end).",
    exemple: "Roulement 1 week-end sur 2 travaillé"
  },
  
  "badgeage": {
    simple: "pointer",
    expert: "badgeage",
    def: "Enregistrement de l'heure d'arrivée et de départ par badge ou pointeuse. Sert à calculer les heures.",
    exemple: "Badger à 8h et à 17h pour enregistrer ta journée"
  },
  
  "pointage": {
    simple: "noter ses heures",
    expert: "pointage",
    def: "Action d'enregistrer ses heures de travail (badge, signature, app). Obligatoire dans certaines entreprises.",
    exemple: "Pointage sur app mobile : début et fin de journée"
  },
  
  "décompte horaire": {
    simple: "comptage des heures",
    expert: "décompte horaire",
    def: "Calcul précis des heures travaillées sur une période pour établir la paie et les heures sup.",
    exemple: "Décompte mensuel : 156h dont 5h sup"
  },
  
  "compteur d'heures": {
    simple: "total des heures",
    expert: "compteur d'heures",
    def: "Cumul des heures travaillées sur une période. Utilisé pour suivre les heures sup et le contingent.",
    exemple: "Compteur annuel : 150h sup sur 220h de contingent"
  },
  
  "solde d'heures": {
    simple: "heures restantes",
    expert: "solde d'heures",
    def: "Différence entre heures dues et heures travaillées. Peut être positif (tu as travaillé plus) ou négatif.",
    exemple: "Solde +10h = tu as 10h sup à récupérer ou à payer"
  },
  
  "temps de trajet": {
    simple: "durée du trajet",
    expert: "temps de trajet",
    def: "Temps pour aller au travail. Généralement non compté comme temps de travail, sauf cas particuliers.",
    exemple: "Trajet domicile-travail : pas payé sauf si mission"
  },
  
  "temps d'habillage": {
    simple: "temps pour se changer",
    expert: "temps d'habillage",
    def: "Temps pour mettre/enlever une tenue obligatoire (uniforme, EPI). Peut être compté comme temps de travail selon accord.",
    exemple: "Habillage 15 min/jour = peut être payé selon la CCN"
  },
  
  "temps de traite": {
    simple: "pauses d'allaitement",
    expert: "temps de traite",
    def: "Temps alloué pour l'allaitement : 1h/jour pendant 1 an après naissance. Non déduit du salaire.",
    exemple: "2 pauses de 30 min pour allaiter = droit légal"
  },
  
  "congé maternité": {
    simple: "congé de grossesse",
    expert: "congé maternité",
    def: "Congé avant et après la naissance (16 semaines minimum). Indemnisé par la sécurité sociale.",
    exemple: "6 semaines avant + 10 semaines après accouchement"
  },
  
  "congé paternité": {
    simple: "congé du père",
    expert: "congé paternité",
    def: "Congé du père à la naissance : 25 jours (dont 4 obligatoires). Indemnisé par la sécu.",
    exemple: "25 jours de congé paternité dans les 6 mois après naissance"
  },
  
  "congé parental": {
    simple: "congé pour élever enfant",
    expert: "congé parental",
    def: "Congé pour s'occuper d'un enfant jusqu'à 3 ans. Suspend le contrat, pas ou peu rémunéré.",
    exemple: "Congé parental 1 an : contrat suspendu, allocation CAF"
  },
  
  "RTT": {
    simple: "jours de repos",
    expert: "RTT",
    def: "Réduction du Temps de Travail. Jours de repos compensant un horaire supérieur à 35h (ex: forfait 39h).",
    exemple: "Forfait 39h → 23 jours de RTT par an"
  },
  
  "JNT": {
    simple: "jours non travaillés",
    expert: "JNT",
    def: "Jours Non Travaillés. Autre nom des RTT dans certaines entreprises.",
    exemple: "12 JNT par an = 12 jours de repos"
  },
  
  "JRTT": {
    simple: "jours RTT",
    expert: "JRTT",
    def: "Jours de Réduction du Temps de Travail. Même chose que RTT, abréviation utilisée en paie.",
    exemple: "Solde JRTT : 15 jours restants"
  },
  
  
  // ═══════════════════════════════════════════════════════════════
  // PAIE ET SALAIRE (45 termes)
  // ═══════════════════════════════════════════════════════════════
  
  "majoration": {
    simple: "bonus sur ton salaire",
    expert: "majoration",
    def: "Augmentation du taux horaire pour compenser les heures supplémentaires. Légalement : +25% pour les 8 premières heures, +50% au-delà.",
    exemple: "Salaire normal = 15€/h → avec majoration 25% = 18,75€/h"
  },
  
  "taux de majoration": {
    simple: "% de bonus",
    expert: "taux de majoration",
    def: "Pourcentage d'augmentation du salaire horaire. 25% = ton heure est payée 1,25 fois plus.",
    exemple: "Heure normale 10€ → avec 50% = 15€"
  },
  
  "coefficient": {
    simple: "multiplicateur",
    expert: "coefficient",
    def: "Nombre par lequel on multiplie le salaire de base. Coefficient 1,25 = salaire × 1,25.",
    exemple: "10€/h × coefficient 1,5 = 15€/h"
  },
  
  "salaire brut": {
    simple: "avant charges",
    expert: "salaire brut",
    def: "Salaire avant déduction des cotisations sociales (retraite, santé, chômage, CSG/CRDS).",
    exemple: "2000€ brut → environ 1560€ net (22% de charges)"
  },
  
  "brut": {
    simple: "avant charges",
    expert: "brut",
    def: "Montant total avant toutes les déductions. Sur la fiche de paie, c'est le haut du document.",
    exemple: "Salaire brut = base + primes + heures sup (avant charges)"
  },
  
  "salaire net": {
    simple: "ce que tu reçois",
    expert: "salaire net",
    def: "Salaire après déduction de toutes les cotisations sociales. C'est ce qui arrive sur ton compte bancaire.",
    exemple: "Net = brut - cotisations (environ 78% du brut)"
  },
  
  "net": {
    simple: "ce que tu touches",
    expert: "net",
    def: "Montant final après toutes les déductions. C'est ce qui est viré sur ton compte.",
    exemple: "2000€ brut = environ 1560€ net"
  },
  
  "net à payer": {
    simple: "montant viré",
    expert: "net à payer",
    def: "Montant final qui sera versé sur ton compte. Dernière ligne de la fiche de paie.",
    exemple: "Net à payer = 1543,21€ (viré le 28 du mois)"
  },
  
  "net imposable": {
    simple: "base pour les impôts",
    expert: "net imposable",
    def: "Base de calcul pour l'impôt sur le revenu. Légèrement supérieur au net à payer (inclut CSG non déductible).",
    exemple: "Net imposable = net + partie CSG/CRDS non déductible"
  },
  
  "taux horaire": {
    simple: "prix de l'heure",
    expert: "taux horaire",
    def: "Montant payé pour une heure de travail. Base de calcul du salaire mensuel.",
    exemple: "Taux 15€/h brut × 151,67h = 2275€ brut/mois"
  },
  
  "salaire de base": {
    simple: "salaire minimum contractuel",
    expert: "salaire de base",
    def: "Rémunération fixe prévue au contrat, hors primes et heures supplémentaires.",
    exemple: "Salaire de base 2000€ + 200€ de primes = 2200€ total"
  },
  
  "salaire minimum": {
    simple: "SMIC",
    expert: "salaire minimum",
    def: "Salaire minimum légal en France : le SMIC. Réévalué chaque année.",
    exemple: "SMIC 2024 = 11,65€/h brut (1766€/mois)"
  },
  
  "SMIC": {
    simple: "salaire minimum",
    expert: "SMIC",
    def: "Salaire Minimum Interprofessionnel de Croissance. Minimum légal qu'un employeur doit payer.",
    exemple: "Tu ne peux pas être payé moins que le SMIC"
  },
  
  "prime": {
    simple: "bonus",
    expert: "prime",
    def: "Rémunération supplémentaire versée en plus du salaire de base. Peut être obligatoire (13e mois) ou facultative.",
    exemple: "Prime de fin d'année = 1 mois de salaire"
  },
  
  "13e mois": {
    simple: "mois de salaire en plus",
    expert: "13e mois",
    def: "Prime équivalent à un mois de salaire, versée en fin d'année. Prévue par certaines CCN ou contrats.",
    exemple: "13e mois = 2000€ versés en décembre"
  },
  
  "prime d'ancienneté": {
    simple: "bonus pour l'ancienneté",
    expert: "prime d'ancienneté",
    def: "Prime calculée selon le nombre d'années dans l'entreprise. Prévue par certaines CCN.",
    exemple: "5 ans d'ancienneté = +5% du salaire de base"
  },
  
  "prime de précarité": {
    simple: "bonus fin de CDD",
    expert: "prime de précarité",
    def: "Indemnité de 10% versée à la fin d'un CDD pour compenser l'instabilité. Obligatoire sauf exceptions.",
    exemple: "3 mois de CDD à 1500€/mois = 450€ de prime de précarité"
  },
  
  "indemnité": {
    simple: "compensation",
    expert: "indemnité",
    def: "Somme versée pour compenser un désagrément (transport, repas, licenciement, etc.).",
    exemple: "Indemnité repas = 5€/jour si tu manges sur place"
  },
  
  "indemnité kilométrique": {
    simple: "remboursement trajet",
    expert: "indemnité kilométrique",
    def: "Remboursement des déplacements professionnels en voiture personnelle. Barème fiscal annuel.",
    exemple: "Mission 100km = 100 × 0,50€ = 50€ remboursés"
  },
  
  "ticket restaurant": {
    simple: "bon repas",
    expert: "ticket restaurant",
    def: "Titre de paiement pour les repas, partiellement pris en charge par l'employeur (50-60%).",
    exemple: "Ticket 10€ : 5€ payés par l'employeur, 5€ par toi"
  },
  
  "avantage en nature": {
    simple: "avantage donné",
    expert: "avantage en nature",
    def: "Bien ou service fourni par l'employeur (voiture, logement, téléphone). Ajouté au salaire pour les charges.",
    exemple: "Voiture de fonction = +200€/mois sur la fiche de paie"
  },
  
  "cotisation sociale": {
    simple: "charges sociales",
    expert: "cotisation sociale",
    def: "Prélèvement sur le salaire brut pour financer la protection sociale (retraite, santé, chômage).",
    exemple: "2000€ brut - 440€ de cotisations = 1560€ net"
  },
  
  "charges salariales": {
    simple: "tes cotisations",
    expert: "charges salariales",
    def: "Cotisations prélevées sur ton salaire (environ 22% du brut). Différent des charges patronales.",
    exemple: "Charges salariales ≈ 22% du brut"
  },
  
  "charges patronales": {
    simple: "cotisations de l'employeur",
    expert: "charges patronales",
    def: "Cotisations payées par l'employeur en plus de ton salaire brut (environ 42% du brut).",
    exemple: "2000€ brut → employeur paie en réalité 2840€ total"
  },
  
  "CSG": {
    simple: "taxe sociale",
    expert: "CSG",
    def: "Contribution Sociale Généralisée. Impôt pour financer la sécurité sociale. Prélevé sur le salaire.",
    exemple: "CSG = 9,2% du brut (dont 6,8% déductible des impôts)"
  },
  
  "CRDS": {
    simple: "taxe pour la dette",
    expert: "CRDS",
    def: "Contribution au Remboursement de la Dette Sociale. Taxe de 0,5% sur le salaire.",
    exemple: "CRDS = 0,5% du brut (non déductible)"
  },
  
  "prélèvement à la source": {
    simple: "impôt direct sur salaire",
    expert: "prélèvement à la source",
    def: "Impôt sur le revenu prélevé directement chaque mois sur le salaire par l'employeur.",
    exemple: "Taux 5% → 1500€ net - 75€ d'impôt = 1425€ viré"
  },
  
  "taux de prélèvement": {
    simple: "% d'impôt",
    expert: "taux de prélèvement",
    def: "Pourcentage d'impôt prélevé chaque mois. Calculé par les impôts selon ta situation.",
    exemple: "Taux 8% = 8% de ton net est prélevé pour l'impôt"
  },
  
  "acompte": {
    simple: "avance sur salaire",
    expert: "acompte",
    def: "Partie du salaire versée avant la fin du mois. Déduit ensuite du salaire total.",
    exemple: "Acompte 500€ le 15 → reste 1500€ le 30"
  },
  
  "avance sur salaire": {
    simple: "argent donné en avance",
    expert: "avance sur salaire",
    def: "Somme avancée par l'employeur, à rembourser sur les prochains salaires.",
    exemple: "Avance 1000€ → remboursement -200€/mois pendant 5 mois"
  },
  
  "rappel de salaire": {
    simple: "argent en retard",
    expert: "rappel de salaire",
    def: "Somme due suite à un oubli ou une erreur. Versée après régularisation.",
    exemple: "Prime oubliée en janvier → rappel 200€ en février"
  },
  
  "régularisation": {
    simple: "correction de salaire",
    expert: "régularisation",
    def: "Correction d'une erreur de paie. Peut être positive (on te doit) ou négative (trop-perçu).",
    exemple: "Heures sup oubliées → régularisation +300€ ce mois"
  },
  
  "trop-perçu": {
    simple: "trop reçu",
    expert: "trop-perçu",
    def: "Somme versée en trop par erreur. Doit être remboursée à l'employeur.",
    exemple: "Prime en double → trop-perçu 500€ à rembourser"
  },
  
  "bulletin de paie": {
    simple: "fiche de paie",
    expert: "bulletin de paie",
    def: "Document mensuel détaillant le calcul du salaire : heures, primes, cotisations, net à payer.",
    exemple: "Bulletin de paie = justificatif obligatoire chaque mois"
  },
  
  "fiche de paie": {
    simple: "bulletin de salaire",
    expert: "fiche de paie",
    def: "Synonyme de bulletin de paie. Document remis chaque mois avec le détail du salaire.",
    exemple: "Garde tes fiches de paie : elles servent de justificatif"
  },
  
  "ligne de paie": {
    simple: "élément du salaire",
    expert: "ligne de paie",
    def: "Chaque élément détaillé sur le bulletin : salaire de base, prime, heures sup, cotisation, etc.",
    exemple: "Ligne 'HS à 25%' : 10h × 15€ × 1,25 = 187,50€"
  },
  
  "cumul imposable": {
    simple: "total pour impôts",
    expert: "cumul imposable",
    def: "Total des revenus depuis janvier, base pour le calcul de l'impôt annuel.",
    exemple: "Cumul imposable juin = 6 mois × net imposable moyen"
  },
  
  "plafond sécurité sociale": {
    simple: "limite de cotisation",
    expert: "plafond sécurité sociale",
    def: "Limite au-delà de laquelle certaines cotisations ne s'appliquent plus. 3666€/mois en 2024.",
    exemple: "Au-delà de 3666€/mois : certaines cotisations plafonnent"
  },
  
  "proratisation": {
    simple: "calcul proportionnel",
    expert: "proratisation",
    def: "Calcul au prorata du temps travaillé. Utilisé pour les entrées/sorties en cours de mois.",
    exemple: "Arrivé le 15 : salaire proratisé = salaire × 15/30 jours"
  },
  
  "absence non rémunérée": {
    simple: "absence non payée",
    expert: "absence non rémunérée",
    def: "Jour d'absence qui n'est pas payé (grève, absence injustifiée, congé sans solde).",
    exemple: "1 jour de grève = -1/30e du salaire mensuel"
  },
  
  "retenue sur salaire": {
    simple: "déduction du salaire",
    expert: "retenue sur salaire",
    def: "Somme déduite du salaire pour absence, trop-perçu, ou autre motif légal.",
    exemple: "Absence 3 jours → retenue 3 × (salaire/30)"
  },
  
  "solde de tout compte": {
    simple: "dernier versement",
    expert: "solde de tout compte",
    def: "Document remis à la rupture du contrat récapitulant toutes les sommes dues (salaire, congés, primes).",
    exemple: "Solde de tout compte = salaire + CP + indemnités"
  },
  
  "variable": {
    simple: "partie qui change",
    expert: "variable",
    def: "Part du salaire qui varie selon les résultats (commissions, objectifs, heures sup).",
    exemple: "Fixe 1500€ + variable 500€ = 2000€ total"
  },
  
  "fixe": {
    simple: "partie garantie",
    expert: "fixe",
    def: "Part du salaire garantie chaque mois, indépendante des résultats ou heures travaillées.",
    exemple: "Salaire fixe = sécurité mensuelle garantie"
  },
  
  "commission": {
    simple: "pourcentage des ventes",
    expert: "commission",
    def: "Rémunération calculée en % des ventes ou résultats. Courante dans le commerce.",
    exemple: "5% de commission sur 10000€ de ventes = 500€"
  },
  
  
  // ═══════════════════════════════════════════════════════════════
  // DROIT ET JURIDIQUE (40 termes)
  // ═══════════════════════════════════════════════════════════════
  
  "contingent": {
    simple: "limite annuelle",
    expert: "contingent",
    def: "Nombre maximum d'heures supplémentaires autorisées par an selon la loi ou ta convention collective. C'est un cadre qui protège à la fois l'employeur et le salarié.",
    exemple: "Contingent 220h = jusqu'à 220h sup possibles dans l'année. Au-delà, il faut un accord spécifique."
  },
  
  "contingent annuel": {
    simple: "limite annuelle d'heures sup",
    expert: "contingent annuel",
    def: "Total d'heures supplémentaires possibles par an selon la réglementation applicable. C'est un plafond fixé pour garantir un équilibre.",
    exemple: "Si contingent = 220h et cumul actuel = 200h → marge restante = 20h"
  },
  
  "palier": {
    simple: "tranche d'heures",
    expert: "palier",
    def: "Niveau d'heures supplémentaires avec un taux de majoration spécifique. Chaque palier a son propre pourcentage.",
    exemple: "1er palier (0-8h) = +25%, 2e palier (8h+) = +50%"
  },
  
  "3 paliers": {
    simple: "3 tranches différentes",
    expert: "3 paliers",
    def: "Système avec 3 niveaux de majoration (exemple HCR : 10% puis 20% puis 50%).",
    exemple: "HCR : 0-4h=+10%, 4-8h=+20%, 8h+=+50%"
  },
  
  "CCN": {
    simple: "accord de ton secteur",
    expert: "CCN",
    def: "Convention Collective Nationale. Ensemble de règles spécifiques à ton secteur d'activité (hôtellerie, BTP, commerce, etc.).",
    exemple: "CCN HCR (hôtels-cafés-restaurants) : règles différentes de la CCN BTP"
  },
  
  "IDCC": {
    simple: "code de l'accord",
    expert: "IDCC",
    def: "Identifiant unique de ta convention collective (numéro à 4 chiffres). Indiqué sur ta fiche de paie.",
    exemple: "IDCC 3292 = Convention HCR"
  },
  
  "convention collective": {
    simple: "règles de ton métier",
    expert: "convention collective",
    def: "Accord négocié entre employeurs et salariés d'un secteur. Définit les règles sur les heures sup, congés, salaires, etc.",
    exemple: "Ta CCN peut prévoir 360h de contingent au lieu de 220h"
  },
  
  "repos compensateur": {
    simple: "congé en échange des heures",
    expert: "repos compensateur",
    def: "Congé accordé en échange d'heures supplémentaires, au lieu d'un paiement. Devient obligatoire au-delà du contingent annuel selon la loi.",
    exemple: "10h sup au-delà du contingent = 10h de repos compensateur à prendre"
  },
  
  "contrepartie obligatoire en repos": {
    simple: "repos obligatoire",
    expert: "contrepartie obligatoire en repos",
    def: "Repos prévu par la loi quand le contingent annuel est dépassé. C'est une protection légale pour la santé du salarié.",
    exemple: "Dépassement du contingent → chaque heure sup génère du repos compensateur"
  },
  
  "récupération": {
    simple: "repos pour compenser",
    expert: "récupération",
    def: "Temps de repos pris pour compenser des heures supplémentaires effectuées. Alternative au paiement.",
    exemple: "10h sup → tu prends 10h de récup au lieu d'être payé"
  },
  
  "droit commun": {
    simple: "règles de base",
    expert: "droit commun",
    def: "Règles légales standard qui s'appliquent quand il n'y a pas de convention collective spécifique.",
    exemple: "Droit commun : 35h/semaine, majoration 25%/50%, contingent 220h"
  },
  
  "Code du Travail": {
    simple: "loi du travail",
    expert: "Code du Travail",
    def: "Livre de lois qui régit les relations de travail en France. Contient toutes les règles légales.",
    exemple: "Le Code du Travail fixe la durée légale à 35h/semaine"
  },
  
  "Art. L3121-22": {
    simple: "article de loi",
    expert: "Art. L3121-22",
    def: "Article du Code du Travail qui définit les règles sur les heures supplémentaires.",
    exemple: "L3121-22 = règle sur la durée légale du travail (35h)"
  },
  
  "accord d'entreprise": {
    simple: "accord de ta boîte",
    expert: "accord d'entreprise",
    def: "Accord négocié dans ton entreprise qui peut adapter les règles de la CCN (horaires, primes, etc.).",
    exemple: "Accord d'entreprise : contingent 250h au lieu de 220h"
  },
  
  "accord de branche": {
    simple: "accord du secteur",
    expert: "accord de branche",
    def: "Accord négocié au niveau d'un secteur d'activité (métallurgie, commerce, etc.). S'applique à toutes les entreprises du secteur.",
    exemple: "Accord branche métallurgie : 13e mois obligatoire"
  },
  
  "usage d'entreprise": {
    simple: "habitude dans la boîte",
    expert: "usage d'entreprise",
    def: "Pratique répétée et constante dans l'entreprise qui devient un droit acquis (prime, jour de congé, etc.).",
    exemple: "Prime de Noël versée 3 ans de suite = usage acquis"
  },
  
  "dérogation": {
    simple: "exception à la règle",
    expert: "dérogation",
    def: "Autorisation de ne pas appliquer une règle légale dans certains cas précis et encadrés.",
    exemple: "Dérogation pour dépasser 10h/jour : autorisée par l'inspection"
  },
  
  "inspection du travail": {
    simple: "contrôleur du travail",
    expert: "inspection du travail",
    def: "Service public qui contrôle le respect du droit du travail dans les entreprises. Peut sanctionner.",
    exemple: "Inspection du travail vérifie les heures sup, la sécurité, etc."
  },
  
  "médecine du travail": {
    simple: "médecin du travail",
    expert: "médecine du travail",
    def: "Service médical qui surveille ta santé au travail. Visite obligatoire à l'embauche et périodiquement.",
    exemple: "Visite médecine du travail tous les 2 ans minimum"
  },
  
  "inaptitude": {
    simple: "incapable de travailler",
    expert: "inaptitude",
    def: "Constat médical que tu ne peux plus exercer ton poste. Peut mener à un reclassement ou licenciement.",
    exemple: "Médecin du travail déclare inapte → recherche de reclassement"
  },
  
  "reclassement": {
    simple: "changement de poste",
    expert: "reclassement",
    def: "Proposition d'un autre poste adapté à ta santé après inaptitude. Obligation de l'employeur.",
    exemple: "Inaptitude physique → reclassement sur poste administratif"
  },
  
  "mise à pied": {
    simple: "suspension temporaire",
    expert: "mise à pied",
    def: "Suspension du contrat de travail pour sanction (avec retenue de salaire) ou avant licenciement.",
    exemple: "Mise à pied 3 jours pour faute = 3 jours non payés"
  },
  
  "avertissement": {
    simple: "blâme écrit",
    expert: "avertissement",
    def: "Sanction disciplinaire écrite notifiant une faute. Reste au dossier mais n'impacte pas le salaire.",
    exemple: "Retards répétés → avertissement au dossier"
  },
  
  "blâme": {
    simple: "réprimande",
    expert: "blâme",
    def: "Sanction disciplinaire moins grave que l'avertissement. Simple rappel à l'ordre.",
    exemple: "Blâme oral pour oubli mineur"
  },
  
  "licenciement": {
    simple: "renvoi",
    expert: "licenciement",
    def: "Rupture du contrat à l'initiative de l'employeur. Doit être justifié (faute, économique, inaptitude).",
    exemple: "Licenciement économique = suppressions de postes"
  },
  
  "démission": {
    simple: "partir de soi-même",
    expert: "démission",
    def: "Rupture du contrat à ton initiative. Tu quittes l'entreprise de ton plein gré.",
    exemple: "Démission = tu pars, pas de chômage (sauf cas spéciaux)"
  },
  
  "rupture conventionnelle": {
    simple: "séparation à l'amiable",
    expert: "rupture conventionnelle",
    def: "Rupture du contrat d'un commun accord. Donne droit au chômage et à une indemnité.",
    exemple: "Rupture conventionnelle = accord employeur/salarié pour partir"
  },
  
  "préavis": {
    simple: "délai avant départ",
    expert: "préavis",
    def: "Période de travail entre l'annonce de départ et le départ effectif. Durée fixée par la CCN.",
    exemple: "Démission avec préavis 1 mois : tu travailles encore 1 mois"
  },
  
  "délai de carence": {
    simple: "attente avant droits",
    expert: "délai de carence",
    def: "Période d'attente avant de bénéficier d'un droit (chômage, mutuelle, prévoyance).",
    exemple: "Délai carence chômage : 7 jours d'attente avant indemnisation"
  },
  
  "période d'essai": {
    simple: "test au début",
    expert: "période d'essai",
    def: "Début du contrat où employeur et salarié peuvent rompre facilement. Durée selon CCN (2-4 mois).",
    exemple: "Période d'essai 2 mois : rupture possible sans motif"
  },
  
  "renouvellement": {
    simple: "prolongation",
    expert: "renouvellement",
    def: "Prolongation d'un contrat (CDD, période d'essai) selon les règles légales ou conventionnelles.",
    exemple: "Renouvellement période d'essai : +2 mois max"
  },
  
  "CDI": {
    simple: "contrat fixe",
    expert: "CDI",
    def: "Contrat à Durée Indéterminée. Forme normale du contrat de travail, sans date de fin.",
    exemple: "CDI = contrat stable, pas de date de fin"
  },
  
  "CDD": {
    simple: "contrat temporaire",
    expert: "CDD",
    def: "Contrat à Durée Déterminée. Contrat avec une date de fin précise. Cas de recours limités.",
    exemple: "CDD 6 mois = contrat qui finit automatiquement après 6 mois"
  },
  
  "intérim": {
    simple: "mission temporaire",
    expert: "intérim",
    def: "Travail temporaire via une agence. Contrat de mission avec date de fin.",
    exemple: "Mission intérim 3 semaines = remplacement ou surcharge"
  },
  
  "clause de non-concurrence": {
    simple: "interdiction concurrence",
    expert: "clause de non-concurrence",
    def: "Interdiction de travailler pour un concurrent après ton départ. Doit être indemnisée.",
    exemple: "Non-concurrence 1 an = pas de concurrent + 30% salaire/mois"
  },
  
  "clause de mobilité": {
    simple: "obligation de bouger",
    expert: "clause de mobilité",
    def: "Clause permettant à l'employeur de changer ton lieu de travail dans une zone géographique définie.",
    exemple: "Mobilité Île-de-France = mutation possible dans toute l'IDF"
  },
  
  "temps de travail": {
    simple: "durée de travail",
    expert: "temps de travail",
    def: "Période pendant laquelle le salarié est à la disposition de l'employeur. Réglementé par la loi.",
    exemple: "Temps de travail = temps effectif (hors pauses)"
  },
  
  "base hebdomadaire": {
    simple: "heures normales par semaine",
    expert: "base hebdomadaire",
    def: "Nombre d'heures de travail normal dans une semaine. Généralement 35h, mais peut varier selon accord.",
    exemple: "Base 35h → au-delà = heures supplémentaires"
  },
  
  "seuil": {
    simple: "limite avant heures sup",
    expert: "seuil",
    def: "Durée de travail normale au-delà de laquelle commence le décompte des heures supplémentaires.",
    exemple: "Seuil 35h → si tu fais 40h, tu as 5h sup"
  },
  
  "reliquat": {
    simple: "heures reportées",
    expert: "reliquat",
    def: "Heures supplémentaires qui ne sont pas encore payées ou récupérées, reportées au mois suivant.",
    exemple: "10h sup non payées ce mois = reliquat de 10h au mois prochain"
  },
  
  "report": {
    simple: "heures du mois dernier",
    expert: "report",
    def: "Heures supplémentaires du mois précédent qui s'ajoutent au mois actuel pour le calcul.",
    exemple: "Report 5h + 10h ce mois = 15h total"
  },
  
  "cumul": {
    simple: "total",
    expert: "cumul",
    def: "Total des heures supplémentaires additionnées sur une période (mois, trimestre, année).",
    exemple: "Cumul annuel : janvier 10h + février 15h = 25h"
  },
  
  
  // ═══════════════════════════════════════════════════════════════
  // SANTÉ ET BIEN-ÊTRE (25 termes)
  // ═══════════════════════════════════════════════════════════════
  
  "Digital Twin": {
    simple: "jumeau numérique",
    expert: "Digital Twin",
    def: "Copie virtuelle de ton état physique et mental basée sur tes heures de travail. Prédit les risques de santé.",
    exemple: "Digital Twin détecte : fatigue 75%, risque burnout élevé"
  },
  
  "score biométrique": {
    simple: "état de santé",
    expert: "score biométrique",
    def: "Indicateur calculé à partir de tes heures de travail pour évaluer ta fatigue, stress, performance.",
    exemple: "Score fatigue : 0% = en forme, 100% = épuisé"
  },
  
  "fatigue": {
    simple: "niveau de fatigue",
    expert: "fatigue",
    def: "Indicateur de ton épuisement physique et mental basé sur tes heures de travail et ton rythme.",
    exemple: "Fatigue 80% = tu es très fatigué, besoin de repos urgent"
  },
  
  "performance": {
    simple: "efficacité",
    expert: "performance",
    def: "Indicateur de ton efficacité au travail. Baisse quand la fatigue augmente ou le stress est élevé.",
    exemple: "Performance 40% = tu es moins efficace qu'en forme"
  },
  
  "stress": {
    simple: "niveau de stress",
    expert: "stress",
    def: "Indicateur de tension psychologique liée à la charge de travail et au rythme.",
    exemple: "Stress 90% = pression importante, risque pour la santé"
  },
  
  "burnout": {
    simple: "épuisement professionnel",
    expert: "burnout",
    def: "État d'épuisement physique et mental causé par un stress prolongé au travail. Reconnu comme maladie professionnelle.",
    exemple: "Burnout = fatigue extrême + démotivation + perte d'efficacité"
  },
  
  "surmenage": {
    simple: "trop de travail",
    expert: "surmenage",
    def: "État de fatigue excessive dû à une charge de travail trop importante ou prolongée.",
    exemple: "60h/semaine pendant 3 mois = risque de surmenage"
  },
  
  "charge mentale": {
    simple: "poids psychologique",
    expert: "charge mentale",
    def: "Pression psychologique liée au travail : responsabilités, décisions, multitâche, urgences.",
    exemple: "Manager 20 personnes = charge mentale élevée"
  },
  
  "charge de travail": {
    simple: "quantité de travail",
    expert: "charge de travail",
    def: "Volume de travail à accomplir sur une période. Peut être mesuré en heures, tâches, ou objectifs.",
    exemple: "Charge de travail excessive = risque de santé"
  },
  
  "récupération": {
    simple: "temps de repos",
    expert: "récupération",
    def: "Temps nécessaire pour que le corps et l'esprit se remettent de l'effort. Essentiel pour la santé.",
    exemple: "Après une semaine chargée, besoin de récupération = repos"
  },
  
  "équilibre vie pro/perso": {
    simple: "équilibre travail/vie",
    expert: "équilibre vie pro/perso",
    def: "Juste répartition entre temps de travail et temps personnel. Essentiel pour la santé mentale.",
    exemple: "50h/semaine au travail = déséquilibre vie pro/perso"
  },
  
  "droit à la déconnexion": {
    simple: "droit de couper",
    expert: "droit à la déconnexion",
    def: "Droit de ne pas répondre aux sollicitations professionnelles hors temps de travail (mail, téléphone).",
    exemple: "Mail à 22h = tu n'es pas obligé de répondre avant le lendemain"
  },
  
  "risque psychosocial": {
    simple: "risque pour la santé mentale",
    expert: "risque psychosocial",
    def: "Risque pour la santé mentale lié au travail : stress, harcèlement, violence, charge excessive.",
    exemple: "RPS = stress chronique, burnout, dépression"
  },
  
  "harcèlement": {
    simple: "agissements répétés",
    expert: "harcèlement",
    def: "Agissements répétés qui dégradent les conditions de travail. Interdit et sanctionné par la loi.",
    exemple: "Remarques humiliantes répétées = harcèlement moral"
  },
  
  "accident du travail": {
    simple: "accident au travail",
    expert: "accident du travail",
    def: "Accident survenu pendant le travail ou le trajet domicile-travail. Pris en charge à 100% par la sécu.",
    exemple: "Chute au bureau = accident du travail"
  },
  
  "maladie professionnelle": {
    simple: "maladie liée au travail",
    expert: "maladie professionnelle",
    def: "Maladie causée par les conditions de travail. Liste fixée par la sécu (TMS, burnout, etc.).",
    exemple: "Troubles musculo-squelettiques = maladie pro reconnue"
  },
  
  "arrêt maladie": {
    simple: "arrêt de travail",
    expert: "arrêt maladie",
    def: "Certificat médical autorisant l'absence pour raison de santé. Indemnisé par la sécu et l'employeur.",
    exemple: "Grippe = arrêt maladie 5 jours"
  },
  
  "mi-temps thérapeutique": {
    simple: "reprise à mi-temps",
    expert: "mi-temps thérapeutique",
    def: "Reprise du travail à temps partiel après arrêt maladie pour faciliter la récupération. Prescription médicale.",
    exemple: "Après burnout : mi-temps thérapeutique 3 mois"
  },
  
  "visite de reprise": {
    simple: "visite médicale retour",
    expert: "visite de reprise",
    def: "Visite médicale obligatoire après un arrêt long (30 jours) pour vérifier si tu peux reprendre.",
    exemple: "Arrêt 2 mois → visite de reprise avec médecin du travail"
  },
  
  "aptitude": {
    simple: "capacité à travailler",
    expert: "aptitude",
    def: "Avis médical confirmant que tu peux exercer ton poste. Délivré par le médecin du travail.",
    exemple: "Visite médicale : avis d'aptitude sans réserve"
  },
  
  "restriction": {
    simple: "limitation",
    expert: "restriction",
    def: "Limitation imposée par le médecin du travail : pas de port de charges, horaires adaptés, etc.",
    exemple: "Restriction : pas de port de charge >10kg"
  },
  
  "ergonomie": {
    simple: "adaptation du poste",
    expert: "ergonomie",
    def: "Adaptation du poste de travail pour préserver la santé : siège, écran, éclairage, etc.",
    exemple: "Ergonomie bureau : écran à hauteur des yeux, siège réglable"
  },
  
  "TMS": {
    simple: "troubles musculaires",
    expert: "TMS",
    def: "Troubles Musculo-Squelettiques. Douleurs articulaires/musculaires liées au travail répétitif.",
    exemple: "TMS = douleurs poignet, dos, épaule dues au travail"
  },
  
  "pénibilité": {
    simple: "difficultés du travail",
    expert: "pénibilité",
    def: "Facteurs de risques professionnels (port de charges, postures, bruit, etc.). Ouvre droits à la retraite.",
    exemple: "Travail de nuit + port de charges = facteurs de pénibilité"
  },
  
  "compte professionnel de prévention": {
    simple: "compte pénibilité",
    expert: "compte professionnel de prévention",
    def: "Compte qui cumule des points selon l'exposition aux facteurs de pénibilité. Utilisable pour la formation ou la retraite.",
    exemple: "10 ans de nuit = points sur le C2P pour partir plus tôt"
  },
  
  
  // ═══════════════════════════════════════════════════════════════
  // OUTILS ET MODULES (30 termes)
  // ═══════════════════════════════════════════════════════════════
  
  "RPG": {
    simple: "jeu de rôle",
    expert: "RPG",
    def: "Role Playing Game. Dans Fox, c'est le mode ludique avec badges et récompenses pour motiver la saisie.",
    exemple: "Mode RPG : gagner des badges en saisissant régulièrement tes heures"
  },
  
  "mode PRO": {
    simple: "mode professionnel",
    expert: "mode PRO",
    def: "Version épurée de Fox sans éléments ludiques. Focus sur l'analyse juridique et les conseils pratiques.",
    exemple: "Mode PRO : analyse de ta situation sans badges ni animations"
  },
  
  "Kitsune": {
    simple: "assistant virtuel",
    expert: "Kitsune",
    def: "Renard virtuel qui t'aide dans Fox. Il analyse ta situation et donne des conseils personnalisés basés sur le droit du travail.",
    exemple: "Kitsune détecte un risque de dépassement du contingent et te prévient"
  },
  
  "badge": {
    simple: "récompense",
    expert: "badge",
    def: "Récompense visuelle obtenue en accomplissant certaines actions (saisie régulière, analyse complète, objectifs).",
    exemple: "Badge 'Rigoureux' : 30 jours de saisie consécutifs"
  },
  
  "synthèse": {
    simple: "résumé",
    expert: "synthèse",
    def: "Vue d'ensemble de ta situation avec les points clés, alertes juridiques et recommandations.",
    exemple: "Synthèse : 150h sup cumulées, 68% du contingent, alerte légale"
  },
  
  "prédiction": {
    simple: "estimation future",
    expert: "prédiction",
    def: "Projection de ton état futur si tu continues au même rythme de travail. Basée sur l'historique.",
    exemple: "Prédiction : dans 2 mois, fatigue atteindra 90% si rythme actuel"
  },
  
  "heatmap": {
    simple: "carte de chaleur",
    expert: "heatmap",
    def: "Calendrier coloré montrant l'intensité de travail par jour. Rouge = journée chargée, vert = normale, bleu = repos.",
    exemple: "Heatmap : janvier très chargé (rouge), février calme (vert)"
  },
  
  "simulation": {
    simple: "test de scénario",
    expert: "simulation",
    def: "Test de différentes situations pour voir l'impact sur ta santé, ton contingent et tes heures sup.",
    exemple: "Simulation : si je travaille 45h/semaine pendant 3 mois → impact ?"
  },
  
  "projection": {
    simple: "estimation",
    expert: "projection",
    def: "Calcul de ce qui va se passer si la tendance actuelle continue sur plusieurs mois.",
    exemple: "Projection : tu atteindras 220h de contingent en novembre à ce rythme"
  },
  
  "calendrier": {
    simple: "planning des jours",
    expert: "calendrier",
    def: "Vue mensuelle ou annuelle des jours travaillés avec les heures saisies et les statistiques.",
    exemple: "Calendrier mensuel : total 165h dont 13h sup"
  },
  
  "graphique": {
    simple: "courbe visuelle",
    expert: "graphique",
    def: "Représentation visuelle de l'évolution des heures, du contingent ou de la santé sur plusieurs mois.",
    exemple: "Graphique annuel : pic en décembre, creux en août"
  },
  
  "tableau de bord": {
    simple: "vue d'ensemble",
    expert: "tableau de bord",
    def: "Écran récapitulatif avec tous les indicateurs clés : heures, contingent, santé, alertes.",
    exemple: "Tableau de bord : 3 alertes, 75% contingent, fatigue modérée"
  },
  
  "alerte": {
    simple: "avertissement",
    expert: "alerte",
    def: "Notification quand une limite est proche ou dépassée : contingent, durée max, santé.",
    exemple: "Alerte à 75% du contingent (165h/220h)"
  },
  
  "notification": {
    simple: "message d'info",
    expert: "notification",
    def: "Message automatique pour t'informer d'un événement : dépassement, rappel de saisie, nouveau badge.",
    exemple: "Notification : 'Tu as dépassé 48h cette semaine'"
  },
  
  "export": {
    simple: "téléchargement",
    expert: "export",
    def: "Téléchargement de tes données dans un fichier (PDF, Excel, JSON) pour sauvegarde ou justificatif.",
    exemple: "Export PDF : récapitulatif annuel de tes heures sup"
  },
  
  "import": {
    simple: "chargement de données",
    expert: "import",
    def: "Chargement de données depuis un fichier externe (planning, heures, etc.) vers l'application.",
    exemple: "Import CSV : charger le planning de ton employeur"
  },
  
  "sauvegarde": {
    simple: "copie de sécurité",
    expert: "sauvegarde",
    def: "Copie de tes données pour éviter de les perdre. À faire régulièrement.",
    exemple: "Sauvegarde mensuelle en JSON recommandée"
  },
  
  "historique": {
    simple: "données passées",
    expert: "historique",
    def: "Archive de toutes tes données passées : heures, calculs, alertes sur plusieurs années.",
    exemple: "Historique : consulter tes heures de 2022 à 2024"
  },
  
  "période": {
    simple: "durée",
    expert: "période",
    def: "Intervalle de temps sur lequel on calcule les heures : semaine, mois, trimestre, année.",
    exemple: "Période mensuelle : du 1er au 31 du mois"
  },
  
  "exercice": {
    simple: "année",
    expert: "exercice",
    def: "Année de référence pour le calcul du contingent et des heures sup (généralement année civile).",
    exemple: "Exercice 2026 : du 1er janvier au 31 décembre 2026"
  },
  
  "dépassement": {
    simple: "au-delà de la limite",
    expert: "dépassement",
    def: "Situation où on dépasse une limite fixée : contingent, durée maximale, seuil d'alerte.",
    exemple: "Dépassement du contingent : 230h/220h = +10h"
  },
  
  "saisie": {
    simple: "noter les heures",
    expert: "saisie",
    def: "Action d'enregistrer tes heures de travail dans l'application jour par jour.",
    exemple: "Saisie quotidienne : noter 8h30 chaque jour travaillé"
  },
  
  "récapitulatif": {
    simple: "résumé total",
    expert: "récapitulatif",
    def: "Document ou écran résumant toutes tes heures et calculs sur une période.",
    exemple: "Récapitulatif mensuel : 165h dont 13h sup à 25%"
  },
  
  "module": {
    simple: "partie de l'app",
    expert: "module",
    def: "Partie indépendante de l'application dédiée à une fonction : annuel (M1), mensuel (M2), Fox (M3), prédictions (M4).",
    exemple: "Module 1 = suivi annuel, Module 2 = paie mensuelle"
  },
  
  "M1": {
    simple: "module annuel",
    expert: "M1",
    def: "Module 1 : Suivi annuel des heures supplémentaires avec calendrier et compteur de contingent.",
    exemple: "M1 : voir ton total annuel d'heures sup"
  },
  
  "M2": {
    simple: "module mensuel",
    expert: "M2",
    def: "Module 2 : Simulation de paie mensuelle avec calcul des heures sup et montants.",
    exemple: "M2 : calculer ce que tu dois gagner ce mois"
  },
  
  "M3": {
    simple: "module Fox",
    expert: "M3",
    def: "Module 3 : Assistant Fox avec analyse juridique, conseils personnalisés et mode RPG optionnel.",
    exemple: "M3 : Kitsune analyse ta situation et te conseille"
  },
  
  "M4": {
    simple: "module prédictions",
    expert: "M4",
    def: "Module 4 : Digital Twin avec prédictions de santé, simulations et heatmap.",
    exemple: "M4 : prévoir ton état de fatigue dans 2 mois"
  },
  
  "PWA": {
    simple: "app web installable",
    expert: "PWA",
    def: "Progressive Web App. Application web qui fonctionne comme une app mobile : installable, fonctionne hors ligne.",
    exemple: "PWA = ajouter à l'écran d'accueil de ton téléphone"
  },
  
  "offline": {
    simple: "hors connexion",
    expert: "offline",
    def: "Mode de fonctionnement sans connexion internet. Tes données sont sur ton téléphone.",
    exemple: "Offline : l'app fonctionne même sans wifi"
  },
  
  
  // ═══════════════════════════════════════════════════════════════
  // SPÉCIFIQUE HCR ET SECTEURS (15 termes)
  // ═══════════════════════════════════════════════════════════════
  
  "HCR": {
    simple: "hôtels-restaurants",
    expert: "HCR",
    def: "Hôtels, Cafés, Restaurants. Secteur avec des règles spécifiques : 3 paliers de majoration (10%, 20%, 50%) et contingent 360h.",
    exemple: "HCR : contingent plus élevé car secteur avec horaires variables"
  },
  
  "établissement permanent": {
    simple: "ouvert toute l'année",
    expert: "établissement permanent",
    def: "Établissement qui fonctionne toute l'année (par opposition à saisonnier). Contingent 360h dans HCR.",
    exemple: "Restaurant permanent (ouvert 12 mois) vs restaurant saisonnier (été uniquement)"
  },
  
  "établissement saisonnier": {
    simple: "ouvert en saison",
    expert: "établissement saisonnier",
    def: "Établissement ouvert seulement une partie de l'année (été, hiver). Règles spécifiques.",
    exemple: "Restaurant de plage : ouvert juin-septembre = saisonnier"
  },
  
  "coupure": {
    simple: "pause longue",
    expert: "coupure",
    def: "Pause longue non payée entre deux services. Courante en HCR (entre midi et soir).",
    exemple: "Service midi 11h-15h, puis coupure 3h, puis service soir 18h-23h"
  },
  
  "service": {
    simple: "période de travail",
    expert: "service",
    def: "Période de travail continue. En HCR : service du midi, service du soir.",
    exemple: "Service du midi = 11h30-15h"
  },
  
  "double service": {
    simple: "midi et soir",
    expert: "double service",
    def: "Travail au service du midi ET du soir dans la même journée. Longue amplitude horaire.",
    exemple: "Double service = 11h-23h avec coupure 15h-18h"
  },
  
  "BTP": {
    simple: "bâtiment-travaux publics",
    expert: "BTP",
    def: "Bâtiment et Travaux Publics. Secteur avec contingent 180h et règles spécifiques (intempéries, pénibilité).",
    exemple: "BTP : contingent réduit à 180h/an"
  },
  
  "intempéries": {
    simple: "mauvais temps",
    expert: "intempéries",
    def: "Conditions météo empêchant le travail (BTP). Chômage technique indemnisé.",
    exemple: "Pluie forte en BTP = arrêt pour intempéries, indemnisé"
  },
  
  "chômage technique": {
    simple: "arrêt forcé payé",
    expert: "chômage technique",
    def: "Arrêt du travail pour raison indépendante du salarié (panne, intempéries). Partiellement indemnisé.",
    exemple: "Usine en panne 2 jours = chômage technique, 70% du salaire"
  },
  
  "commerce": {
    simple: "vente",
    expert: "commerce",
    def: "Secteur de la vente. Règles spécifiques sur les dimanches, jours fériés et modulation.",
    exemple: "Commerce : dimanche souvent travaillé avec majoration"
  },
  
  "grande distribution": {
    simple: "supermarché",
    expert: "grande distribution",
    def: "Secteur des grandes surfaces. CCN avec taux réduits (10%/25%) et contingent 220h.",
    exemple: "Grande distribution : heures sup majorées à 10% puis 25% seulement"
  },
  
  "logistique": {
    simple: "transport-stockage",
    expert: "logistique",
    def: "Secteur du transport et stockage de marchandises. Horaires variables, pics d'activité.",
    exemple: "Logistique : pics en décembre (Noël) = beaucoup d'heures sup"
  },
  
  "santé": {
    simple: "médical-soignant",
    expert: "santé",
    def: "Secteur médical et paramédical (hôpitaux, cliniques, EHPAD). Horaires 24h/24, gardes.",
    exemple: "Santé : gardes de nuit, astreintes, dimanche travaillé"
  },
  
  "garde": {
    simple: "service de nuit/week-end",
    expert: "garde",
    def: "Période de travail continu de longue durée (12h, 24h) dans le secteur santé. Majorée.",
    exemple: "Garde 24h hôpital = samedi 8h à dimanche 8h"
  },
  
  "astreinte médicale": {
    simple: "disponible pour urgences",
    expert: "astreinte médicale",
    def: "Période où le médecin/infirmier doit être joignable pour intervenir. Indemnisée même sans intervention.",
    exemple: "Astreinte nuit : à domicile mais dispo si appel urgence"
  }
};

// ═══════════════════════════════════════════════════════════════
// GESTION DU MODE
// ═══════════════════════════════════════════════════════════════
const MODE_STORAGE_KEY = 'APP_MODE'; // 'debutant' ou 'expert'

function getMode() {
  return localStorage.getItem(MODE_STORAGE_KEY) || 'debutant';
}

function setMode(mode) {
  localStorage.setItem(MODE_STORAGE_KEY, mode);
  applyMode();
}

function isFirstVisit() {
  return !localStorage.getItem('APP_VISITED');
}

function markVisited() {
  localStorage.setItem('APP_VISITED', 'true');
}

// ═══════════════════════════════════════════════════════════════
// APPLICATION DU MODE
// ═══════════════════════════════════════════════════════════════
function applyMode() {
  const mode = getMode();
  document.body.classList.toggle('mode-debutant', mode === 'debutant');
  document.body.classList.toggle('mode-expert', mode === 'expert');
  
  // Mettre à jour le switch de mode si présent
  const modeSwitch = document.getElementById('mode-switch');
  if (modeSwitch) {
    modeSwitch.checked = (mode === 'expert');
  }
  
  // Appliquer les transformations de texte
  transformTextByMode();
}

function transformTextByMode() {
  const mode = getMode();
  
  // Si mode débutant, remplacer les termes techniques par versions simples
  if (mode === 'debutant') {
    document.querySelectorAll('[data-glossaire]').forEach(el => {
      const terme = el.getAttribute('data-glossaire');
      const entry = GLOSSAIRE[terme];
      if (entry) {
        el.textContent = entry.simple;
      }
    });
  } else {
    // Mode expert : restaurer les termes techniques
    document.querySelectorAll('[data-glossaire]').forEach(el => {
      const terme = el.getAttribute('data-glossaire');
      const entry = GLOSSAIRE[terme];
      if (entry) {
        el.textContent = entry.expert;
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// POPUP DE DÉFINITION
// ═══════════════════════════════════════════════════════════════
function showDefinition(terme) {
  const entry = GLOSSAIRE[terme];
  if (!entry) return;
  
  const mode = getMode();
  
  // Créer la popup
  const popup = document.createElement('div');
  popup.className = 'glossaire-popup';
  popup.innerHTML = `
    <div class="glossaire-popup-content">
      <button class="glossaire-close" onclick="this.parentElement.parentElement.remove()">×</button>
      <h3>${entry.expert}</h3>
      ${mode === 'debutant' ? `<p class="glossaire-simple">💡 En simple : <b>${entry.simple}</b></p>` : ''}
      <p class="glossaire-def">${entry.def}</p>
      <p class="glossaire-exemple">📌 Exemple : ${entry.exemple}</p>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Fermer en cliquant à l'extérieur
  popup.addEventListener('click', (e) => {
    if (e.target === popup) popup.remove();
  });
  
  // Fermer avec Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      popup.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// ═══════════════════════════════════════════════════════════════
// TUTORIEL PREMIÈRE UTILISATION
// ═══════════════════════════════════════════════════════════════
function showTutorial() {
  const tutorial = document.createElement('div');
  tutorial.className = 'tutorial-overlay';
  tutorial.innerHTML = `
    <div class="tutorial-content">
      <h2>👋 Bienvenue sur Simulheures !</h2>
      
      <div class="tutorial-step">
        <h3>🎯 À quoi ça sert ?</h3>
        <p>Cette application t'aide à <b>suivre tes heures supplémentaires</b> et <b>vérifier tes calculs de paie</b>. Un outil pour toi et ton employeur.</p>
      </div>
      
      <div class="tutorial-step">
        <h3>⚖️ Ta convention collective</h3>
        <p>Les règles sur les heures supplémentaires varient selon ton secteur d'activité. Choisis ta situation :</p>
        <div class="ccn-choice">
          <button class="ccn-choice-btn" onclick="selectTutorialCCN('search')">
            <div class="ccn-icon">🔍</div>
            <div class="ccn-title">Je connais ma CCN</div>
            <div class="ccn-desc">Hôtellerie, BTP, Commerce, etc.</div>
          </button>
          <button class="ccn-choice-btn" onclick="selectTutorialCCN('default')">
            <div class="ccn-icon">📋</div>
            <div class="ccn-title">Droit commun</div>
            <div class="ccn-desc">Règles de base (35h, 220h/an)</div>
          </button>
          <button class="ccn-choice-btn" onclick="selectTutorialCCN('custom')">
            <div class="ccn-icon">⚙️</div>
            <div class="ccn-title">Accord personnalisé</div>
            <div class="ccn-desc">Configuration sur mesure</div>
          </button>
        </div>
      </div>
      
      <div class="tutorial-step" id="mode-selection-step" style="display:none;">
        <h3>🔧 Mode d'affichage :</h3>
        <div class="mode-choice">
          <button class="mode-btn" onclick="selectTutorialMode('debutant')">
            <div class="mode-icon">🎓</div>
            <div class="mode-title">Mode Débutant</div>
            <div class="mode-desc">Vocabulaire simplifié + aide à chaque étape</div>
          </button>
          <button class="mode-btn" onclick="selectTutorialMode('expert')">
            <div class="mode-icon">⚡</div>
            <div class="mode-title">Mode Expert</div>
            <div class="mode-desc">Termes techniques + interface rapide</div>
          </button>
        </div>
      </div>
      
      <div class="tutorial-footer">
        <label>
          <input type="checkbox" id="tutorial-no-show"> Ne plus afficher ce message
        </label>
      </div>
    </div>
  `;
  
  document.body.appendChild(tutorial);
}

function selectTutorialCCN(choice) {
  // Gérer le choix de CCN
  if (choice === 'search') {
    // Ouvrir le modal CCN si disponible (dans menu.html)
    if (typeof openCCNModal === 'function') {
      openCCNModal();
      document.querySelector('.tutorial-overlay')?.remove();
      markVisited();
    } else {
      alert('Pour configurer votre CCN, utilisez le bouton "⚖️ Convention collective" dans le menu principal.');
    }
  } else if (choice === 'default') {
    // Appliquer le droit commun (par défaut, rien à faire)
    localStorage.removeItem('CCN_IDCC');
    localStorage.removeItem('CCN_NOM');
    localStorage.removeItem('CCN_CUSTOM');
  } else if (choice === 'custom') {
    // Ouvrir le formulaire personnalisé
    if (typeof openCCNModal === 'function' && typeof toggleCustomForm === 'function') {
      openCCNModal();
      setTimeout(() => toggleCustomForm(), 300);
      document.querySelector('.tutorial-overlay')?.remove();
      markVisited();
    } else {
      alert('Pour configurer un accord personnalisé, utilisez le bouton "⚖️ Convention collective" dans le menu principal, puis "⚙️ Accord d\'entreprise".');
    }
  }
  
  // Passer à l'étape sélection du mode
  document.getElementById('mode-selection-step').style.display = 'block';
  
  // Scroll vers le mode
  setTimeout(() => {
    document.getElementById('mode-selection-step').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function selectTutorialMode(mode) {
  setMode(mode);
  
  // Enregistrer "ne plus afficher" si coché
  const noShow = document.getElementById('tutorial-no-show');
  if (noShow && noShow.checked) {
    markVisited();
  }
  
  // Fermer le tutoriel
  document.querySelector('.tutorial-overlay')?.remove();
  
  // Afficher un message de confirmation
  showModeConfirmation(mode);
}

function showModeConfirmation(mode) {
  const msg = document.createElement('div');
  msg.className = 'mode-confirmation';
  msg.innerHTML = mode === 'debutant' 
    ? `✅ Mode Débutant activé ! Les termes compliqués sont maintenant simplifiés.`
    : `✅ Mode Expert activé ! Tu vois maintenant tous les termes techniques.`;
  
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
}

// ═══════════════════════════════════════════════════════════════
// WIDGET SWITCH MODE
// ═══════════════════════════════════════════════════════════════
function createModeSwitch() {
  const switchHTML = `
    <div class="mode-switch-container">
      <label class="mode-switch-label">
        <span class="mode-text">🎓 Débutant</span>
        <input type="checkbox" id="mode-switch" onchange="toggleMode()">
        <span class="mode-slider"></span>
        <span class="mode-text">⚡ Expert</span>
      </label>
    </div>
  `;
  
  // Insérer dans le header ou menu
  const targetContainer = document.querySelector('.header-actions') || document.querySelector('nav') || document.body;
  const div = document.createElement('div');
  div.innerHTML = switchHTML;
  targetContainer.appendChild(div.firstElementChild);
}

function toggleMode() {
  const currentMode = getMode();
  const newMode = currentMode === 'debutant' ? 'expert' : 'debutant';
  setMode(newMode);
  showModeConfirmation(newMode);
}

// ═══════════════════════════════════════════════════════════════
// TRANSFORMATION AUTOMATIQUE DES TERMES
// ═══════════════════════════════════════════════════════════════
function wrapTermesGlossaire() {
  // Liste des termes à rendre cliquables (triés par longueur décroissante)
  const termes = Object.keys(GLOSSAIRE).sort((a, b) => b.length - a.length);
  
  // Sélecteurs à transformer
  const selectors = 'p, li, td, h3, h4, label, .panel-label, .card h3, .advice-msg';
  
  document.querySelectorAll(selectors).forEach(el => {
    // Ne pas transformer si déjà transformé
    if (el.hasAttribute('data-glossaire-wrapped')) return;
    
    let html = el.innerHTML;
    let hasChanges = false;
    
    termes.forEach(terme => {
      // Créer un pattern qui cherche le terme (case insensitive, mot entier)
      const pattern = new RegExp(`\\b(${terme})\\b`, 'gi');
      const newHtml = html.replace(pattern, (match) => {
        hasChanges = true;
        const entry = GLOSSAIRE[terme];
        return `<span class="terme-glossaire" data-glossaire="${terme}" onclick="showDefinition('${terme}')">${match}</span>`;
      });
      html = newHtml;
    });
    
    if (hasChanges) {
      el.innerHTML = html;
      el.setAttribute('data-glossaire-wrapped', 'true');
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════════
function initGlossaire() {
  // Afficher le tutoriel si première visite
  if (isFirstVisit()) {
    setTimeout(showTutorial, 500);
  }
  
  // Appliquer le mode actuel
  applyMode();
  
  // Créer le switch de mode
  createModeSwitch();
  
  // Transformer les termes du glossaire
  wrapTermesGlossaire();
  
  // Injecter les styles
  injectGlossaireStyles();
}

// ═══════════════════════════════════════════════════════════════
// STYLES CSS
// ═══════════════════════════════════════════════════════════════
function injectGlossaireStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Termes du glossaire */
    .terme-glossaire {
      border-bottom: 1px dotted rgba(0,200,255,0.5);
      cursor: help;
      transition: all 0.2s;
    }
    .terme-glossaire:hover {
      border-bottom-color: rgba(0,200,255,1);
      color: #00c8ff;
    }
    
    /* Popup de définition */
    .glossaire-popup {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s;
    }
    .glossaire-popup-content {
      background: linear-gradient(135deg, #1a2332 0%, #0f1419 100%);
      border: 1px solid rgba(0,200,255,0.3);
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      position: relative;
      box-shadow: 0 8px 32px rgba(0,200,255,0.2);
    }
    .glossaire-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: #888;
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
    }
    .glossaire-close:hover {
      color: #ff4444;
    }
    .glossaire-popup h3 {
      color: #00c8ff;
      margin: 0 0 16px 0;
    }
    .glossaire-simple {
      background: rgba(0,200,255,0.1);
      padding: 12px;
      border-radius: 4px;
      margin: 12px 0;
      color: #00c8ff;
    }
    .glossaire-def {
      color: #ccc;
      line-height: 1.6;
      margin: 12px 0;
    }
    .glossaire-exemple {
      background: rgba(255,200,0,0.1);
      padding: 12px;
      border-radius: 4px;
      border-left: 3px solid #ffc800;
      color: #ffc800;
      margin: 12px 0;
    }
    
    /* Switch de mode */
    .mode-switch-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mode-switch-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .mode-text {
      font-size: 11px;
      color: #888;
      transition: color 0.2s;
    }
    .mode-switch-label:hover .mode-text {
      color: #00c8ff;
    }
    #mode-switch {
      appearance: none;
      width: 40px;
      height: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s;
    }
    #mode-switch:checked {
      background: rgba(0,200,255,0.3);
    }
    #mode-switch::before {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      top: 2px;
      left: 2px;
      transition: transform 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    #mode-switch:checked::before {
      transform: translateX(20px);
      background: #00c8ff;
    }
    
    /* Tutoriel */
    .tutorial-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s;
    }
    .tutorial-content {
      background: linear-gradient(135deg, #1a2332 0%, #0f1419 100%);
      border: 2px solid rgba(0,200,255,0.3);
      border-radius: 12px;
      padding: 32px;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .tutorial-content h2 {
      color: #00c8ff;
      text-align: center;
      margin: 0 0 24px 0;
    }
    .tutorial-step {
      margin: 24px 0;
    }
    .tutorial-step h3 {
      color: #fff;
      margin: 0 0 12px 0;
    }
    .tutorial-step p {
      color: #ccc;
      line-height: 1.6;
    }
    .mode-choice {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 16px 0;
    }
    .ccn-choice {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin: 16px 0;
    }
    .ccn-choice-btn {
      background: rgba(0,200,255,0.05);
      border: 2px solid rgba(0,200,255,0.2);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: left;
    }
    .ccn-choice-btn:hover {
      background: rgba(0,200,255,0.15);
      border-color: rgba(0,200,255,0.5);
      transform: translateX(4px);
    }
    .ccn-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .ccn-title {
      color: #00c8ff;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .ccn-desc {
      color: #888;
      font-size: 12px;
    }
    .mode-btn {
      background: rgba(0,200,255,0.05);
      border: 2px solid rgba(0,200,255,0.2);
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
    }
    .mode-btn:hover {
      background: rgba(0,200,255,0.15);
      border-color: rgba(0,200,255,0.5);
      transform: translateY(-2px);
    }
    .mode-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .mode-title {
      color: #00c8ff;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .mode-desc {
      color: #888;
      font-size: 12px;
    }
    .tutorial-footer {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
      text-align: center;
      color: #888;
    }
    .mode-confirmation {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,200,255,0.9);
      color: #000;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10001;
      animation: slideIn 0.3s;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateX(400px); }
      to { transform: translateX(0); }
    }
    
    /* Mode débutant : mettre en avant les termes cliquables */
    .mode-debutant .terme-glossaire {
      background: rgba(0,200,255,0.05);
      padding: 0 4px;
      border-radius: 2px;
    }
    
    /* Responsive mobile */
    @media (max-width: 600px) {
      .mode-choice {
        grid-template-columns: 1fr;
      }
      .glossaire-popup-content {
        padding: 16px;
      }
      .tutorial-content {
        padding: 20px;
      }
    }
  `;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════
// AUTO-INIT AU CHARGEMENT
// ═══════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlossaire);
  } else {
    initGlossaire();
  }
  
  // Exposer les fonctions globalement
  window.showDefinition = showDefinition;
  window.toggleMode = toggleMode;
  window.selectTutorialMode = selectTutorialMode;
}
