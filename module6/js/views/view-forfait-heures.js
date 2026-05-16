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
        if (!confirm('Reconfigurer le contrat FH ? Les données saisies sont conservées.')) return;
        M6_Storage.setContract(this._regime, null);
        this._contract = null;
        try { document.getElementById('m6-coach-fab')?.remove(); } catch(_) {}
        if (window.M6_Router?._showWizard) M6_Router._showWizard(this._regime);
        else location.reload();
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
    const mk = (id, icon, label) =>
      `<button class="m6-nav-item ${this._section===id?'active':''}" data-sec="${id}">
        <span class="nav-icon">${icon}</span>${label}
      </button>`;
    return `<nav class="m6-bottom-nav">
      ${mk('bilan',     '◈', 'Bilan')}
      ${mk('semaines',  '◻', 'Semaines')}
      ${mk('bio',       '♡', 'Santé')}
      ${mk('tendances', '◗', 'Tendances')}
      <div class="m6-nav-row-sep"></div>
      ${mk('validite',  '⚖', 'Validité')}
      ${mk('entretien', '◉', 'Entretien')}
      ${mk('export',    '◆', 'Export')}
      ${mk('glossaire', '≡', 'Glossaire')}
    </nav>`;
  },

  _bindNav() {
    this._c.querySelectorAll('[data-sec]').forEach(b => {
      b.onclick = () => { this._section = b.dataset.sec; this.render(); };
    });
    const editBtn = this._c.querySelector('#fh-edit-contract');
    if (editBtn) editBtn.onclick = () => {
      if (!confirm('Reconfigurer le contrat FH ? Les données saisies sont conservées.')) return;
      this._editContract();
    };
    const yp = this._c.querySelector('#vfh-yr');
    if (yp) yp.onchange = () => { this._year=parseInt(yp.value); M6_Storage.setActiveYear(this._year); this._load(); this.render(); };
    const ypHdr2 = document.querySelector('#vfh-yr-hdr');
    if (ypHdr2) ypHdr2.onchange = () => { this._year=parseInt(ypHdr2.value); M6_Storage.setActiveYear(this._year); this._load(); this.render(); };
  },

  _formatH(h) {
    if(!h||isNaN(h)) return '0h';
    const e=Math.floor(h), m=Math.round((h-e)*60);
    return m>0?`${e}h${String(m).padStart(2,'0')}`:`${e}h`;
  },
  _editContract() {
    M6_Storage.setContract(this._regime, null);
    this._contract = null;
    this._section = 'bilan';
    try { document.getElementById('m6-coach-fab')?.remove(); } catch(_) {}
    // Relancer le wizard de configuration via le router
    if (window.M6_Router?._showWizard) {
      M6_Router._showWizard(this._regime);
    } else if (window.M6_Router) {
      M6_Router.init();
    } else {
      location.reload();
    }
  }
};

global.VFH = VFH;
global.VFH_editContract = () => VFH._editContract();

})(window);
