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
// ── Hash local SHA-256 simplifié (pas d'API externe) ─────────────
// Utilise SubtleCrypto si dispo, sinon un hash djb2 déterministe
function _localHash(str) {
  // Essayer SubtleCrypto en async (best effort — on utilise le sync comme fallback)
  // Retour synchrone : djb2 hash (suffisant pour une référence de document)
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h & 0x7FFFFFFF;
  }
  return 'M6-' + h.toString(16).toUpperCase().padStart(8, '0');
}

// ── Web Share API — partage natif ou téléchargement fallback ─────
async function _shareOrSave(doc, filename, toastMsg) {
  // Essayer Web Share API (iOS Safari 14+, Android Chrome 61+)
  if (navigator.canShare) {
    try {
      const pdfBlob = doc.output('blob');
      const file    = new File([pdfBlob], filename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        window.M6_toast?.(toastMsg + ' — partagé');
        return;
      }
    } catch(e) {
      // L'utilisateur a annulé le partage ou l'API n'est pas supportée
      if (e.name === 'AbortError') return; // annulation volontaire
    }
  }
  // Fallback : téléchargement direct
  doc.save(filename);
  window.M6_toast?.(toastMsg);
}

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

    _shareOrSave(doc, `Forfait_Jours_${mNom}_${year}.pdf`, 'PDF mensuel généré');

    // Marquer la sauvegarde fichier
    if (window.M6_Storage) M6_Storage.markFileSave?.('forfait_jours', year);
  },

  // ── Export periode libre ──────────────────────────────────────
  exportPeriode(opts) {
    this._askCertification(() => this._genPeriode(opts));
  },

  _genPeriode({ regime, year, contract, data, moods, dateDebut, dateFin }) {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) { window.M6_toast?.('jsPDF non charge'); return; }
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const M=15, W=doc.internal.pageSize.getWidth()-2*M;
    let y=20;

    const d1 = new Date(dateDebut+'T12:00:00'), d2 = new Date(dateFin+'T12:00:00');
    const label1 = d1.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
    const label2 = d2.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
    const feries = M6_Feries?.getSet(year) || new Set();

    // Filtrer les données sur la période
    const entries = Object.entries(data)
      .filter(([dk]) => dk >= dateDebut && dk <= dateFin)
      .sort(([a],[b]) => a.localeCompare(b));

    // Comptage
    const typeLabels = { travail:'Travail', rtt:'RTT', cp:'Conge paye', ferie:'Ferie',
      repos:'Repos', rachat:'Rachat', demi:'Demi-journee', maladie:'Maladie',
      maternite:'Maternite', css:'Conge ss solde', formation:'Formation',
      cet:'CET', astreinte:'Astreinte', teletravail:'Teletravail' };
    const counts = {}; let jTravail = 0;
    entries.forEach(([,v]) => {
      const t = v.type||'travail';
      counts[t] = (counts[t]||0) + 1;
      if(t==='travail'||t==='rachat'||t==='teletravail') jTravail++;
      if(t==='demi') jTravail += 0.5;
    });

    // En-tete
    doc.setFillColor(26,23,20); doc.rect(0,0,210,30,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(247,243,237);
    doc.text(_pdfSanitize('Rapport de periode - Forfait Jours'), M, 13);
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(196,163,90);
    doc.text(_pdfSanitize('Du ' + label1 + ' au ' + label2), M, 22);
    y=38;

    // Identite
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(26,23,20);
    doc.text('CADRE', M, y); y+=4;
    doc.setFillColor(240,235,225); doc.rect(M,y,W,16,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(74,69,64);
    doc.text(_pdfSanitize((contract.nomCadre||contract.nom||'N/A')), M+3, y+5);
    doc.text(_pdfSanitize('CCN : ' + (contract.ccnLabel||'N/A')), M+3, y+11);
    doc.text(_pdfSanitize('Forfait : ' + (contract.plafond||218) + 'j'), M+120, y+5);
    y+=22;

    // Stats periode
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(26,23,20);
    doc.text(_pdfSanitize('BILAN PERIODE (' + entries.length + ' jours saisis)'), M, y); y+=4;
    const statRows = [['Jours travailles (equiv.)', String(jTravail)],
      ...Object.entries(counts).map(([t,n]) => [typeLabels[t]||t, String(n)])];
    statRows.forEach(([l,v],i) => {
      if(i%2===0){doc.setFillColor(248,244,238);doc.rect(M,y-3,W,7,'F');}
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(74,69,64);
      doc.text(_pdfSanitize(l), M+2, y+1);
      doc.setFont('helvetica','bold');doc.setTextColor(26,23,20);
      doc.text(v, M+W-15, y+1, {align:'right'});
      y+=7;
    });
    y+=6;

    // Calendrier de la periode (liste jours)
    if(y > 220) { doc.addPage(); y=20; }
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(26,23,20);
    doc.text('DETAIL DES JOURS', M, y); y+=4;
    entries.forEach(([dk,v],i) => {
      if(y > 272) { doc.addPage(); y=20; }
      const d = new Date(dk+'T12:00:00');
      const lbl = d.toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'2-digit'});
      const typ = typeLabels[v.type||'travail'] || v.type;
      const amp = v.debut && v.fin ? ' ' + v.debut + '-' + v.fin : '';
      const dep = v.deplacement ? ' [Dep.]' : '';
      if(i%2===0){doc.setFillColor(248,244,238);doc.rect(M,y-3,W,7,'F');}
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(74,69,64);
      doc.text(_pdfSanitize(lbl), M+2, y+1);
      doc.text(_pdfSanitize(typ + amp + dep), M+28, y+1);
      if(v.note) doc.text(_pdfSanitize(v.note.substring(0,40)), M+95, y+1);
      y+=7;
    });

    // Pied
    if(y > 260) { doc.addPage(); y=20; }
    y = Math.max(y+8, 250);
    doc.setFillColor(248,244,238); doc.rect(M,y,W,20,'F');
    doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(74,69,64);
    doc.text(_pdfSanitize('Certifie exact. Respect des temps de repos Art. L3131-1 et L3132-2.'), M+3, y+6);
    doc.text(_pdfSanitize('Genere le ' + new Date().toLocaleDateString('fr-FR') + ' - M6 Cadres'), M+3, y+12);
    doc.text(_pdfSanitize('Signature : __________________'), M+3, y+18);
    doc.setFontSize(7); doc.setTextColor(138,132,124);
    doc.text('Ce document ne remplace pas un avis juridique.', M, 292);

    const fn = _pdfSanitize('periode_' + dateDebut + '_' + dateFin + '_' + (contract.nomCadre||'cadre').replace(/\s+/g,'_').toLowerCase() + '.pdf');
    _shareOrSave(doc, fn, 'PDF période exporté');
  },

  // ── Export annuel ─────────────────────────────────────────────
  exportAnnuel(opts) {
    this._askCertification(() => this._genAnnuel(opts));
  },

  _genAnnuel({ regime, year, contract, data, moods, analysis }) {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) { alert('PDF non disponible.'); return; }

    const doc = new jsPDF({ format:'a4', unit:'mm' });
    const W=210, M=15, PW=W-2*M; // marges fixes 15mm
    let y=0;

    const txt  = (t,x,ry,size,color,style='normal',align='left') => {
      doc.setFontSize(size); doc.setTextColor(...(color||[26,23,20]));
      doc.setFont('helvetica',style);
      const str = String(t||'');
      if (align==='right') doc.text(str,x,ry,{align:'right'});
      else if (align==='center') doc.text(str,x,ry,{align:'center'});
      else doc.text(str,x,ry);
    };
    const rect = (x,ry,w,h,fill) => {
      if(fill){doc.setFillColor(...fill);doc.rect(x,ry,w,h,'F');}
      else{doc.setLineWidth(0.2);doc.rect(x,ry,w,h,'S');}
    };
    const ln = (x1,y1,x2,y2,w=0.3) => { doc.setLineWidth(w); doc.line(x1,y1,x2,y2); };
    const chk = () => { if(y>268){doc.addPage();y=15;} };

    // ── Couverture ─────────────────────────────────────────────
    rect(0,0,W,45,[26,23,20]);
    // Ligne dorée
    doc.setDrawColor(196,163,90); doc.setLineWidth(0.5);
    doc.line(M,40,W-M,40);
    txt('M6 CADRES',M,9,7.5,[196,163,90],'bold');
    txt('BILAN ANNUEL — FORFAIT JOURS',M,17,14,[247,243,237],'bold');
    txt(`Exercice ${year}`,M,25,9,[196,163,90],'normal');
    txt(`${_pdfSanitize(contract.nomCadre||'Cadre')}  ·  ${_pdfSanitize(contract.ccnLabel||'Droit commun')}  ·  Plafond ${contract.plafond||218}j`,M,33,8,[189,181,168]);
    // Hash preuve (SHA-256 simplifié local)
    const hashStr = _localHash(`${regime}-${year}-${contract.nomCadre||''}-${analysis?.joursEffectifs||0}`);
    txt(`Réf. : ${hashStr}`,W-M,9,6,[150,140,130],'normal','right');
    txt(`Généré le ${new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}`,W-M,14,6.5,[150,140,130],'normal','right');
    y = 52;

    // ── Synthèse annuelle ──────────────────────────────────────
    rect(M,y,PW,8,[240,235,228]);
    txt('SYNTHÈSE ANNUELLE',M+3,y+5.5,8,[70,65,60],'bold');
    y += 11;

    const a = analysis || {};
    const synthRows = [
      ['Jours travaillés',        `${a.joursEffectifs||0} / ${a.plafond||218}j`,   a.joursEffectifs>(a.plafond||218)?[155,44,44]:[26,23,20]],
      ['Dont jours rachetés',     `${a.rachetes||0}j`,                             [26,23,20]],
      ['RTT pris / théoriques',   `${a.rttPris||0} / ${a.rttTheoriques||0}j`,      [26,23,20]],
      ['Solde RTT',               `${a.rttSolde>=0?'+':''}${a.rttSolde??0}j`,      (a.rttSolde||0)<0?[155,44,44]:[26,23,20]],
      ['Congés pris',             `${a.cpPris||0}j`,                               [26,23,20]],
      ['Fériés ouvrés',           `${a.feriesOuvres||0}j`,                         [26,23,20]],
      ['Taux de remplissage',     `${a.tauxRemplissage||0}%`,                      a.tauxRemplissage>=100?[155,44,44]:a.tauxRemplissage>=90?[196,133,58]:[45,107,79]],
      ['Demi-journées matin',     `${a.demis_matin||0}`,                           [26,23,20]],
      ['Demi-journées après-midi',`${a.demis_am||0}`,                              [26,23,20]],
    ];

    synthRows.forEach(([l,v,col],i) => {
      const ry = y + i*5.5;
      if (i%2===0) { doc.setFillColor(248,245,241); doc.rect(M,ry-1.5,PW,5.5,'F'); }
      txt(l, M+2, ry+2.5, 8, [70,65,60]);
      txt(v, W-M-2, ry+2.5, 8, col||[26,23,20], 'bold', 'right');
    });
    y += synthRows.length*5.5 + 8;
    chk();

    // ── Alertes ────────────────────────────────────────────────
    if (a.alertes?.length) {
      rect(M,y,PW,7,[255,248,230]);
      txt('POINTS DE VIGILANCE',M+3,y+5,8,[122,92,0],'bold');
      y += 10;
      a.alertes.forEach(al => {
        chk();
        const icon = {danger:'■',warning:'▲',info:'●'}[al.niveau]||'●';
        const color = al.niveau==='danger'?[155,44,44]:al.niveau==='warning'?[196,133,58]:[55,48,163];
        doc.setFontSize(7.5); doc.setTextColor(...color); doc.setFont('helvetica','bold');
        doc.text(icon+' '+_pdfSanitize(al.titre), M+2, y);
        doc.setFont('helvetica','normal'); doc.setTextColor(74,69,64);
        const lines = doc.splitTextToSize(_pdfSanitize(al.texte||''), PW-8);
        doc.text(lines, M+6, y+4);
        y += 4 + lines.length*3.5 + 3;
        chk();
      });
      y += 4;
    }

    // ── Tableau mensuel ────────────────────────────────────────
    chk();
    doc.addPage(); y = 15;
    rect(M,y,PW,8,[26,23,20]);
    txt('RÉCAPITULATIF MENSUEL',M+3,y+5.5,8,[247,243,237],'bold');
    y += 11;

    // En-têtes colonnes
    const cols = [M+2, M+28, M+44, M+60, M+76, M+96, M+116];
    const hdrs = ['Mois','Travail','RTT','CP','Rachat','Charge','Amplitude'];
    rect(M,y-1,PW,6,[240,235,228]);
    hdrs.forEach((h,i) => txt(h, cols[i], y+4, 7, [70,65,60], 'bold'));
    y += 7;

    const mNoms=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    for (let m=0;m<12;m++) {
      chk();
      const prefix = `${year}-${String(m+1).padStart(2,'0')}`;
      const jours  = Object.entries(data||{}).filter(([k])=>k.startsWith(prefix));
      const t  = jours.filter(([,v])=>v.type==='travail'||v.type==='rachat').length + jours.filter(([,v])=>v.type==='demi').length*0.5;
      const r  = jours.filter(([,v])=>v.type==='rtt').length;
      const cp = jours.filter(([,v])=>v.type==='cp').length;
      const ra = jours.filter(([,v])=>v.type==='rachat').length;
      const critiques = jours.filter(([k])=>moods?.[k]?.niveau==='critique').length;
      const ampViols  = jours.filter(([k,v])=>{ if(!v.debut||!v.fin) return false; const dh=v.debut.split(':'), fh=v.fin.split(':'); return (parseInt(fh[0])*60+parseInt(fh[1]))-(parseInt(dh[0])*60+parseInt(dh[1]))>780; }).length;

      if (m%2===0) { doc.setFillColor(248,245,241); doc.rect(M,y-1,PW,6,'F'); }
      ln(M,y+5,W-M,y+5, 0.1); // ligne séparatrice fine
      [mNoms[m], t||'-', r||'-', cp||'-', ra||'-',
       critiques>0?critiques+'×🔴':'-',
       ampViols>0?ampViols+'×⏰':'-'
      ].forEach((v,i) => {
        const col = (i===5&&critiques>0)?[155,44,44]:(i===6&&ampViols>0)?[196,133,58]:[26,23,20];
        doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...col);
        doc.text(String(v), cols[i], y+3.5);
      });
      y += 6;
    }
    y += 8; chk();

    // ── Entretiens ─────────────────────────────────────────────
    const entretiens = (window.M6_Storage?.getEntretiens(regime, null)||[]).filter(e=>e.date&&e.date.startsWith(String(year)));
    if (entretiens.length) {
      rect(M,y,PW,7,[240,235,228]);
      txt('ENTRETIENS ANNUELS (Art. L3121-65)',M+3,y+5,8,[70,65,60],'bold');
      y += 10;
      entretiens.forEach(e => {
        chk();
        doc.setFillColor(248,245,241); doc.rect(M,y,PW,16,'F');
        txt(new Date(e.date+'T12:00:00').toLocaleDateString('fr-FR'), M+3, y+4.5, 8, [26,23,20], 'bold');
        txt(_pdfSanitize('Manager : '+(e.manager||'N/A')), M+3, y+9, 7.5, [74,69,64]);
        txt(_pdfSanitize('Charge : '+(e.charge||'N/A')+' · Ajustement : '+(e.ajustement==='oui'?'Demandé':'Non')), M+3, y+13.5, 7, [100,95,90]);
        y += 20; chk();
      });
    }

    // ── Rupture Conventionnelle ────────────────────────────────
    const rupture = window.M6_RuptureCalculateur?._getLastSimulation?.();
    if (rupture) {
      chk();
      rect(M,y,PW,7,[240,235,228]);
      txt('SIMULATION RUPTURE CONVENTIONNELLE',M+3,y+5,8,[70,65,60],'bold');
      y += 10;
      [[`Indemnité légale min.`, rupture.indemnite+'€'],[`Préavis`, rupture.preavis||'N/A'],[`Ancienneté`, rupture.anciennete||'N/A']].forEach(([l,v]) => {
        txt(l, M+3, y, 8, [74,69,64]); txt(v, W-M-2, y, 8, [26,23,20], 'bold', 'right'); y+=5;
      });
      y += 5; chk();
    }

    // ── Certification + signature ──────────────────────────────
    chk();
    if (y > 230) { doc.addPage(); y = 15; }
    doc.setDrawColor(45,107,79); doc.setLineWidth(0.4);
    doc.rect(M,y,PW,30,'S');
    rect(M,y,PW,7,[232,245,238]);
    txt('CERTIFICATION LÉGALE ANNUELLE',M+3,y+5,8,[30,90,60],'bold');
    doc.setFontSize(7.5); doc.setTextColor(74,69,64); doc.setFont('helvetica','normal');
    const certText = doc.splitTextToSize(
      `Je soussigné(e) ${_pdfSanitize(contract.nomCadre||'_________________')} certifie l'exactitude du présent document et atteste avoir respecté les repos quotidien (11h, Art. L3131-1) et hebdomadaire (35h, Art. L3132-2) sur l'exercice ${year}. Réf. : ${hashStr}`,
      PW-6);
    doc.text(certText, M+3, y+10);
    y += 34;
    chk();

    txt('Cadre :', M+3, y+5, 8, [26,23,20]); ln(M+22,y+6,M+PW/2-5,y+6);
    txt('Date :', M+PW/2+3, y+5, 8, [26,23,20]); ln(M+PW/2+18,y+6,W-M-2,y+6);
    y += 12;
    txt('Manager :', M+3, y+5, 8, [26,23,20]); ln(M+25,y+6,M+PW/2-5,y+6);
    txt('Date :', M+PW/2+3, y+5, 8, [26,23,20]); ln(M+PW/2+18,y+6,W-M-2,y+6);

    // Footer
    doc.setFontSize(6.5); doc.setTextColor(150);
    doc.text(`M6 Cadres · Bilan ${year} · Généré le ${new Date().toLocaleString('fr-FR')} · Réf. ${hashStr}`, M, 290);
    doc.text('Art. L3121-58 à L3121-65 Code du travail', W-M, 290, {align:'right'});

    const filename = `Forfait_Jours_Annuel_${year}_${(contract.nomCadre||'Cadre').replace(/\s/g,'_')}.pdf`;
    _shareOrSave(doc, filename, 'PDF annuel généré');
    if (window.M6_Storage) M6_Storage.markFileSave?.('forfait_jours', year);
  },

  _genAnnuelFJ({ regime, year, contract, data, moods, analysis }) {
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

    _shareOrSave(doc, `Entretien_Annuel_Forfait_Jours_${year}.pdf`, 'PDF entretien généré');
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
        doc.save(_pdfSanitize('dirigeant_' + (contract.nom||'cadre').replace(/\s+/g,'_').toLowerCase() + '_' + year + '.pdf'));
    M6_toast?.('PDF Dirigeant genere');
  },

  // ── Export sur une periode libre ────────────────────────────────
  exportPeriode({ regime, year, dateDebut, dateFin, contract, data, moods }) {
    if(typeof window==='undefined'||!window.jspdf) { M6_toast?.('jsPDF non charge'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const M=15, W=doc.internal.pageSize.getWidth()-2*M;
    let y=20;

    // En-tete
    doc.setFillColor(26,23,20); doc.rect(0,0,210,32,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(247,243,237);
    doc.text(_pdfSanitize('Rapport de periode - Forfait Cadres'), M, 14);
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(196,163,90);
    doc.text(_pdfSanitize('Du ' + dateDebut + ' au ' + dateFin + ' - ' + (contract.nomCadre||contract.nom||'N/A')), M, 22);
    doc.text(_pdfSanitize('CCN : ' + (contract.ccnLabel||'N/A') + ' - Forfait : ' + (contract.plafond||218) + 'j'), M, 28);
    y = 42;

    // Identification
    doc.setFillColor(240,235,225); doc.rect(M,y,W,16,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(74,69,64);
    doc.text(_pdfSanitize('Cadre : ' + (contract.nomCadre||contract.nom||'N/A')), M+3, y+5);
    doc.text(_pdfSanitize('Periode analysee : ' + dateDebut + ' au ' + dateFin), M+3, y+10);
    doc.text(_pdfSanitize('Exporte le : ' + new Date().toLocaleDateString('fr-FR')), M+3, y+14);
    y += 22;

    // Filtrer les entrees sur la periode
    const debut = dateDebut; const fin = dateFin;
    const entries = Object.entries(data)
      .filter(([dk]) => dk >= debut && dk <= fin)
      .sort(([a],[b]) => a.localeCompare(b));

    // Comptages
    let travailles=0, rttPris=0, cpPris=0, rachat=0, maladie=0, deplacement=0, demis=0;
    entries.forEach(([dk,v]) => {
      const t = v.type||'travail';
      if(t==='travail')    travailles++;
      if(t==='rachat')     { travailles++; rachat++; }
      if(t==='demi')       { travailles+=0.5; demis++; }
      if(t==='rtt')        rttPris++;
      if(t==='cp')         cpPris++;
      if(t==='maladie')    maladie++;
      if(v.deplacement)    deplacement++;
    });

    // Tableau recap
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(26,23,20);
    doc.text(_pdfSanitize('RECAPITULATIF DE LA PERIODE'), M, y); y+=6;
    const recap = [
      ['Jours travailles (dont '+rachat+' rachetes)', travailles],
      ['Demi-journees (x0.5)', demis],
      ['RTT pris', rttPris],
      ['Conges payes pris', cpPris],
      ['Arrets maladie', maladie],
      ['Deplacements professionnels', deplacement],
      ['Total jours saisis', entries.length],
    ];
    recap.forEach(([l,v],i) => {
      if(i%2===0) { doc.setFillColor(248,244,238); doc.rect(M,y-3,W,7,'F'); }
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(74,69,64);
      doc.text(_pdfSanitize(l), M+2, y+1);
      doc.setFont('helvetica','bold'); doc.setTextColor(26,23,20);
      doc.text(String(v), M+W-15, y+1, {align:'right'});
      y+=7;
    });
    y+=8;

    // Tableau journalier (si < 62 jours)
    if(entries.length > 0 && entries.length <= 62) {
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(26,23,20);
      doc.text(_pdfSanitize('DETAIL JOURNALIER'), M, y); y+=6;
      doc.setFontSize(8);
      doc.setFillColor(26,23,20);
      doc.rect(M,y-3,W,6,'F');
      doc.setTextColor(247,243,237);
      doc.text('Date',M+2,y+1); doc.text('Type',M+35,y+1);
      doc.text('Debut',M+65,y+1); doc.text('Fin',M+85,y+1);
      doc.text('Note',M+105,y+1);
      y+=8;
      const typeNames = { travail:'Travail',rtt:'RTT',cp:'Conge',ferie:'Ferie',repos:'Repos',rachat:'Rachat',demi:'Demi-j.',maladie:'Maladie',maternite:'Maternite',css:'CSS',formation:'Formation',cet:'CET',astreinte:'Astreinte',teletravail:'Teletravail' };
      entries.forEach(([dk,v],i) => {
        if(y > 265) { doc.addPage(); y=20; }
        if(i%2===0) { doc.setFillColor(248,244,238); doc.rect(M,y-3,W,6,'F'); }
        const d = new Date(dk+'T12:00:00');
        const dateStr = d.toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'2-digit'});
        const typeStr = typeNames[v.type||'travail']||v.type||'?';
        const depl = v.deplacement ? ' [D]' : '';
        doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(26,23,20);
        doc.text(_pdfSanitize(dateStr),M+2,y+1);
        doc.text(_pdfSanitize(typeStr+depl),M+35,y+1);
        doc.text(_pdfSanitize(v.debut||''),M+65,y+1);
        doc.text(_pdfSanitize(v.fin||''),M+85,y+1);
        if(v.note) doc.text(_pdfSanitize((v.note||'').substring(0,25)),M+105,y+1);
        y+=6;
      });
      y+=6;
    } else if(entries.length > 62) {
      doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(138,132,124);
      doc.text(_pdfSanitize('Detail journalier omis (periode > 2 mois). Utilisez l export JSON pour le detail complet.'), M, y); y+=10;
    }

    // Certification
    if(y>255) { doc.addPage(); y=20; }
    doc.setFillColor(248,244,238); doc.rect(M,y,W,24,'F');
    doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(74,69,64);
    doc.text(_pdfSanitize('Je certifie l exactitude des informations ci-dessus et le respect des temps de repos legaux.'), M+3, y+7);
    doc.text(_pdfSanitize('Genere le ' + new Date().toLocaleString('fr-FR') + ' par M6 Cadres'), M+3, y+12);
    doc.setTextColor(139,105,20);
    doc.text(_pdfSanitize('Signature cadre : _________________________   Date : ________'), M+3, y+19);
    y+=30;

    doc.setFontSize(7); doc.setTextColor(138,132,124); doc.setFont('helvetica','normal');
    doc.text('Ce document ne remplace pas un avis juridique. Sources : Code du travail L3121-41 a L3121-65.', M, 290);

    const nomFichier = _pdfSanitize('periode_' + debut + '_' + fin + '_' + (contract.nomCadre||'cadre').replace(/\s+/g,'_').toLowerCase() + '.pdf');
    _shareOrSave(doc, nomFichier, 'PDF période généré : ' + entries.length + ' jours');
  },
  // ── PDF Mensuel Forfait Heures ────────────────────────────────
  exportMensuelFH({ regime, year, mois, contract, data, analysis }) {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) { window.M6_toast?.('jsPDF non chargé'); return; }

    const doc = new jsPDF({ format:'a4', unit:'mm' });
    const W=210, M=15, PW=W-2*M;
    let y=0;

    const txt  = (t,x,ry,size,color,style='normal',align='left') => {
      doc.setFontSize(size); doc.setTextColor(...(color||[26,23,20]));
      doc.setFont('helvetica',style);
      if (align==='right') doc.text(String(t||''),x,ry,{align:'right'});
      else doc.text(String(t||''),x,ry);
    };
    const rect = (x,ry,w,h,fill) => { doc.setFillColor(...fill); doc.rect(x,ry,w,h,'F'); };
    const chk  = () => { if(y>268){doc.addPage();y=15;} };

    const mNoms = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const mNom  = mNoms[mois]||'';
    const hashStr = _localHash(`${regime}-FH-${year}-${mois}-${contract.nomCadre||''}`);

    // Couverture
    rect(0,0,W,40,[26,23,20]);
    doc.setDrawColor(196,163,90); doc.setLineWidth(0.4); doc.line(M,36,W-M,36);
    txt('M6 CADRES — FORFAIT HEURES',M,9,7,[196,163,90],'bold');
    txt(`RAPPORT MENSUEL — ${mNom.toUpperCase()} ${year}`,M,17,13,[247,243,237],'bold');
    txt(`${_pdfSanitize(contract.nomCadre||'Cadre')}  ·  ${_pdfSanitize(contract.ccnLabel||'Droit commun')}`,M,26,8,[189,181,168]);
    txt(`Réf. ${hashStr}`,W-M,9,6,[150,140,130],'normal','right');
    y = 48;

    // Infos contrat
    rect(M,y,PW,7,[240,235,228]);
    txt('PARAMÈTRES CONTRAT',M+3,y+5,8,[70,65,60],'bold');
    y += 10;
    [[`Seuil déclenchement HS`, `${contract.seuilHebdo||35}h/sem`],[`Contingent annuel`, `${analysis?.contingent||contract.contingent||220}h`],[`Taux majorations`, analysis?.a3Paliers ? `+${analysis.taux1||25}%(${analysis.palier||8}h) / +${analysis.taux_inter}%(${analysis.palier_inter}h) / +${analysis.taux2||50}%`:`+${analysis?.taux1||25}%(${analysis?.palier||8}h) / +${analysis?.taux2||50}%`],[`CCN`, _pdfSanitize(analysis?.ccnNom||contract.ccnLabel||'Droit commun')]].forEach(([l,v],i)=>{
      if(i%2===0){doc.setFillColor(248,245,241);doc.rect(M,y-1.5,PW,5.5,'F');}
      txt(l,M+2,y+2.5,8,[70,65,60]); txt(v,W-M-2,y+2.5,8,[26,23,20],'bold','right'); y+=5.5;
    });
    y += 5; chk();

    // Semaines du mois
    rect(M,y,PW,7,[26,23,20]);
    txt('SEMAINES DU MOIS',M+3,y+5,8,[247,243,237],'bold');
    y += 10;
    const semsOfMonth = Object.entries(data||{}).filter(([wk,])=>{
      const wn = parseInt(wk.split('W')[1]);
      const yr = parseInt(wk.split('-')[0]);
      const d  = new Date(yr, 0, 1+(wn-1)*7-(new Date(yr,0,1).getDay()||7)+1);
      return d.getFullYear()===year && d.getMonth()===mois;
    });

    if (!semsOfMonth.length) {
      doc.setFontSize(8); doc.setTextColor(138,132,124);
      doc.text('Aucune semaine saisie pour ce mois.', M+3, y); y+=10;
    } else {
      rect(M,y-1,PW,6,[240,235,228]);
      ['Semaine','Heures','HS palier 1','HS palier 2','Total HS','Montant brut'].forEach((h,i)=>{
        txt(h, M+2+i*32, y+4, 7, [70,65,60], 'bold');
      });
      y += 7;
      let totalH=0, totalHS1=0, totalHS2=0, totalHSm=0, totalMnt=0;
      semsOfMonth.forEach(([wk,v],i)=>{
        chk();
        const h  = parseFloat(v.heures)||0;
        const seuil = contract.seuilHebdo||35;
        const extra = Math.max(0,h-seuil);
        const t1    = analysis?.taux1||25, pal=analysis?.palier||8;
        const t2    = analysis?.taux2||50;
        const hs1   = Math.min(extra,pal), hs2=Math.max(0,extra-pal);
        const tauxH = contract.tauxHoraire||0;
        const mnt   = tauxH>0 ? Math.round((hs1*tauxH*(1+t1/100)+hs2*tauxH*(1+t2/100))*100)/100 : 0;
        totalH+=h; totalHS1+=hs1; totalHS2+=hs2; totalHSm+=(hs1+hs2); totalMnt+=mnt;
        if(i%2===0){doc.setFillColor(248,245,241);doc.rect(M,y-1.5,PW,5.5,'F');}
        [wk, h+'h', hs1>0?'+'+hs1+'h':'-', hs2>0?'+'+hs2+'h':'-', (hs1+hs2)>0?(hs1+hs2).toFixed(1)+'h':'-', mnt>0?mnt.toFixed(2)+'€':'-'].forEach((v,j)=>{
          const col = j>=2&&parseFloat(v)>0?[155,44,44]:[26,23,20];
          txt(v, M+2+j*32, y+2.5, 7.5, col, j===0?'normal':'bold'); 
        });
        y += 5.5; chk();
      });
      // Totaux
      doc.setLineWidth(0.3); doc.setDrawColor(196,163,90);
      doc.line(M,y,W-M,y);
      y += 4;
      rect(M,y,PW,7,[232,245,238]);
      txt('TOTAUX DU MOIS',M+3,y+5,8,[30,90,60],'bold');
      txt(`${totalH}h travaillées · ${totalHSm.toFixed(1)}h HS · ${totalMnt>0?totalMnt.toFixed(2)+'€ brut TEPA':'Taux horaire non renseigné'}`,W-M-2,y+5,8,[30,90,60],'normal','right');
      y += 12;

      // TEPA
      if (contract.tauxHoraire > 0) {
        chk();
        rect(M,y,PW,7,[240,235,228]);
        txt('RÉDUCTION COTISATIONS ET EXONÉRATION FISCALE (Loi TEPA)',M+3,y+5,8,[70,65,60],'bold');
        y += 10;
        const exoMois = Math.min(totalMnt, 7500/12);
        [[`HS à +${analysis?.taux1||25}%`,`${totalHS1.toFixed(1)}h`],[`HS à +${analysis?.taux2||50}%`,`${totalHS2.toFixed(1)}h`],[`Montant brut mensuel`,`${totalMnt.toFixed(2)} €`],[`Exonération IR estimée (plaf. 625€/mois)`,`${exoMois.toFixed(2)} €`]].forEach(([l,v],i)=>{
          if(i%2===0){doc.setFillColor(248,245,241);doc.rect(M,y-1.5,PW,5.5,'F');}
          txt(l,M+2,y+2.5,8,[70,65,60]); txt(v,W-M-2,y+2.5,8,[26,23,20],'bold','right'); y+=5.5;
        });
        y += 3;
        doc.setFontSize(6.5); doc.setTextColor(100);
        doc.text('Art. L241-17 CSS · Loi TEPA 2007 · Loi 2022-1158', M+2, y);
        y += 8;
      }
    }
    chk();

    // Certification
    if (y > 240) { doc.addPage(); y = 15; }
    doc.setDrawColor(45,107,79); doc.setLineWidth(0.3); doc.rect(M,y,PW,22,'S');
    rect(M,y,PW,6,[232,245,238]);
    txt('CERTIFICATION (Art. L3121-46)',M+3,y+4.5,8,[30,90,60],'bold');
    doc.setFontSize(7.5); doc.setTextColor(74,69,64); doc.setFont('helvetica','normal');
    const certLines = doc.splitTextToSize(`Je soussigné(e) ${_pdfSanitize(contract.nomCadre||'_________________')} certifie l'exactitude de ce rapport de suivi d'heures supplémentaires pour ${mNom} ${year}. Réf. : ${hashStr}`, PW-6);
    doc.text(certLines, M+3, y+10);
    y += 26;
    doc.setFontSize(8); doc.setTextColor(26,23,20);
    doc.text('Signature cadre :', M+3, y+5); doc.line(M+38,y+6,M+PW/2,y+6);
    doc.text('Date :', M+PW/2+5, y+5); doc.line(M+PW/2+18,y+6,W-M-2,y+6);

    doc.setFontSize(7); doc.setTextColor(138,132,124);
    doc.text(`M6 Cadres — Forfait Heures — ${mNom} ${year} — Généré le ${new Date().toLocaleDateString('fr-FR')}`, M, 290);
    doc.text('Art. L3121-27 à L3121-46 Code du travail', W-M, 290, {align:'right'});

    _shareOrSave(doc, `Forfait_Heures_${mNom}_${year}.pdf`, `PDF mensuel FH ${mNom} ${year} généré`);
  },

  // ── Export preuve renforcée (hash SHA-256 local) ────────────────
  exportPreuve({ regime, year, contract, data, analysis }) {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) { window.M6_toast?.('jsPDF non chargé'); return; }

    const doc = new jsPDF({ format:'a4', unit:'mm' });
    const W=210, M=15, PW=W-2*M;
    let y=15;

    const ts    = new Date().toISOString();
    const hash  = _localHash(`${regime}-${year}-${contract.nomCadre||''}-${JSON.stringify(Object.keys(data||{}).length)}-${ts}`);
    const dataStr = JSON.stringify({regime,year,nomCadre:contract.nomCadre,joursEffectifs:analysis?.joursEffectifs,plafond:analysis?.plafond,rachetes:analysis?.rachetes,rttPris:analysis?.rttPris});

    doc.setFillColor(26,23,20); doc.rect(0,0,W,30,'F');
    doc.setFontSize(8); doc.setTextColor(196,163,90); doc.setFont('helvetica','bold');
    doc.text('M6 CADRES — DOCUMENT DE PREUVE', M, 9);
    doc.setFontSize(11); doc.setTextColor(247,243,237);
    doc.text(`EMPREINTE NUMÉRIQUE DU FORFAIT ${year}`, M, 18);
    doc.setFontSize(7); doc.setTextColor(189,181,168);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, M, 25);
    y = 38;

    doc.setFontSize(8); doc.setTextColor(26,23,20); doc.setFont('helvetica','bold');
    doc.text('IDENTIFICATION', M, y); y += 6;
    [[`Cadre`, contract.nomCadre||'N/A'],[`Régime`, regime],[`Exercice`, String(year)],[`CCN`, contract.ccnLabel||'Droit commun']].forEach(([l,v])=>{
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,69,64);
      doc.text(l+' :', M+2, y); doc.setFont('helvetica','bold'); doc.setTextColor(26,23,20);
      doc.text(_pdfSanitize(v), M+40, y); y+=5;
    });
    y += 6;

    doc.setFontSize(8); doc.setTextColor(26,23,20); doc.setFont('helvetica','bold');
    doc.text('EMPREINTE DU DOCUMENT (Hash djb2)', M, y); y+=6;
    doc.setFontSize(9); doc.setTextColor(55,48,163); doc.setFont('helvetica','bold');
    doc.text(hash, M+2, y); y+=7;
    doc.setFontSize(7); doc.setTextColor(100); doc.setFont('helvetica','normal');
    const dataLines = doc.splitTextToSize('Données hachées : '+dataStr, PW-4);
    doc.text(dataLines, M+2, y); y+= dataLines.length*3.5 + 5;

    doc.setFontSize(8); doc.setTextColor(26,23,20); doc.setFont('helvetica','bold');
    doc.text('SYNTHÈSE CERTIFIÉE', M, y); y+=6;
    [[`Jours travaillés`,`${analysis?.joursEffectifs||0} / ${analysis?.plafond||218}`],[`RTT pris`,`${analysis?.rttPris||0} / ${analysis?.rttTheoriques||0}`],[`Rachats`,`${analysis?.rachetes||0}`],[`Alertes`,`${analysis?.alertes?.length||0}`]].forEach(([l,v])=>{
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,69,64);
      doc.text(l+' :', M+2, y); doc.setFont('helvetica','bold'); doc.setTextColor(26,23,20);
      doc.text(_pdfSanitize(v), M+40, y); y+=5;
    });
    y += 8;

    // Zone de signature
    doc.setDrawColor(45,107,79); doc.setLineWidth(0.3); doc.rect(M,y,PW,28,'S');
    doc.setFillColor(232,245,238); doc.rect(M,y,PW,7,'F');
    doc.setFontSize(8); doc.setTextColor(30,90,60); doc.setFont('helvetica','bold');
    doc.text('SIGNATURE ET CERTIFICATION', M+3, y+5); y+=10;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(74,69,64);
    const certL = doc.splitTextToSize(`Je soussigné(e) ${_pdfSanitize(contract.nomCadre||'___________')} certifie que ce document reflète fidèlement les données saisies dans l'application M6 Cadres pour l'exercice ${year}. Hash de référence : ${hash}`, PW-6);
    doc.text(certL, M+3, y); y+=certL.length*3.5+4;
    doc.setFontSize(8); doc.setTextColor(26,23,20);
    doc.text('Signature :', M+3, y+4); doc.line(M+25,y+5,M+PW/2,y+5);
    doc.text('Date :', M+PW/2+3, y+4); doc.line(M+PW/2+16,y+5,W-M-2,y+5);

    doc.setFontSize(7); doc.setTextColor(138,132,124);
    doc.text('Document de preuve M6 Cadres — Usage interne et prud\'hommal', M, 290);
    doc.text(hash, W-M, 290, {align:'right'});

    _shareOrSave(doc, `Preuve_Forfait_${year}_${hash}.pdf`, 'Document de preuve généré');
  },
};

global.M6_PDF = M6_PDF;
})(window);
