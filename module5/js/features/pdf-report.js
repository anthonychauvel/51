/**
 * PDF-REPORT — Export PDF M5 Mizuki
 * Rapport professionnel heures complémentaires
 * Sections : Contrat · Bilan · Heatmap · Détail semaines · Droits · Refus modèle
 */
(function(global) {
'use strict';

const M5_PdfReport = {

  generate(contract, stats, weeks, analysis) {
    const JClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if(!JClass) { alert('PDF non disponible. Vérifie ta connexion pour charger jsPDF.'); return; }
    const doc = new JClass({ orientation:'portrait', unit:'mm', format:'a4' });
    const M=15, PW=180, pageH=297;
    let y=20;
    const mode = contract.modeCalcul||'HEBDO';
    const VIOLET=[89,44,165], VIOLET_LIGHT=[230,220,255], AMBER=[245,158,11];

    const checkPage=(needed=10)=>{ if(y+needed>pageH-18){ doc.addPage(); y=20; } };

    const h1=(txt)=>{
      checkPage(14);
      doc.setFillColor(...VIOLET);
      doc.rect(M,y-5,PW,8,'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(11); doc.setFont('helvetica','bold');
      doc.text(txt,M+3,y);
      doc.setTextColor(0,0,0);
      y+=8;
    };

    const row=(label,val,highlight=false)=>{
      checkPage(6);
      doc.setFontSize(9);
      doc.setFont('helvetica','bold');
      doc.setTextColor(89,44,165);
      doc.text(label+' :',M,y);
      doc.setFont('helvetica','normal');
      if(highlight) doc.setTextColor(...AMBER);
      else doc.setTextColor(0,0,0);
      doc.text(String(val),M+72,y);
      doc.setTextColor(0,0,0);
      y+=6;
    };

    // ══ EN-TÊTE ══════════════════════════════════════════════════
    doc.setFillColor(30,12,74);
    doc.rect(0,0,210,28,'F');
    doc.setFillColor(...VIOLET);
    doc.rect(0,22,210,6,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(16); doc.setFont('helvetica','bold');
    doc.text('🦊 Mizuki — Rapport Heures Complémentaires',M,12);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text('Simulateur Heures Sup France · Module Temps Partiel',M,19);
    doc.setTextColor(196,168,255);
    doc.setFontSize(8);
    doc.text('Généré le '+new Date().toLocaleDateString('fr-FR',{dateStyle:'long'}),M+PW,26,{align:'right'});
    doc.setTextColor(0,0,0);
    y=36;

    // ══ SECTION 1 : MON CONTRAT ══════════════════════════════════
    h1('1. Mon contrat');
    const modeLabel=mode==='MENSUEL'?'Mensuel (par mois de paie)':mode==='ANNUEL'?'Annuel (compteur glissant)':'Hebdomadaire';
    row('Salarié(e)',contract.userName||'Non renseigné');
    row('Durée contractuelle',`${contract.hoursBase}h/semaine`);
    row('Taux horaire brut',contract.hourlyRate>0?`${(contract.hourlyRate).toFixed(2)} €/h`:'Non renseigné');
    row('Convention collective',contract.ccnNom||'Droit commun');
    const capPct=Math.round((contract.cap||0.10)*100);
    const capH=(contract.hoursBase*(contract.cap||0.10)).toFixed(1);
    row('Plafond heures comp.',`${capPct}% du contrat (max ${capH}h/sem)`);
    row("Majorations",`+${Math.round((contract.rate1||0.10)*100)}% jusqu'à ${(contract.hoursBase*((contract.threshold||0.10))).toFixed(1)}h · +${Math.round((contract.rate2||0.25)*100)}% au-delà`);
    row('Mode de calcul',modeLabel);
    row("Jours fériés", contract.neutraliseFeries!==false ? "Neutralisés (Art. L3121-29)" : "Inclus dans l'assiette (Cass. Soc. 2012)");
    row('Début exercice',contract.exerciceStart||String(new Date().getFullYear()));
    y+=4;

    // ══ SECTION 2 : BILAN ════════════════════════════════════════
    h1('2. Bilan de la période');
    if(mode==='ANNUEL' && analysis && analysis.annuelResult) {
      const ar=analysis.annuelResult;
      row('Exercice',`${ar.debutEx} → ${ar.finEx}`);
      row('Avancement',`${ar.pctAvancement}% (${ar.joursEcoules} j / ${ar.nbJoursEx} j)`);
      row('Objectif annuel',`${ar.objectifAnnuel}h`);
      row('Théorique cumulé',`${ar.theoriqueCumule}h`);
      row('Heures réalisées',`${ar.reelCumule}h`);
      row('Solde',`${ar.solde>=0?'+':''}${ar.solde}h`,Math.abs(ar.solde)>5);
      row('Semaines saisies',String(ar.semaines));
    } else if(mode==='MENSUEL' && analysis && analysis.mensuelResult) {
      const mr=analysis.mensuelResult;
      row('Seuil mensuel',`${mr.seuilMensuel}h`);
      row('Heures ce mois',`${mr.totalWorked}h`);
      row('Delta vs seuil',`${mr.delta>=0?'+':''}${mr.delta.toFixed(1)}h`,mr.delta>0);
      row('Heures comp. mois',`${mr.totalCompH}h`);
      row(`dont +${Math.round((contract.rate1||0.10)*100)}%`,`${mr.compH1.toFixed(1)}h`);
      row(`dont +${Math.round((contract.rate2||0.25)*100)}%`,`${mr.compH2.toFixed(1)}h`);
      if(contract.hourlyRate>0) row('Montant estimé brut',`${mr.totalCompAmount.toFixed(2)} €`);
      row('Plafond mensuel',`${mr.maxAllowed.toFixed(1)}h`);
    } else if(stats) {
      row('Semaines saisies',String(stats.totalWeeks));
      row('Semaines en dépassement',`${stats.weeksWithComp} (${stats.pctOverContract}%)`);
      row('Total heures comp.',`${stats.totalComp.toFixed(1)}h`,stats.totalComp>0);
      row(`dont +${Math.round((contract.rate1||0.10)*100)}%`,`${(stats.totalComp1||0).toFixed(1)}h`);
      row(`dont +${Math.round((contract.rate2||0.25)*100)}%`,`${(stats.totalComp2||0).toFixed(1)}h`);
      row('Moyenne hebdo',`${stats.avgWorked}h/sem`);
      row('Semaine la plus chargée',`${stats.maxWorked}h`);
    }
    y+=4;

    // ══ SECTION 3 : HEATMAP VISUELLE ════════════════════════════
    if(weeks && weeks.length>0) {
      checkPage(30);
      h1("3. Vue d'ensemble — intensité hebdomadaire");
      const CELL=6, GAP=1.2;
      const maxW=stats ? stats.maxWorked : Math.max(...weeks.map(w=>w.worked||0));
      let wx=M, wy=y;
      const MOIS=['J','F','M','A','M','J','J','A','S','O','N','D'];
      doc.setFontSize(7);
      weeks.forEach((w,i)=>{
        checkPage(CELL+4);
        if(wx+CELL+GAP>M+PW){ wx=M; wy+=CELL+GAP; }
        const wh=w.worked||0;
        const ratio=maxW>0?wh/maxW:0;
        // Couleur : vert si OK, ambre si HC, rouge si proche 35h
        let r=230,g=230,b=255;
        if(wh>=35){ r=220;g=80;b=80; }
        else if(wh>contract.hoursBase){ r=Math.round(245+ratio*0); g=Math.round(158*(1-ratio*0.3)); b=Math.round(11+ratio*20); }
        else if(wh>0){ r=16;g=185;b=129; }
        doc.setFillColor(r,g,b);
        doc.rect(wx,wy,CELL,CELL,'F');
        doc.setFillColor(255,255,255);
        doc.setTextColor(wh>0&&(r<150||g<150)?255:80,wh>0&&(r<150||g<150)?255:80,wh>0&&(r<150||g<150)?255:80);
        if(wh>0) doc.text(String(wh),wx+CELL/2,wy+CELL-1.5,{align:'center'});
        doc.setTextColor(0,0,0);
        wx+=CELL+GAP;
      });
      y=wy+CELL+6;
      // Légende
      doc.setFontSize(7); doc.setFont('helvetica','normal');
      [[16,185,129,'Conforme'],[245,158,11,'Heures comp.'],[220,80,80,'≥35h']].forEach(([r,g,b,lbl],i)=>{
        const lx=M+i*40;
        doc.setFillColor(r,g,b); doc.rect(lx,y,5,4,'F');
        doc.setTextColor(0,0,0); doc.text(lbl,lx+7,y+3);
      });
      y+=10;
    }

    // ══ SECTION 4 : DÉTAIL PAR SEMAINE ══════════════════════════
    if(weeks && weeks.length>0) {
      checkPage(22);
      h1('4. Détail par semaine');
      const cols=[M+2,M+48,M+80,M+102,M+124,M+148,M+168];
      doc.setFillColor(...VIOLET_LIGHT);
      doc.rect(M,y-4,PW,7,'F');
      doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...VIOLET);
      ['Semaine','Travaillées','Comp.',`+${Math.round((contract.rate1||0.10)*100)}%`,`+${Math.round((contract.rate2||0.25)*100)}%`,'Montant','OK'].forEach((h,i)=>doc.text(h,cols[i],y));
      doc.setTextColor(0,0,0); y+=4;
      doc.setFontSize(8); doc.setFont('helvetica','normal');
      let alt=false;
      weeks.forEach(w=>{
        if(w.worked===null||w.worked===undefined) return;
        checkPage(6);
        const wh=w.worked||0;
        const diff=Math.max(0,wh-contract.hoursBase);
        const thr=contract.hoursBase*(contract.threshold||0.10);
        const c1=Math.min(diff,thr);
        const c2=Math.max(0,diff-thr);
        const d=new Date(w.monday+'T12:00:00');
        const fn=new Date(w.monday+'T12:00:00'); fn.setDate(fn.getDate()+6);
        const lbl=`${d.getDate()}/${d.getMonth()+1} au ${fn.getDate()}/${fn.getMonth()+1}/${fn.getFullYear()}`;
        if(alt){ doc.setFillColor(248,245,255); doc.rect(M,y-3,PW,5.5,'F'); }
        alt=!alt;
        doc.text(lbl,cols[0],y);
        doc.text(`${wh}h`,cols[1],y);
        if(diff>0){
          const montant=contract.hourlyRate>0?c1*contract.hourlyRate*(1+(contract.rate1||0.10))+c2*contract.hourlyRate*(1+(contract.rate2||0.25)):0;
          doc.setTextColor(...VIOLET);
          doc.text(`+${diff.toFixed(1)}h`,cols[2],y);
          doc.text(c1>0?`${c1.toFixed(1)}h`:'--',cols[3],y);
          doc.text(c2>0?`${c2.toFixed(1)}h`:'--',cols[4],y);
          doc.text(montant>0?`${montant.toFixed(2)}€`:'--',cols[5],y);
          doc.setTextColor(wh>=35?180:0,0,0);
          doc.text(wh>=35?'⚠️ 35h':' ',cols[6],y);
          doc.setTextColor(0,0,0);
        } else {
          doc.setTextColor(180,180,180);
          ['--','--','--','--','✓'].forEach((t,i)=>doc.text(t,cols[i+2],y));
          doc.setTextColor(0,0,0);
        }
        y+=5.5;
      });
      y+=6;
    }

    // ══ SECTION 5 : MES DROITS ═══════════════════════════════════
    checkPage(50);
    h1('5. Mes droits — Rappels légaux');
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    const droits=[
      ["Art. L3123-20",`Majoration : +${Math.round((contract.rate1||0.10)*100)}% jusqu'à 1/${Math.round(1/(contract.threshold||0.10))}e du contrat, puis +${Math.round((contract.rate2||0.25)*100)}%`],
      ["Art. L3123-21","Délai de prévenance : 3 jours ouvrés minimum avant toute HC imposée. Tu peux REFUSER si délai non respecté."],
      ["Art. L3123-9","Jamais 35h : même en temps partiel, aucune semaine ne peut atteindre la durée légale du temps plein."],
      ["Art. L3123-13","Règle des 12 semaines : si tes heures dépassent le contrat de +2h ou plus 12 semaines consécutives, tu peux demander une modification de contrat."],
      ["Art. L3123-14","Modification de contrat : ta demande écrite oblige l'employeur à répondre dans le mois. Refus doit être justifié."],
      ["Art. L3123-5","Durée minimale : ton contrat doit être de 24h/sem minimum, sauf dérogation légale ou accord de branche."],
      ["Défiscalisation","Les HC sont exonérées d'impôt sur le revenu et de cotisations salariales depuis la loi TEPA (plafond annuel)."],
    ];
    droits.forEach(([art,txt])=>{
      checkPage(12);
      doc.setFont('helvetica','bold'); doc.setTextColor(...VIOLET);
      doc.text(art+' :',M,y);
      doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
      const lines=doc.splitTextToSize(txt,PW-30);
      doc.text(lines,M+35,y);
      y+=lines.length*5+3;
    });
    y+=4;

    // ══ SECTION 6 : MODÈLE DE REFUS ═════════════════════════════
    checkPage(60);
    h1('6. Modèle de refus — Heures complémentaires (délai non respecté)');
    doc.setFontSize(9); doc.setFont('helvetica','italic'); doc.setTextColor(100,100,100);
    doc.text('À compléter, signer et conserver une copie avant envoi à votre employeur.',M,y); y+=8;
    doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
    const refusLines=[
      `${contract.userName||"[Prénom Nom]"}`,
      `Employé(e) à temps partiel - ${contract.hoursBase}h/semaine`,
      contract.ccnNom||"Droit commun","",
      `[Lieu], le [date]`,"",
      "A l'attention de [Nom de l'employeur / RH]","",
      "Objet : Refus d'heures complementaires - Art. L3123-21 Code du travail","",
      "Madame, Monsieur,","",
      `Je soussigne(e) ${contract.userName||"[Prenom Nom]"} vous informe par la presente que je decline`,
      "la demande d'heures complementaires pour la semaine concernee.","",
      "En effet, le delai legal de prevenance de 3 jours ouvres (Art. L3123-21)",
      "n'a pas ete respecte. Je suis donc en droit de refuser cette demande",
      "sans que cela ne constitue une faute de ma part.","",
      "Je conserve ce document a titre de preuve.","",
      "Veuillez agreer, Madame, Monsieur, l'expression de mes salutations distinguees.","","",
      "Signature : _______________________",
      "Date : ___________________________","",
      "(Envoi recommande avec accuse de reception)",
    ];
    refusLines.forEach(line=>{
      checkPage(6);
      if(line==='') y+=3;
      else { doc.text(line,M,y); y+=5; }
    });

    // ══ PIED DE PAGE ═════════════════════════════════════════════
    const totalPages=doc.getNumberOfPages();
    for(let p=1;p<=totalPages;p++){
      doc.setPage(p);
      doc.setFillColor(30,12,74);
      doc.rect(0,pageH-12,210,12,'F');
      doc.setFontSize(7); doc.setTextColor(196,168,255);
      doc.text(`Page ${p}/${totalPages}`,M,pageH-5);
      doc.text('Code du travail — Légifrance. Document informatif, non juridique. Mizuki 2026.',105,pageH-5,{align:'center'});
    }

    const yr=new Date().getFullYear();
    doc.save(`heures-complementaires-mizuki-${yr}.pdf`);
  }
};

global.M5_PdfReport = M5_PdfReport;
}(typeof window !== 'undefined' ? window : global));
