/**
 * PDF-REPORT M6 — Export PDF via jsPDF (CDN)
 * Trois modes : mensuel · période · annuel
 * Inclut : récapitulatif jours, alertes, signature bloc cadre
 */
'use strict';

(function(global) {

const M6_PDF = {

  // ── Utilitaires ───────────────────────────────────────────────
  _new() {
    if (typeof window.jspdf === 'undefined') {
      alert('Module PDF non chargé. Vérifiez votre connexion internet.'); return null;
    }
    return new window.jspdf.jsPDF();
  },

  _header(doc, title, sub, regime) {
    const REG = { forfait_jours:'Forfait Jours', forfait_heures:'Forfait Heures', cadre_dirigeant:'Cadre Dirigeant' };
    // Fond header
    doc.setFillColor(26,23,20);
    doc.rect(0,0,210,28,'F');
    doc.setTextColor(247,243,237);
    doc.setFont('helvetica','bold');
    doc.setFontSize(16);
    doc.text('M6 Cadres — ' + (REG[regime]||regime), 10, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica','normal');
    doc.setTextColor(196,163,90);
    doc.text(title, 10, 20);
    doc.setTextColor(138,132,124);
    doc.text(sub, 10, 25);
    // Date génération
    doc.setTextColor(138,132,124);
    doc.setFontSize(7);
    doc.text('Généré le ' + new Date().toLocaleString('fr-FR'), 200, 25, { align:'right' });
    // Reset
    doc.setTextColor(26,23,20);
    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    return 35; // y cursor
  },

  _separator(doc, y, color=[196,163,90]) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(10, y, 200, y);
    doc.setDrawColor(0);
    return y + 4;
  },

  _section(doc, y, title) {
    doc.setFont('helvetica','bold');
    doc.setFontSize(10);
    doc.setTextColor(26,23,20);
    doc.text(title, 10, y);
    return y + 5;
  },

  _row(doc, y, label, value, highlight=false) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    if(highlight) doc.setTextColor(139,105,20); else doc.setTextColor(74,69,64);
    doc.text(label, 12, y);
    if(highlight) doc.setTextColor(139,105,20); else doc.setTextColor(26,23,20);
    doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    doc.text(String(value), 200, y, { align:'right' });
    doc.setTextColor(26,23,20);
    doc.setFont('helvetica','normal');
    return y + 5.5;
  },

  _alert(doc, y, al) {
    if (y > 260) { doc.addPage(); y = 20; }
    const colors = {
      danger:  [[155,44,44],  [251,234,234]],
      warning: [[122,92,0],   [255,248,230]],
      info:    [[55,48,163],  [238,242,255]],
      success: [[45,106,79],  [232,245,239]],
    };
    const [tc, bc] = colors[al.niveau] || colors.info;
    doc.setFillColor(...bc);
    doc.roundedRect(10, y, 190, 12, 2, 2, 'F');
    doc.setTextColor(...tc);
    doc.setFontSize(8);
    doc.setFont('helvetica','bold');
    doc.text(`${al.icon} ${al.titre}`, 14, y+5);
    doc.setFont('helvetica','normal');
    const lines = doc.splitTextToSize(al.texte, 160);
    doc.text(lines[0]||'', 14, y+9);
    doc.setTextColor(26,23,20);
    return y + 16;
  },

  _signatureBloc(doc, y, nom='', nomManager='') {
    if (y > 240) { doc.addPage(); y = 20; }
    y = this._separator(doc, y+4);
    doc.setFontSize(9);
    doc.setFont('helvetica','bold');
    doc.text('Validation mensuelle', 10, y+4);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.text('Je certifie l\'exactitude des informations ci-dessus.', 10, y+9);
    y += 14;
    // Deux colonnes signature
    doc.setFontSize(8);
    doc.text('Cadre — Signature & date :', 10, y);
    doc.text('Manager — Signature & date :', 115, y);
    y += 4;
    // Zones
    doc.setDrawColor(196,163,90);
    doc.setLineWidth(0.3);
    doc.rect(10, y, 90, 20);
    doc.rect(115, y, 85, 20);
    if (nom) { doc.setFontSize(7); doc.text(nom, 14, y+5); }
    if (nomManager) { doc.setFontSize(7); doc.text(nomManager, 119, y+5); }
    return y + 26;
  },

  // ── Export mensuel ────────────────────────────────────────────
  exportMensuel(opts) {
    const { regime, year, mois, contract, data, moods, analysis, validations } = opts;
    const doc = this._new(); if (!doc) return;
    const feries = M6_Feries.getSet(year);
    const moisLabel = ['Janvier','Février','Mars','Avril','Mai','Juin',
                       'Juillet','Août','Septembre','Octobre','Novembre','Décembre'][mois];
    let y = this._header(doc, `Récapitulatif mensuel — ${moisLabel} ${year}`,
                         `CCN : ${contract.ccnLabel||'Droit commun'} · Forfait ${contract.plafond||218}j`, regime);

    // Infos contrat
    y = this._section(doc, y, '📋 Contrat');
    y = this._row(doc, y, 'Plafond annuel', `${contract.plafond||218} jours`);
    y = this._row(doc, y, 'RTT théoriques', `${analysis.rttTheoriques} jours`);
    y = this._row(doc, y, 'RTT restants', `${analysis.rttSolde} jours`, analysis.rttSolde < 0);
    y = this._separator(doc, y);

    // Jours du mois
    y = this._section(doc, y, `📅 Détail — ${moisLabel}`);
    const prefix = `${year}-${String(mois+1).padStart(2,'0')}`;
    const entriesMois = Object.entries(data).filter(([k]) => k.startsWith(prefix)).sort(([a],[b])=>a.localeCompare(b));
    const TYPES = { travail:'Travail', rtt:'RTT', cp:'Congé payé', ferie:'Férié', repos:'Repos', rachat:'Rachat', demi:'Demi-j', deplacement:'Déplacement' };

    let travaillesMois=0, rttMois=0, cpMois=0;
    for (const [dk,v] of entriesMois) {
      const t = v.type||'travail';
      const d = new Date(dk+'T12:00:00');
      const dayLabel = d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'});
      const moodEm = moods[dk] ? ` ${M6_MOOD_COLORS[moods[dk].niveau]?.icon||''}` : '';
      const ampLabel = v.debut&&v.fin ? ` (${v.debut}→${v.fin})` : '';
      y = this._row(doc, y, `${dayLabel}`, `${TYPES[t]||t}${moodEm}${ampLabel}`, t==='rachat');
      if (['travail','rachat'].includes(t)) travaillesMois++;
      if (t==='rtt') rttMois++;
      if (t==='cp')  cpMois++;
    }
    y = this._separator(doc, y);
    y = this._row(doc, y, 'Jours travaillés ce mois', travaillesMois, true);
    y = this._row(doc, y, 'RTT pris ce mois', rttMois);
    y = this._row(doc, y, 'CP pris ce mois', cpMois);
    y = this._separator(doc, y);

    // Alertes
    if (analysis.alertes.length) {
      y = this._section(doc, y, '⚠️ Points de vigilance');
      for (const al of analysis.alertes.slice(0,5)) y = this._alert(doc, y, al);
      y += 4;
    }

    // Cumul annuel
    y = this._section(doc, y, '📊 Cumul annuel');
    y = this._row(doc, y, 'Jours travaillés (YTD)', `${analysis.joursEffectifs}/${analysis.plafond}`);
    y = this._row(doc, y, 'Avancement forfait', `${analysis.tauxRemplissage}%`);

    // Signature
    y = this._signatureBloc(doc, y, contract.nomCadre||'', contract.nomManager||'');

    // Footer
    doc.setFontSize(7); doc.setTextColor(138,132,124);
    doc.text('Document généré par M6 Cadres — Simulateur Heures Sup France. Valeur indicative.', 105, 288, {align:'center'});

    doc.save(`M6_${regime}_${year}_${String(mois+1).padStart(2,'0')}_${moisLabel}.pdf`);
  },

  // ── Export annuel ─────────────────────────────────────────────
  exportAnnuel(opts) {
    const { regime, year, contract, data, moods, analysis } = opts;
    const doc = this._new(); if (!doc) return;
    let y = this._header(doc, `Bilan annuel ${year}`,
                         `${contract.ccnLabel||'Droit commun'} · Forfait ${contract.plafond||218}j`, regime);

    y = this._section(doc, y, '📋 Synthèse annuelle');
    y = this._row(doc, y, 'Jours travaillés', `${analysis.joursEffectifs}/${analysis.plafond}`);
    y = this._row(doc, y, 'dont jours rachetés', analysis.rachetes, analysis.rachetes>0);
    y = this._row(doc, y, 'RTT théoriques', analysis.rttTheoriques);
    y = this._row(doc, y, 'RTT pris', analysis.rttPris);
    y = this._row(doc, y, 'Solde RTT', analysis.rttSolde, analysis.rttSolde<0);
    y = this._row(doc, y, 'Congés pris', analysis.cpPris);
    y = this._row(doc, y, 'Jours fériés ouvrés', analysis.feriesOuvres);
    y = this._row(doc, y, 'Avancement forfait', `${analysis.tauxRemplissage}%`);
    if (analysis.isProrata) y = this._row(doc, y, 'Prorata appliqué', `${Math.round(analysis.ratio*100)}%`);
    y = this._separator(doc, y);

    // Fractionnement
    if (analysis.fractionnement?.droitFractionnement > 0) {
      y = this._section(doc, y, '🗓️ Congés de fractionnement');
      y = this._row(doc, y, 'CP hors période légale', `${analysis.fractionnement.cpHorsPeriode}j`);
      y = this._row(doc, y, 'Droit fractionnement', `${analysis.fractionnement.droitFractionnement}j`, true);
      y = this._separator(doc, y);
    }

    // Simulation rachat
    if (analysis.simulRachat) {
      const sr = analysis.simulRachat;
      y = this._section(doc, y, '💰 Simulation rachat');
      y = this._row(doc, y, 'Jours rachetés', sr.joursRachetes);
      y = this._row(doc, y, 'Base brute', `${sr.montantBase} €`);
      y = this._row(doc, y, `Majoration ${sr.majoration}%`, `+${sr.gainBrut} €`);
      y = this._row(doc, y, 'Total brut rachat', `${sr.montantMajoré} €`, true);
      y = this._separator(doc, y);
    }

    // Alertes
    if (analysis.alertes.length) {
      y = this._section(doc, y, '⚠️ Alertes & Conformité');
      for (const al of analysis.alertes) y = this._alert(doc, y, al);
      y += 4;
    }

    // Mentions légales
    y = this._separator(doc, y);
    doc.setFontSize(7.5);
    doc.setFont('helvetica','italic');
    doc.setTextColor(138,132,124);
    const disclaimer = 'Ce document est généré à titre indicatif. Seul le bulletin de paie officiel et les documents contractuels font foi. Références : Code du travail Art. L3121-41 à L3121-65, CCN applicable.';
    const lines = doc.splitTextToSize(disclaimer, 190);
    doc.text(lines, 10, y);
    y += lines.length * 4;

    y = this._signatureBloc(doc, y, contract.nomCadre||'', contract.nomManager||'');
    doc.setFontSize(7); doc.setTextColor(138,132,124);
    doc.text('M6 Cadres — Simulateur Heures Sup France', 105, 288, {align:'center'});

    doc.save(`M6_${regime}_${year}_bilan_annuel.pdf`);
  },

  // ── Export entretien annuel ───────────────────────────────────
  exportEntretien(opts) {
    const { regime, year, contract, analysis, entretien } = opts;
    const doc = this._new(); if (!doc) return;
    let y = this._header(doc, `Compte-rendu entretien annuel — ${year}`,
                         `Art. L3121-65 Code du travail`, regime);

    doc.setFontSize(8); doc.setTextColor(74,69,64);
    doc.text(`Date de l'entretien : ${entretien?.date || '________________'}`, 10, y);
    doc.text(`Cadre : ${contract.nomCadre || '________________'}`, 10, y+5);
    doc.text(`Manager : ${contract.nomManager || '________________'}`, 10, y+10);
    y += 20;

    y = this._section(doc, y, '1. Bilan de la charge de travail');
    y = this._row(doc, y, 'Jours travaillés', `${analysis.joursEffectifs}/${analysis.plafond}`);
    y = this._row(doc, y, 'RTT solde', `${analysis.rttSolde}j`);
    doc.setFontSize(8); doc.text('Commentaires charge :', 10, y); y += 5;
    doc.rect(10, y, 190, 18); y += 22;

    y = this._section(doc, y, '2. Articulation vie professionnelle / personnelle');
    doc.setFontSize(8); doc.text('Évaluation (1=Très difficile / 5=Excellente) : ______', 10, y); y += 6;
    doc.text('Commentaires :', 10, y); y += 4;
    doc.rect(10, y, 190, 14); y += 18;

    y = this._section(doc, y, '3. Rémunération');
    y = this._row(doc, y, 'Taux journalier', contract.tauxJournalier ? `${contract.tauxJournalier} €` : 'NC');
    doc.setFontSize(8); doc.text('Commentaires salaire :', 10, y); y += 4;
    doc.rect(10, y, 190, 12); y += 16;

    y = this._section(doc, y, '4. Organisation du travail');
    const entretienFields = ['Télétravail', 'Déplacements', 'Astreintes', 'Outils numériques'];
    for (const f of entretienFields) {
      doc.setFontSize(8); doc.setTextColor(74,69,64);
      doc.text(`${f} :`, 10, y); doc.rect(60, y-4, 140, 8); y += 10;
    }
    y += 4;

    y = this._section(doc, y, '5. Objectifs et plan d\'action');
    doc.rect(10, y, 190, 25); y += 29;

    y = this._section(doc, y, '6. Alertes identifiées');
    if (analysis.alertes.length) {
      for (const al of analysis.alertes.slice(0,3)) y = this._alert(doc, y, al);
    } else {
      doc.setFontSize(8); doc.text('Aucune alerte — situation conforme.', 10, y); y += 6;
    }

    y = this._signatureBloc(doc, y, contract.nomCadre||'', contract.nomManager||'');
    doc.setFontSize(7); doc.setTextColor(138,132,124);
    doc.text('Formulaire généré par M6 Cadres — Art. L3121-65 Code du travail', 105, 288, {align:'center'});
    doc.save(`M6_entretien_annuel_${year}.pdf`);
  }
};

global.M6_PDF = M6_PDF;

})(window);
