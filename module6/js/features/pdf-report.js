/**
 * PDF-REPORT M6 v2 — Exports certifiés sans emoji (compatibilité maximale)
 * - Texte pur (pas d'emoji → pas de cadrage cassé)
 * - Mention légale repos obligatoire dans chaque PDF
 * - Checkbox certification avant export
 * - Mensuel + Annuel + Entretiens historique
 * - Bloc signature cadre + manager
 * - Avertissement médical (non-substitution)
 */
'use strict';

(function(global) {

// Nettoie les emojis et caracteres speciaux pour jsPDF
function _pdfSanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\u00e9/g, 'e').replace(/\u00e8/g, 'e')
    .replace(/\u00ea/g, 'e').replace(/\u00eb/g, 'e')
    .replace(/\u00e0/g, 'a').replace(/\u00e2/g, 'a')
    .replace(/\u00f4/g, 'o').replace(/\u00ee/g, 'i')
    .replace(/\u00f9/g, 'u').replace(/\u00fb/g, 'u')
    .replace(/\u00e7/g, 'c').replace(/\u0153/g, 'oe')
    .replace(/[^\x00-\x7E\xA0-\xFF]/g, '?')
    .trim();
}

const M6_PDF = {

  // ── Certification obligatoire avant export ────────────────────
  _askCertification(onConfirm) {
    let el = document.getElementById('pdf-cert-modal');
    if (el) el.remove();
    el = document.createElement('div');
    el.id = 'pdf-cert-modal';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(26,23,20,0.7);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
    el.innerHTML = `
    <div style="background:#fff;width:100%;max-width:480px;border-radius:16px 16px 0 0;padding:24px 20px;padding-bottom:calc(24px + env(safe-area-inset-bottom,0))">
      <div style="font-family:var(--font-display,Georgia,serif);font-size:1.3rem;font-weight:600;margin-bottom:16px;color:#1A1714">Certification avant export</div>

      <div style="background:#F7F3ED;border-radius:8px;padding:14px;margin-bottom:16px;font-size:0.82rem;color:#4A4540;line-height:1.6">
        Pour avoir une valeur probante, ce document doit attester du respect de vos obligations legales.
      </div>

      <label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:#EEF3FA;border-radius:8px;margin-bottom:10px;cursor:pointer;border:2px solid transparent" id="cert1-wrap">
        <input type="checkbox" id="cert1" style="margin-top:2px;width:16px;height:16px;flex-shrink:0">
        <div style="font-size:0.78rem;color:#1A1714;line-height:1.5">
          Je certifie l exactitude des informations saisies dans ce document.
        </div>
      </label>

      <label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:#EEF3FA;border-radius:8px;margin-bottom:16px;cursor:pointer;border:2px solid transparent" id="cert2-wrap">
        <input type="checkbox" id="cert2" style="margin-top:2px;width:16px;height:16px;flex-shrink:0">
        <div style="font-size:0.78rem;color:#1A1714;line-height:1.5">
          Je certifie avoir respecte mes temps de repos quotidien (11h) et hebdomadaire (35h) pendant la periode couverte — Art. L3131-1 et L3132-2 du Code du travail.
        </div>
      </label>

      <div id="cert-warn" style="display:none;color:#9B2C2C;font-size:0.75rem;margin-bottom:12px;padding:8px 12px;background:#FBEAEA;border-radius:6px">
        Cochez les deux cases pour continuer.
      </div>

      <button id="cert-ok" style="width:100%;background:#1A1714;color:#F7F3ED;border:none;border-radius:8px;padding:13px;font-size:0.88rem;font-weight:500;cursor:pointer;margin-bottom:8px">
        Generer le PDF
      </button>
      <button id="cert-cancel" style="width:100%;background:transparent;border:1px solid #E2DAD0;border-radius:8px;padding:11px;font-size:0.85rem;cursor:pointer;color:#8A847C">
        Annuler
      </button>
    </div>`;
    document.body.appendChild(el);

    el.querySelector('#cert-ok').addEventListener('click', () => {
      const c1 = el.querySelector('#cert1')?.checked;
      const c2 = el.querySelector('#cert2')?.checked;
      if (!c1 || !c2) { el.querySelector('#cert-warn').style.display='block'; return; }
      el.remove();
      onConfirm();
    });
    el.querySelector('#cert-cancel').addEventListener('click', () => el.remove());
    el.addEventListener('click', e => { if(e.target===el) el.remove(); });
  },

  // ── Export mensuel ────────────────────────────────────────────
  exportMensuel(opts) {
    this._askCertification(() => this._genMensuel(opts));
  },

  _genMensuel({ regime, year, mois, contract, data, moods, analysis, validations }) {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) { alert('PDF non disponible — verifiez votre connexion internet (jsPDF CDN).'); return; }

    const doc  = new jsPDF({ format:'a4', unit:'mm' });
    const mNom = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'][mois];
    const W    = 210, M = 20;
    let y      = 0;

    const lnH  = () => { y += 5; };
    const line  = (x1,y1,x2,y2,w=0.3) => { doc.setLineWidth(w); doc.line(x1,y1,x2,y2); };
    const rect  = (x,ry,w,h,fill) => { if(fill){doc.setFillColor(...fill);doc.rect(x,ry,w,h,'F');}else{doc.rect(x,ry,w,h,'S');} };
    const txt   = (t,x,ry,size,color,style='normal') => {
      doc.setFontSize(size);
      doc.setTextColor(...(color||[26,23,20]));
      doc.setFont('helvetica',style);
      doc.text(String(t),x,ry);
    };

    // ── En-tête ──────────────────────────────────────────────
    rect(0,0,W,28,[26,23,20]);
    txt('MODULE 6 - CADRES',M,10,8,[196,163,90],'bold');
    txt('RECAPITULATIF MENSUEL DE FORFAIT JOURS',M,16,13,[247,243,237],'bold');
    txt(`${mNom} ${year}`,M,22,9,[189,181,168]);
    y = 34;

    // Infos cadre
    txt('CADRE',M,y,8,[138,132,124],'bold'); y+=5;
    txt(`Nom : ${contract.nomCadre||'Non renseigne'}`,M,y,10); lnH();
    txt(`CCN : ${contract.ccnLabel||'Droit commun'} - Forfait ${contract.plafond||218} jours`,M,y,10); lnH();
    txt(`Manager : ${contract.nomManager||'Non renseigne'}`,M,y,10); y+=8;

    // Tableau mensuel
    rect(0,y,W,6,[240,235,228]);
    txt('DATE',M,y+4.5,7,[70,69,68],'bold');
    txt('TYPE',70,y+4.5,7,[70,69,68],'bold');
    txt('DEBUT',100,y+4.5,7,[70,69,68],'bold');
    txt('FIN',125,y+4.5,7,[70,69,68],'bold');
    txt('AMPLITUDE',145,y+4.5,7,[70,69,68],'bold');
    txt('CHARGE',175,y+4.5,7,[70,69,68],'bold');
    y += 7;
    line(M,y,W-M,y);

    // Lignes du mois
    const feries = M6_Feries?.getSet(year) || new Set();
    let joursT = 0, rttP = 0, cpP = 0, reposCertifies = 0;
    let rowCount = 0;

    for (let j=1; j<=new Date(year,mois+1,0).getDate(); j++) {
      const dk = `${year}-${String(mois+1).padStart(2,'0')}-${String(j).padStart(2,'0')}`;
      const d  = new Date(dk+'T12:00:00');
      const dw = d.getDay();
      if (dw===0||dw===6) continue; // skip WE

      const entry  = data[dk];
      const mood   = moods?.[dk];
      const type   = entry?.type||'travail';
      const isFer  = feries.has(dk);
      if (isFer && !entry) continue;

      const typeLabels = { travail:'Travail', rtt:'RTT', cp:'Conge', ferie:'Ferie',
                           repos:'Repos', rachat:'Rachat', demi:'Demi-j.' };

      if (rowCount%2===0) rect(M-2,y-0.5,W-2*M+4,5.5,[248,245,241]);
      txt(d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'}),M,y+3.5,8,[26,23,20]);
      txt(typeLabels[type]||type, 70,y+3.5,8);

      let ampText = '-';
      if (entry?.debut&&entry?.fin) {
        const [dh,dm]=entry.debut.split(':').map(Number), [fh,fm]=entry.fin.split(':').map(Number);
        const amp = (fh*60+fm)-(dh*60+dm);
        ampText = `${Math.floor(amp/60)}h${String(amp%60).padStart(2,'0')}`;
        if (amp > 780) txt(`!`, 165, y+3.5, 8, [155,44,44], 'bold');
        txt(entry.debut,100,y+3.5,8);
        txt(entry.fin,125,y+3.5,8);
      }
      txt(ampText, 145, y+3.5, 8);

      const moodMap = { faible:'Legere', ok:'Normale', eleve:'Soutenue', critique:'CRITIQUE' };
      const moodStr = mood?.niveau ? moodMap[mood.niveau]||mood.niveau : '-';
      const moodColor = mood?.niveau==='critique'?[155,44,44]:mood?.niveau==='eleve'?[138,90,26]:[70,112,95];
      txt(moodStr, 175, y+3.5, 7, moodColor);

      if (type==='travail'||type==='rachat') joursT++;
      if (type==='rtt') rttP++;
      if (type==='cp')  cpP++;
      if (entry?.reposOk) reposCertifies++;

      y += 6; rowCount++;
      if (y > 260) { doc.addPage(); y = 15; }
    }

    y += 4; line(M,y,W-M,y); y += 6;

    // Recapitulatif mensuel
    rect(M-2,y-1,W-2*M+4,6,[240,235,228]);
    txt(`Jours travailles : ${joursT} | RTT : ${rttP} | Conges : ${cpP}`, M, y+3.5, 8, [26,23,20], 'bold');
    y += 10;

    // Cumul annuel
    txt('CUMUL ANNUEL',M,y,8,[138,132,124],'bold'); y += 5;
    txt(`Jours effectifs : ${analysis?.joursEffectifs||'-'} / ${analysis?.plafond||218}`, M, y, 9); lnH();
    txt(`Solde RTT : ${analysis?.rttSolde>=0?'+':''}${analysis?.rttSolde??'-'}`, M, y, 9); y += 8;

    // Mention juridique repos
    rect(M-2,y-1,W-2*M+4,14,[232,245,238]);
    doc.setFontSize(7.5); doc.setTextColor(30,90,60); doc.setFont('helvetica','bold');
    doc.text('CERTIFICATION LEGALE', M, y+4);
    doc.setFont('helvetica','normal');
    const certLines = doc.splitTextToSize(
      'Le cadre soussigne certifie avoir respecte ses temps de repos quotidien (11h consecutives - Art. L3131-1) et hebdomadaire (35h consecutives - Art. L3132-2) pendant la periode ci-dessus.',
      W-2*M);
    doc.text(certLines, M, y+8.5);
    y += 18;

    // Avertissement medical
    if (y < 240) {
      rect(M-2,y-1,W-2*M+4,9,[238,242,255]);
      doc.setFontSize(6.5); doc.setTextColor(55,48,163);
      const medLines = doc.splitTextToSize(
        'Note : Les indicateurs de sante presentes dans cet outil sont fournis a titre informatif uniquement. Ils ne constituent pas un avis medical et ne remplacent pas une consultation medicale professionnelle.',
        W-2*M);
      doc.text(medLines, M, y+4);
      y += 13;
    }

    // Bloc signature
    y = Math.max(y+4, 255);
    if (y > 260) { doc.addPage(); y = 20; }
    line(M,y,W-M,y);  y += 8;
    txt('SIGNATURES',M,y,8,[138,132,124],'bold'); y += 6;
    txt('Cadre :',M,y,8); txt('Date :',120,y,8);
    line(M+20,y+1,95,y+1); line(120+12,y+1,W-M,y+1); y += 10;
    txt('Manager :',M,y,8); txt('Date :',120,y,8);
    line(M+24,y+1,95,y+1); line(120+12,y+1,W-M,y+1);

    // Pied de page
    doc.setFontSize(7); doc.setTextColor(180);
    doc.text(`M6 Cadres - ${mNom} ${year} - Genere le ${new Date().toLocaleDateString('fr-FR')}`, M, 290);
    doc.text('Art. L3121-58 a L3121-65 Code du travail', W-M, 290, {align:'right'});

    doc.save(`Forfait_Jours_${mNom}_${year}.pdf`);
    M6_toast?.('PDF mensuel genere');

    // Marquer la sauvegarde fichier
    if (window.M6_Storage) M6_Storage.markFileSave?.('forfait_jours', year);
  },

  // ── Export annuel ─────────────────────────────────────────────
  exportAnnuel(opts) {
    this._askCertification(() => this._genAnnuel(opts));
  },

  _genAnnuel({ regime, year, contract, data, moods, analysis }) {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) { alert('PDF non disponible.'); return; }

    const doc = new jsPDF({ format:'a4', unit:'mm' });
    const W=210, M=20;
    let y=0;

    const txt  = (t,x,ry,size,color,style='normal') => { doc.setFontSize(size); doc.setTextColor(...(color||[26,23,20])); doc.setFont('helvetica',style); doc.text(String(t),x,ry); };
    const rect = (x,ry,w,h,fill) => { if(fill){doc.setFillColor(...fill);doc.rect(x,ry,w,h,'F');}else{doc.rect(x,ry,w,h,'S');} };
    const ln   = (x1,y1,x2,y2) => { doc.setLineWidth(0.3); doc.line(x1,y1,x2,y2); };

    // Couverture
    rect(0,0,W,40,[26,23,20]);
    txt('M6 CADRES - BILAN ANNUEL',M,12,10,[196,163,90],'bold');
    txt(`FORFAIT JOURS ${year}`,M,20,16,[247,243,237],'bold');
    txt(`${contract.nomCadre||'Cadre'} - ${contract.ccnLabel||'Droit commun'}`,M,28,9,[189,181,168]);
    txt(`Plafond : ${contract.plafond||218} jours`,M,34,8,[189,181,168]);
    y = 48;

    // Synthese annuelle
    rect(M-2,y-2,W-2*M+4,30,[247,243,237]);
    txt('SYNTHESE ANNUELLE',M,y+3,9,[138,132,124],'bold');
    const rows = [
      [`Jours travailles`, `${analysis?.joursEffectifs||0} / ${analysis?.plafond||218}`],
      [`dont jours rachetes`, `${analysis?.rachetes||0}`],
      [`RTT pris / theoriques`, `${analysis?.rttPris||0} / ${analysis?.rttTheoriques||0}`],
      [`Solde RTT`, `${analysis?.rttSolde>=0?'+':''}${analysis?.rttSolde??0}`],
      [`Conges pris`, `${analysis?.cpPris||0}`],
      [`Jours feries ouvres`, `${analysis?.feriesOuvres||0}`],
    ];
    rows.forEach(([l,v],i) => {
      txt(l,M,y+10+i*4,8);
      txt(v,W-M,y+10+i*4,8,[26,23,20],'bold');
      doc.setFont('helvetica','bold');
      doc.text(String(v), W-M, y+10+i*4, {align:'right'});
      doc.setFont('helvetica','normal');
    });
    y += 36;

    // Alertes
    if (analysis?.alertes?.length) {
      txt('POINTS DE VIGILANCE',M,y,9,[138,132,124],'bold'); y+=5;
      analysis.alertes.forEach(al => {
        const niv = {danger:'[!]', warning:'[>]', info:'[i]'}[al.niveau]||'[ ]';
        const lines = doc.splitTextToSize(`${niv} ${al.titre} - ${al.texte}`, W-2*M);
        doc.setFontSize(8); doc.setFont('helvetica','normal');
        doc.setTextColor(...(al.niveau==='danger'?[155,44,44]:al.niveau==='warning'?[196,133,58]:[55,48,163]));
        doc.text(lines, M, y);
        y += lines.length*4 + 2;
        if (y > 260) { doc.addPage(); y = 15; }
      });
      y += 4;
    }

    // Tableau mensuel recapitulatif
    doc.addPage(); y = 15;
    txt('RECAPITULATIF MENSUEL',M,y,10,[26,23,20],'bold'); y += 7;
    rect(M-2,y-1,W-2*M+4,6,[240,235,228]);
    ['Mois','Travail','RTT','CP','Rachat','Charge'].forEach((h,i)=>{
      txt(h, M+i*30, y+4, 7, [70,69,68], 'bold');
    });
    y += 7;
    const mNoms=['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'];
    for (let m=0;m<12;m++) {
      const prefix = `${year}-${String(m+1).padStart(2,'0')}`;
      const jours  = Object.entries(data).filter(([k])=>k.startsWith(prefix));
      const t = jours.filter(([,v])=>v.type==='travail'||v.type==='rachat').length;
      const r = jours.filter(([,v])=>v.type==='rtt').length;
      const c = jours.filter(([,v])=>v.type==='cp').length;
      const ra= jours.filter(([,v])=>v.type==='rachat').length;
      const critiques = jours.filter(([k])=>moods?.[k]?.niveau==='critique').length;
      if (m%2===0) rect(M-2,y-1,W-2*M+4,5,[248,245,241]);
      [mNoms[m],t,r,c,ra, critiques>0?`${critiques} critiq.`:'-'].forEach((v,i)=>{
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(26,23,20);
        if (i===5&&critiques>0) doc.setTextColor(155,44,44);
        doc.text(String(v),M+i*30,y+3.5);
      });
      y += 5;
    }
    y += 6;

    // Certification + signature
    if (y > 230) { doc.addPage(); y = 15; }
    rect(M-2,y-1,W-2*M+4,20,[232,245,238]);
    doc.setFontSize(8); doc.setTextColor(30,90,60); doc.setFont('helvetica','bold');
    doc.text('CERTIFICATION LEGALE ANNUELLE', M, y+5);
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    const certAnnuel = doc.splitTextToSize(
      `Je soussigne(e) ${contract.nomCadre||'_________________'} certifie l exactitude du present document et atteste avoir respecte mes temps de repos quotidien (11h - Art. L3131-1) et hebdomadaire (35h - Art. L3132-2) sur l'ensemble de l'exercice ${year}.`,
      W-2*M);
    doc.text(certAnnuel, M, y+10);
    y += 24;

    doc.setFontSize(8); doc.setTextColor(26,23,20);
    txt('Cadre :', M, y+5, 8); ln(M+20,y+6,95,y+6);
    txt('Date :', 110, y+5, 8); ln(122,y+6,W-M,y+6);
    y += 12;
    txt('Manager :', M, y+5, 8); ln(M+26,y+6,95,y+6);
    txt('Date :', 110, y+5, 8); ln(122,y+6,W-M,y+6);

    // Note medicale
    y += 16;
    doc.setFontSize(6.5); doc.setTextColor(100);
    doc.text('Note : Les indicateurs biologiques sont indicatifs et ne remplacent pas un avis medical professionnel.', M, y);

    doc.setFontSize(7); doc.setTextColor(180);
    doc.text(`M6 Cadres - Bilan ${year} - Genere le ${new Date().toLocaleDateString('fr-FR')}`, M, 290);

    doc.save(`Forfait_Jours_Annuel_${year}.pdf`);
    M6_toast?.('PDF annuel genere');
    if (window.M6_Storage) M6_Storage.markFileSave?.('forfait_jours', year);
  },

  // ── Export entretien annuel ───────────────────────────────────
  exportEntretien({ year, contract, entretien, analysis }) {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) { alert('PDF non disponible.'); return; }

    const doc = new jsPDF({ format:'a4', unit:'mm' });
    const W=210, M=20;
    let y=15;

    const txt = (t,x,ry,size,color,style='normal') => { doc.setFontSize(size); doc.setTextColor(...(color||[26,23,20])); doc.setFont('helvetica',style); doc.text(String(t),x,ry); };
    const rect = (x,ry,w,h,fill) => { doc.setFillColor(...fill); doc.rect(x,ry,w,h,'F'); };
    const ln = (x1,y1,x2,y2) => { doc.setLineWidth(0.3); doc.line(x1,y1,x2,y2); };

    rect(0,0,W,22,[26,23,20]);
    txt('M6 CADRES',M,8,8,[196,163,90],'bold');
    txt('COMPTE-RENDU D\'ENTRETIEN ANNUEL - FORFAIT JOURS',M,14,10,[247,243,237],'bold');
    txt(`Art. L3121-65 Code du travail`,M,19,7,[189,181,168]);
    y = 28;

    // Infos
    txt('INFORMATIONS GENERALES',M,y,9,[138,132,124],'bold'); y+=5;
    [
      ['Cadre',           contract.nomCadre||'—'],
      ['Manager',         contract.nomManager||'—'],
      ['Date de l\'entretien', entretien?.date ? new Date(entretien.date).toLocaleDateString('fr-FR') : '—'],
      ['CCN',             contract.ccnLabel||'Droit commun'],
      ['Forfait',         `${contract.plafond||218} jours/an`],
      ['Exercice',        String(year)],
    ].forEach(([l,v]) => {
      txt(l+' :',M,y,8,[138,132,124]); txt(v,80,y,8,[26,23,20],'bold'); y+=5;
    });
    y += 4;

    // Bilan de charge
    txt('1. BILAN DE LA CHARGE DE TRAVAIL',M,y,9,[26,23,20],'bold'); y+=6;
    [
      ['Jours travailles',     `${analysis?.joursEffectifs||0} / ${analysis?.plafond||218}`],
      ['Taux de realisation',  `${analysis?.tauxRemplissage||0} %`],
      ['RTT pris / theoriques',`${analysis?.rttPris||0} / ${analysis?.rttTheoriques||0}`],
      ['Solde RTT',            `${analysis?.rttSolde>=0?'+':''}${analysis?.rttSolde??0}`],
      ['Jours rachetes',       `${analysis?.rachetes||0}`],
    ].forEach(([l,v]) => {
      txt(l+' :',M,y,8); txt(v,120,y,8,[26,23,20],'bold'); y+=5;
    });
    y += 4;

    // Thematiques obligatoires
    const themes = [
      ['2. ORGANISATION DU TEMPS DE TRAVAIL', entretien?.organisation||''],
      ['3. EQUILIBRE VIE PROFESSIONNELLE / PERSONNELLE', entretien?.equilibre||''],
      ['4. CHARGE DE TRAVAIL (niveau ressenti)', entretien?.chargeRessentie||''],
      ['5. REMUNERATION', entretien?.remuneration||''],
      ['6. DROIT A LA DECONNEXION', entretien?.deconnexion||''],
      ['7. POINTS D\'ACTION', entretien?.actions||''],
    ];
    themes.forEach(([titre, contenu]) => {
      if (y > 240) { doc.addPage(); y = 15; }
      txt(titre,M,y,8,[26,23,20],'bold'); y+=4;
      const lines = doc.splitTextToSize(contenu||'(Non renseigne)', W-2*M);
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(74,69,64);
      doc.text(lines,M,y); y += lines.length*4+3;
      ln(M,y,W-M,y); y+=4;
    });

    // Signature
    if (y > 240) { doc.addPage(); y = 15; }
    y += 4;
    rect(M-2,y-2,W-2*M+4,6,[247,243,237]);
    txt('SIGNATURES',M,y+3,8,[138,132,124],'bold'); y+=9;
    txt('Cadre :',M,y,8); ln(M+20,y+1,95,y+1);
    txt('Date :',110,y,8); ln(122,y+1,W-M,y+1); y+=10;
    txt('Manager :',M,y,8); ln(M+26,y+1,95,y+1);
    txt('Date :',110,y,8); ln(122,y+1,W-M,y+1);

    doc.setFontSize(7); doc.setTextColor(180);
    doc.text(`Entretien annuel Art. L3121-65 - ${year} - ${new Date().toLocaleDateString('fr-FR')}`, M, 290);

    doc.save(`Entretien_Annuel_Forfait_Jours_${year}.pdf`);
    M6_toast?.('PDF entretien genere');
  },

  // Export specifique Cadre Dirigeant
  exportDirigeant({ year, contract, data, moods, analysis, projets }) {
    if(typeof window==='undefined'||!window.jspdf) { M6_toast?.('jsPDF non charge'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const M=15, W=doc.internal.pageSize.getWidth()-2*M;
    let y=20;

    // En-tete
    doc.setFillColor(26,23,20); doc.rect(0,0,210,30,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(247,243,237);
    doc.text(_pdfSanitize('Cadre Dirigeant - Rapport ' + year), M, 15);
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(196,163,90);
    doc.text(_pdfSanitize((contract.fonction||'Dirigeant') + ' - ' + (contract.entreprise||'') + ' - Art. L3111-2'), M, 22);
    y=40;

    // Identite
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(26,23,20);
    doc.text('IDENTIFICATION', M, y); y+=5;
    doc.setFillColor(240,235,225); doc.rect(M,y,W,22,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(74,69,64);
    doc.text(_pdfSanitize('Nom : ' + (contract.nom||'N/A')), M+3, y+5);
    doc.text(_pdfSanitize('Fonction : ' + (contract.fonction||'N/A')), M+3, y+10);
    doc.text(_pdfSanitize('Entreprise : ' + (contract.entreprise||'N/A')), M+3, y+15);
    doc.text(_pdfSanitize('Annee : ' + year), M+90, y+5);
    doc.text(_pdfSanitize('CCN : ' + (contract.ccnLabel||'Non renseignee')), M+90, y+10);
    y+=28;

    // Stats annuelles
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(26,23,20);
    doc.text('BILAN DE PRESENCE ' + year, M, y); y+=5;
    const rows = [
      ['Jours de presence', analysis.joursEffectifs||0],
      ['Conges payes pris', analysis.cpPris||0],
      ['CP restants', (contract.joursCPContrat||25)-(analysis.cpPris||0)],
      ['Deplacements professionnels', analysis.deplacements||0],
      ['Demi-journees', analysis.demis||0],
    ];
    rows.forEach(([l,v],i)=>{
      if(i%2===0) { doc.setFillColor(248,244,238); doc.rect(M,y-3,W,7,'F'); }
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(74,69,64);
      doc.text(_pdfSanitize(l), M+2, y+1);
      doc.setFont('helvetica','bold'); doc.setTextColor(26,23,20);
      doc.text(String(v), M+W-20, y+1, {align:'right'});
      y+=7;
    });
    y+=5;

    // Projets / Missions
    if(projets && projets.length) {
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(26,23,20);
      doc.text('MISSIONS ' + year, M, y); y+=5;
      projets.forEach((p,i)=>{
        if(y>260) { doc.addPage(); y=20; }
        if(i%2===0) { doc.setFillColor(248,244,238); doc.rect(M,y-3,W,7,'F'); }
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(74,69,64);
        doc.text(_pdfSanitize((p.nom||'?').substring(0,40)), M+2, y+1);
        doc.text(_pdfSanitize(p.categorie||''), M+100, y+1);
        doc.setFont('helvetica','bold'); doc.setTextColor(26,23,20);
        doc.text(_pdfSanitize((p.heures||0)+'h'), M+W-10, y+1, {align:'right'});
        y+=7;
      });
      y+=5;
    }

    // Certification
    if(y>240) { doc.addPage(); y=20; }
    doc.setFillColor(248,244,238); doc.rect(M,y,W,20,'F');
    doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(74,69,64);
    doc.text(_pdfSanitize('Certification : Le soussigne certifie l exactitude des informations ci-dessus.'), M+3, y+6);
    doc.text(_pdfSanitize('Genere le ' + new Date().toLocaleDateString('fr-FR') + ' par M6 Cadres - Simulateur Heures Sup France'), M+3, y+11);
    doc.setTextColor(139,105,20);
    doc.text(_pdfSanitize('Signature : _________________________'), M+3, y+17);
    y+=28;

    // Pied
    doc.setFontSize(7); doc.setTextColor(138,132,124); doc.setFont('helvetica','normal');
    doc.text('Ce document ne remplace pas un avis juridique ou medical professionnel.', M, 290);

    doc.save(_pdfSanitize('dirigeant_' + (contract.nom||'cadre').replace(/\s+/g,'_').toLowerCase() + '_' + year + '.pdf'));
    M6_toast?.('PDF Dirigeant genere');
  },
};

global.M6_PDF = M6_PDF;
})(window);
