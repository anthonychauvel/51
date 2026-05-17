/**
 * VALIDITE-HEURES-CD.JS — Vérification de validité juridique
 * pour Forfait Heures et Cadre Dirigeant
 *
 * FH : Art. L3121-39 à L3121-46 (forfait heures hebdo/mensuel/annuel)
 * CD : Art. L3111-2 (3 critères cumulatifs Cass. Soc. 31/01/2012)
 *
 * Calque le pattern de M6_SimulateurNullite (FJ) en ajustant les conditions.
 */
'use strict';

(function(global) {

// ══════════════════════════════════════════════════════════════════
//  FORFAIT HEURES — 6 conditions cumulatives
// ══════════════════════════════════════════════════════════════════
const M6_ValiditeFH = {
  analyze(contract, analysis) {
    const conditions = [];

    // ── 1. Convention de forfait écrite (L3121-40) ─────────────
    const hasContract = !!(contract.seuilHebdo && contract.seuilHebdo > 0);
    conditions.push({
      id: 'convention_forfait_h',
      titre: 'Convention de forfait heures écrite',
      loi: 'Art. L3121-40 + Cass. Soc. 23/06/2010',
      ok: hasContract,
      niveau: hasContract ? 'ok' : 'danger',
      detail: hasContract
        ? `Forfait à ${contract.seuilHebdo}h/semaine — convention présente.`
        : 'La convention de forfait heures doit figurer par écrit dans le contrat de travail (durée hebdo/mensuelle/annuelle).',
      recommandation: 'Vérifiez que votre contrat mentionne explicitement : "convention individuelle de forfait en heures à hauteur de X heures par semaine/mois/an".',
    });

    // ── 2. Accord collectif autorisant le forfait (L3121-39) ───
    // Pour le forfait annuel uniquement — hebdo/mensuel possible sans accord
    const isForfaitAnnuel = (contract.seuilHebdo * 47) > 1607; // > durée légale annuelle
    const hasCCN = !!(contract.ccnLabel || contract.ccnIdcc);
    conditions.push({
      id: 'accord_collectif_h',
      titre: 'Accord collectif requis',
      loi: 'Art. L3121-39',
      ok: !isForfaitAnnuel || hasCCN,
      niveau: !isForfaitAnnuel ? 'ok' : (hasCCN ? 'warning' : 'danger'),
      detail: !isForfaitAnnuel
        ? 'Forfait hebdo/mensuel — l\'accord collectif n\'est pas obligatoire.'
        : (hasCCN
          ? `CCN "${contract.ccnLabel}" renseignée — vérifier qu\'elle autorise le forfait annuel en heures.`
          : 'Forfait annuel détecté : un accord d\'entreprise ou de branche est obligatoire (L3121-63 par renvoi).'),
      recommandation: 'Le forfait annuel en heures nécessite un accord collectif. Forfait hebdo/mensuel : l\'écrit dans le contrat suffit.',
    });

    // ── 3. Contingent annuel HS respecté (L3121-30) ────────────
    const contingentBase = contract.contingent || 220;
    const totalHS = analysis?.totalHS || 0;
    // Prorata si arrivée en cours d'exercice
    let contingent = contingentBase;
    if (analysis?.contingentProrata && analysis?.contingent) contingent = analysis.contingent;
    const respectContingent = totalHS <= contingent;
    const contingentLabel = (contingent < contingentBase)
      ? `${contingent}h proraté (/${contingentBase}h sur l'exercice complet)`
      : `${contingent}h`;
    conditions.push({
      id: 'contingent_h',
      titre: 'Contingent annuel HS respecté',
      loi: 'Art. L3121-30 + L3121-33',
      ok: respectContingent,
      niveau: respectContingent ? 'ok' : (totalHS > contingent * 1.1 ? 'danger' : 'warning'),
      detail: `${totalHS}h sur ${contingentLabel} de contingent (${Math.round(totalHS/Math.max(1,contingent)*100)}%).${!respectContingent ? ' Au-delà : repos compensateur obligatoire.' : ''}`,
      recommandation: 'Au-delà du contingent, chaque HS ouvre droit à un repos compensateur obligatoire (100% pour entreprises >20 salariés).',
    });

    // ── 4. Majoration des HS appliquée (L3121-28) ──────────────
    const taux1 = contract.taux1 || 25;
    const taux2 = contract.taux2 || 50;
    const tauxOK = taux1 >= 25 && taux2 >= 50;
    conditions.push({
      id: 'majoration_hs',
      titre: 'Majoration HS conforme',
      loi: 'Art. L3121-28',
      ok: tauxOK,
      niveau: tauxOK ? 'ok' : 'danger',
      detail: tauxOK
        ? `Majorations : +${taux1}% (8 premières HS) puis +${taux2}% — conformes au minimum légal.`
        : `Taux configurés (+${taux1}% / +${taux2}%) en dessous du minimum légal (+25% / +50%).`,
      recommandation: 'Minimum légal : +25% sur les 8 premières HS hebdo, +50% au-delà. Une CCN peut prévoir des taux supérieurs.',
    });

    // ── 5. Repos quotidien (L3131-1) ───────────────────────────
    const violationsQuotidien = analysis?.violationsQuotidien || 0;
    conditions.push({
      id: 'repos_quotidien_h',
      titre: 'Repos quotidien 11h respecté',
      loi: 'Art. L3131-1',
      ok: violationsQuotidien === 0,
      niveau: violationsQuotidien === 0 ? 'ok' : (violationsQuotidien > 5 ? 'danger' : 'warning'),
      detail: violationsQuotidien === 0
        ? 'Aucune violation détectée dans les saisies.'
        : `${violationsQuotidien} violation(s) du repos quotidien (amplitude > 13h).`,
      recommandation: 'Tout salarié bénéficie d\'un repos quotidien minimum de 11h consécutives entre deux journées de travail.',
    });

    // ── 6. Durée maximale hebdo (L3121-20) ─────────────────────
    const maxHebdo = analysis?.max || 0;
    const respectMax = maxHebdo <= 48;
    conditions.push({
      id: 'duree_max_h',
      titre: 'Durée maximale hebdo (48h) respectée',
      loi: 'Art. L3121-20 + Directive 2003/88/CE',
      ok: respectMax,
      niveau: respectMax ? 'ok' : 'danger',
      detail: respectMax
        ? `Maximum hebdomadaire : ${maxHebdo}h — sous le plafond légal de 48h.`
        : `Pic à ${maxHebdo}h détecté — dépasse le plafond absolu de 48h fixé par la directive européenne.`,
      recommandation: 'La durée hebdomadaire ne peut excéder 48h (plafond absolu UE). 44h en moyenne sur 12 semaines consécutives (L3121-22).',
    });

    // Synthèse
    const okCount = conditions.filter(c => c.ok).length;
    const dangerCount = conditions.filter(c => c.niveau === 'danger').length;
    const warningCount = conditions.filter(c => c.niveau === 'warning').length;

    return {
      conditions,
      synthese: {
        total:    conditions.length,
        ok:       okCount,
        danger:   dangerCount,
        warning:  warningCount,
        validite: dangerCount === 0,
      }
    };
  },

  render(container, contract, analysis) {
    if (!container) return;
    const result = this.analyze(contract, analysis);
    const s = result.synthese;

    const headerColor = s.danger > 0 ? '#9B2C2C' : (s.warning > 0 ? '#C4853A' : '#2D6A4F');
    const statusLabel = s.danger > 0 ? 'À corriger' : (s.warning > 0 ? 'Vigilance' : 'Conforme');

    let html = `
    <div class="m6-card" style="margin-bottom:14px;border-left:4px solid ${headerColor}">
      <div class="m6-card-body" style="display:flex;align-items:center;gap:14px">
        <div style="font-size:2rem">${s.danger > 0 ? '⚠️' : (s.warning > 0 ? '⚡' : '✅')}</div>
        <div style="flex:1">
          <div style="font-family:Georgia,serif;font-size:1.05rem;font-weight:600;color:#1A1714">Validité du forfait heures : ${statusLabel}</div>
          <div style="font-size:0.78rem;color:#4A4540;margin-top:2px">${s.ok}/${s.total} conditions remplies${s.danger > 0 ? ` · ${s.danger} critique(s)` : ''}${s.warning > 0 ? ` · ${s.warning} vigilance(s)` : ''}</div>
        </div>
      </div>
    </div>
    `;

    for (const c of result.conditions) {
      const icon = c.niveau === 'ok' ? '✅' : (c.niveau === 'danger' ? '❌' : '⚠️');
      const bgColor = c.niveau === 'ok' ? '#E8F3EE' : (c.niveau === 'danger' ? '#FAE8E6' : '#FEF5E5');
      const borderColor = c.niveau === 'ok' ? '#2D6A4F' : (c.niveau === 'danger' ? '#9B2C2C' : '#C4853A');
      html += `
      <div class="m6-card" style="margin-bottom:10px">
        <div style="padding:14px 14px 8px 14px">
          <div style="display:flex;gap:10px;align-items:start;margin-bottom:6px">
            <div style="font-size:1.2rem;flex-shrink:0">${icon}</div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:0.92rem;color:#1A1714;line-height:1.3">${c.titre}</div>
              <div style="font-size:0.7rem;color:#8A847C;margin-top:2px">Réf. ${c.loi}</div>
            </div>
          </div>
          <div style="background:${bgColor};border-left:3px solid ${borderColor};padding:10px;border-radius:6px;margin:8px 0;font-size:0.82rem;color:#4A4540;line-height:1.5">${c.detail}</div>
          <div style="font-size:0.78rem;color:#4A4540;line-height:1.5;border-left:2px solid #E2DAD0;padding-left:10px">
            <strong>Recommandation :</strong> ${c.recommandation}
          </div>
        </div>
      </div>
      `;
    }

    container.innerHTML = html;
  }
};

// ══════════════════════════════════════════════════════════════════
//  CADRE DIRIGEANT — 3 critères cumulatifs L3111-2
// ══════════════════════════════════════════════════════════════════
const M6_ValiditeCD = {
  analyze(contract) {
    const conditions = [];

    // ── 1. Pouvoir de direction effectif ───────────────────────
    const hasResponsabilites = !!(contract.responsabilites || contract.fonctions);
    conditions.push({
      id: 'pouvoir_direction',
      titre: 'Pouvoir de direction effectif',
      loi: 'Art. L3111-2 alinéa 1 + Cass. Soc. 31/01/2012',
      ok: true,
      niveau: 'ok',
      detail: 'Vous avez déclaré exercer des fonctions de direction. Conservez des preuves : organigramme, procurations, fiche de poste.',
      recommandation: 'Documentez vos responsabilités : direction d\'équipe, signature de contrats, représentation de l\'entreprise.',
    });

    // ── 2. Rémunération parmi les plus élevées ─────────────────
    const tauxJ = contract.tauxJournalier || 0;
    const remuOK = tauxJ >= 500; // ~150k€/an = grosse rémunération cadre
    conditions.push({
      id: 'remuneration_elevee',
      titre: 'Rémunération parmi les plus élevées de l\'entreprise',
      loi: 'Art. L3111-2 alinéa 2',
      ok: remuOK,
      niveau: tauxJ > 0 ? 'ok' : 'info',
      detail: tauxJ > 0
        ? `Taux journalier déclaré : ${tauxJ}€ (≈ ${Math.round(tauxJ * 218 / 1000)}k€ brut/an).${tauxJ < 300 ? ' Ce niveau peut être insuffisant pour qualifier de cadre dirigeant.' : ''}`
        : 'Taux journalier non renseigné — la rémunération doit pourtant figurer parmi les plus hautes de l\'entreprise.',
      recommandation: 'Le statut CD requiert une rémunération objectivement élevée. La jurisprudence retient les rémunérations dans le top 5-10% de l\'entreprise.',
    });

    // ── 3. Autonomie réelle d'organisation ─────────────────────
    // Ce critère est difficile à vérifier sans entretien, mais on peut alerter
    conditions.push({
      id: 'autonomie_reelle',
      titre: 'Autonomie réelle dans l\'organisation du temps',
      loi: 'Art. L3111-2 alinéa 3',
      ok: true, // présumé OK si le user s'auto-déclare CD
      niveau: 'info',
      detail: 'Auto-déclaratif : vous avez une autonomie totale dans l\'organisation de vos journées (pas de pointage, pas de validation de congés, etc.).',
      recommandation: 'Si vous devez justifier vos horaires, demander des autorisations de congés ou suivre des process imposés, le statut CD peut être contesté.',
    });

    // ── 4. Risque requalification (alerte) ─────────────────────
    conditions.push({
      id: 'requalification',
      titre: 'Risque de requalification',
      loi: 'Cass. Soc. 02/07/2014 + 04/02/2015',
      ok: true,
      niveau: 'info',
      detail: 'Les 3 critères ci-dessus sont CUMULATIFS. Si l\'un manque, le juge peut requalifier en cadre soumis aux durées du travail (rappel HS sur 3 ans + RC).',
      recommandation: 'Conservez des preuves : organigramme, fiche de poste, bulletins de paie, contrats signés en votre nom, documents stratégiques.',
    });

    const okCount = conditions.filter(c => c.ok && c.niveau === 'ok').length;
    const warningCount = conditions.filter(c => c.niveau === 'warning').length;
    const dangerCount = conditions.filter(c => c.niveau === 'danger').length;

    return {
      conditions,
      synthese: {
        total: conditions.length,
        ok: okCount,
        warning: warningCount,
        danger: dangerCount,
        validite: dangerCount === 0,
      }
    };
  },

  render(container, contract) {
    if (!container) return;
    const result = this.analyze(contract);
    const s = result.synthese;

    const headerColor = s.danger > 0 ? '#9B2C2C' : (s.warning > 0 ? '#C4853A' : '#2D6A4F');
    const statusLabel = s.danger > 0 ? 'Risque' : (s.warning > 0 ? 'Vigilance' : 'Critères réunis');

    let html = `
    <div class="m6-alert info" style="margin-bottom:14px;font-size:0.82rem">
      <span>⚖️</span><div>
        <strong>Le statut Cadre Dirigeant doit réunir 3 critères CUMULATIFS</strong> (Cass. Soc. 31/01/2012). L'absence d'un seul critère peut entraîner la requalification et un rappel d'heures supplémentaires sur 3 ans.
      </div>
    </div>

    <div class="m6-card" style="margin-bottom:14px;border-left:4px solid ${headerColor}">
      <div class="m6-card-body" style="display:flex;align-items:center;gap:14px">
        <div style="font-size:2rem">${s.danger > 0 ? '⚠️' : (s.warning > 0 ? '⚡' : '✅')}</div>
        <div style="flex:1">
          <div style="font-family:Georgia,serif;font-size:1.05rem;font-weight:600;color:#1A1714">${statusLabel}</div>
          <div style="font-size:0.78rem;color:#4A4540;margin-top:2px">${s.danger > 0 ? `${s.danger} critère(s) à risque` : s.warning > 0 ? `${s.warning} critère(s) à documenter` : 'Conditions L3111-2 vraisemblablement remplies'}</div>
        </div>
      </div>
    </div>
    `;

    for (const c of result.conditions) {
      const icon = c.niveau === 'ok' ? '✅' : (c.niveau === 'danger' ? '❌' : (c.niveau === 'warning' ? '⚠️' : 'ℹ️'));
      const bgColor = c.niveau === 'ok' ? '#E8F3EE' : (c.niveau === 'danger' ? '#FAE8E6' : (c.niveau === 'warning' ? '#FEF5E5' : '#EFF4F8'));
      const borderColor = c.niveau === 'ok' ? '#2D6A4F' : (c.niveau === 'danger' ? '#9B2C2C' : (c.niveau === 'warning' ? '#C4853A' : '#5C7A8A'));
      html += `
      <div class="m6-card" style="margin-bottom:10px">
        <div style="padding:14px 14px 8px 14px">
          <div style="display:flex;gap:10px;align-items:start;margin-bottom:6px">
            <div style="font-size:1.2rem;flex-shrink:0">${icon}</div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:0.92rem;color:#1A1714;line-height:1.3">${c.titre}</div>
              <div style="font-size:0.7rem;color:#8A847C;margin-top:2px">Réf. ${c.loi}</div>
            </div>
          </div>
          <div style="background:${bgColor};border-left:3px solid ${borderColor};padding:10px;border-radius:6px;margin:8px 0;font-size:0.82rem;color:#4A4540;line-height:1.5">${c.detail}</div>
          <div style="font-size:0.78rem;color:#4A4540;line-height:1.5;border-left:2px solid #E2DAD0;padding-left:10px">
            <strong>Recommandation :</strong> ${c.recommandation}
          </div>
        </div>
      </div>
      `;
    }

    container.innerHTML = html;
  }
};

global.M6_ValiditeFH = M6_ValiditeFH;
global.M6_ValiditeCD = M6_ValiditeCD;

})(window);
