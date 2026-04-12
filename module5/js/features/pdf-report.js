/**
 * PDF-REPORT M5 — Export rapport heures complémentaires
 * Utilise jsPDF (chargé depuis CDN dans index.html)
 */
(function(global) {
'use strict';

const PDFReportM5 = {

  generate(year) {
    if (!window.jspdf && !window.jsPDF) {
      alert('jsPDF non disponible. Vérifiez votre connexion.');
      return;
    }
    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const contract = global.M5_Contract.get();
    const weeks    = global.M5_DataStore.getWeeksSorted(year);
    const ccnRules = contract;
    const stats    = global.M5_DataStore.getAnnualStats(year, contract.hoursBase, ccnRules);
    const userName = localStorage.getItem('M5_USER_NAME') || '';

    const M = 15; // margin
    const PW = 210 - M * 2;
    let y = M;

    // ── En-tête ───────────────────────────────────────────────────
    doc.setFillColor(123, 79, 212);
    doc.rect(0, 0, 210, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Simulateur Heures Sup France — Module Temps Partiel', M, 10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport heures complémentaires — Mizuki', M, 17);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 210 - M, 17, { align: 'right' });

    y = 30;
    doc.setTextColor(0, 0, 0);

    // ── Informations contrat ──────────────────────────────────────
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 42, 138);
    doc.text('Mon contrat', M, y);
    y += 6;

    doc.setDrawColor(123, 79, 212);
    doc.setLineWidth(0.5);
    doc.line(M, y, M + PW, y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const infos = [
      ['Salarié(e)', userName || '—'],
      ['Durée contractuelle', `${contract.hoursBase}h/semaine`],
      ['Taux horaire brut', contract.hourlyRate > 0 ? `${contract.hourlyRate.toFixed(2)} €/h` : 'Non renseigné'],
      ['Convention collective', contract.ccnNom || 'Droit commun'],
      ['Plafond heures comp.', `${Math.round((contract.cap || 0.10) * 100)}% du contrat (${(contract.hoursBase * (contract.cap || 0.10)).toFixed(1)}h/sem max)`],
      ['Exercice', year],
    ];

    infos.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label + ' :', M, y);
      doc.setFont('helvetica', 'normal');
      doc.text(val, M + 70, y);
      y += 6;
    });

    y += 4;

    // ── Statistiques annuelles ────────────────────────────────────
    if (stats) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(74, 42, 138);
      doc.text('Bilan annuel', M, y);
      y += 6;
      doc.setDrawColor(123, 79, 212);
      doc.line(M, y, M + PW, y);
      y += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      const statRows = [
        ['Semaines saisies', `${stats.totalWeeks}`],
        ['Semaines avec heures comp.', `${stats.weeksWithComp} (${stats.pctOverContract}%)`],
        ['Total heures comp.', `${stats.totalComp}h`],
        [`dont majorées à +${Math.round((contract.rate1||0.10)*100)}%`, `${stats.totalComp1}h`],
        [`dont majorées à +${Math.round((contract.rate2||0.25)*100)}%`, `${stats.totalComp2}h`],
        ['Moyenne hebdo travaillée', `${stats.avgWorked}h/sem`],
        ['Semaine la plus chargée', `${stats.maxWorked}h`],
      ];

      statRows.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label + ' :', M, y);
        doc.setFont('helvetica', 'normal');
        doc.text(val, M + 90, y);
        y += 6;
      });

      y += 4;
    }

    // ── Détail semaines ───────────────────────────────────────────
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 42, 138);
    doc.text('Détail par semaine', M, y);
    y += 6;
    doc.setDrawColor(123, 79, 212);
    doc.line(M, y, M + PW, y);
    y += 5;

    // En-tête tableau
    doc.setFillColor(237, 224, 255);
    doc.rect(M, y - 3, PW, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 42, 138);
      doc.text('Semaine', M + 2, y + 2);
      doc.text('Travaillees', M + 52, y + 2);
      doc.text('Comp.', M + 90, y + 2);
      doc.text('+10%', M + 117, y + 2);
      doc.text('+25%', M + 144, y + 2);
      doc.text('Montant', M + 163, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);

    let alternate = false;
    weeks.forEach(w => {
      if (y > 270) { doc.addPage(); y = M; }

      if (alternate) {
        doc.setFillColor(248, 244, 255);
        doc.rect(M, y - 3, PW, 7, 'F');
      }
      alternate = !alternate;

      const wh   = w.worked || 0;
      const diff = Math.max(0, wh - contract.hoursBase);
      const th1  = contract.hoursBase * (contract.threshold || 0.10);
      const c1   = diff > 0 ? Math.min(diff, th1) : 0;
      const c2   = diff > th1 ? diff - th1 : 0;

      // Date formatée
      const d  = new Date(w.monday + 'T12:00:00');
      const fn = new Date(w.monday + 'T12:00:00'); fn.setDate(fn.getDate() + 4);
      const dateLabel = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} au ${String(fn.getDate()).padStart(2,"0")}/${String(fn.getMonth()+1).padStart(2,"0")}/${fn.getFullYear()}`;

      doc.text(dateLabel, M + 2, y + 1);
      doc.text(`${wh}h`, M + 52, y + 1);

      if (diff > 0) {
        // Calcul montant comp
        const rate1 = contract.rate1 || 0.10;
        const rate2 = contract.rate2 || 0.25;
        const montant = c1 * contract.hourlyRate * (1 + rate1) + c2 * contract.hourlyRate * (1 + rate2);
        doc.setTextColor(123, 79, 212);
        doc.text(`+${diff.toFixed(1)}h`, M + 90, y + 1);
        doc.text(c1 > 0 ? `${c1.toFixed(1)}h` : '—', M + 117, y + 1);
        doc.text(c2 > 0 ? `${c2.toFixed(1)}h` : '—', M + 144, y + 1);
        doc.text(contract.hourlyRate > 0 ? `${montant.toFixed(2)}eu` : '—', M + 163, y + 1);
        doc.setTextColor(0, 0, 0);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('—', M + 90, y + 1);
        doc.text('—', M + 117, y + 1);
        doc.text('—', M + 144, y + 1);
        doc.text('—', M + 163, y + 1);
        doc.setTextColor(0, 0, 0);
      }

      y += 7;
    });

    // ── Pied de page ──────────────────────────────────────────────
    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'Simulateur Heures Sup France — Outil d\'aide au suivi. Ne se substitue pas à un avis juridique professionnel.',
        105, 292, { align: 'center' }
      );
      doc.text(`Page ${p} / ${pages}`, 210 - M, 292, { align: 'right' });
    }

    // ── Téléchargement ────────────────────────────────────────────
    doc.save(`heures-complementaires-${year}.pdf`);
  }
};

global.PDFReportM5 = PDFReportM5;

}(typeof window !== 'undefined' ? window : global));
