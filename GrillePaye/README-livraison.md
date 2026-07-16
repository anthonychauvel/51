# Livraison GrillePaye — 16/07/2026

## Fichiers à déployer
- **index.html** → remplace le fichier existant (données corrigées déjà embarquées en base64, validé node --check + décodage runtime)
- **ccn-data.json** → source brute correspondante, pour référence/futures éditions

## Fichiers de suivi (pas à déployer, juste pour toi)
- tracking-ccn.csv → détail des 158 grilles flaguées à l'origine, statut final de chacune
- verif_dares_complete.csv → croisement complet des 429 IDCC vs base officielle DARES
- ccn_a_renumeroter.csv / ccn_introuvables_dares.csv → historique des décisions de renumérotation

## État
- 429 → 394 entrées (doublons/fusions consolidés)
- ~50 mismatchs identité corrigés au total (158 flaguées + balayage complet des 271 restantes)
- Toutes les entrées touchées ont une grille non-vide (plus de 0€ trompeur)
- 21 grilles restent en estimation SMIC-ancrée clairement marquée "(estimation)" + "À VÉRIFIER" dans le champ source — CCN trop petites/anciennes pour avoir une grille publiée trouvable par recherche web
