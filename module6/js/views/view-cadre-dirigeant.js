/**
 * VIEW-CADRE-DIRIGEANT — Module complet L3111-2
 * 6 onglets : Bilan · Calendrier · Projets · Santé · Entretien · Export
 *
 * Sources : L3111-2, L3121-65, L4121-1 — Dirigeants non soumis durée légale
 * mais conservent : CP, protection santé, entretien charge de travail si >218j engagement contractuel
 */
'use strict';

(function(global) {

const REGIME = 'cadre_dirigeant';
const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const VCD = {
  _c: null, _year: new Date().getFullYear(), _section: 'bilan',
  _contract: null, _data: {}, _moods: {}, _projets: [],

  init(container) {
    this._c = container;
    this._year = M6_Storage.getActiveYear();
    this._load(); this.render();
  },

  _load() {
    this._contract = M6_Storage.getContract(REGIME);
    this._data     = M6_Storage.getData(REGIME, this._year);
    this._moods    = M6_Storage.getMoods(REGIME, this._year);
    try { this._projets = JSON.parse(localStorage.getItem(`M6_CD_PROJETS_${this._year}`) || '[]'); } catch { this._projets = []; }
  },
  _saveData()     { M6_Storage.setData(REGIME, this._year, this._data); },
  _saveProjets()  { localStorage.setItem(`M6_CD_PROJETS_${this._year}`, JSON.stringify(this._projets)); },
  _saveContract() { M6_Storage.setContract(REGIME, this._contract); },

  // ── Stats de base ──────────────────────────────────────────────
  _calcStats() {
    const feries = M6_Feries.getSet(this._year);
    const cpTotal = this._contract?.joursCPContrat || 25;
    let jTravailles=0, cpPris=0, rttPris=0, jAbsence=0, deplacements=0, demis=0;
    const amplitudesLong = [];

    for(const [dk, v] of Object.entries(this._data)) {
      if(!dk.startsWith(String(this._year))) continue;
      const t = v.type || 'travail';
      const dow = new Date(dk+'T12:00:00').getDay();
      if(t==='cp') { if(dow!==0&&dow!==6&&!feries.has(dk)) cpPris++; continue; }
      if(t==='rtt')    { rttPris++; continue; }
      if(t==='repos')  continue;
      if(t==='demi')   { jTravailles+=0.5; demis++; }
      else if(t==='travail') jTravailles++;
      if(v.deplacement) deplacements++;
      if(v.debut&&v.fin) {
        const amp=(new Date(`${dk}T${v.fin}:00`)-new Date(`${dk}T${v.debut}:00`))/3600000;
        if(amp>=11) amplitudesLong.push({dk,amp});
      }
    }

    // Projets : total heures déclarées
    const hProjets = this._projets.reduce((s,p) => s + (p.heures||0), 0);
    const cpSolde  = cpTotal - cpPris;

    return { jTravailles, cpPris, cpTotal, cpSolde, rttPris, deplacements, demis,
             amplitudesLong, hProjets };
  },

  // ── RENDER ─────────────────────────────────────────────────────
  render() {
    if (!this._contract) { this._c.innerHTML = this._tplSetup(); this._bindSetup(); return; }
    const stats = this._calcStats();
    const bio   = M6_BioEngine.analyzeForfaitJours(
      { plafond:218, joursCPContrat:this._contract.joursCPContrat||25,
        entretienDate:this._contract.entretienDate },
      this._data, this._year
    );

    // Zenji
    const zenjiMsg = window.M6_Zenji
      ? M6_Zenji.getContextMessage('bilan',
          {joursEffectifs:stats.jTravailles,plafond:218,rttPris:stats.rttPris,rttSolde:0,rachetes:0,cpPris:stats.cpPris,alertes:[]},
          bio, this._contract)
      : '';

    this._c.innerHTML = `${this._tplHeader(stats)}${this._tplNav()}<div class="m6-main m6-fade-in" id="cd-ct" style="padding-top:8px"></div>`;
    const ct = this._c.querySelector('#cd-ct');
    const zenjiHtml = zenjiMsg ? M6_Zenji.renderCard(zenjiMsg, bio?.phase?.code||'P1', true) : '';

    switch(this._section) {
      case 'bilan':     ct.innerHTML = zenjiHtml + this._tplBilan(stats,bio); this._bindBilan(); break;
      case 'calendrier':this._renderCal(ct); break;
      case 'projets':   ct.innerHTML = zenjiHtml + this._tplProjets(); this._bindProjets(); break;
      case 'sante':     ct.innerHTML = zenjiHtml + this._tplSante(bio,stats); break;
      case 'entretien': ct.innerHTML = zenjiHtml;
        M6_Entretien.renderForm(ct, REGIME, this._year, this._contract,
          {joursEffectifs:stats.jTravailles,plafond:218,rttPris:stats.rttPris,alertes:[]},
          ()=>{this._load();this.render();}); break;
      case 'export':    ct.innerHTML = zenjiHtml + this._tplExport(stats,bio); this._bindExport(stats,bio); break;
    }
    this._bindNav();
  },

  // ── HEADER ─────────────────────────────────────────────────────
  _tplHeader(s) {
    const pct = Math.min(100, Math.round(s.cpPris/Math.max(1,s.cpTotal)*100));
    return `<div style="background:var(--charbon);padding:10px 16px;padding-top:calc(10px + env(safe-area-inset-top,0));position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(196,163,90,0.25)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <img src="../module6/images/Cadre.png" alt="Zenji" style="width:32px;height:32px;object-fit:cover;object-position:top center;border-radius:50%;border:2px solid var(--champagne);flex-shrink:0">
        <div style="flex:1">
          <div style="font-family:var(--font-display);font-size:1rem;font-weight:600;color:var(--ivoire)">Cadre Dirigeant ${this._year}</div>
          <div style="font-size:0.62rem;color:var(--champagne);letter-spacing:0.06em;text-transform:uppercase">${this._contract.fonction||'L3111-2'} · ${this._contract.entreprise||''}</div>
        </div>
        ${this._tplYrPicker()}
        <a href="../menu.html" style="color:var(--pierre);font-size:0.7rem;text-decoration:none;border:1px solid rgba(255,255,255,0.12);padding:4px 8px;border-radius:6px">← Menu</a>
      </div>
      <div style="display:flex;gap:12px;font-size:0.68rem;color:var(--pierre)">
        <span>📅 <strong style="color:var(--ivoire)">${s.jTravailles}</strong>j travaillés</span>
        <span>✈️ <strong style="color:${s.cpSolde<=5?'var(--alerte)':'var(--champagne)'}">${s.cpSolde}</strong>j CP restants</span>
        <span>💼 <strong style="color:var(--ivoire)">${s.deplacements}</strong> déplacements</span>
      </div>
    </div>`;
  },

  _tplYrPicker() {
    const yrs = M6_Storage.getAllYears(REGIME);
    if(yrs.length<=1) return `<span style="font-size:0.72rem;color:var(--pierre)">${this._year}</span>`;
    return `<select id="cd-yr" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--ivoire);font-size:0.72rem;border-radius:6px;padding:3px 6px;-webkit-appearance:none">${M6_Storage.getAllYears(REGIME).map(y=>`<option value="${y}" ${y==this._year?'selected':''}>${y}</option>`).join('')}</select>`;
  },

  _tplNav() {
    const tabs = [{id:'bilan',icon:'◈',label:'Bilan'},{id:'calendrier',icon:'◻',label:'Agenda'},{id:'projets',icon:'◆',label:'Projets'},{id:'sante',icon:'♡',label:'Santé'},{id:'entretien',icon:'◉',label:'Entretien'},{id:'export',icon:'≡',label:'Export'}];
    return `<nav class="m6-bottom-nav">${tabs.map(t=>`<button class="m6-nav-item ${this._section===t.id?'active':''}" data-sec="${t.id}"><span class="nav-icon">${t.icon}</span>${t.label}</button>`).join('')}</nav>`;
  },

  _bindNav() {
    this._c.querySelectorAll('[data-sec]').forEach(b=>b.addEventListener('click',()=>{this._section=b.dataset.sec;this.render();}));
    const yp=this._c.querySelector('#cd-yr');
    if(yp) yp.addEventListener('change',()=>{this._year=parseInt(yp.value);M6_Storage.setActiveYear(this._year);this._load();this.render();});
  },

  // ── BILAN ──────────────────────────────────────────────────────
  _tplBilan(s, bio) {
    return `
    <div class="m6-alert info" style="margin-bottom:14px;font-size:0.78rem">
      <span>⚖️</span><div><strong>Régime Cadre Dirigeant (L3111-2)</strong> — Pas de compteur d'heures légal. Autonomie totale sur l'organisation du temps. Obligations : CP, protection santé, entretien de charge si engagement contractuel.</div>
    </div>

    <!-- CP -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon">✈️</div>
        <div><div class="m6-card-label">Congés Payés ${this._year}</div><div class="m6-card-title">Solde CP</div></div>
        <span class="m6-badge ${s.cpSolde<=5?'m6-badge-danger':'m6-badge-ok'}" style="margin-left:auto">${s.cpSolde}j restants</span>
      </div>
      <div class="m6-card-body">
        <div class="m6-progress-wrap" style="margin-bottom:8px">
          <div class="m6-progress-bar ${s.cpPris>=s.cpTotal?'ok':''}" style="width:${Math.min(100,s.cpPris/s.cpTotal*100)}%"></div>
        </div>
        <div class="m6-stats-grid">
          <div class="m6-stat-box"><div class="m6-stat-val">${s.cpTotal}</div><div class="m6-stat-label">CP contractuels</div></div>
          <div class="m6-stat-box"><div class="m6-stat-val">${s.cpPris}</div><div class="m6-stat-label">CP pris</div></div>
          <div class="m6-stat-box" style="border-color:${s.cpSolde<=5?'var(--alerte)':'rgba(196,163,90,0.35)'}">
            <div class="m6-stat-val" style="color:${s.cpSolde<=5?'var(--alerte)':'var(--champagne-2)'}">${s.cpSolde}</div>
            <div class="m6-stat-label">Solde CP</div>
          </div>
          <div class="m6-stat-box"><div class="m6-stat-val">${s.deplacements}</div><div class="m6-stat-label">Déplacements</div></div>
        </div>
      </div>
    </div>

    <!-- Activité -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon">📊</div>
        <div><div class="m6-card-label">Activité</div><div class="m6-card-title">Bilan de présence ${this._year}</div></div>
      </div>
      <div class="m6-card-body">
        ${[['Jours de présence',s.jTravailles,''],['dont demi-journées',s.demis,'× 0.5j'],['Déplacements professionnels',s.deplacements,''],['Amplitudes >11h',s.amplitudesLong.length,'(Hakola 2001)']].map(([l,v,h])=>`<div class="m6-row"><span class="m6-row-label">${l}</span><span class="m6-row-val">${v} <small style="color:var(--pierre)">${h}</small></span></div>`).join('')}
      </div>
    </div>

    <!-- Mini-bio -->
    ${bio.hasData?`<div class="m6-card" style="margin-bottom:14px;cursor:pointer" id="cd-bio-card">
      <div class="m6-card-body" style="padding:12px 14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div class="m6-card-label">Santé — Phase ${bio.phase?.code}</div>
          <span class="m6-badge" style="background:${bio.phase?.color}20;color:${bio.phase?.color};border-radius:99px;font-size:0.65rem;padding:2px 8px">${bio.phase?.label}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center">
          ${[['Fatigue',bio.fatigue,true],['Stress',bio.stress,true],['Récup.',bio.recovery,false],['Perf.',bio.performance,false]].map(([l,v,inv])=>{const c=inv?(v>60?'#B85C50':v>35?'#C4853A':'#4A7C6F'):(v<40?'#B85C50':v<65?'#C4853A':'#4A7C6F');return `<div style="background:var(--ivoire);border-radius:8px;padding:8px 4px"><div style="font-family:var(--font-display);font-size:1.3rem;font-weight:700;color:${c}">${v}</div><div style="font-size:0.6rem;color:var(--pierre)">${l}</div></div>`;}).join('')}
        </div>
      </div>
    </div>`:''}

    <!-- Droits maintenus -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon">📋</div>
        <div><div class="m6-card-label">Protections légales</div><div class="m6-card-title">Droits maintenus (L3111-2)</div></div>
      </div>
      <div class="m6-card-body">
        ${[['Congés payés','25j ouvrables min (L3141-1)','✅'],['Protection licenciement','Régime commun','✅'],['Maternité / Paternité','Protection complète','✅'],['Médecine du travail','VIP obligatoire','✅'],['Entretien de charge','Si engagement contractuel','✅'],['Durée légale 35h','Non applicable','—'],['Heures supplémentaires','Non applicable','—'],['Repos légaux','Recommandés, non imposés','—']].map(([l,d,ico])=>`<div class="m6-row" style="align-items:flex-start;padding:7px 0"><div><div style="font-size:0.8rem;font-weight:500">${l}</div><div style="font-size:0.7rem;color:var(--pierre)">${d}</div></div><span style="font-size:0.9rem;margin-left:auto;flex-shrink:0">${ico}</span></div>`).join('')}
      </div>
    </div>

    <!-- Alertes amplitude -->
    ${s.amplitudesLong.length>5?`<div class="m6-alert warning" style="margin-bottom:14px"><span>⏰</span><div><strong>${s.amplitudesLong.length} journées longues (>11h)</strong><br><span style="font-size:0.77rem">Même sans obligation légale, Hakola & Härmä 2001 documentent la perturbation circadienne. Préservez votre performance sur la durée.</span></div></div>`:''}

    <button class="m6-btn m6-btn-primary" id="cd-saisir" style="margin-bottom:8px">+ Saisir une journée</button>
    <div style="display:flex;gap:8px">
      <button class="m6-btn m6-btn-ghost" id="cd-newyr" style="flex:1;font-size:0.78rem">📅 Nouvel exercice</button>
      <button class="m6-btn m6-btn-ghost" id="cd-reset" style="flex:1;font-size:0.78rem">⚙️ Reconfigurer</button>
    </div>`;
  },

  _bindBilan() {
    this._c.querySelector('#cd-saisir')?.addEventListener('click',()=>{this._section='calendrier';this.render();});
    this._c.querySelector('#cd-bio-card')?.addEventListener('click',()=>{this._section='sante';this.render();});
    this._c.querySelector('#cd-newyr')?.addEventListener('click',()=>{const y=prompt(`Exercice (ex: ${this._year+1})`,this._year+1);if(!y||isNaN(y))return;const yr=parseInt(y);M6_Storage.createYear(REGIME,yr);this._year=yr;M6_Storage.setActiveYear(yr);this._load();this.render();M6_toast(`Exercice ${yr} créé`);});
    this._c.querySelector('#cd-reset')?.addEventListener('click',()=>{if(!confirm('Reconfigurer le contrat ? Les données de saisie sont conservées.'))return;M6_Storage.setContract(REGIME,null);this._contract=null;this._c.innerHTML=this._tplSetup();this._bindSetup();});
  },

  // ── CALENDRIER ─────────────────────────────────────────────────
  _renderCal(ct) {
    ct.innerHTML = '<div id="cd-cal-root"></div>';
    if(window.M6_Calendar) {
      M6_Calendar.init(ct.querySelector('#cd-cal-root'), REGIME, this._year, this._data, this._moods,
        (dk,v,mood) => {
          if(v===null){delete this._data[dk];this._saveData();}
          else{M6_Storage.setDay(REGIME,this._year,dk,v);if(mood)M6_Storage.setMood(REGIME,this._year,dk,mood);}
          this._load();
          M6_Calendar.refresh?.(this._data,this._moods);
          M6_toast('Enregistré');
        });
    } else {
      ct.innerHTML = '<div class="m6-alert info" style="margin:16px"><span>⚠️</span><div>Module calendrier non chargé.</div></div>';
    }
  },

  // ── PROJETS / MISSIONS ─────────────────────────────────────────
  _tplProjets() {
    const totalH = this._projets.reduce((s,p)=>s+(p.heures||0),0);
    const cats = ['Stratégie','Innovation','Opérationnel','RH & Management','Finance','Externe'];
    const bycat = {};
    cats.forEach(c=>{bycat[c]=this._projets.filter(p=>p.categorie===c).reduce((s,p)=>s+(p.heures||0),0);});

    return `
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Répartition du temps dirigeant</div><div class="m6-ornement-line"></div></div>

    <div class="m6-alert info" style="margin-bottom:14px;font-size:0.78rem">
      <span>💡</span><div>La ventilation du temps par mission permet de piloter votre délégation et d'objectiver la valeur ajoutée de votre rôle. Utile pour l'entretien de charge et le conseil d'administration.</div>
    </div>

    <!-- Donut simplifié par catégorie -->
    ${totalH>0?`<div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px"><span class="m6-card-label">Répartition par domaine</span><span class="m6-badge m6-badge-champagne">${totalH}h déclarées</span></div>
      ${cats.filter(c=>bycat[c]>0).map(c=>{const pct=Math.round(bycat[c]/totalH*100);return `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:3px"><span>${c}</span><span style="font-weight:500">${bycat[c]}h (${pct}%)</span></div><div style="height:6px;background:var(--ivoire-2);border-radius:99px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--champagne-2),var(--champagne));border-radius:99px"></div></div></div>`;}).join('')}
    </div></div>`:''}

    <!-- Liste projets -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon">◆</div><div><div class="m6-card-label">Missions</div><div class="m6-card-title">${this._projets.length} enregistrée(s)</div></div></div>
      <div class="m6-card-body">
        ${!this._projets.length?'<div style="font-size:0.78rem;color:var(--pierre);text-align:center;padding:16px 0">Aucune mission déclarée — ajoutez votre première mission ci-dessous.</div>':
          this._projets.map((p,i)=>`<div class="m6-row" style="align-items:flex-start;padding:8px 0">
            <div style="flex:1">
              <div style="font-size:0.83rem;font-weight:500">${p.nom}</div>
              <div style="font-size:0.7rem;color:var(--pierre)">${p.categorie||'—'} · ${p.heures||0}h déclarées</div>
              ${p.note?`<div style="font-size:0.68rem;color:var(--pierre);font-style:italic;margin-top:2px">${p.note}</div>`:''}
            </div>
            <button data-del-proj="${i}" style="background:none;border:none;color:var(--pierre);cursor:pointer;font-size:0.9rem;padding:2px 6px">✕</button>
          </div>`).join('')}
      </div>
    </div>

    <!-- Ajouter mission -->
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon">+</div><div><div class="m6-card-label">Nouvelle mission</div></div></div>
      <div class="m6-card-body">
        <div class="m6-field"><label>Nom de la mission</label><input type="text" id="p-nom" placeholder="ex : Stratégie de croissance 2026" style="font-size:16px"></div>
        <div class="m6-field"><label>Domaine</label>
          <select id="p-cat" style="font-size:14px">${cats.map(c=>`<option>${c}</option>`).join('')}</select>
        </div>
        <div class="m6-field"><label>Heures déclarées</label><input type="number" id="p-h" min="0" step="0.5" placeholder="ex : 40" style="font-size:16px"></div>
        <div class="m6-field"><label>Note</label><input type="text" id="p-note" placeholder="Contexte, résultats clés…" style="font-size:16px"></div>
        <button class="m6-btn m6-btn-gold" id="p-add">Ajouter la mission</button>
      </div>
    </div>`;
  },

  _bindProjets() {
    this._c.querySelector('#p-add')?.addEventListener('click',()=>{
      const nom = this._c.querySelector('#p-nom')?.value.trim();
      if(!nom){M6_toast('Nom requis');return;}
      this._projets.push({nom,categorie:this._c.querySelector('#p-cat')?.value,heures:parseFloat(this._c.querySelector('#p-h')?.value)||0,note:this._c.querySelector('#p-note')?.value.trim()});
      this._saveProjets();this._load();this.render();M6_toast('Mission ajoutée');
    });
    this._c.querySelectorAll('[data-del-proj]').forEach(b=>b.addEventListener('click',()=>{
      const i=parseInt(b.dataset.delProj);this._projets.splice(i,1);this._saveProjets();this._load();this.render();
    }));
  },

  // ── SANTÉ ──────────────────────────────────────────────────────
  _tplSante(bio, s) {
    const bar=(l,v,inv)=>{const c=inv?(v>60?'#B85C50':v>35?'#C4853A':'#4A7C6F'):(v<40?'#B85C50':v<65?'#C4853A':'#4A7C6F');return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px"><span>${l}</span><span style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:${c}">${v}</span></div><div style="height:8px;background:var(--ivoire-2);border-radius:99px;overflow:hidden"><div style="height:100%;width:${v}%;border-radius:99px;background:${c}"></div></div></div>`;};

    if(!bio.hasData) return `
      <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Santé & Bien-être Dirigeant</div><div class="m6-ornement-line"></div></div>
      <div class="m6-alert info"><span>ℹ️</span><div>Saisissez des journées dans l'Agenda pour voir votre analyse biologique. Renseignez les amplitudes pour affiner.</div></div>
      <div class="m6-card" style="margin-top:14px"><div class="m6-card-body">
        <div style="font-size:0.8rem;color:var(--charbon-3);line-height:1.6">
          <strong>Pour un cadre dirigeant, la santé est un actif stratégique.</strong><br>
          Même sans obligation légale de compteur d'heures, les longues durées exposent aux mêmes risques biologiques :<br>
          • Risque cardiovasculaire (Kivimäki 2015 — RR AVC 1.33 à ≥55h/sem)<br>
          • Vieillissement épigénétique (Dresden Burnout Study 2025)<br>
          • Déclin cognitif mesuré par IRM (Frontiers 2025)
        </div>
      </div></div>`;

    return `
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Santé & Bien-être</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon" style="background:${bio.phase?.color}20">🩺</div><div><div class="m6-card-label">Phase physiologique (INRS)</div><div class="m6-card-title" style="color:${bio.phase?.color}">${bio.phase?.code} — ${bio.phase?.label}</div></div></div>
      <div class="m6-card-body">${bar('Fatigue accumulée',bio.fatigue,true)}${bar('Stress chronique',bio.stress,true)}${bar('Capacité de récupération',bio.recovery,false)}${bar('Performance estimée (Pencavel)',bio.performance,false)}</div>
    </div>
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header"><div class="m6-card-icon">❤️</div><div><div class="m6-card-label">Risques long terme</div><div class="m6-card-title">CV · Cognitif · Vieillissement</div></div></div>
      <div class="m6-card-body">${bar('Risque CV (Kivimäki 2015 / Lancet)',bio.cvRisk,true)}${bar('Risque cognitif (Jang 2025 / Frontiers)',bio.cogRisk,true)}${bar('Vieillissement biologique (Ahola 2012)',bio.agingRisk,true)}<div style="font-size:0.7rem;color:var(--pierre);margin-top:8px">Même sans obligation légale, un dirigeant exposé à >55h/sem éq. supporte un RR AVC = 1.33 (IC95% 1.11–1.61). Pega et al. WHO/ILO 2021.</div></div>
    </div>

    <!-- Amplitudes longues -->
    ${s.amplitudesLong.length?`<div class="m6-card" style="margin-bottom:14px"><div class="m6-card-header"><div class="m6-card-icon">⏱️</div><div><div class="m6-card-label">Journées longues</div><div class="m6-card-title">${s.amplitudesLong.length} journées >11h</div></div></div>
      <div class="m6-card-body">${s.amplitudesLong.slice(-5).reverse().map(a=>`<div class="m6-row"><span class="m6-row-label">${new Date(a.dk+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</span><span class="m6-row-val ${a.amp>13?'alert':''}">${Math.round(a.amp*10)/10}h</span></div>`).join('')}
      <div style="font-size:0.7rem;color:var(--pierre);margin-top:8px">Hakola & Härmä 2001 : amplitude >11h → perturbation circadienne et dette de sommeil cumulée.</div></div></div>`:''}

    <!-- Alertes bio -->
    ${bio.alertesBio.length?`<div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Alertes santé</div><div class="m6-ornement-line"></div></div>${bio.alertesBio.map(al=>`<div class="m6-alert ${al.niv}" style="margin-bottom:10px"><span class="m6-alert-icon">⚕️</span><div><strong>${al.titre}</strong><br><span style="font-size:0.77rem">${al.texte}</span></div></div>`).join('')}`:''}

    <div class="m6-alert info" style="font-size:0.75rem;margin-top:8px">
      <span>⚕️</span><div>Cette analyse ne remplace pas un avis médical. Consultez votre médecin du travail (R4624-10) pour un suivi personnalisé.</div>
    </div>`;
  },

  // ── EXPORT ─────────────────────────────────────────────────────
  _tplExport(s, bio) {
    const as=M6_Storage.getAutoSaveDate(REGIME,this._year);
    const fs=M6_Storage.getFileSaveDate(REGIME,this._year);
    const valid=M6_Storage.getValidations(REGIME,this._year);
    const log=M6_Storage.getLog(REGIME,this._year).slice(-6).reverse();
    const yrs=M6_Storage.getAllYears(REGIME);
    return `
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Sauvegarde</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body" style="padding:10px 14px">
      <div class="m6-row"><span class="m6-row-label">Application</span><span style="font-size:0.72rem;color:${as?'var(--succes)':'var(--alerte)'}">${as?new Date(as).toLocaleString('fr-FR'):'—'}</span></div>
      <div class="m6-row"><span class="m6-row-label">Fichier JSON</span><span style="font-size:0.72rem;color:${fs?'var(--succes)':'var(--alerte)'}">${fs?new Date(fs).toLocaleString('fr-FR'):'Jamais exporté ⚠️'}</span></div>
    </div></div>

    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">PDF Dirigeant</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div class="m6-field"><label>Mois (PDF mensuel)</label><select id="pdf-mois" style="font-size:14px">${MOIS_FR.map((m,i)=>`<option value="${i}">${m}</option>`).join('')}</select></div>
      <div class="m6-field"><label>Votre nom</label><input type="text" id="pdf-nom" value="${this._contract.nom||''}" placeholder="Prénom NOM" style="font-size:16px"></div>
      <div class="m6-field"><label>Fonction</label><input type="text" id="pdf-fnc" value="${this._contract.fonction||''}" placeholder="Directeur Général…" style="font-size:16px"></div>
      <div style="margin-bottom:12px">
        <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.8rem;color:var(--charbon);cursor:pointer">
          <input type="checkbox" id="pdf-attest" style="margin-top:2px;flex-shrink:0">
          <span>Je certifie l'exactitude de ces informations et le respect recommandé des temps de repos quotidien et hebdomadaire.</span>
        </label>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="m6-btn m6-btn-ghost" id="pdf-m" style="flex:1;font-size:0.78rem">📄 PDF Mensuel</button>
        <button class="m6-btn m6-btn-ghost" id="pdf-a" style="flex:1;font-size:0.78rem">📋 PDF Annuel</button>
      </div>
    </div></div>

    <!-- Validation mensuelle -->
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Validation mensuelle</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div class="m6-field"><label>Mois</label><select id="v-mois" style="font-size:14px">${MOIS_FR.map((m,i)=>`<option value="${i}">${m}${valid[i]?' ✓':''}</option>`).join('')}</select></div>
      <div class="m6-field"><label>Votre nom</label><input type="text" id="v-nom" value="${this._contract.nom||''}" style="font-size:16px"></div>
      <button class="m6-btn m6-btn-gold" id="v-btn" style="font-size:0.8rem">Valider ce mois</button>
      ${Object.entries(valid).length?`<div style="margin-top:10px">${Object.entries(valid).sort(([a],[b])=>a-b).map(([m,v])=>`<div class="m6-row"><span class="m6-row-label">${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'][m]}</span><span style="font-size:0.65rem;color:var(--pierre)">${new Date(v.ts).toLocaleString('fr-FR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})} · #${v.hash}</span></div>`).join('')}</div>`:''}
    </div></div>

    <!-- JSON -->
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">JSON — Exercices : ${yrs.join(', ')}</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card" style="margin-bottom:14px"><div class="m6-card-body">
      <div style="display:flex;gap:8px">
        <button class="m6-btn m6-btn-primary" id="exp-j" style="flex:1;font-size:0.78rem">Exporter JSON</button>
        <button class="m6-btn m6-btn-ghost" id="imp-j" style="flex:1;font-size:0.78rem">Importer JSON</button>
      </div>
    </div></div>

    <!-- Historique -->
    <div class="m6-ornement"><div class="m6-ornement-line"></div><div class="m6-ornement-text">Historique des modifications</div><div class="m6-ornement-line"></div></div>
    <div class="m6-card"><div class="m6-card-body">${!log.length?'<div style="font-size:0.78rem;color:var(--pierre)">Aucune modification.</div>':log.map(l=>`<div class="m6-row" style="padding:5px 0;align-items:flex-start"><div><div style="font-size:0.72rem;font-weight:500">${l.action}</div><div style="font-size:0.65rem;color:var(--pierre)">${l.detail}</div></div><span style="font-size:0.6rem;color:var(--pierre);flex-shrink:0;margin-left:8px">${new Date(l.ts).toLocaleString('fr-FR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}</span></div>`).join('')}</div></div>`;
  },

  _bindExport(stats, bio) {
    const saveMeta = () => {
      const nom = this._c.querySelector('#pdf-nom')?.value.trim();
      const fnc = this._c.querySelector('#pdf-fnc')?.value.trim();
      if(nom){ this._contract.nom=nom; } if(fnc){ this._contract.fonction=fnc; }
      this._saveContract();
    };
    const checkAttest = () => {
      if(!this._c.querySelector('#pdf-attest')?.checked){M6_toast('Cochez la case de certification');return false;}
      return true;
    };

    const makeAnalysis = () => ({
      joursEffectifs:stats.jTravailles, cpPris:stats.cpPris, plafond:218,
      rttPris:stats.rttPris, deplacements:stats.deplacements, demis:stats.demis,
      rachetes:0, feriesOuvres:0, rttTheoriques:0, rttSolde:0,
      alertes:[], tauxRemplissage:0
    });

    this._c.querySelector('#pdf-m')?.addEventListener('click',()=>{
      if(!checkAttest()) return; saveMeta();
      M6_PDF.exportMensuel({regime:REGIME,year:this._year,mois:parseInt(this._c.querySelector('#pdf-mois')?.value),contract:this._contract,data:this._data,moods:this._moods,analysis:makeAnalysis(),validations:M6_Storage.getValidations(REGIME,this._year)});
    });
    this._c.querySelector('#pdf-a')?.addEventListener('click',()=>{
      if(!checkAttest()) return; saveMeta();
      M6_PDF.exportAnnuel({regime:REGIME,year:this._year,contract:this._contract,data:this._data,moods:this._moods,analysis:makeAnalysis()});
    });
    this._c.querySelector('#v-btn')?.addEventListener('click',()=>{
      const m=parseInt(this._c.querySelector('#v-mois')?.value),nom=this._c.querySelector('#v-nom')?.value.trim();
      if(!nom){M6_toast('Saisissez votre nom');return;}
      M6_Storage.addValidation(REGIME,this._year,m,nom);M6_toast('Validé');this.render();
    });
    this._c.querySelector('#exp-j')?.addEventListener('click',()=>M6_ImportExport.export(REGIME));
    this._c.querySelector('#imp-j')?.addEventListener('click',()=>M6_ImportExport.import(REGIME,()=>{this._load();this.render();}));
  },

  // ── SETUP ──────────────────────────────────────────────────────
  _tplSetup() {
    return `<div style="padding:32px 16px;padding-top:calc(40px + env(safe-area-inset-top,0));min-height:100dvh;background:var(--ivoire)">
      <!-- Portrait Zenji -->
      <div style="text-align:center;margin-bottom:24px">
        <img src="../module6/images/Cadre.png" alt="Zenji" style="width:100px;height:100px;object-fit:cover;object-position:top center;border-radius:50%;border:3px solid var(--champagne);margin:0 auto 10px">
        <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:600;color:var(--charbon)">Cadre Dirigeant</div>
        <div style="font-size:0.7rem;color:var(--pierre);margin-top:4px">Art. L3111-2 — Configuration initiale</div>
      </div>
      <div class="m6-card"><div class="m6-card-body">
        <div class="m6-field"><label>Votre nom complet</label><input type="text" id="s-nom" placeholder="Prénom NOM" style="font-size:16px"></div>
        <div class="m6-field"><label>Fonction</label><input type="text" id="s-fnc" placeholder="Directeur Général, DAF, DRH…" style="font-size:16px"></div>
        <div class="m6-field"><label>Entreprise</label><input type="text" id="s-ent" placeholder="Nom de l'entreprise" style="font-size:16px"></div>
        <div class="m6-field"><label>CCN applicable</label><input type="text" id="s-ccn" placeholder="ex : Syntec, Banque AFB, Hôtellerie…" style="font-size:16px"></div>
        <div class="m6-field"><label>Congés payés contractuels (jours ouvrables)</label><input type="number" id="s-cp" value="25" min="25" max="50" style="font-size:16px"></div>
        <div class="m6-field"><label>Date début exercice (si en cours d'année)</label><input type="date" id="s-debut" style="font-size:16px"></div>
        <div class="m6-field"><label>Nom du manager / Président du CA</label><input type="text" id="s-mgr" placeholder="Pour les PDF" style="font-size:16px"></div>
        <button class="m6-btn m6-btn-gold" id="s-save">Commencer le suivi →</button>
      </div></div>
      <div class="m6-alert info" style="margin-top:12px;font-size:0.78rem">
        <span>⚖️</span><div>En tant que cadre dirigeant (L3111-2), vous n'êtes pas soumis à la durée légale. Ce module suit vos CP, vos journées de présence, vos missions et votre santé.</div>
      </div>
      <a href="../menu.html" style="display:block;text-align:center;margin-top:20px;font-size:0.8rem;color:var(--pierre)">← Menu</a>
    </div>`;
  },

  _bindSetup() {
    this._c.querySelector('#s-save')?.addEventListener('click',()=>{
      const c = {
        nom:           this._c.querySelector('#s-nom')?.value.trim(),
        fonction:      this._c.querySelector('#s-fnc')?.value.trim(),
        entreprise:    this._c.querySelector('#s-ent')?.value.trim(),
        ccnLabel:      this._c.querySelector('#s-ccn')?.value.trim(),
        joursCPContrat:parseInt(this._c.querySelector('#s-cp')?.value)||25,
        dateArrivee:   this._c.querySelector('#s-debut')?.value||null,
        nomManager:    this._c.querySelector('#s-mgr')?.value.trim(),
      };
      M6_Storage.setContract(REGIME, c);
      M6_Storage.createYear(REGIME, this._year);
      this._load(); this.render();
    });
  }
};

global.VCD = VCD;
global.VCD_editContract = () => { M6_Storage.setContract(REGIME,null); VCD._contract=null; VCD._c.innerHTML=VCD._tplSetup(); VCD._bindSetup(); };

})(window);
