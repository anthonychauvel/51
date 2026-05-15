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
    if (bio?.hasData && window.M6_PhaseAlert) M6_PhaseAlert.showIfNeeded(this._regime, this._year, bio.phase?.code, bio.fatigue);

    const yrs2 = M6_Storage.getAllYears(this._regime);
    const yrPickerHtml2 = yrs2.length > 1
      ? `<select id="vfh-yr-hdr" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:var(--champagne);font-size:0.7rem;border-radius:6px;padding:2px 6px;-webkit-appearance:none">${yrs2.map(y=>`<option value="${y}" ${y==this._year?'selected':''}>${y}</option>`).join('')}</select>`
      : `<span style="font-size:0.7rem;color:var(--champagne)">${this._year}</span>`;
    window.M6_Header?.set({
      title: `Forfait Heures ${this._year}`,
      sub: `Seuil ${this._formatH(this._contract.seuilHebdo)} · Contingent ${this._contract.contingent||220}h · ${analysis.totalHS}h HS`,
      showReset: true,
      showSwitch: true,
      onReset: () => {
        if (!confirm('Reconfigurer le contrat ?')) return;
        M6_Storage.setContract(this._regime, null);
        this._contract = null;
        this._c.innerHTML = this._tplSetup();
        this._bindSetup();
      },
      yearPicker: yrPickerHtml2,
    });
    this._c.innerHTML = `${this._tplNav()}<div class="m6-main m6-fade-in" id="vfh-ct" style="padding-top:8px"></div>`;
    const ct = this._c.querySelector('#vfh-ct');

    const zenjiMsg = window.M6_Zenji
      ? M6_Zenji.getContextMessage(this._section,
          this._section==='bilan'||this._section==='bio' ? {joursEffectifs:analysis.semaines,plafond:this._contract.contingent,rttPris:0,rttSolde:0,rachetes:0,alertes:analysis.alertes} : {},
          bio, this._contract)
      : '';
    const zenjiHtml = (zenjiMsg && this._section !== 'semaines')
      ? M6_Zenji.renderCard(zenjiMsg, bio?.phase?.code || 'P1', true)
      : '';

    try {
      switch(this._section) {
        case 'bilan':     ct.innerHTML = zenjiHtml + this._tplBilan(analysis,bio); this._bindBilan(analysis); this._bindFHTooltips(); break;
        case 'semaines':  ct.innerHTML = this._tplSemaines(analysis); this._bindSemaines(); break;
        case 'bio':       ct.innerHTML = zenjiHtml + this._tplBio(bio); break;
        case 'export':    ct.innerHTML = zenjiHtml + this._tplExport(analysis); this._bindExport(analysis); break;
        case 'validite':
          ct.innerHTML = zenjiHtml + '<div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">⚖ Validité juridique</div><div class="m6-ornement-line"></div></div><div id="vfh-validite-ct"></div>';
          if (window.M6_ValiditeFH) {
            window.M6_ValiditeFH.render(ct.querySelector('#vfh-validite-ct'), this._contract, analysis);
          } else {
            ct.innerHTML += '<div class="m6-alert info" style="margin:16px"><span>ℹ️</span><div>Module Validité non chargé.</div></div>';
          }
          break;
        case 'entretien':
          ct.innerHTML = zenjiHtml;
          if (window.M6_Entretien) M6_Entretien.renderForm(ct, this._regime, this._year, this._contract, {}, ()=>{this._load();this.render();});
          else ct.innerHTML += '<div class="m6-alert info" style="margin:16px"><span>ℹ️</span><div>Module entretien non chargé.</div></div>';
          break;
        case 'tendances':
          ct.innerHTML = '<div style="padding:4px 0"></div>';
          try {
            if(window.M6_Charts) {
              const fhData = {};
              Object.entries(this._data).forEach(([wk,v]) => {
                const [y,wn] = wk.split('-W');
                const d = new Date(parseInt(y), 0, 1 + (parseInt(wn)-1)*7);
                d.setDate(d.getDate() + (1-(d.getDay()||7)));
                for(let i=0;i<5;i++) { const di=new Date(d); di.setDate(d.getDate()+i); fhData[di.toISOString().slice(0,10)]={type:'travail'}; }
              });
              M6_Charts.renderPage(ct, {plafond:220, joursCPContrat:25, seuilHebdo:this._contract.seuilHebdo||39}, fhData, this._year);
            } else {
              ct.innerHTML += '<div class="m6-alert info"><span>⚠️</span><div>Module graphiques non chargé.</div></div>';
            }
          } catch(e) { ct.innerHTML += `<div class="m6-alert warning" style="margin:16px"><span>⚠️</span><div>Erreur graphiques : ${e.message}</div></div>`; console.error('[VFH Tendances]', e); }
          break;
        case 'glossaire':
          ct.innerHTML = zenjiHtml;
          if (window.M6_GlossaireUI) M6_GlossaireUI.render(ct);
          else ct.innerHTML += '<div class="m6-alert info" style="margin:16px"><span>ℹ️</span><div>Module glossaire non chargé.</div></div>';
          break;
      }
    } catch(e) {
      ct.innerHTML = `<div class="m6-alert warning" style="margin:16px"><span>⚠️</span><div><strong>Erreur section ${this._section}</strong><br>${e.message}</div></div>`;
      console.error('[VFH render]', e);
    } finally {
      this._bindNav();
    }
    // Coach contextuel
    if (window.M6_Coach) {
      window.M6_Coach.ensureButton('forfait_heures');
      window.M6_Coach.maybeAutoShow('forfait_heures', this._section);
    }
    // Détruire l'ancienne bulle avant réinitialisation
    if (window.M6_ZenjiPopup) M6_ZenjiPopup.destroy();
    // Popup Zenji flottant
    if (window.M6_ZenjiPopup) {
      M6_ZenjiPopup.init(
        { joursEffectifs:analysis.semaines, plafond:analysis.contingent,
          rttPris:0, rttSolde:0, rachetes:0, cpPris:0,
          tauxRemplissage:analysis.tauxRemplissage, alertes:analysis.alertes,
          rttTheoriques:0, joursRestants:analysis.contingent - analysis.totalHS },
        bio, this._contract,
        (action) => {
          if(action.includes('Santé')||action.includes('santé')) { this._section='bio'; this.render(); }
          else if(action.includes('Export')||action.includes('PDF')) { this._section='export'; this.render(); }
          else if(action.includes('Glossaire')||action.includes('glossaire')) { this._section='glossaire'; this.render(); }
        },
        'forfait_heures'
      );
    }
    if(window.M6_AlertePhase && bio?.hasData) M6_AlertePhase.check(bio, this._regime||'forfait_heures');
    // Notification automatique si phase Épuisement (P4)
    if (bio?.hasData && bio?.phase?.code === 'P4' && window.Notification && Notification.permission === 'granted') {
      const lastP4 = localStorage.getItem('M6_FH_LAST_P4_NOTIF');
      const today = new Date().toISOString().slice(0,10);
      if (lastP4 !== today) {
        new Notification('⚠️ Zenji — Phase Épuisement', { body: 'Vos indicateurs atteignent le seuil critique INRS P4. Consultez votre médecin du travail (Art. R4624-10).', icon: 'images/Cadre.png' });
        localStorage.setItem('M6_FH_LAST_P4_NOTIF', today);
      }
    }
  },

  _bindFHTooltips() {
    const tipWrap = this._c.querySelector('#fh-cont-tip');
    if (tipWrap) {
      tipWrap.addEventListener('click', e => { e.stopPropagation(); tipWrap.classList.toggle('open'); });
      document.addEventListener('click', () => tipWrap.classList.remove('open'), { once: false });
    }
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
    const tabs = [{id:'bilan',icon:'◈',label:'Bilan'},{id:'semaines',icon:'◻',label:'Semaines'},{id:'bio',icon:'♡',label:'Santé'},{id:'tendances',icon:'◗',label:'Tendances'},{id:'validite',icon:'⚖',label:'Validité'},{id:'entretien',icon:'◉',label:'Entretien'},{id:'export',icon:'◆',label:'Export'},{id:'glossaire',icon:'≡',label:'Glossaire'}];
    return `<nav class="m6-bottom-nav">${tabs.map(t=>`<button class="m6-nav-item ${this._section===t.id?'active':''}" data-sec="${t.id}"><span class="nav-icon">${t.icon}</span>${t.label}</button>`).join('')}</nav>`;
  },

  _bindNav() {
    this._c.querySelectorAll('[data-sec]').forEach(b=>b.addEventListener('click',()=>{this._section=b.dataset.sec;this.render();}));
    // Bouton reconfigurer contrat (accessible depuis n'importe quelle section)
    this._c.querySelector('#fh-nav-edit-contract')?.addEventListener('click', () => {
      if (!confirm('Reconfigurer le contrat ? Les données sont conservées.')) return;
      this._editContract();
    });
    const yp = this._c.querySelector('#vfh-yr');
    if (yp) yp.addEventListener('change',()=>{this._year=parseInt(yp.value);M6_Storage.setActiveYear(this._year);this._load();this.render();});
    const ypHdr2 = document.querySelector('#vfh-yr-hdr');
    if (ypHdr2) ypHdr2.addEventListener('change',()=>{this._year=parseInt(ypHdr2.value);M6_Storage.setActiveYear(this._year);this._load();this.render();});
  },

  // ── BILAN ──────────────────────────────────────────────────
  _tplBilan(a, bio) {
    // Bannière prorata mid-year
    // Prorata auto : basé sur la 1ère saisie ou dateArrivee explicite
    const _prrDateRef = this._contract.dateArrivee || a.firstEntry || null;
    const _prrActive  = a.contingentProrata || (this._contract.dateArrivee && a.isProrata !== false);
    const midYearBanner = (_prrActive && _prrDateRef) ? (() => {
      const dt = new Date(_prrDateRef + 'T12:00:00');
      const p  = a.contingentBase ? Math.round(a.contingent / a.contingentBase * 100) : 100;
      return `<div class="m6-alert info" style="margin-bottom:14px;font-size:0.78rem">
        <span>📐</span><div>
          <strong>Prorata automatique</strong> — Démarrage détecté le
          <strong>${dt.toLocaleDateString('fr-FR')}</strong> (1ère semaine saisie)<br>
          Contingent HS ajusté : <strong>${a.contingent}h</strong>${a.contingentBase ? ` sur ${a.contingentBase}h (${p}%)` : ''}
          — Compteurs calculés depuis cette date.
        </div>
      </div>`;
    })() : '';
    return `${midYearBanner}
    <!-- QUICK ACTIONS -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
      <button class="m6-quick-action" data-quick="semaines" style="background:#1A1714;color:#F7F3ED;border:none;border-radius:10px;padding:14px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center">
        <span style="font-size:1.4rem">📅</span>
        <span style="font-size:0.7rem;font-weight:500;line-height:1.2">Saisir<br>la semaine</span>
      </button>
      <button class="m6-quick-action" data-quick="bio" style="background:#C4A35A;color:#1A1714;border:none;border-radius:10px;padding:14px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center">
        <span style="font-size:1.4rem">♡</span>
        <span style="font-size:0.7rem;font-weight:600;line-height:1.2">Voir mes<br>indicateurs</span>
      </button>
      <button class="m6-quick-action" data-quick="export" style="background:#F7F3ED;color:#1A1714;border:1px solid #E2DAD0;border-radius:10px;padding:14px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center">
        <span style="font-size:1.4rem">◆</span>
        <span style="font-size:0.7rem;font-weight:500;line-height:1.2">Exporter<br>PDF</span>
      </button>
    </div>

    <div class="m6-stats-grid" style="margin-bottom:14px">
      <div class="m6-stat-box"><div class="m6-stat-val">${a.totalHS}h</div><div class="m6-stat-label">Total HS</div></div>
      <div class="m6-stat-box"><div class="m6-stat-val">${a.semaines}</div><div class="m6-stat-label">Semaines saisies</div></div>
      <div class="m6-stat-box"><div class="m6-stat-val">${a.totalHSTaux1}h</div><div class="m6-stat-label">HS à +${a.taux1}%</div></div>
      <div class="m6-stat-box" style="border-color:rgba(196,163,90,0.35)">
        <div class="m6-stat-val" style="color:var(--champagne-2)">${a.tauxHoraire>0?a.montantTotal.toFixed(0)+'€':'—'}</div>
        <div class="m6-stat-label">Montant brut HS</div>
      </div>
    </div>

    <!-- Barre de progression forfait heures -->
    <div class="m6-progress-bar-wrap">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
        <span style="font-size:0.72rem;font-weight:600;color:var(--charbon)">Consommation du contingent <span class="m6-tooltip-wrap" id="fh-cont-tip" style="cursor:pointer;font-size:0.65rem;color:var(--pierre)">ⓘ<span class="m6-tooltip-bubble">Contingent annuel de ${a.contingent||220}h fixé par votre CCN ou accord d'entreprise. Au-delà, une autorisation de l'inspection du travail peut être requise (Art. L3121-30).</span></span></span>
        <span style="font-size:0.72rem;color:${a.tauxRemplissage>=90?'var(--alerte)':'var(--pierre)'}"><strong>${a.totalHS}h</strong> / ${a.contingent||220}h</span>
      </div>
      <div class="m6-progress-track">
        <div class="m6-progress-fill" style="width:${Math.min(100,a.tauxRemplissage)}%;background:${a.tauxRemplissage>=100?'linear-gradient(90deg,#9B2C2C,#E53E3E)':a.tauxRemplissage>=90?'linear-gradient(90deg,var(--champagne-2),var(--champagne))':'linear-gradient(90deg,#2D6A4F,#4A7C6F)'}"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:var(--pierre);margin-top:3px">
        <span>${a.tauxRemplissage}% utilisé</span>
        <span style="color:${(a.contingent||220)-a.totalHS <= 20?'var(--alerte)':'inherit'}">Reste : <strong>${Math.max(0,(a.contingent||220)-a.totalHS)}h</strong></span>
      </div>
    </div>

    ${a.tauxHoraire>0||this._contract.tauxHoraire>0?`<div class="m6-card" style="margin-bottom:14px"><div class="m6-card-header"><div class="m6-card-icon">💶</div><div><div class="m6-card-label">Loi TEPA 2007 ${a.ccnNom?'· '+a.ccnNom:''}</div><div class="m6-card-title">Réduction de cotisations salariales et exonération fiscale</div></div></div><div class="m6-card-body">
      <div class="m6-row"><span class="m6-row-label">HS à +${a.taux1||25}% (${a.palier||8}h/sem)</span><span class="m6-row-val">${(a.montantHS1||0).toFixed(2)} €</span></div>
      ${a.a3Paliers&&a.taux_inter?`<div class="m6-row"><span class="m6-row-label">HS à +${a.taux_inter}% (${a.palier_inter}h/sem)</span><span class="m6-row-val">${(a.montantHS_inter||0).toFixed(2)} €</span></div>`:''}
      <div class="m6-row"><span class="m6-row-label">HS à +${a.taux2||50}%</span><span class="m6-row-val">${(a.montantHS2||0).toFixed(2)} €</span></div>
      <div class="m6-row"><span style="font-weight:600">Total brut</span><span class="m6-row-val gold" style="font-family:var(--font-display);font-size:1.2rem">${(a.montantTotal||0).toFixed(2)} €</span></div>
      <div class="m6-row"><span class="m6-row-label">Exo IR (plaf. 7 500€/an)</span><span class="m6-row-val ok">${(a.exoFiscale||0).toFixed(2)} €</span></div>
      <div style="font-size:0.7rem;color:var(--pierre);margin-top:6px">Art. L241-17 CSS · Loi TEPA 2007 · Loi 2022-1158</div>
    </div></div>`:''}

    ${bio.hasData?`<div class="m6-card" style="margin-bottom:14px;cursor:pointer" id="fh-bio-card"><div class="m6-card-body" style="padding:12px 14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div class="m6-card-label">Santé — Phase ${bio.phase?.code}</div><span class="m6-badge" style="background:${bio.phase?.color}20;color:${bio.phase?.color};border-radius:99px;font-size:0.65rem;padding:2px 8px">${bio.phase?.label}</span></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">${[['Fatigue',bio.fatigue,true],['Stress',bio.stress,true],['Récup.',bio.recovery,false],['Perf.',bio.performance,false]].map(([l,v,inv])=>{const c=inv?(v>60?'#B85C50':v>35?'#C4853A':'#4A7C6F'):(v<40?'#B85C50':v<65?'#C4853A':'#4A7C6F');return `<div style="background:var(--ivoire);border-radius:8px;padding:8px 4px"><div style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:${c}">${v}</div><div style="font-size:0.6rem;color:var(--pierre);text-transform:uppercase">${l}</div></div>`;}).join('')}</div><div style="font-size:0.68rem;color:var(--pierre);margin-top:6px;text-align:right">→ onglet Santé</div></div></div>`:''}

    ${a.alertes.length?a.alertes.map(al=>`<div class="m6-alert ${al.niveau}" style="margin-bottom:10px"><span class="m6-alert-icon">${al.icon}</span><div><strong>${al.titre}</strong><br><span style="font-size:0.77rem">${al.texte}</span><br><span style="font-size:0.65rem;color:var(--pierre)">Art. ${al.loi}</span></div></div>`).join('') : `<div class="m6-alert success" style="margin-bottom:14px"><span class="m6-alert-icon">✅</span><div><strong>Contingent conforme</strong> — Aucune alerte pour ${this._year}.</div></div>`}

    <button class="m6-btn m6-btn-primary" id="fh-saisir" style="margin-bottom:8px">＋ Saisir une semaine</button>
    <div style="display:flex;gap:8px">
      <button class="m6-btn m6-btn-ghost" id="fh-newyr" style="flex:1;font-size:0.78rem">📅 Nouvel exercice</button>
      <button class="m6-btn m6-btn-ghost" id="fh-edit-contract" style="flex:1;font-size:0.78rem">⚙️ Contrat</button>
    </div>`;
  },

  _bindBilan(analysis) {
    // Quick Actions
    this._c.querySelectorAll('[data-quick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.quick;
        if (action === 'semaines') {
          this._section = 'semaines'; this.render();
          setTimeout(() => this._c.querySelector('#fh-add')?.click(), 250);
        } else if (action === 'bio') {
          this._section = 'bio'; this.render();
        } else if (action === 'export') {
          this._section = 'export'; this.render();
        }
      });
    });
    this._c.querySelector('#fh-saisir')?.addEventListener('click', () => { this._section='semaines'; this.render(); setTimeout(()=>this._c.querySelector('#fh-add')?.click(),200); });
    this._c.querySelector('#fh-bio-card')?.addEventListener('click', () => { this._section='bio'; this.render(); });
    this._c.querySelector('#fh-edit-contract')?.addEventListener('click', () => { if(!confirm('Reconfigurer le contrat ? Les données sont conservées.')) return; this._editContract(); });
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
      // Mode saisie : 'global' (heures totales) ou 'jours' (par jour)
      let saisieMode = 'global';
      const jours = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
      const seuil = this._contract.seuilHebdo || 39;
      const hParJour = (seuil / 5).toFixed(2);

      const renderSheet = () => {
        const isDuplicate = !!this._data[wk] && !prefill;
        sh.innerHTML = `
          <div class="m6-sheet-title">Saisir une semaine</div>

          ${isDuplicate ? '<div class="m6-alert warning" style="margin-bottom:10px;font-size:0.78rem"><span>⚠️</span><div>Cette semaine est déjà saisie. Les données seront remplacées.</div></div>' : ''}

          <!-- Sélecteur de semaine RÉTROACTIF — any week allowed -->
          <div class="m6-field">
            <label>Choisir n'importe quelle semaine (passée ou future)</label>
            <input type="date" id="fh-date-nav" style="font-size:16px"
              value="${(()=>{try{const yr=parseInt(wk);const wn=parseInt(wk.split('W')[1]);const d=new Date(yr,0,1+(wn-1)*7-(new Date(yr,0,1).getDay()||7)+1);return d.toISOString().slice(0,10);}catch(e){return new Date().toISOString().slice(0,10);}})()}">
            <div style="font-size:0.7rem;color:var(--pierre);margin-top:3px">
              Semaine sélectionnée : <strong id="fh-wk-display">${wk}</strong>
              <span style="font-size:0.65rem;color:var(--champagne-2);margin-left:4px">✅ saisie rétroactive autorisée</span>
            </div>
          </div>

          <!-- Mode de saisie -->
          <div class="m6-tabs" style="margin-bottom:12px">
            <button class="m6-tab ${saisieMode==='global'?'active':''}" id="fh-mode-global">Total semaine</button>
            <button class="m6-tab ${saisieMode==='jours'?'active':''}" id="fh-mode-jours">Par jour</button>
          </div>

          <!-- Mode global -->
          <div id="fh-zone-global" style="${saisieMode==='jours'?'display:none':''}">
            <div class="m6-field">
              <label>Heures travaillées cette semaine (ex: 41.5)</label>
              <input type="number" id="fh-h" min="0" max="80" step="0.25"
                value="${entry.heures||''}" placeholder="${seuil}" style="font-size:16px">
              <div style="font-size:0.7rem;color:var(--pierre);margin-top:3px">
                Seuil contractuel : ${seuil}h · Au-delà = heures supplémentaires
              </div>
              <div id="fh-realtime-calcul" style="margin-top:8px;padding:8px 10px;background:var(--ivoire-2);border-radius:var(--radius);font-size:0.78rem;display:none">
                <span id="fh-rt-hs">0h</span> HS cette semaine · Contingent restant : <span id="fh-rt-reste">—</span>
              </div>
            </div>
          </div>

          <!-- Mode jours -->
          <div id="fh-zone-jours" style="${saisieMode==='global'?'display:none':''}">
            <div style="font-size:0.72rem;color:var(--pierre);margin-bottom:8px">
              Saisissez les heures par jour — le total est calculé automatiquement.
            </div>
            ${jours.map((j,i) => {
              const stored = entry.jours ? (entry.jours[i] ?? hParJour) : hParJour;
              return `<div class="m6-field" style="margin-bottom:8px">
                <label style="display:flex;justify-content:space-between">
                  <span>${j}</span>
                  <span id="fh-j${i}-val" style="color:var(--champagne-2)">${stored}h</span>
                </label>
                <input type="range" id="fh-j${i}" min="0" max="14" step="0.5" value="${stored}"
                  oninput="document.getElementById('fh-j${i}-val').textContent=this.value+'h';
                           const t=[0,1,2,3,4].reduce((s,x)=>s+(parseFloat(document.getElementById('fh-j'+x)?.value)||0),0);
                           document.getElementById('fh-total-jours').textContent=t.toFixed(1)+'h';">
              </div>`;
            }).join('')}
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600;margin-top:4px;padding:8px;background:var(--ivoire-2);border-radius:var(--radius)">
              <span>Total semaine</span>
              <span id="fh-total-jours" style="color:var(--champagne-2)">
                ${entry.jours ? entry.jours.reduce((s,v)=>s+(v||0),0).toFixed(1) : (seuil).toFixed(1)}h
              </span>
            </div>
          </div>

          <div class="m6-field" style="margin-top:12px">
            <label>Note (déplacement, astreinte, télétravail…)</label>
            <input type="text" id="fh-note" value="${(entry.note||'').substring(0,200)}"
              placeholder="ex : 2j déplacement Lyon" style="font-size:16px" maxlength="200">
          </div>

          <!-- Attestation repos -->
          

          <button class="m6-btn m6-btn-primary" id="fh-sv">Enregistrer</button>
          <div style="height:8px"></div>
          <button class="m6-btn m6-btn-ghost" id="fh-cl" style="width:100%">Annuler</button>`;

        // Bind navigation par date → week
        sh.querySelector('#fh-date-nav')?.addEventListener('change', e => {
          const d = new Date(e.target.value + 'T12:00:00');
          const newWk = M6_ForfaitHeures.isoWeek(d);
          wk = newWk;
          sh.querySelector('#fh-wk-display').textContent = newWk;
        });

        // Bind mode toggle
        sh.querySelector('#fh-mode-global')?.addEventListener('click', () => {
          saisieMode = 'global';
          sh.querySelector('#fh-zone-global').style.display = '';
          sh.querySelector('#fh-zone-jours').style.display = 'none';
          sh.querySelector('#fh-mode-global').classList.add('active');
          sh.querySelector('#fh-mode-jours').classList.remove('active');
        });
        sh.querySelector('#fh-mode-jours')?.addEventListener('click', () => {
          saisieMode = 'jours';
          sh.querySelector('#fh-zone-global').style.display = 'none';
          sh.querySelector('#fh-zone-jours').style.display = '';
          sh.querySelector('#fh-mode-global').classList.remove('active');
          sh.querySelector('#fh-mode-jours').classList.add('active');
        });

        sh.querySelector('#fh-sv')?.addEventListener('click', () => {
          if (!sh.querySelector('#fh-repos')?.checked) {
            M6_toast('Attestez le respect des temps de repos'); return;
          }
          let heures, joursArr = null;
          if (saisieMode === 'jours') {
            joursArr = [0,1,2,3,4].map(i => parseFloat(sh.querySelector('#fh-j'+i)?.value) || 0);
            heures = Math.round(joursArr.reduce((s,v)=>s+v,0) * 100) / 100;
          } else {
            heures = parseFloat(sh.querySelector('#fh-h')?.value);
            if (isNaN(heures)) { M6_toast('Saisissez les heures'); return; }
          }
          const note = sh.querySelector('#fh-note')?.value.trim().replace(/['"]/g, '') || null;
          const payload = { heures, note };
          if (joursArr) payload.jours = joursArr;
          this._save(wk, payload);
          ov.classList.remove('open');
        });
      };

      renderSheet();
      // Calcul temps réel — affiche les HS et le reste du contingent
      const bindRealtime = () => {
        const hInput = sh.querySelector('#fh-h');
        const rtPanel = sh.querySelector('#fh-realtime-calcul');
        const rtHS = sh.querySelector('#fh-rt-hs');
        const rtReste = sh.querySelector('#fh-rt-reste');
        const seuilC = this._contract?.seuilHebdo || 39;
        const contingent = this._contract?.contingent || 220;
        const totalHSActuel = Object.values(this._data).reduce((acc, v) => acc + Math.max(0, (v.heures||0) - seuilC), 0);
        const updateRT = () => {
          const h = parseFloat(hInput?.value) || 0;
          const hs = Math.max(0, h - seuilC);
          if (rtPanel && h > 0) { rtPanel.style.display = ''; }
          if (rtHS) rtHS.textContent = hs > 0 ? `+${hs.toFixed(1)}h HS` : '0h HS';
          const reste = Math.max(0, contingent - totalHSActuel - hs);
          if (rtReste) { rtReste.textContent = `${reste.toFixed(0)}h`; rtReste.style.color = reste < 20 ? 'var(--alerte)' : 'var(--succes)'; }
        };
        hInput?.addEventListener('input', updateRT);
      };
      bindRealtime();
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
    <div class="m6-alert info" style="margin-bottom:12px;font-size:0.72rem"><span>⚠️</span><div>Le score de Risque CV est un <strong>indicateur épidémiologique</strong>, pas un diagnostic médical. Il ne remplace pas un avis médical. En cas de doute, consultez votre médecin du travail.</div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-header"><div class="m6-card-icon">🩺</div><div><div class="m6-card-label">Phase INRS</div><div class="m6-card-title" style="color:${bio.phase?.color}">${bio.phase?.code} — ${bio.phase?.label}</div></div></div><div class="m6-card-body">${bar('Fatigue',bio.fatigue,true)}${bar('Stress',bio.stress,true)}${bar('Récupération',bio.recovery,false)}${bar('Performance (Pencavel)',bio.performance,false)}</div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-header"><div class="m6-card-icon">❤️</div><div><div class="m6-card-label">Long terme</div><div class="m6-card-title">Risques</div></div></div><div class="m6-card-body">${bar('Risque CV (OMS/OIT 2021)',bio.cvRisk,true)}${bar('Charge cognitive',bio.cogRisk,true)}<div style="font-size:0.7rem;color:var(--pierre);margin-top:6px">Pega et al. WHO/ILO 2021 · Kivimäki 2015 · Jang 2025<br>⚠️ Ces indicateurs ne remplacent pas un avis médical.</div></div></div>
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
      <div class="m6-field"><label>Mois à exporter</label>
        <select id="fh-pdf-mois" style="font-size:14px">${['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i)=>`<option value="${i}" ${i===new Date().getMonth()?'selected':''}>${m}</option>`).join('')}</select>
      </div>
      <div class="m6-field"><label>Email manager (copie PDF)</label><input type="email" id="fh-mgr-email" value="${this._contract.emailManager||''}" placeholder="manager@entreprise.fr" style="font-size:16px"></div>
      
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
        <button class="m6-btn m6-btn-ghost" id="fh-pdf-m" style="flex:1;min-width:120px;font-size:0.78rem">📄 PDF Mensuel</button>
        <button class="m6-btn m6-btn-ghost" id="fh-pdf-a" style="flex:1;min-width:120px;font-size:0.78rem">📋 PDF Annuel</button>
        <button class="m6-btn m6-btn-ghost" id="fh-pdf-preuve" style="flex:1;min-width:120px;font-size:0.78rem">🔏 Preuve</button>
      </div>
      <div class="m6-field"><label>PDF Periode — date debut</label><input type="date" id="fh-per-d1" value="${this._year}-01-01" style="font-size:16px"></div>
      <div class="m6-field"><label>PDF Periode — date fin</label><input type="date" id="fh-per-d2" value="${new Date().toISOString().slice(0,10)}" style="font-size:16px"></div>
      <button class="m6-btn m6-btn-ghost" id="fh-pdf-per" style="width:100%;font-size:0.78rem">📅 PDF Période</button>
    </div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Rupture conventionnelle</div><div class="m6-ornement-line"></div></div>
    <div id="rupture-container-fh"></div>
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">JSON — Exercices : ${yrs.join(', ')}</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div style="display:flex;gap:8px"><button class="m6-btn m6-btn-primary" id="exp-j" style="flex:1;font-size:0.78rem">💾 Exporter</button><button class="m6-btn m6-btn-primary" id="exp-csv-fh" style="flex:1;font-size:0.78rem">📊 CSV SIRH</button>
        <button class="m6-btn m6-btn-ghost" id="imp-j" style="flex:1;font-size:0.78rem">📂 Importer</button></div>
    </div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Historique</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card"><div class="m6-card-body">${!log.length?'<div style="font-size:0.78rem;color:var(--pierre)">Aucune modification.</div>':log.map(l=>`<div class="m6-row" style="padding:5px 0;align-items:flex-start"><div><div style="font-size:0.72rem;font-weight:500">${l.action}</div><div style="font-size:0.65rem;color:var(--pierre)">${l.detail}</div></div><span style="font-size:0.6rem;color:var(--pierre);flex-shrink:0;margin-left:8px">${new Date(l.ts).toLocaleString('fr-FR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}</span></div>`).join('')}</div></div>`;
  },

  _bindExport(analysis) {
    const checkCertifFH = () => {

      return true;
    };
    const saveEmailFH = () => {
      const em = this._c.querySelector('#fh-mgr-email')?.value.trim();
      if (em) { this._contract.emailManager = em; M6_Storage.setContract(this._regime, this._contract); }
    };
    const emailCopyFH = (type) => {
      const email = this._contract.emailManager;
      if (!email) return;
      const nom = this._contract.nomCadre||'Cadre';
      const sub = encodeURIComponent(`[M6] Rapport Forfait Heures ${type} — ${nom} — ${this._year}`);
      const bod = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint le rapport de suivi d'heures supplémentaires ${type} de ${nom}.\n\nCordialement,\n${nom}`);
      setTimeout(() => { const a=document.createElement('a'); a.href=`mailto:${email}?subject=${sub}&body=${bod}`; a.click(); }, 1500);
      M6_toast(`📧 Email préparé pour ${email}`);
    };

    this._c.querySelector('#fh-sv-taux')?.addEventListener('click',()=>{
      this._contract.tauxHoraire=parseFloat(this._c.querySelector('#fh-taux')?.value)||0;
      this._contract.taux1=parseInt(this._c.querySelector('#fh-t1')?.value)||25;
      this._contract.taux2=parseInt(this._c.querySelector('#fh-t2')?.value)||50;
      M6_Storage.setContract(this._regime,this._contract); M6_toast('✓ Taux mis à jour'); this.render();
    });
    this._c.querySelector('#fh-pdf-m')?.addEventListener('click',()=>{
      if (!checkCertifFH()) return; saveEmailFH();
      const mois = parseInt(this._c.querySelector('#fh-pdf-mois')?.value)||0;
      const a2 = M6_ForfaitHeures.analyze(this._contract, this._data, this._year);
      M6_PDF.exportMensuelFH({regime:this._regime,year:this._year,mois,contract:this._contract,data:this._data,analysis:a2});
      emailCopyFH('mensuel');
    });
    this._c.querySelector('#fh-pdf-a')?.addEventListener('click',()=>{
      if (!checkCertifFH()) return; saveEmailFH();
      const a2=M6_ForfaitHeures.analyze(this._contract,this._data,this._year);
      M6_PDF.exportAnnuel({regime:this._regime,year:this._year,contract:this._contract,data:this._data,moods:{},analysis:a2});
      emailCopyFH('annuel');
    });
    this._c.querySelector('#fh-pdf-preuve')?.addEventListener('click',()=>{
      const a2=M6_ForfaitHeures.analyze(this._contract,this._data,this._year);
      M6_PDF.exportPreuve({regime:this._regime,year:this._year,contract:this._contract,data:this._data,analysis:a2});
    });
    this._c.querySelector('#fh-pdf-per')?.addEventListener('click',()=>{
      if (!checkCertifFH()) return; saveEmailFH();
      const d1 = this._c.querySelector('#fh-per-d1')?.value;
      const d2 = this._c.querySelector('#fh-per-d2')?.value;
      if(!d1||!d2||d1>d2){M6_toast('Vérifiez les dates');return;}
      const a2=M6_ForfaitHeures.analyze(this._contract,this._data,this._year);
      M6_PDF.exportPeriode({regime:this._regime,year:this._year,dateDebut:d1,dateFin:d2,contract:this._contract,data:this._data,moods:{}});
    });
    // Rupture conventionnelle
    const rc = this._c.querySelector('#rupture-container-fh');
    if (rc && window.M6_RuptureCalculateur) M6_RuptureCalculateur.renderUI(rc, this._contract);
    this._c.querySelector('#exp-j')?.addEventListener('click',()=>M6_ImportExport.export(this._regime));
    this._c.querySelector('#exp-csv-fh')?.addEventListener('click', () => M6_ImportExport.exportCSV(this._regime, this._year));
    this._c.querySelector('#imp-j')?.addEventListener('click',()=>M6_ImportExport.import(this._regime,()=>{this._load();this.render();}));
  },

  _tplSetup() {
    return `<div style="padding:32px 16px;padding-top:calc(40px + env(safe-area-inset-top,0));min-height:100dvh;background:var(--ivoire)">
      <div class="m6-ornement" style="margin-top:0"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Configuration Forfait Heures</div><div class="m6-ornement-line"></div></div>
      <div class="m6-card"><div class="m6-card-body">
        <div class="m6-field" style="position:relative">
          <label>CCN applicable (optionnel) — Forfait Heures</label>
          <input type="text" id="fh-ccn" placeholder="ex : Syntec, HCR, Transport, Banque…" style="font-size:16px" autocomplete="off">
          <input type="hidden" id="fh-ccn-idcc" value="${this._contract.ccnIdcc||0}">
          <div id="fh-ccn-drop" style="display:none;position:absolute;left:0;right:0;top:100%;background:#fff;border:1px solid var(--ivoire-3);border-radius:var(--radius);z-index:100;box-shadow:var(--shadow);max-height:180px;overflow-y:auto"></div>
          <div id="fh-ccn-info" style="display:none;margin-top:4px"></div>
          <div style="font-size:0.68rem;color:var(--pierre);margin-top:4px">Pré-remplit automatiquement le contingent et les taux selon votre CCN (fichier CCN commun v5.5).</div>
        </div>
        <div class="m6-field"><label>Durée hebdomadaire contractuelle (heures)</label><input type="number" id="s-seuil" value="39" min="35" max="48" step="0.5" style="font-size:16px"></div>
        <div class="m6-field"><label>Palier majoration 1 (heures HS)</label><input type="number" id="s-pal" value="8" min="1" max="20" style="font-size:16px"></div>
        <div class="m6-field"><label>Taux majoration 1 (%)</label><input type="number" id="s-t1" value="25" min="10" max="100" style="font-size:16px"></div>
        <div class="m6-field"><label>Taux majoration 2 (%)</label><input type="number" id="s-t2" value="50" min="25" max="200" style="font-size:16px"></div>
        <div class="m6-field"><label>Contingent annuel HS (heures) <span class="m6-tooltip-wrap" id="fh-setup-cont-tip" style="cursor:pointer;font-size:0.65rem;color:var(--pierre)">ⓘ<span class="m6-tooltip-bubble">220h est le contingent légal par défaut (Art. L3121-30). Votre CCN peut prévoir un plafond différent. Au-delà, une autorisation de l'inspection du travail est requise.</span></span></label><input type="number" id="s-cont" value="220" min="100" max="500" style="font-size:16px"></div>
        <div class="m6-field"><label>Taux horaire brut (€) — optionnel</label><input type="number" id="s-tauxH" step="0.01" placeholder="25.50" style="font-size:16px"></div>
        <div class="m6-field"><label>Début de l'exercice</label><input type="date" id="s-debut" value="${this._year}-01-01" style="font-size:16px"></div>
        <div class="m6-field"><label>Fin de l'exercice</label><input type="date" id="s-fin" value="${this._year}-12-31" style="font-size:16px"></div>
        <button class="m6-btn m6-btn-gold" id="s-save">Commencer →</button>
      </div></div>
      <div class="m6-alert info" style="margin-top:12px"><span>ℹ️</span><div>Votre CCN peut prévoir des seuils et taux différents. Consultez votre contrat.</div></div>
      <a href="../menu.html" style="display:block;text-align:center;margin-top:20px;font-size:0.8rem;color:var(--pierre)">← Menu</a>
    </div>`;
  },

  _bindSetup() {
    // Forfait Heures → CCN depuis le fichier COMMUN (racine ../ccn/conventions-collectives.js)
    // L'adaptateur détecte automatiquement le régime 'forfait_heures' et bascule sur window.CCN_API
    if (window.M6_CCN_Adapter) {
      M6_CCN_Adapter.bindAutocomplete(
        this._c.querySelector('#fh-ccn'),
        this._c.querySelector('#fh-ccn-drop'),
        (ccn) => {
          // buildContractDefaults avec régime 'forfait_heures' → lit les règles HS du fichier commun
          const d = M6_CCN_Adapter.buildContractDefaults(ccn, 'forfait_heures');
          const contEl   = this._c.querySelector('#s-cont');
          const seuilEl  = this._c.querySelector('#s-seuil');
          const t1El     = this._c.querySelector('#s-t1');
          const t2El     = this._c.querySelector('#s-t2');
          const idccEl   = this._c.querySelector('#fh-ccn-idcc');
          if (contEl  && d.contingent) contEl.value   = d.contingent;
          if (seuilEl && d.seuilHebdo) seuilEl.value  = d.seuilHebdo;
          if (t1El    && d.taux1)      t1El.value     = d.taux1;
          if (t2El    && d.taux2)      t2El.value     = d.taux2;
          if (idccEl)                  idccEl.value   = ccn.idcc || 0;
          // Alertes HCR 3 paliers
          const rules = window.CCN_API ? CCN_API.getGroupeForCCN(ccn.idcc||0) : null;
          const infoZone = this._c.querySelector('#fh-ccn-info');
          if (infoZone) {
            infoZone.style.display = 'block';
            let html = M6_CCN_Adapter.renderCCNCard(ccn, 'forfait_heures');
            if (rules?.taux_inter !== null && rules?.taux_inter !== undefined) {
              html += `<div class="m6-alert warning" style="margin-top:6px;font-size:0.72rem"><span>⚠️</span><div><strong>CCN ${ccn.nom} — 3 paliers de majoration</strong><br>
                +${rules.taux1}% sur les ${rules.palier1}h premières HS<br>
                +${rules.taux_inter}% sur les ${rules.palier_inter}h suivantes<br>
                +${rules.taux2}% au-delà — calculé automatiquement dans le bilan</div></div>`;
            }
            infoZone.innerHTML = html;
          }
          M6_toast('CCN ' + ccn.nom + ' appliquée');
        },
        'forfait_heures'
      );
    }
    // Tooltip contingent
    const tipWrap = this._c.querySelector('#fh-setup-cont-tip');
    if (tipWrap) tipWrap.addEventListener('click', e => { e.stopPropagation(); tipWrap.classList.toggle('open'); });
    this._c.querySelector('#s-save')?.addEventListener('click',()=>{
      const c={seuilHebdo:parseFloat(this._c.querySelector('#s-seuil')?.value)||39,palier1:parseInt(this._c.querySelector('#s-pal')?.value)||8,taux1:parseInt(this._c.querySelector('#s-t1')?.value)||25,taux2:parseInt(this._c.querySelector('#s-t2')?.value)||50,contingent:parseInt(this._c.querySelector('#s-cont')?.value)||220,tauxHoraire:parseFloat(this._c.querySelector('#s-tauxH')?.value)||0,ccnLabel:this._c.querySelector('#fh-ccn')?.value.trim()||'',ccnIdcc:parseInt(this._c.querySelector('#fh-ccn-idcc')?.value||'0')||0,dateDebutExercice:this._c.querySelector('#s-debut')?.value||null,dateFinExercice:this._c.querySelector('#s-fin')?.value||null};
      M6_Storage.setContract(this._regime,c); M6_Storage.createYear(this._regime,this._year); this._load(); this.render();
    });
  },

  _formatH(h) {
    if(!h||isNaN(h)) return '0h';
    const e=Math.floor(h), m=Math.round((h-e)*60);
    return m>0?`${e}h${String(m).padStart(2,'0')}`:`${e}h`;
  },
  _editContract() {
    M6_Storage.setContract(this._regime, null);
    this._contract = null;
    this._section = 'bilan';  // reset section pour éviter boucle sur export
    try { document.getElementById('m6-coach-fab')?.remove(); } catch(_) {}
    this._c.innerHTML = this._tplSetup();
    this._bindSetup();
  }
};

global.VFH = VFH;
global.VFH_editContract = () => VFH._editContract();

})(window);
