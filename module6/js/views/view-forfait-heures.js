/**
 * VIEW-FORFAIT-HEURES — Orchestrateur complet M6 Forfait Heures
 * 5 onglets : Bilan · Semaines · Santé · Export · Glossaire
 */
'use strict';

(function(global) {

const VFH = {
  _c: null, _regime: 'forfait_heures',
  _year: new Date().getFullYear(),
  _section: 'bilan',
  _contract: null, _data: {},

  init(container) {
    this._c = container;
    this._year = M6_Storage.getActiveYear();
    this._load(); this.render();
  },

  _load() {
    this._contract = M6_Storage.getContract(this._regime);
    this._data     = M6_Storage.getData(this._regime, this._year);
  },

  _save(wk, value) {
    if (value === null) {
      const d = M6_Storage.getData(this._regime, this._year);
      delete d[wk]; M6_Storage.setData(this._regime, this._year, d);
    } else {
      M6_Storage.setDay(this._regime, this._year, wk, value);
    }
    this._load(); this.render(); M6_toast('✓ Enregistré');
  },

  render() {
    if (!this._contract) { this._c.innerHTML = this._tplSetup(); this._bindSetup(); return; }
    const analysis = M6_ForfaitHeures.analyze(this._contract, this._data, this._year);
    const bio      = M6_BioEngine.analyzeForfaitHeures(this._contract, this._data, this._year);
    this._c.innerHTML = `${this._tplHeader(analysis)}${this._tplNav()}<div class="m6-main m6-fade-in" id="vfh-ct" style="padding-top:8px"></div>`;
    const ct = this._c.querySelector('#vfh-ct');
    switch(this._section) {
      case 'bilan':     ct.innerHTML = this._tplBilan(analysis,bio); this._bindBilan(analysis); break;
      case 'semaines':  ct.innerHTML = this._tplSemaines(analysis); this._bindSemaines(); break;
      case 'bio':       ct.innerHTML = this._tplBio(bio); break;
      case 'export':    ct.innerHTML = this._tplExport(analysis); this._bindExport(analysis); break;
      case 'glossaire': M6_GlossaireUI.render(ct); break;
    }
    this._bindNav();
  },

  _tplHeader(a) {
    const pct = a.tauxRemplissage;
    const barColor = pct>=100?'linear-gradient(90deg,#9B2C2C,#E53E3E)':pct>=90?'linear-gradient(90deg,var(--champagne-2),var(--champagne))':'linear-gradient(90deg,#2D6A4F,#4A7C6F)';
    return `<div style="background:var(--charbon);padding:10px 16px;padding-top:calc(10px + env(safe-area-inset-top,0));position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(196,163,90,0.25)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="flex:1">
          <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;color:var(--ivoire)">Forfait Heures ${this._year}</div>
          <div style="font-size:0.65rem;color:var(--champagne);letter-spacing:0.06em;text-transform:uppercase">Seuil ${this._formatH(this._contract.seuilHebdo)} · Contingent ${a.contingent}h</div>
        </div>
        ${this._tplYrPicker()}
        <a href="../menu.html" style="color:var(--pierre);font-size:0.7rem;text-decoration:none;border:1px solid rgba(255,255,255,0.12);padding:4px 8px;border-radius:6px">← Menu</a>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:var(--pierre);margin-bottom:3px">
          <span><strong style="color:var(--ivoire)">${a.totalHS}h</strong> HS cumulées</span>
          <span><strong style="color:${pct>=90?'var(--alerte)':'var(--champagne)'}">${pct}%</strong> du contingent</span>
        </div>
        <div style="height:5px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden">
          <div style="height:100%;border-radius:99px;width:${Math.min(100,pct)}%;background:${barColor}"></div>
        </div>
      </div>
    </div>`;
  },

  _tplYrPicker() {
    const yrs = M6_Storage.getAllYears(this._regime);
    if (yrs.length <= 1) return `<span style="font-size:0.72rem;color:var(--pierre)">${this._year}</span>`;
    return `<select id="vfh-yr" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--ivoire);font-size:0.72rem;border-radius:6px;padding:3px 6px;-webkit-appearance:none">${M6_Storage.getAllYears(this._regime).map(y=>`<option value="${y}" ${y==this._year?'selected':''}>${y}</option>`).join('')}</select>`;
  },

  _tplNav() {
    const tabs = [{id:'bilan',icon:'◈',label:'Bilan'},{id:'semaines',icon:'◻',label:'Semaines'},{id:'bio',icon:'♡',label:'Santé'},{id:'export',icon:'◆',label:'Export'},{id:'glossaire',icon:'≡',label:'Glossaire'}];
    return `<nav class="m6-bottom-nav">${tabs.map(t=>`<button class="m6-nav-item ${this._section===t.id?'active':''}" data-sec="${t.id}"><span class="nav-icon">${t.icon}</span>${t.label}</button>`).join('')}</nav>`;
  },

  _bindNav() {
    this._c.querySelectorAll('[data-sec]').forEach(b=>b.addEventListener('click',()=>{this._section=b.dataset.sec;this.render();}));
    const yp = this._c.querySelector('#vfh-yr');
    if (yp) yp.addEventListener('change',()=>{this._year=parseInt(yp.value);M6_Storage.setActiveYear(this._year);this._load();this.render();});
  },

  // ── BILAN ──────────────────────────────────────────────────
  _tplBilan(a, bio) {
    return `
    <div class="m6-stats-grid" style="margin-bottom:14px">
      <div class="m6-stat-box"><div class="m6-stat-val">${a.totalHS}h</div><div class="m6-stat-label">Total HS</div></div>
      <div class="m6-stat-box"><div class="m6-stat-val">${a.semaines}</div><div class="m6-stat-label">Semaines saisies</div></div>
      <div class="m6-stat-box"><div class="m6-stat-val">${a.totalHSTaux1}h</div><div class="m6-stat-label">HS à +${a.taux1}%</div></div>
      <div class="m6-stat-box" style="border-color:rgba(196,163,90,0.35)">
        <div class="m6-stat-val" style="color:var(--champagne-2)">${a.tauxHoraire>0?a.montantTotal.toFixed(0)+'€':'—'}</div>
        <div class="m6-stat-label">Montant brut HS</div>
      </div>
    </div>

    ${a.tauxHoraire>0?`<div class="m6-card" style="margin-bottom:14px"><div class="m6-card-header"><div class="m6-card-icon">💶</div><div><div class="m6-card-label">Loi TEPA 2007</div><div class="m6-card-title">Exonération fiscale</div></div></div><div class="m6-card-body">
      <div class="m6-row"><span class="m6-row-label">HS à +${a.taux1}%</span><span class="m6-row-val">${a.montantHS1.toFixed(2)} €</span></div>
      <div class="m6-row"><span class="m6-row-label">HS à +${a.taux2}%</span><span class="m6-row-val">${a.montantHS2.toFixed(2)} €</span></div>
      <div class="m6-row"><span style="font-weight:600">Total brut</span><span class="m6-row-val gold" style="font-family:var(--font-display);font-size:1.2rem">${a.montantTotal.toFixed(2)} €</span></div>
      <div class="m6-row"><span class="m6-row-label">Exo IR (plaf. 7 500€/an)</span><span class="m6-row-val ok">${a.exoFiscale.toFixed(2)} €</span></div>
      <div style="font-size:0.7rem;color:var(--pierre);margin-top:6px">Art. L241-17 CSS · Loi TEPA 2007 · Loi 2022-1158</div>
    </div></div>`:''}

    ${bio.hasData?`<div class="m6-card" style="margin-bottom:14px;cursor:pointer" id="fh-bio-card"><div class="m6-card-body" style="padding:12px 14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div class="m6-card-label">Santé — Phase ${bio.phase?.code}</div><span class="m6-badge" style="background:${bio.phase?.color}20;color:${bio.phase?.color};border-radius:99px;font-size:0.65rem;padding:2px 8px">${bio.phase?.label}</span></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">${[['Fatigue',bio.fatigue,true],['Stress',bio.stress,true],['Récup.',bio.recovery,false],['Perf.',bio.performance,false]].map(([l,v,inv])=>{const c=inv?(v>60?'#B85C50':v>35?'#C4853A':'#4A7C6F'):(v<40?'#B85C50':v<65?'#C4853A':'#4A7C6F');return `<div style="background:var(--ivoire);border-radius:8px;padding:8px 4px"><div style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:${c}">${v}</div><div style="font-size:0.6rem;color:var(--pierre);text-transform:uppercase">${l}</div></div>`;}).join('')}</div><div style="font-size:0.68rem;color:var(--pierre);margin-top:6px;text-align:right">→ onglet Santé</div></div></div>`:''}

    ${a.alertes.length?a.alertes.map(al=>`<div class="m6-alert ${al.niveau}" style="margin-bottom:10px"><span class="m6-alert-icon">${al.icon}</span><div><strong>${al.titre}</strong><br><span style="font-size:0.77rem">${al.texte}</span><br><span style="font-size:0.65rem;color:var(--pierre)">Art. ${al.loi}</span></div></div>`).join('') : `<div class="m6-alert success" style="margin-bottom:14px"><span class="m6-alert-icon">✅</span><div><strong>Contingent conforme</strong> — Aucune alerte pour ${this._year}.</div></div>`}

    <button class="m6-btn m6-btn-primary" id="fh-saisir" style="margin-bottom:8px">＋ Saisir une semaine</button>
    <div style="display:flex;gap:8px">
      <button class="m6-btn m6-btn-ghost" id="fh-newyr" style="flex:1;font-size:0.78rem">📅 Nouvel exercice</button>
      <button class="m6-btn m6-btn-ghost" onclick="VFH_editContract()" style="flex:1;font-size:0.78rem">⚙️ Contrat</button>
    </div>`;
  },

  _bindBilan(analysis) {
    this._c.querySelector('#fh-saisir')?.addEventListener('click', () => { this._section='semaines'; this.render(); setTimeout(()=>this._c.querySelector('#fh-add')?.click(),200); });
    this._c.querySelector('#fh-bio-card')?.addEventListener('click', () => { this._section='bio'; this.render(); });
    this._c.querySelector('#fh-newyr')?.addEventListener('click', () => { const y=prompt(`Exercice (ex: ${this._year+1})`,this._year+1); if(!y||isNaN(y))return; const yr=parseInt(y); M6_Storage.createYear(this._regime,yr); this._year=yr; M6_Storage.setActiveYear(yr); this._load(); this.render(); M6_toast(`✓ Exercice ${yr} créé`); });
  },

  // ── SEMAINES ───────────────────────────────────────────────
  _tplSemaines(a) {
    const entries = Object.entries(this._data).filter(([k])=>k.startsWith(String(this._year))).sort(([a],[b])=>b.localeCompare(a));
    const curWk   = M6_ForfaitHeures.isoWeek(new Date());
    return `
    <button class="m6-btn m6-btn-primary" id="fh-add" style="margin-bottom:14px">＋ Saisir une semaine</button>

    ${!entries.length?`<div class="m6-alert info"><span>📋</span><div>Aucune semaine saisie pour ${this._year}.</div></div>`:''}

    ${entries.map(([wk,v])=>{
      const h=parseFloat(v.heures)||0, extra=Math.max(0,h-a.seuil);
      const hs1=Math.min(extra,a.palier), hs2=Math.max(0,extra-a.palier);
      const isCur=wk===curWk;
      const [,wn]=wk.split('-W');
      return `<div class="m6-card" style="margin-bottom:10px${isCur?';border-color:var(--champagne)':''}">
        <div class="m6-card-body" style="padding:12px 14px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--pierre)">S${wn}${isCur?' · <span class="m6-badge m6-badge-champagne">En cours</span>':''}</div>
              <div style="font-family:var(--font-display);font-size:1.3rem;font-weight:600">${this._formatH(h)}</div>
            </div>
            <div style="text-align:right">
              ${extra>0?`<div style="font-size:0.78rem;color:var(--champagne-2);font-weight:500">+${this._formatH(extra)} HS</div><div style="font-size:0.68rem;color:var(--pierre)">${hs1>0?this._formatH(hs1)+' à +'+a.taux1+'%':''}${hs2>0?' · '+this._formatH(hs2)+' à +'+a.taux2+'%':''}</div>`:`<div style="font-size:0.78rem;color:var(--succes)">Conforme</div>`}
            </div>
            <button data-del="${wk}" style="background:none;border:none;color:var(--pierre);font-size:1rem;cursor:pointer;padding:4px 8px;margin-left:4px">✕</button>
          </div>
          ${v.note?`<div style="font-size:0.72rem;color:var(--pierre);margin-top:6px;font-style:italic">${v.note}</div>`:''}
        </div>
      </div>`;
    }).join('')}

    <!-- Overlay saisie -->
    <div class="m6-overlay" id="fh-overlay">
      <div class="m6-sheet" id="fh-sheet"></div>
    </div>`;
  },

  _bindSemaines() {
    const openForm = (prefill) => {
      const ov = this._c.querySelector('#fh-overlay');
      const sh = this._c.querySelector('#fh-sheet');
      if (!ov||!sh) return;
      const wk = prefill || M6_ForfaitHeures.isoWeek(new Date());
      const entry = this._data[wk]||{};
      sh.innerHTML = `
        <div class="m6-sheet-title">Saisir une semaine</div>
        <div class="m6-field"><label>Semaine (format: 2026-W21)</label><input type="week" id="fh-wk" value="${wk}" style="font-size:14px"></div>
        <div class="m6-field"><label>Heures travaillées (ex: 39.5)</label><input type="number" id="fh-h" min="0" max="80" step="0.25" value="${entry.heures||''}" placeholder="${this._contract.seuilHebdo||39}" style="font-size:16px"></div>
        <div class="m6-field"><label>Note (déplacement, astreinte…)</label><input type="text" id="fh-note" value="${entry.note||''}" placeholder="" style="font-size:16px"></div>
        <button class="m6-btn m6-btn-primary" id="fh-sv">Enregistrer</button>
        <div style="height:8px"></div>
        <button class="m6-btn m6-btn-ghost" id="fh-cl" style="width:100%">Annuler</button>`;
      sh.querySelector('#fh-sv').addEventListener('click',()=>{
        const w=sh.querySelector('#fh-wk')?.value, h=parseFloat(sh.querySelector('#fh-h')?.value), n=sh.querySelector('#fh-note')?.value.trim();
        if(!w||isNaN(h)){M6_toast('Remplissez semaine et heures');return;}
        this._save(w,{heures:h,note:n||null});
        ov.classList.remove('open');
      });
      sh.querySelector('#fh-cl').addEventListener('click',()=>ov.classList.remove('open'));
      ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open');});
      requestAnimationFrame(()=>ov.classList.add('open'));
    };
    this._c.querySelector('#fh-add')?.addEventListener('click', () => openForm());
    this._c.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{this._save(b.dataset.del,null);}));
  },

  // ── BIO ─────────────────────────────────────────────────────
  _tplBio(bio) {
    if (!bio.hasData) return `<div class="m6-alert info" style="margin-top:16px"><span>ℹ️</span><div>Saisissez des semaines pour voir l'analyse biologique.</div></div>`;
    const bar = (l,v,inv)=>{const c=inv?(v>60?'#B85C50':v>35?'#C4853A':'#4A7C6F'):(v<40?'#B85C50':v<65?'#C4853A':'#4A7C6F');return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px"><span>${l}</span><span style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:${c}">${v}</span></div><div style="height:8px;background:var(--ivoire-2);border-radius:99px;overflow:hidden"><div style="height:100%;width:${v}%;border-radius:99px;background:${c}"></div></div></div>`;};
    return `
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Santé & Bien-être</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-header"><div class="m6-card-icon">🩺</div><div><div class="m6-card-label">Phase INRS</div><div class="m6-card-title" style="color:${bio.phase?.color}">${bio.phase?.code} — ${bio.phase?.label}</div></div></div><div class="m6-card-body">${bar('Fatigue',bio.fatigue,true)}${bar('Stress',bio.stress,true)}${bar('Récupération',bio.recovery,false)}${bar('Performance (Pencavel)',bio.performance,false)}</div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-header"><div class="m6-card-icon">❤️</div><div><div class="m6-card-label">Long terme</div><div class="m6-card-title">Risques</div></div></div><div class="m6-card-body">${bar('Risque CV (OMS/OIT 2021)',bio.cvRisk,true)}${bar('Charge cognitive',bio.cogRisk,true)}<div style="font-size:0.7rem;color:var(--pierre);margin-top:6px">Pega et al. WHO/ILO 2021 · Kivimäki 2015 · Jang 2025</div></div></div>
    <div class="m6-card"><div class="m6-card-body"><div class="m6-row"><span class="m6-row-label">Semaines saisies</span><span class="m6-row-val">${bio.details.n}</span></div><div class="m6-row"><span class="m6-row-label">Moyenne hebdo</span><span class="m6-row-val">${bio.details.mean}h</span></div><div class="m6-row"><span class="m6-row-label">Semaines surcharge (>120% seuil)</span><span class="m6-row-val">${bio.details.surcharge}</span></div></div></div>`;
  },

  // ── EXPORT ─────────────────────────────────────────────────
  _tplExport(a) {
    const as=M6_Storage.getAutoSaveDate(this._regime,this._year), fs=M6_Storage.getFileSaveDate(this._regime,this._year);
    const log=M6_Storage.getLog(this._regime,this._year).slice(-6).reverse();
    const yrs=M6_Storage.getAllYears(this._regime);
    return `
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Sauvegarde</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body" style="padding:10px 14px"><div class="m6-row"><span class="m6-row-label">🟢 Application</span><span class="m6-row-val" style="font-size:0.73rem">${as?new Date(as).toLocaleString('fr-FR'):'—'}</span></div><div class="m6-row"><span class="m6-row-label">💾 Fichier</span><span class="m6-row-val" style="font-size:0.73rem;color:${fs?'var(--succes)':'var(--alerte)'}">${fs?new Date(fs).toLocaleString('fr-FR'):'Jamais exporté ⚠️'}</span></div></div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Taux & PDF</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div class="m6-field"><label>Taux horaire brut (€)</label><input type="number" id="fh-taux" value="${this._contract.tauxHoraire||''}" step="0.01" placeholder="25.50" style="font-size:16px"></div>
      <div class="m6-field"><label>Taux +1 (%)</label><input type="number" id="fh-t1" value="${this._contract.taux1||25}" min="10" style="font-size:16px"></div>
      <div class="m6-field"><label>Taux +2 (%)</label><input type="number" id="fh-t2" value="${this._contract.taux2||50}" min="25" style="font-size:16px"></div>
      <button class="m6-btn m6-btn-gold" id="fh-sv-taux" style="margin-bottom:10px;font-size:0.8rem">Mettre à jour les taux</button>
      <div style="display:flex;gap:8px">
        <button class="m6-btn m6-btn-ghost" id="fh-pdf-a" style="flex:1;font-size:0.78rem">📋 PDF Annuel</button>
      </div>
    </div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">JSON — Exercices : ${yrs.join(', ')}</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div style="display:flex;gap:8px"><button class="m6-btn m6-btn-primary" id="exp-j" style="flex:1;font-size:0.78rem">💾 Exporter</button><button class="m6-btn m6-btn-ghost" id="imp-j" style="flex:1;font-size:0.78rem">📂 Importer</button></div>
    </div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Historique</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card"><div class="m6-card-body">${!log.length?'<div style="font-size:0.78rem;color:var(--pierre)">Aucune modification.</div>':log.map(l=>`<div class="m6-row" style="padding:5px 0;align-items:flex-start"><div><div style="font-size:0.72rem;font-weight:500">${l.action}</div><div style="font-size:0.65rem;color:var(--pierre)">${l.detail}</div></div><span style="font-size:0.6rem;color:var(--pierre);flex-shrink:0;margin-left:8px">${new Date(l.ts).toLocaleString('fr-FR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}</span></div>`).join('')}</div></div>`;
  },

  _bindExport(analysis) {
    this._c.querySelector('#fh-sv-taux')?.addEventListener('click',()=>{
      this._contract.tauxHoraire=parseFloat(this._c.querySelector('#fh-taux')?.value)||0;
      this._contract.taux1=parseInt(this._c.querySelector('#fh-t1')?.value)||25;
      this._contract.taux2=parseInt(this._c.querySelector('#fh-t2')?.value)||50;
      M6_Storage.setContract(this._regime,this._contract); M6_toast('✓ Taux mis à jour'); this.render();
    });
    this._c.querySelector('#fh-pdf-a')?.addEventListener('click',()=>{
      const a2=M6_ForfaitHeures.analyze(this._contract,this._data,this._year);
      M6_PDF.exportAnnuel({regime:this._regime,year:this._year,contract:this._contract,data:this._data,moods:{},analysis:a2});
    });
    this._c.querySelector('#exp-j')?.addEventListener('click',()=>M6_ImportExport.export(this._regime));
    this._c.querySelector('#imp-j')?.addEventListener('click',()=>M6_ImportExport.import(this._regime,()=>{this._load();this.render();}));
  },

  _tplSetup() {
    return `<div style="padding:32px 16px;padding-top:calc(40px + env(safe-area-inset-top,0));min-height:100dvh;background:var(--ivoire)">
      <div class="m6-ornement" style="margin-top:0"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Configuration Forfait Heures</div><div class="m6-ornement-line"></div></div>
      <div class="m6-card"><div class="m6-card-body">
        <div class="m6-field"><label>Durée hebdomadaire contractuelle (heures)</label><input type="number" id="s-seuil" value="39" min="35" max="48" step="0.5" style="font-size:16px"></div>
        <div class="m6-field"><label>Palier majoration 1 (heures HS)</label><input type="number" id="s-pal" value="8" min="1" max="20" style="font-size:16px"></div>
        <div class="m6-field"><label>Taux majoration 1 (%)</label><input type="number" id="s-t1" value="25" min="10" max="100" style="font-size:16px"></div>
        <div class="m6-field"><label>Taux majoration 2 (%)</label><input type="number" id="s-t2" value="50" min="25" max="200" style="font-size:16px"></div>
        <div class="m6-field"><label>Contingent annuel HS (heures)</label><input type="number" id="s-cont" value="220" min="100" max="500" style="font-size:16px"></div>
        <div class="m6-field"><label>Taux horaire brut (€) — optionnel</label><input type="number" id="s-tauxH" step="0.01" placeholder="25.50" style="font-size:16px"></div>
        <button class="m6-btn m6-btn-gold" id="s-save">Commencer →</button>
      </div></div>
      <div class="m6-alert info" style="margin-top:12px"><span>ℹ️</span><div>Votre CCN peut prévoir des seuils et taux différents. Consultez votre contrat.</div></div>
      <a href="../menu.html" style="display:block;text-align:center;margin-top:20px;font-size:0.8rem;color:var(--pierre)">← Menu</a>
    </div>`;
  },

  _bindSetup() {
    this._c.querySelector('#s-save')?.addEventListener('click',()=>{
      const c={seuilHebdo:parseFloat(this._c.querySelector('#s-seuil')?.value)||39,palier1:parseInt(this._c.querySelector('#s-pal')?.value)||8,taux1:parseInt(this._c.querySelector('#s-t1')?.value)||25,taux2:parseInt(this._c.querySelector('#s-t2')?.value)||50,contingent:parseInt(this._c.querySelector('#s-cont')?.value)||220,tauxHoraire:parseFloat(this._c.querySelector('#s-tauxH')?.value)||0};
      M6_Storage.setContract(this._regime,c); M6_Storage.createYear(this._regime,this._year); this._load(); this.render();
    });
  },

  _formatH(h) {
    if(!h||isNaN(h)) return '0h';
    const e=Math.floor(h), m=Math.round((h-e)*60);
    return m>0?`${e}h${String(m).padStart(2,'0')}`:`${e}h`;
  },
  _editContract() { M6_Storage.setContract(this._regime,null); this._contract=null; this._c.innerHTML=this._tplSetup(); this._bindSetup(); }
};

global.VFH = VFH;
global.VFH_editContract = () => VFH._editContract();

})(window);
