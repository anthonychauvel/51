/**
 * VIEW-FORFAIT-JOURS — Orchestrateur complet M6
 * 6 onglets : Bilan · Calendrier · Santé · Entretien · Export · Glossaire
 * Prorata arrivée en cours d'année · Fractionnement · Multi-années
 */
'use strict';

(function(global) {

const VFJ = {
  _c: null, _regime: 'forfait_jours',
  _year: new Date().getFullYear(),
  _section: 'bilan',
  _contract: null, _data: {}, _moods: {},

  init(container) {
    this._c = container;
    this._year = M6_Storage.getActiveYear();
    this._load(); this.render();
  },

  _load() {
    this._contract = M6_Storage.getContract(this._regime);
    this._data     = M6_Storage.getData(this._regime, this._year);
    this._moods    = M6_Storage.getMoods(this._regime, this._year);
  },

  _save(dk, value, mood) {
    if (value === null) {
      const d = M6_Storage.getData(this._regime, this._year);
      delete d[dk]; M6_Storage.setData(this._regime, this._year, d);
      const m = M6_Storage.getMoods(this._regime, this._year);
      delete m[dk]; localStorage.setItem(`M6_${this._regime}_${this._year}_MOODS`, JSON.stringify(m));
    } else {
      M6_Storage.setDay(this._regime, this._year, dk, value);
      if (mood) M6_Storage.setMood(this._regime, this._year, dk, mood);
    }
    this._load();
    if (this._section === 'calendrier' && window.M6_Calendar) {
      M6_Calendar.refresh(this._data, this._moods);
    } else { this.render(); }
    M6_toast('✓ Enregistré');
    this._alerteSurchauffe();
  },

  _alerteSurchauffe() {
    const today = new Date(); let n = 0;
    for (let i = 0; i < 3; i++) {
      const d = new Date(today); d.setDate(today.getDate()-i);
      const m = this._moods[d.toISOString().slice(0,10)];
      if (m?.niveau === 'critique') n++;
    }
    if (n >= 3) setTimeout(() => M6_toast('🔥 3j critique — signalez à votre manager (L4121-1)'), 600);
  },

  render() {
    if (!this._contract) { this._c.innerHTML = this._tplSetup(); this._bindSetup(); return; }
    const analysis = M6_ForfaitJours.analyze(this._contract, this._data, this._year);
    const bio      = M6_BioEngine.analyzeForfaitJours(this._contract, this._data, this._year);
    this._c.innerHTML = `${this._tplHeader(analysis)}${this._tplNav()}<div class="m6-main m6-fade-in" id="vfj-content" style="padding-top:8px"></div>`;
    const ct = this._c.querySelector('#vfj-content');
    switch(this._section) {
      case 'bilan':      ct.innerHTML = this._tplBilan(analysis,bio); this._bindBilan(analysis,bio); break;
      case 'calendrier': this._renderCal(ct); break;
      case 'bio':        ct.innerHTML = this._tplBio(bio); break;
      case 'entretien':  M6_Entretien.renderForm(ct, this._regime, this._year, this._contract, analysis, ()=>{this._load();this.render();}); break;
      case 'export':     ct.innerHTML = this._tplExport(analysis); this._bindExport(analysis); break;
      case 'glossaire':  M6_GlossaireUI.render(ct); break;
    }
    this._bindNav();
  },

  _tplHeader(a) {
    const r = Math.max(0, a.plafond - a.joursEffectifs);
    const pct = a.tauxRemplissage;
    const barColor = pct>=100 ? 'linear-gradient(90deg,#9B2C2C,#E53E3E)' : pct>=90 ? 'linear-gradient(90deg,var(--champagne-2),var(--champagne))' : 'linear-gradient(90deg,#2D6A4F,#4A7C6F)';
    return `<div style="background:var(--charbon);padding:10px 16px;padding-top:calc(10px + env(safe-area-inset-top,0));position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(196,163,90,0.25)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="flex:1">
          <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;color:var(--ivoire)">Forfait Jours ${this._year}</div>
          <div style="font-size:0.65rem;color:var(--champagne);letter-spacing:0.06em;text-transform:uppercase">${this._contract.ccnLabel||'Droit commun'} · ${a.plafond}j</div>
        </div>
        ${this._tplYearPicker()}
        <a href="../menu.html" style="color:var(--pierre);font-size:0.7rem;text-decoration:none;border:1px solid rgba(255,255,255,0.12);padding:4px 8px;border-radius:6px">← Menu</a>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:var(--pierre);margin-bottom:3px">
          <span><strong style="color:var(--ivoire)">${a.joursEffectifs}</strong> jours</span>
          <span style="color:${r<=10?'var(--alerte)':'var(--pierre)'}"><strong style="color:${r<=10?'var(--alerte)':'var(--champagne)'}">${r}</strong> restants / ${a.plafond}</span>
        </div>
        <div style="height:5px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden">
          <div style="height:100%;border-radius:99px;width:${Math.min(100,pct)}%;background:${barColor};transition:width 0.6s"></div>
        </div>
      </div>
    </div>`;
  },

  _tplYearPicker() {
    const yrs = M6_Storage.getAllYears(this._regime);
    if (yrs.length <= 1) return `<span style="font-size:0.72rem;color:var(--pierre)">${this._year}</span>`;
    return `<select id="vfj-yr" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--ivoire);font-size:0.72rem;border-radius:6px;padding:3px 6px;-webkit-appearance:none">
      ${yrs.map(y=>`<option value="${y}" ${y==this._year?'selected':''}>${y}</option>`).join('')}
    </select>`;
  },

  _tplNav() {
    const tabs = [{id:'bilan',icon:'◈',label:'Bilan'},{id:'calendrier',icon:'◻',label:'Calendrier'},{id:'bio',icon:'♡',label:'Santé'},{id:'entretien',icon:'◉',label:'Entretien'},{id:'export',icon:'◆',label:'Export'},{id:'glossaire',icon:'≡',label:'Glossaire'}];
    return `<nav class="m6-bottom-nav">${tabs.map(t=>`<button class="m6-nav-item ${this._section===t.id?'active':''}" data-sec="${t.id}"><span class="nav-icon">${t.icon}</span>${t.label}</button>`).join('')}</nav>`;
  },

  _bindNav() {
    this._c.querySelectorAll('[data-sec]').forEach(b => b.addEventListener('click', () => { this._section=b.dataset.sec; this.render(); }));
    const yp = this._c.querySelector('#vfj-yr');
    if (yp) yp.addEventListener('change', () => { this._year=parseInt(yp.value); M6_Storage.setActiveYear(this._year); this._load(); this.render(); });
  },

  // ── BILAN ────────────────────────────────────────────────────
  _tplBilan(a, bio) {
    const frac = a.fractionnement;
    return `
    ${a.isProrata ? `<div class="m6-alert info" style="margin-bottom:12px;font-size:0.78rem"><span>📐</span><div>Prorata appliqué (arrivée ${new Date(this._contract.dateArrivee+'T12:00:00').toLocaleDateString('fr-FR')}) → <strong>${a.plafondProrata}j</strong> (${Math.round(a.ratio*100)}%).</div></div>` : ''}
    ${frac?.droitFractionnement>0 ? `<div class="m6-alert success" style="margin-bottom:12px;font-size:0.78rem"><span>🗓️</span><div><strong>${frac.droitFractionnement}j de fractionnement</strong> acquis (CP hors mai-oct : ${frac.cpHorsPeriode}j — L3141-23).</div></div>` : ''}

    <div class="m6-stats-grid" style="margin-bottom:14px">
      <div class="m6-stat-box"><div class="m6-stat-val">${a.joursEffectifs}</div><div class="m6-stat-label">Jours travaillés</div></div>
      <div class="m6-stat-box" style="border-color:${a.rttSolde<0?'var(--alerte)':'rgba(196,163,90,0.35)'}">
        <div class="m6-stat-val" style="color:${a.rttSolde<0?'var(--alerte)':'var(--champagne-2)'}">${a.rttSolde>=0?'+':''}${a.rttSolde}</div>
        <div class="m6-stat-label">Solde RTT</div>
      </div>
      <div class="m6-stat-box"><div class="m6-stat-val">${a.rttTheoriques}</div><div class="m6-stat-label">RTT théoriques</div></div>
      <div class="m6-stat-box"><div class="m6-stat-val">${a.rttPris}</div><div class="m6-stat-label">RTT pris</div></div>
    </div>

    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon">📊</div><div><div class="m6-card-label">Répartition</div><div class="m6-card-title">Détail ${this._year}</div></div></div>
      <div class="m6-card-body">
        ${[['Jours travaillés',a.joursEffectifs,a.rachetes>0?`(dont ${a.rachetes} rachetés)`:''],[`RTT pris`,a.rttPris,`/${a.rttTheoriques} théoriques`],['CP pris',a.cpPris,`/${this._contract.joursCPContrat||25}j contractuels`],['Demi-journées',a.demis||0,''],['Déplacements',a.deplacements||0,''],['Fériés ouvrés',a.feriesOuvres,''],['Repos',a.reposPris,'']].map(([l,v,h])=>`<div class="m6-row"><span class="m6-row-label">${l}</span><span class="m6-row-val">${v} <small style="color:var(--pierre);font-weight:400">${h||''}</small></span></div>`).join('')}
      </div>
    </div>

    ${bio.hasData ? `<div class="m6-card" style="margin-bottom:14px;cursor:pointer" id="bio-card">
      <div class="m6-card-body" style="padding:12px 14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div class="m6-card-label">Santé — Phase ${bio.phase?.code}</div>
          <span class="m6-badge" style="background:${bio.phase?.color}20;color:${bio.phase?.color};border-radius:99px;font-size:0.65rem;padding:2px 8px">${bio.phase?.label}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">
          ${[['Fatigue',bio.fatigue,true],['Stress',bio.stress,true],['Récup.',bio.recovery,false],['Perf.',bio.performance,false]].map(([l,v,inv])=>{
            const c=inv?(v>60?'#B85C50':v>35?'#C4853A':'#4A7C6F'):(v<40?'#B85C50':v<65?'#C4853A':'#4A7C6F');
            return `<div style="background:var(--ivoire);border-radius:8px;padding:8px 4px"><div style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:${c}">${v}</div><div style="font-size:0.6rem;color:var(--pierre);text-transform:uppercase">${l}</div></div>`;
          }).join('')}
        </div>
        <div style="font-size:0.68rem;color:var(--pierre);margin-top:6px;text-align:right">→ onglet Santé</div>
      </div>
    </div>` : ''}

    ${a.alertes.length ? `<div class="m6-card" style="margin-bottom:14px"><div class="m6-card-header"><div class="m6-card-icon">⚠️</div><div><div class="m6-card-label">Vigilance</div><div class="m6-card-title">${a.alertes.length} point(s)</div></div></div><div class="m6-card-body" style="padding-bottom:8px">${a.alertes.map(al=>`<div class="m6-alert ${al.niveau}" style="margin-bottom:8px"><span class="m6-alert-icon">${al.icon}</span><div><strong>${al.titre}</strong><br><span style="font-size:0.77rem">${al.texte}</span><br><span style="font-size:0.65rem;color:var(--pierre)">Art. ${al.loi}</span></div></div>`).join('')}</div></div>` : `<div class="m6-alert success" style="margin-bottom:14px"><span class="m6-alert-icon">✅</span><div><strong>Situation conforme</strong> — Aucune alerte pour ${this._year}.</div></div>`}

    ${a.simulRachat ? `<div class="m6-card" style="margin-bottom:14px"><div class="m6-card-header"><div class="m6-card-icon">💰</div><div><div class="m6-card-label">Simulation</div><div class="m6-card-title">Rachat de jours</div></div></div><div class="m6-card-body"><div class="m6-row"><span class="m6-row-label">Jours rachetés</span><span class="m6-row-val">${a.simulRachat.joursRachetes}j</span></div><div class="m6-row"><span class="m6-row-label">Base brute</span><span class="m6-row-val">${a.simulRachat.montantBase}€</span></div><div class="m6-row"><span class="m6-row-label">Majoration ${a.simulRachat.majoration}%</span><span class="m6-row-val gold">+${a.simulRachat.gainBrut}€</span></div><div class="m6-row"><span style="font-weight:600">Total brut</span><span class="m6-row-val gold" style="font-family:var(--font-display);font-size:1.2rem">${a.simulRachat.montantMajoré}€</span></div></div></div>` : ''}

    <button class="m6-btn m6-btn-primary" id="vfj-saisir" style="margin-bottom:8px">＋ Saisir aujourd'hui</button>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <button class="m6-btn m6-btn-ghost" id="vfj-newyr" style="flex:1;font-size:0.78rem">📅 Nouvel exercice</button>
      <button class="m6-btn m6-btn-ghost" onclick="VFJ_editContract()" style="flex:1;font-size:0.78rem">⚙️ Contrat</button>
    </div>`;
  },

  _bindBilan(analysis, bio) {
    this._c.querySelector('#vfj-saisir')?.addEventListener('click', () => {
      if (window.M6_Calendar) {
        this._section = 'calendrier'; this.render();
        setTimeout(() => M6_Calendar._openPopup(new Date().toISOString().slice(0,10)), 300);
      }
    });
    this._c.querySelector('#bio-card')?.addEventListener('click', () => { this._section='bio'; this.render(); });
    this._c.querySelector('#vfj-newyr')?.addEventListener('click', () => this._openNewYear());
  },

  _renderCal(ct) {
    ct.innerHTML = '<div id="cal-root"></div>';
    M6_Calendar.init(ct.querySelector('#cal-root'), this._regime, this._year, this._data, this._moods, (dk,v,m) => this._save(dk,v,m));
  },

  // ── BIO ─────────────────────────────────────────────────────
  _tplBio(bio) {
    if (!bio.hasData) return `<div class="m6-alert info" style="margin-top:16px"><span>ℹ️</span><div>Saisissez des jours avec leur niveau de charge pour voir l'analyse.</div></div>`;
    const bar = (label, val, inv) => {
      const c = inv ? (val>60?'#B85C50':val>35?'#C4853A':'#4A7C6F') : (val<40?'#B85C50':val<65?'#C4853A':'#4A7C6F');
      return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px"><span>${label}</span><span style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:${c}">${val}</span></div><div style="height:8px;background:var(--ivoire-2);border-radius:99px;overflow:hidden"><div style="height:100%;width:${val}%;border-radius:99px;background:${c}"></div></div></div>`;
    };
    return `
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Santé & Bien-être</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon" style="background:${bio.phase?.color}20">🩺</div><div><div class="m6-card-label">Phase INRS</div><div class="m6-card-title" style="color:${bio.phase?.color}">${bio.phase?.code} — ${bio.phase?.label}</div></div></div>
      <div class="m6-card-body">${bar('Fatigue accumulée',bio.fatigue,true)}${bar('Stress chronique',bio.stress,true)}${bar('Capacité de récupération',bio.recovery,false)}${bar('Performance estimée (Pencavel)',bio.performance,false)}</div>
    </div>
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon">❤️</div><div><div class="m6-card-label">Long terme</div><div class="m6-card-title">Risques CV & cognitif</div></div></div>
      <div class="m6-card-body">${bar('Risque CV (OMS/OIT 2021)',bio.cvRisk,true)}${bar('Charge cognitive (Jang 2025)',bio.cogRisk,true)}<div style="font-size:0.7rem;color:var(--pierre);margin-top:6px">Pega F. et al. WHO/ILO 2021 · Kivimäki 2015 (Lancet) · Jang W. et al. 2025</div></div>
    </div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body"><div class="m6-card-label" style="margin-bottom:8px">Répartition de la charge déclarée</div><div style="display:flex;gap:8px;flex-wrap:wrap">
      ${['faible','ok','elevé','critique'].map(niv=>{const c=M6_MOOD_COLORS[niv];const n=Object.values(this._moods).filter(m=>m.niveau===niv).length;return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:10px;padding:10px 14px;text-align:center;min-width:60px"><div style="font-size:1.4rem">${c.icon}</div><div style="font-family:var(--font-display);font-size:1.3rem;font-weight:700;color:${c.text}">${n}</div><div style="font-size:0.65rem;color:${c.text};opacity:0.8">${c.label}</div></div>`;}).join('')}
    </div></div></div>
    ${bio.alertesBio.length ? bio.alertesBio.map(al=>`<div class="m6-alert ${al.niv}" style="margin-bottom:10px"><span class="m6-alert-icon">⚕️</span><div><strong>${al.titre}</strong><br><span style="font-size:0.77rem">${al.texte}</span></div></div>`).join('') : ''}`;
  },

  // ── EXPORT ───────────────────────────────────────────────────
  _tplExport(a) {
    const valid = M6_Storage.getValidations(this._regime, this._year);
    const log   = M6_Storage.getLog(this._regime, this._year).slice(-8).reverse();
    const as    = M6_Storage.getAutoSaveDate(this._regime, this._year);
    const fs    = M6_Storage.getFileSaveDate(this._regime, this._year);
    const yrs   = M6_Storage.getAllYears(this._regime);
    return `
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Sauvegarde</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body" style="padding:10px 14px">
      <div class="m6-row"><span class="m6-row-label">🟢 Application</span><span class="m6-row-val" style="font-size:0.73rem">${as?new Date(as).toLocaleString('fr-FR'):'—'}</span></div>
      <div class="m6-row"><span class="m6-row-label">💾 Fichier</span><span class="m6-row-val" style="font-size:0.73rem;color:${fs?'var(--succes)':'var(--alerte)'}">${fs?new Date(fs).toLocaleString('fr-FR'):'Jamais exporté ⚠️'}</span></div>
    </div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">PDF certifié</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div class="m6-field"><label>Mois à exporter</label>
        <select id="pdf-mois" style="font-size:14px">${['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i)=>`<option value="${i}" ${i===new Date().getMonth()?'selected':''}>${m}</option>`).join('')}</select></div>
      <div class="m6-field"><label>Votre nom</label><input type="text" id="pdf-nom" value="${this._contract.nomCadre||''}" placeholder="Prénom NOM" style="font-size:16px"></div>
      <div class="m6-field"><label>Nom manager</label><input type="text" id="pdf-mgr" value="${this._contract.nomManager||''}" placeholder="Prénom NOM" style="font-size:16px"></div>
      <div style="display:flex;gap:8px">
        <button class="m6-btn m6-btn-ghost" id="pdf-m" style="flex:1;font-size:0.78rem">📄 PDF Mensuel</button>
        <button class="m6-btn m6-btn-ghost" id="pdf-a" style="flex:1;font-size:0.78rem">📋 PDF Annuel</button>
      </div>
    </div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Validation mensuelle</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div class="m6-field"><label>Mois à valider</label>
        <select id="v-mois" style="font-size:14px">${['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i)=>`<option value="${i}">${m}${valid[i]?' ✓':''}</option>`).join('')}</select></div>
      <div class="m6-field"><label>Votre nom</label><input type="text" id="v-nom" value="${this._contract.nomCadre||''}" style="font-size:16px"></div>
      <button class="m6-btn m6-btn-gold" id="v-btn" style="font-size:0.8rem">🔏 Valider</button>
      ${Object.entries(valid).length?`<div style="margin-top:10px">${Object.entries(valid).sort(([a],[b])=>a-b).map(([m,v])=>`<div class="m6-row"><span class="m6-row-label">${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'][m]}</span><span style="font-size:0.65rem;color:var(--pierre)">${new Date(v.ts).toLocaleString('fr-FR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})} · #${v.hash}</span></div>`).join('')}</div>`:''}
    </div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">JSON — Exercices : ${yrs.join(', ')}</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <button class="m6-btn m6-btn-primary" id="exp-j" style="flex:1;font-size:0.78rem">💾 Exporter JSON</button>
        <button class="m6-btn m6-btn-ghost" id="imp-j" style="flex:1;font-size:0.78rem">📂 Importer</button>
      </div>
      <button class="m6-btn m6-btn-ghost" id="rgpd" style="width:100%;font-size:0.75rem">📋 Export RGPD complet</button>
    </div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Historique des modifications</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card"><div class="m6-card-body">
      ${!log.length ? '<div style="font-size:0.78rem;color:var(--pierre)">Aucune modification.</div>' :
        log.map(l=>`<div class="m6-row" style="padding:5px 0;align-items:flex-start"><div><div style="font-size:0.72rem;font-weight:500">${l.action}</div><div style="font-size:0.65rem;color:var(--pierre)">${l.detail}</div></div><span style="font-size:0.6rem;color:var(--pierre);flex-shrink:0;margin-left:8px">${new Date(l.ts).toLocaleString('fr-FR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}</span></div>`).join('')}
    </div></div>`;
  },

  _bindExport(analysis) {
    const saveMeta = () => {
      const nom = this._c.querySelector('#pdf-nom')?.value.trim();
      const mgr = this._c.querySelector('#pdf-mgr')?.value.trim();
      if (nom||mgr) { this._contract.nomCadre=nom||''; this._contract.nomManager=mgr||''; M6_Storage.setContract(this._regime,this._contract); }
    };
    this._c.querySelector('#pdf-m')?.addEventListener('click', () => { saveMeta(); M6_PDF.exportMensuel({regime:this._regime,year:this._year,mois:parseInt(this._c.querySelector('#pdf-mois')?.value),contract:this._contract,data:this._data,moods:this._moods,analysis,validations:M6_Storage.getValidations(this._regime,this._year)}); });
    this._c.querySelector('#pdf-a')?.addEventListener('click', () => { saveMeta(); M6_PDF.exportAnnuel({regime:this._regime,year:this._year,contract:this._contract,data:this._data,moods:this._moods,analysis}); });
    this._c.querySelector('#v-btn')?.addEventListener('click', () => { const m=parseInt(this._c.querySelector('#v-mois')?.value),nom=this._c.querySelector('#v-nom')?.value.trim(); if(!nom){M6_toast('Saisissez votre nom');return;} M6_Storage.addValidation(this._regime,this._year,m,nom); M6_toast('🔏 Validé'); this.render(); });
    this._c.querySelector('#exp-j')?.addEventListener('click', () => M6_ImportExport.export(this._regime));
    this._c.querySelector('#imp-j')?.addEventListener('click', () => M6_ImportExport.import(this._regime,()=>{this._load();this.render();}));
    this._c.querySelector('#rgpd')?.addEventListener('click', () => M6_ImportExport.exportRGPD());
  },

  _openNewYear() {
    const y = prompt(`Créer un exercice (ex : ${this._year+1})`, this._year+1);
    if (!y||isNaN(y)) return;
    const yr = parseInt(y);
    M6_Storage.createYear(this._regime, yr);
    this._year = yr; M6_Storage.setActiveYear(yr);
    this._load(); this.render(); M6_toast(`✓ Exercice ${yr} créé`);
  },

  _tplSetup() {
    return `<div style="padding:32px 16px;padding-top:calc(40px + env(safe-area-inset-top,0));min-height:100dvh;background:var(--ivoire)">
      <div class="m6-ornement" style="margin-top:0"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Configuration Forfait Jours</div><div class="m6-ornement-line"></div></div>
      <div class="m6-card"><div class="m6-card-body">
        <div class="m6-field"><label>Plafond annuel (jours)</label><input type="number" id="s-p" value="218" min="100" max="235" style="font-size:16px"></div>
        <div class="m6-field"><label>Congés payés contractuels</label><input type="number" id="s-cp" value="25" min="25" max="35" style="font-size:16px"></div>
        <div class="m6-field"><label>CCN applicable (optionnel)</label><input type="text" id="s-ccn" placeholder="ex : Syntec, Banque AFB…" style="font-size:16px"></div>
        <div class="m6-field"><label>Taux journalier brut (€)</label><input type="number" id="s-tj" min="0" step="10" placeholder="ex : 350" style="font-size:16px"></div>
        <div class="m6-field"><label>Votre nom (PDF)</label><input type="text" id="s-nom" placeholder="Prénom NOM" style="font-size:16px"></div>
        <div class="m6-field"><label>Date d'arrivée si en cours d'année</label><input type="date" id="s-arr" style="font-size:16px"></div>
        <div class="m6-field"><label>Taux majoration rachat (%)</label><input type="number" id="s-maj" value="10" min="10" max="100" style="font-size:16px"></div>
        <button class="m6-btn m6-btn-gold" id="s-save">Commencer →</button>
      </div></div>
      <div class="m6-alert info" style="margin-top:12px"><span>ℹ️</span><div>Plafond légal : <strong>218 jours</strong> (L3121-64). Prorata automatique si arrivée en cours d'année.</div></div>
      <a href="../menu.html" style="display:block;text-align:center;margin-top:20px;font-size:0.8rem;color:var(--pierre)">← Menu</a>
    </div>`;
  },

  _bindSetup() {
    this._c.querySelector('#s-save')?.addEventListener('click', () => {
      const c = { plafond:parseInt(this._c.querySelector('#s-p')?.value)||218, joursCPContrat:parseInt(this._c.querySelector('#s-cp')?.value)||25, ccnLabel:this._c.querySelector('#s-ccn')?.value.trim(), tauxJournalier:parseFloat(this._c.querySelector('#s-tj')?.value)||0, nomCadre:this._c.querySelector('#s-nom')?.value.trim(), dateArrivee:this._c.querySelector('#s-arr')?.value||null, tauxMajorationRachat:parseInt(this._c.querySelector('#s-maj')?.value)||10 };
      M6_Storage.setContract(this._regime, c);
      M6_Storage.createYear(this._regime, this._year);
      this._load(); this.render();
    });
  },

  _editContract() { M6_Storage.setContract(this._regime,null); this._contract=null; this._c.innerHTML=this._tplSetup(); this._bindSetup(); }
};

global.VFJ = VFJ;
global.VFJ_editContract = () => VFJ._editContract();

})(window);
