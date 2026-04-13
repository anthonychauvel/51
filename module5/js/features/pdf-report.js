/**
 * PDF-REPORT — Export PDF M5 Mizuki
 * Adaptatif : HEBDO / MENSUEL / ANNUEL
 * Colonnes compactes A4 (210mm — marges 15mm → PW 180mm)
 */
(function(global) {
'use strict';

const M5_PdfReport = {

  generate(contract, stats, weeks, analysis) {
    // jsPDF UMD : expose window.jspdf.jsPDF
    const JClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if(!JClass) { alert('PDF non disponible. Vérifie ta connexion pour charger jsPDF.'); return; }
    const doc = new JClass({ orientation:'portrait', unit:'mm', format:'a4' });
    const M = 15, PW = 180, pageH = 297;
    let y = 20;
    const mode = contract.modeCalcul || 'HEBDO';

    const checkPage = (needed=10) => {
      if(y + needed > pageH - 15) {
        doc.addPage(); y = 20;
      }
    };

    // ── En-tête ──────────────────────────────────────────────────
    doc.setFillColor(89, 44, 165);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text('Simulateur Heures Sup France — Module Temps Partiel', M, 10);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text('Rapport heures complementaires — Mizuki', M, 16);
    doc.setTextColor(0, 0, 0);
    y = 30;

    // ── Contrat ──────────────────────────────────────────────────
    doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.setTextColor(89, 44, 165);
    doc.text('Mon contrat', M, y); y += 2;
    doc.setDrawColor(89, 44, 165); doc.setLineWidth(0.4);
    doc.line(M, y, M + PW, y); y += 6;
    doc.setTextColor(0, 0, 0); doc.setFontSize(10);

    const modeLabel = mode==='MENSUEL'?'Mensuel':mode==='ANNUEL'?'Annuel (glissant)':'Hebdomadaire';
    [
      ['Salarie(e)', contract.userName || 'Non renseigne'],
      ['Duree contractuelle', `${contract.hoursBase}h/semaine`],
      ['Taux horaire brut', `${(contract.hourlyRate||0).toFixed(2)} eu/h`],
      ['Convention collective', contract.ccnNom || 'Droit commun'],
      ['Plafond heures comp.', `${Math.round((contract.cap||0.10)*100)}% du contrat (${(contract.hoursBase*(contract.cap||0.10)).toFixed(1)}h/sem max)`],
      ['Mode de calcul', modeLabel],
      ['Exercice', contract.exerciceStart ? `${contract.exerciceStart.slice(3,5)}/${new Date().getFullYear()}` : String(new Date().getFullYear())],
      ['Jours feries', contract.neutraliseFeries!==false ? 'Neutralises (Art. L3121-29)' : 'Inclus dans l\'assiette (Cass. Soc. 2012)'],
    ].forEach(([label, val]) => {
      checkPage(7);
      doc.setFont('helvetica','bold'); doc.text(label + ' :', M, y);
      doc.setFont('helvetica','normal'); doc.text(String(val), M + 75, y);
      y += 6;
    });

    y += 4;

    // ── Bilan selon le mode ───────────────────────────────────────
    doc.setFontSize(13); doc.setFont('helvetica','bold');
    doc.setTextColor(89, 44, 165);
    const bilanTitle = mode==='MENSUEL'?'Bilan mensuel':mode==='ANNUEL'?'Compteur annuel':'Bilan annuel';
    doc.text(bilanTitle, M, y); y += 2;
    doc.line(M, y, M + PW, y); y += 6;
    doc.setTextColor(0, 0, 0); doc.setFontSize(10);

    if(mode==='ANNUEL' && analysis && analysis.annuelResult) {
      const ar = analysis.annuelResult;
      const solde = ar.solde;
      [
        ['Exercice', `${ar.debutEx} au ${ar.finEx}`],
        ['Jours ecoules', `${ar.joursEcoules} / ${ar.nbJoursEx} (${ar.pctAvancement}%)`],
        ['Objectif annuel', `${ar.objectifAnnuel}h`],
        ['Theorique cumule', `${ar.theoriqueCumule}h`],
        ['Heures realisees', `${ar.reelCumule}h`],
        ['Solde Avance/Retard', `${solde>=0?'+':''}${solde}h`],
        ['Semaines saisies', String(ar.semaines)],
      ].forEach(([label, val]) => {
        checkPage(7);
        doc.setFont('helvetica','bold'); doc.text(label + ' :', M, y);
        doc.setFont('helvetica','normal');
        if(label.includes('Solde')) {
          doc.setTextColor(solde>0?0:180, solde>0?120:0, 0);
        }
        doc.text(String(val), M + 75, y);
        doc.setTextColor(0,0,0);
        y += 6;
      });

    } else if(mode==='MENSUEL' && analysis && analysis.mensuelResult) {
      const mr = analysis.mensuelResult;
      [
        ['Seuil mensuel', `${mr.seuilMensuel}h (${contract.hoursBase}h x 52/12)`],
        ['Heures ce mois', `${mr.totalWorked}h`],
        ['Delta vs seuil', `${mr.delta>=0?'+':''}${mr.delta.toFixed(1)}h`],
        ['Heures comp. mois', `${mr.totalCompH}h`],
        ['dont +' + Math.round((contract.rate1||0.10)*100) + '%', `${mr.compH1.toFixed(1)}h`],
        ['dont +' + Math.round((contract.rate2||0.25)*100) + '%', `${mr.compH2.toFixed(1)}h`],
        ['Plafond mensuel', `${mr.maxAllowed.toFixed(1)}h`],
      ].forEach(([label, val]) => {
        checkPage(7);
        doc.setFont('helvetica','bold'); doc.text(label + ' :', M, y);
        doc.setFont('helvetica','normal'); doc.text(String(val), M + 75, y);
        y += 6;
      });

    } else if(stats) {
      // Mode HEBDO — bilan annuel
      [
        ['Semaines saisies', `${stats.totalWeeks}`],
        ['Semaines avec heures comp.', `${stats.weeksWithComp} (${stats.pctOverContract}%)`],
        ['Total heures comp.', `${stats.totalComp}h`],
        [`dont majorees a +${Math.round((contract.rate1||0.10)*100)}%`, `${stats.totalComp1}h`],
        [`dont majorees a +${Math.round((contract.rate2||0.25)*100)}%`, `${stats.totalComp2}h`],
        ['Moyenne hebdo travaillee', `${stats.avgWorked}h/sem`],
        ['Semaine la plus chargee', `${stats.maxWorked}h`],
      ].forEach(([label, val]) => {
        checkPage(7);
        doc.setFont('helvetica','bold'); doc.text(label + ' :', M, y);
        doc.setFont('helvetica','normal'); doc.text(String(val), M + 95, y);
        y += 6;
      });
    }

    // ── Détail semaines (toujours affiché) ───────────────────────
    if(weeks && weeks.length > 0) {
      y += 4; checkPage(20);
      doc.setFontSize(13); doc.setFont('helvetica','bold');
      doc.setTextColor(89, 44, 165);
      doc.text('Detail par semaine', M, y); y += 2;
      doc.line(M, y, M + PW, y); y += 6;

      // En-tête tableau — 6 colonnes dans 180mm
      // Semaine(50) Trav.(32) Comp.(22) +10%(22) +25%(22) Montant(32)
      const cols = [M+2, M+52, M+84, M+106, M+128, M+150];
      doc.setFillColor(230, 220, 255);
      doc.rect(M, y-4, PW, 7, 'F');
      doc.setFontSize(8); doc.setFont('helvetica','bold');
      doc.setTextColor(89, 44, 165);
      ['Semaine','Travaillees','Comp.', '+10%','+25%','Montant'].forEach((h,i)=>{
        doc.text(h, cols[i], y);
      });
      doc.setTextColor(0,0,0);
      y += 4;

      doc.setFontSize(8); doc.setFont('helvetica','normal');
      let alt = false;
      weeks.forEach(w => {
        if(!w || w.worked === null || w.worked === undefined) return;
        checkPage(6);

        const wh = w.worked || 0;
        const diff = Math.max(0, wh - contract.hoursBase);
        const threshold = contract.hoursBase * (contract.threshold || 0.10);
        const c1 = Math.min(diff, threshold);
        const c2 = Math.max(0, diff - threshold);

        const d = new Date(w.monday + 'T12:00:00');
        const fn = new Date(w.monday + 'T12:00:00'); fn.setDate(fn.getDate()+6);
        const dateLabel = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} au ${String(fn.getDate()).padStart(2,'0')}/${String(fn.getMonth()+1).padStart(2,'0')}/${fn.getFullYear()}`;

        if(alt) { doc.setFillColor(248,245,255); doc.rect(M, y-3, PW, 5.5, 'F'); }
        alt = !alt;

        doc.text(dateLabel, cols[0], y);
        doc.text(`${wh}h`, cols[1], y);

        if(diff > 0) {
          const montant = contract.hourlyRate > 0
            ? c1 * contract.hourlyRate * (1+(contract.rate1||0.10)) + c2 * contract.hourlyRate * (1+(contract.rate2||0.25))
            : 0;
          doc.setTextColor(89, 44, 165);
          doc.text(`+${diff.toFixed(1)}h`, cols[2], y);
          doc.text(c1>0 ? `${c1.toFixed(1)}h` : '--', cols[3], y);
          doc.text(c2>0 ? `${c2.toFixed(1)}h` : '--', cols[4], y);
          doc.text(montant>0 ? `${montant.toFixed(2)}eu` : '--', cols[5], y);
          doc.setTextColor(0,0,0);
        } else {
          doc.setTextColor(180,180,180);
          doc.text('--', cols[2], y);
          doc.text('--', cols[3], y);
          doc.text('--', cols[4], y);
          doc.text('--', cols[5], y);
          doc.setTextColor(0,0,0);
        }
        y += 5.5;
      });
    }

    // ── Pied de page ─────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for(let p=1; p<=totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8); doc.setTextColor(150,150,150);
      doc.text(`Page ${p}/${totalPages}`, 105, 290, {align:'center'});
      doc.text('Source : Code du travail — Legifrance. A titre informatif uniquement.', 105, 294, {align:'center'});
    }

    // ── Sauvegarde ───────────────────────────────────────────────
    const yr = new Date().getFullYear();
    doc.save(`heures-complementaires-mizuki-${yr}.pdf`);
  }
};

global.M5_PdfReport = M5_PdfReport;
}(typeof window !== 'undefined' ? window : global));
