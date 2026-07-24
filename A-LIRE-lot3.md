# Encart du jour + mode sobre — version corrigée

Deux fichiers : `taiko.html` et `menu.html`. Bump du service worker.

---

## Les quatre points signalés

### 1. Le poste s'affichait « M » au lieu de « Matin »

Taiko range le libellé d'un poste dans le champ **`l`** (`Matin`, `Après-midi`, `Nuit`,
`Journée`). Mon code lisait `n`, qui n'existe pas, et retombait sur la clé du poste —
d'où le « · M » de la capture.

Corrigé : l'encart affiche le nom complet, et le nom que **tu** as donné au poste si tu
l'as renommé dans Taiko.

### 2. Le bouton « Ouvrir » faisait tout planter

Il appelait `go('taiko')`, qui redirige vers `taiko/index.html`. Or le fichier est
`taiko.html` à la racine — la navigation échouait.

Le bouton est **retiré**, comme demandé. La to-do liste reste accessible par son propre
bouton, plus haut dans la page.

### 3. Navigation par balayage

Glisser vers la gauche avance d'un jour, vers la droite recule. Deux chevrons `‹ ›`
discrets accompagnent le geste : sans eux, rien n'indiquerait que l'encart se balaie, et
ils servent de repli quand le glissement passe mal.

**Bornes** : de trois jours en arrière jusqu'au dernier jour publié par Taiko (quatorze
d'avance). Pas de rebouclage — on s'arrête, on ne repart pas au début.

**Le geste n'est pris que s'il est franchement horizontal** : au moins 45 px, et une
composante horizontale 1,6 fois supérieure à la verticale. Sans cette condition, un
défilement de la page déclencherait un changement de jour à chaque fois.

Un jour sans rien affiche « Rien de prévu » plutôt que de disparaître — sinon l'encart
s'évanouirait sous le doigt pendant la navigation.

### 4. Le flash dans Taiko — c'était moi

`save()` est appelé **trente fois** dans le code, y compris sur l'`oninput` du sélecteur de
couleur des postes. J'y avais greffé une publication **synchrone** du récap : quatorze
jours recalculés, chacun appelant `posteFor`, `dayItems` et `ferieOf`. Sur un glissement
de curseur, cela déclenchait des dizaines de recalculs complets par seconde — le gel
visible que tu décris.

La publication est maintenant **différée de 600 ms**, et chaque nouvelle sauvegarde annule
la précédente. Vérifié : quarante sauvegardes en rafale ne produisent **aucune** publication
immédiate, puis **une seule** une fois les modifications retombées.

---

## Ce qui a été vérifié

| Contrôle | Résultat |
|---|---|
| Libellé du poste | « Matin », « Après-midi », « Nuit » |
| Bouton « Ouvrir » | retiré |
| Navigation avant/arrière | J-3 → J+13 selon le publié |
| Borne haute et basse | pas de rebouclage |
| Glissement court (20 px) | ignoré |
| Glissement diagonal | ignoré, le défilement reste possible |
| Jour férié | mention explicite |
| 40 sauvegardes en rafale | 0 publication immédiate, 1 différée |

---

## Le mode sobre, revu

### Le nid d'abeille et la vignette gardent leurs couleurs

J'avais commencé par les neutraliser. C'était une erreur : la page devenait uniformément
grise, sans aucun point d'accroche. Ces cinq cercles et cette vignette sont les seules
taches de couleur de l'écran — c'est précisément ce qui l'empêche d'être terne.

Ils sont donc **conservés tels quels**, avec seulement une ombre renforcée pour qu'ils se
détachent du fond.

### Fond noir métallisé

Le fond venait du profil : turquoise en Temps plein. Conservé derrière des tuiles sombres,
il donnait un rendu bâtard, ni coloré ni sobre.

Il est remplacé par un noir métallisé, composé de **trois couches de dégradés** — aucune
image, donc aucun octet ajouté et un rendu net à toute densité d'écran :

- un halo froid en haut à gauche, qui simule une source de lumière ;
- un halo chaud en bas à droite, qui réchauffe et évite le gris mort ;
- un dégradé de base anthracite légèrement bleuté.

Plus un liseré clair au sommet, qui donne l'impression de métal poli plutôt que de peinture
mate. Les tuiles reçoivent un très léger relief — un dégradé interne et un filet clair sur
l'arête haute — pour ne pas se fondre dans le fond.

Mesuré sur le rendu : le fond varie de `#20262C` à `#161A1F` du haut vers le bas. Il
respire, là où un aplat noir aurait paru plat.

### Libellés du bouton raccourcis

« Revenir au mode illustré » faisait 26 caractères et débordait de la rangée sur un écran
de téléphone, poussant le sélecteur de profil hors du cadre — visible sur tes captures.

Les libellés deviennent **« Sobre »** et **« Illustré »** : 5 et 8 caractères. La rangée
tient sur la largeur.

### Personnalisation en mode sobre

Badge ✕ ramené à l'intérieur de la ligne — il était posé en débordement, ce qui chevauchait
la ligne du dessus sur des rangées courtes. Contour pointillé adouci pour le fond sombre.
Et le tiroir « Modules masqués » lit désormais le **titre réellement affiché** au lieu de
noms figés (« Mizuki », « FOX Engine »), donc il suit le mode actif.


---

## Corrections d'après la capture du mode sobre

### Les outils et le site des guides avaient disparu

Deux tuiles — **Trousse à outils** et **simulateurheuressupfrance.fr** — n'ont aucun
élément `.title` : leur contenu est **une image seule**. Le mode sobre masquant les images,
elles se réduisaient à des boîtes vides. Ce sont les deux traits horizontaux visibles sous
la liste sur ta capture.

Un titre leur est désormais fabriqué à partir du **texte alternatif de l'image**, qui
décrit déjà la destination — « Trousse à outils du Renard » devient « Trousse à outils »,
et la vignette du site donne « simulateurheuressupfrance.fr ». Le titre injecté est retiré
au retour en mode illustré : rien ne subsiste.

Les dix tuiles sont maintenant lisibles, contre huit auparavant.

### Favoris, Guide de démarrage et badge CCN passent au noir

Ils gardaient leur teinte turquoise héritée du profil : trois taches froides au-dessus
d'une page métallisée.

Ils passent au même noir que les tuiles, **en conservant leur filet d'accent** — l'or pour
les favoris, un gris clair pour le guide. Sans cette distinction, les deux boutons
deviendraient impossibles à différencier l'un de l'autre.

### Un défaut trouvé au passage

Le repli de renommage — pour les tuiles sans correspondance prévue — passait par la forme
normalisée du titre. Il mangeait les accents et les apostrophes : « Compteur annuel
**d heures** », « Heures **mensualisees** ».

Il ne retire plus que les emojis et le séparateur qui les suit. Les libellés restent
intacts.

### Badge « Reprendre »

Il se posait par-dessus le titre sur les lignes courtes du mode sobre. Il est ramené à
droite, centré verticalement, sans chevauchement.

### Vérifications

| Contrôle | Résultat |
|---|---|
| Tuiles vides en mode sobre | 0 sur 10 (était 2) |
| Accents et apostrophes préservés | oui |
| Titres injectés retirés au retour | oui |
| Titres d'origine intacts | oui |
| Mascottes ou emojis restants | 0 |
