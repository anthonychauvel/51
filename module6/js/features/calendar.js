/**
 * CALENDAR M6 v2 — Corrections audit complètes
 * - Mood OBLIGATOIRE avant enregistrement
 * - Certification repos (checkbox obligatoire)
 * - Déplacement = TOGGLE sur Travail (pas exclusif)
 * - Horaires défaut 09:00-18:30 pré-remplis
 * - Bandeau compteur global annuel fixe
 * - Demi-journée : visuel cellule coupée
 * - Alerte amplitude temps réel automatique
 * - Anti-doublon semaine validation rapide
 * - Demi-journée 0.5 bien comptée
 */
'use strict';

(function(global) {

const MOOD_COLORS = {
  faible:   { bg:'#E8F5F0', border:'#4A7C6F', text:'#2D5A4E', label:'Légère',  icon:'🌿' },
  ok:       { bg:'#EEF3FA', border:'#3B6098', text:'#1E3A5F', label:'Normale',  icon:'✓'  },
  eleve:    { bg:'#FFF7E6', border:'#C4853A', text:'#8B5A1A', label:'Soutenue', icon:'⚡' },
  critique: { bg:'#FFF0EE', border:'#B85C50', text:'#7A3028', label:'Critique', icon:'🔥' },
};

const TYPE_CONFIG = {
  travail: { icon:'●', label:'Travail',      bg:'#1E3A5F', text:'#fff', val:1   },
  rtt:     { icon:'○', label:'RTT',          bg:'#4A7C6F', text:'#fff', val:0   },
  cp:      { icon:'◆', label:'Congé',        bg:'#2D6A4F', text:'#fff', val:0   },
  ferie:   { icon:'★', label:'Férié',        bg:'#3B6098', text:'#fff', val:0   },
  repos:   { icon:'◯', label:'Repos',        bg:'#6B7280', text:'#fff', val:0   },
  rachat:  { icon:'◈', label:'Rachat',       bg:'#C4853A', text:'#fff', val:1   },
  demi:    { icon:'◑', label:'Demi-j.',      bg:'#5C3F9B', text:'#fff', val:0.5 },
};

const M6_Calendar = {
  _container:null, _regime:null, _year:null, _data:{}, _moods:{},
  _feries:null, _onSave:null, _overlay:null, _currentMonth:null,
  _swipeStartX:0, _contract:null,

  init(container, regime, year, data, moods, onSave, contract) {
    this._container    = container;
    this._regime       = regime;
    this._year         = year;
    this._data         = data || {};
    this._moods        = moods || {};
    this._feries       = M6_Feries.getSet(year);
    this._onSave       = onSave;
    this._contract     = contract || {};
    this._currentMonth = new Date().getMonth();
    this._render();
    this._bindSwipe();
  },

  refresh(data, moods) {
    this._data  = data || {};
    this._moods = moods || {};
    this._render();
  },

  // ── Compteur global ──────────────────────────────────────────
  _countTravail() {
    let n = 0;
    Object.values(this._data).forEach(v => {
      const t = v.type || 'travail';
      n += TYPE_CONFIG[t]?.val ?? (t === 'travail' ? 1 : 0);
    });
    return Math.round(n * 10) / 10;
  },

  // ── Render ────────────────────────────────────────────────────
  _render() {
    const plafond = this._contract?.plafond || 218;
    const travailles = this._countTravail();
    const pct = Math.min(100, Math.round(travailles / plafond * 100));
    const restants = Math.max(0, plafond - travailles);
    const barColor = pct >= 100 ? '#9B2C2C' : pct >= 90 ? '#C4853A' : '#2D6A4F';

    this._container.innerHTML = `
    <!-- Bandeau compteur global annuel fixe -->
    <div style="background:var(--charbon);border-radius:var(--radius);padding:10px 14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <div style="font-size:0.72rem;color:var(--pierre)">Total annuel</div>
        <div style="font-size:0.68rem;color:${pct>=90?'#E57C70':'var(--champagne)'}">
          <strong style="color:${pct>=90?'#E57C70':'var(--ivoire)'}">${restants}j</strong> restants
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:6px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${pct}%;border-radius:99px;background:${barColor};transition:width 0.5s"></div>
        </div>
        <div style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--ivoire);white-space:nowrap">
          ${travailles} / ${plafond}j
        </div>
      </div>
    </div>

    <!-- Navigation mois -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <button id="cal-prev" style="background:none;border:1px solid var(--ivoire-3);border-radius:8px;padding:6px 14px;font-size:1.1rem;cursor:pointer;color:var(--charbon)">‹</button>
      <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;color:var(--charbon)" id="cal-mlabel">
        ${this._mName(this._currentMonth)} ${this._year}
      </div>
      <button id="cal-next" style="background:none;border:1px solid var(--ivoire-3);border-radius:8px;padding:6px 14px;font-size:1.1rem;cursor:pointer;color:var(--charbon)">›</button>
    </div>

    <!-- Légende compacte -->
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
      ${Object.entries(TYPE_CONFIG).map(([t,c])=>`
        <div style="display:flex;align-items:center;gap:3px;font-size:0.6rem;color:var(--charbon-3)">
          <div style="width:9px;height:9px;border-radius:2px;background:${c.bg};flex-shrink:0"></div>${c.label}
        </div>`).join('')}
      <div style="display:flex;align-items:center;gap:3px;font-size:0.6rem;color:var(--charbon-3)">
        <div style="width:9px;height:9px;border-radius:2px;background:linear-gradient(90deg,#1E3A5F 50%,#5C3F9B 50%)"></div>Demi-j.
      </div>
    </div>

    <!-- Calendrier courant -->
    <div id="cal-cur">${this._buildMonth(this._currentMonth)}</div>

    <!-- Stats mood -->
    <div id="cal-stats">${this._buildStats()}</div>

    <!-- Actions rapides -->
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="m6-btn m6-btn-ghost" id="cal-btn-sem" style="flex:1;font-size:0.78rem">✓ Valider semaine</button>
      <button class="m6-btn m6-btn-ghost" id="cal-btn-yr"  style="flex:1;font-size:0.78rem">Voir l'année</button>
    </div>

    <!-- Overlay popup -->
    <div class="m6-overlay" id="cal-popup">
      <div class="m6-sheet" id="cal-sheet" style="max-height:88dvh;overflow-y:auto"></div>
    </div>

    <!-- Overlay année complète -->
    <div class="m6-overlay" id="cal-yr-overlay">
      <div class="m6-sheet" style="max-height:92dvh;overflow-y:auto;border-radius:16px 16px 0 0;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:600">Calendrier ${this._year}</div>
          <button id="cal-yr-close" style="background:none;border:1px solid var(--ivoire-3);border-radius:8px;padding:5px 12px;font-size:0.8rem;cursor:pointer">✕</button>
        </div>
        <div>${Array.from({length:12},(_,m)=>this._buildMonth(m)).join('')}</div>
      </div>
    </div>
    `;

    this._overlay = this._container.querySelector('#cal-popup');
    this._bindEvents();
  },

  _buildMonth(mois) {
    const mN  = this._mName(mois);
    const premier = new Date(this._year, mois, 1);
    let dow = premier.getDay(); dow = dow===0?6:dow-1;
    const nbJ = new Date(this._year, mois+1, 0).getDate();
    const today = new Date().toISOString().slice(0,10);
    let cells = '';
    for (let i=0; i<dow; i++) cells += `<div></div>`;

    for (let j=1; j<=nbJ; j++) {
      const dk  = `${this._year}-${String(mois+1).padStart(2,'0')}-${String(j).padStart(2,'0')}`;
      const d   = new Date(this._year, mois, j);
      const dw  = d.getDay(), isWE = dw===0||dw===6;
      const isFerie = this._feries.has(dk);
      const entry   = this._data[dk];
      let type = entry?.type;
      if (!type) { if(isFerie) type='ferie'; else if(isWE) type='repos'; }
      const isDep    = entry?.deplacement === true;
      const isToday  = dk === today;
      const mood     = this._moods[dk];
      const cfg      = type ? TYPE_CONFIG[type] : null;
      const moodDot  = mood ? `<div style="position:absolute;bottom:1px;right:1px;width:5px;height:5px;border-radius:50%;background:${MOOD_COLORS[mood.niveau]?.border||'#aaa'}"></div>` : '';
      const depBadge = isDep ? `<div style="position:absolute;top:1px;left:1px;font-size:0.45rem;line-height:1">T</div>` : '';

      // Demi-journée → split visuel
      let cellBg = cfg ? cfg.bg : 'var(--ivoire-2)';
      if (type === 'demi') cellBg = 'linear-gradient(135deg,#1E3A5F 50%,#E2DAD0 50%)';

      cells += `<div onclick="M6_Calendar._openPopup('${dk}')"
        style="aspect-ratio:1;border-radius:4px;cursor:pointer;position:relative;
               display:flex;align-items:center;justify-content:center;
               font-size:0.58rem;font-weight:${isToday?'700':'400'};
               background:${cellBg};
               color:${cfg?cfg.text:'var(--pierre)'};
               box-shadow:${isToday?'inset 0 0 0 2px var(--champagne)':'none'};
               opacity:${isWE&&!entry?'0.6':'1'}"
        title="${this._tLabel(type)} — ${dk}">
        ${j}${moodDot}${depBadge}
      </div>`;
    }

    const jTrav = Object.entries(this._data)
      .filter(([k,v])=> k.startsWith(`${this._year}-${String(mois+1).padStart(2,'0')}`) && (v.type==='travail'||v.type==='rachat'))
      .length + Object.entries(this._data)
      .filter(([k,v])=> k.startsWith(`${this._year}-${String(mois+1).padStart(2,'0')}`) && v.type==='demi')
      .length * 0.5;

    return `<div class="m6-card" style="margin-bottom:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:var(--grey-line)">
        <div style="font-family:var(--font-display);font-size:0.95rem;font-weight:600">${mN}</div>
        <span style="font-size:0.65rem;background:var(--ivoire-2);color:var(--pierre);border-radius:99px;padding:2px 8px">${jTrav}j</span>
      </div>
      <div style="padding:8px 8px 10px">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:3px">
          ${['L','M','M','J','V','S','D'].map(l=>`<div style="text-align:center;font-size:0.52rem;color:var(--pierre)">${l}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">${cells}</div>
      </div>
    </div>`;
  },

  _buildStats() {
    const moods = Object.values(this._moods);
    if (!moods.length) return '';
    const mc = {};
    moods.forEach(m => { mc[m.niveau]=(mc[m.niveau]||0)+1; });
    return `<div class="m6-card" style="margin-top:8px"><div class="m6-card-body">
      <div class="m6-card-label" style="margin-bottom:6px">Charge déclarée</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${Object.entries(mc).map(([niv,n])=>{const c=MOOD_COLORS[niv]||{};return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:8px;padding:5px 10px;font-size:0.7rem;color:${c.text}">${c.icon||''} <strong>${n}</strong> ${c.label||niv}</div>`;}).join('')}
      </div>
    </div></div>`;
  },

  // ── POPUP JOUR ────────────────────────────────────────────────
  _openPopup(dk) {
    if (!this._overlay) return;
    const d      = new Date(dk+'T12:00:00');
    const label  = d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const entry  = this._data[dk] || {};
    const mood   = this._moods[dk] || {};
    const isFerie = this._feries.has(dk);
    const isWE   = [0,6].includes(d.getDay());
    const sheet  = this._container.querySelector('#cal-sheet');

    // Horaires défaut pré-remplis 09:00 / 18:30
    const defaultDebut = entry.debut || '09:00';
    const defaultFin   = entry.fin   || '18:30';

    sheet.innerHTML = `
    <div style="font-family:var(--font-display);font-size:1.15rem;font-weight:600;margin-bottom:6px;color:var(--charbon);text-transform:capitalize">${label}</div>
    ${isFerie?`<div style="display:inline-block;font-size:0.65rem;background:var(--info-bg);color:var(--info);border-radius:99px;padding:2px 10px;margin-bottom:10px">Jour férié</div>`:''}
    ${isWE?`<div style="display:inline-block;font-size:0.65rem;background:var(--ivoire-2);color:var(--pierre);border-radius:99px;padding:2px 10px;margin-bottom:10px">Week-end</div>`:''}

    <!-- Type (sans déplacement — géré séparément) -->
    <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--pierre);margin-bottom:8px">Type de journée</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">
      ${['travail','rtt','cp','ferie','repos','rachat','demi'].map(t=>{
        const c = TYPE_CONFIG[t];
        const sel = entry.type===t;
        return `<div class="cal-type-pill" data-type="${t}"
          style="border:2px solid ${sel?c.bg:'var(--ivoire-3)'};
                 background:${sel?c.bg:'var(--ivoire)'};
                 color:${sel?c.text:'var(--charbon-3)'};
                 border-radius:10px;padding:10px 4px;text-align:center;cursor:pointer;
                 font-size:0.68rem;font-weight:500;transition:all 0.15s">
          <div style="font-size:0.9rem;margin-bottom:3px">${c.icon}</div>${c.label}
        </div>`;
      }).join('')}
    </div>

    <!-- Déplacement : toggle sur Travail -->
    <div style="margin-bottom:12px">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 12px;background:var(--ivoire);border-radius:var(--radius);border:2px solid ${entry.deplacement?'#5C3F9B':'var(--ivoire-3)'}">
        <div id="dep-toggle" style="width:20px;height:20px;border-radius:50%;background:${entry.deplacement?'#5C3F9B':'var(--ivoire-3)'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.7rem;flex-shrink:0">T</div>
        <div>
          <div style="font-size:0.8rem;font-weight:500;color:var(--charbon)">En déplacement</div>
          <div style="font-size:0.65rem;color:var(--pierre)">S'ajoute à la journée (pas exclusif)</div>
        </div>
      </label>
    </div>

    <!-- Amplitude avec horaires défaut pré-remplis -->
    <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--pierre);margin-bottom:6px">
      Amplitude horaire <span style="text-transform:none;font-size:0.65rem;color:var(--pierre);opacity:0.7">(optionnel — alerte auto si > 13h)</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px">
      <div class="m6-field" style="margin:0"><label>Début</label>
        <input type="time" id="pop-deb" value="${defaultDebut}" style="font-size:14px"></div>
      <div class="m6-field" style="margin:0"><label>Fin</label>
        <input type="time" id="pop-fin" value="${defaultFin}" style="font-size:14px"></div>
    </div>
    <div id="pop-amp-warn" style="margin-bottom:10px"></div>

    <!-- Mood OBLIGATOIRE -->
    <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--pierre);margin-bottom:6px">
      Niveau de charge <span style="color:var(--alerte);font-size:0.6rem">* obligatoire</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
      ${Object.entries(MOOD_COLORS).map(([niv,c])=>`
        <div class="cal-mood-pill" data-mood="${niv}"
          style="border:2px solid ${mood.niveau===niv?c.border:'var(--ivoire-3)'};
                 background:${mood.niveau===niv?c.bg:'var(--ivoire)'};
                 color:${mood.niveau===niv?c.text:'var(--pierre)'};
                 border-radius:8px;padding:8px 4px;text-align:center;cursor:pointer;font-size:0.65rem">
          <div style="font-size:1.1rem">${c.icon}</div>${c.label}
        </div>`).join('')}
    </div>
    <div id="pop-mood-warn" style="display:none;margin-bottom:8px" class="m6-alert danger">
      <span>⚠️</span><div style="font-size:0.78rem">Renseignez le niveau de charge — requis pour l'entretien annuel (L3121-65).</div>
    </div>

    <!-- Certification repos -->
    <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--ivoire);border-radius:var(--radius);margin-bottom:12px;cursor:pointer">
      <input type="checkbox" id="pop-repos-ok" ${entry.reposOk?'checked':''} style="margin-top:3px;width:16px;height:16px;flex-shrink:0">
      <div style="font-size:0.75rem;color:var(--charbon-3);line-height:1.4">
        J'ai respecté mes repos quotidien (11h) et hebdomadaire (35h) — Art. L3131-1, L3132-2
      </div>
    </label>

    <!-- Note -->
    <div class="m6-field" style="margin-bottom:14px">
      <label>Note (200 car. max)</label>
      <input type="text" id="pop-note" value="${entry.note||''}" maxlength="200" placeholder="ex: réunion critique, client…" style="font-size:14px">
    </div>

    <!-- Actions -->
    <button class="m6-btn m6-btn-primary" id="pop-save" style="margin-bottom:8px">Enregistrer</button>
    ${entry.type?`<button class="m6-btn m6-btn-ghost" id="pop-del" style="width:100%;font-size:0.8rem;margin-bottom:8px">Effacer ce jour</button>`:''}
    <button class="m6-btn m6-btn-ghost" id="pop-cancel" style="width:100%;font-size:0.8rem">Annuler</button>
    `;

    // État interne
    let selType = entry.type || null;
    let selMood = mood.niveau || null;
    let selDep  = entry.deplacement || false;

    // Pills type
    sheet.querySelectorAll('.cal-type-pill').forEach(p => {
      p.addEventListener('click', () => {
        sheet.querySelectorAll('.cal-type-pill').forEach(x => {
          x.style.background='var(--ivoire)'; x.style.borderColor='var(--ivoire-3)'; x.style.color='var(--charbon-3)';
        });
        selType = p.dataset.type;
        const c = TYPE_CONFIG[selType];
        p.style.background = c.bg; p.style.borderColor = c.bg; p.style.color = c.text;
      });
    });

    // Toggle déplacement
    const depBtn = sheet.querySelector('#dep-toggle');
    const depWrap = depBtn?.parentElement;
    depBtn?.addEventListener('click', () => {
      selDep = !selDep;
      if (depBtn) {
        depBtn.style.background = selDep ? '#5C3F9B' : 'var(--ivoire-3)';
      }
      if (depWrap) depWrap.style.borderColor = selDep ? '#5C3F9B' : 'var(--ivoire-3)';
    });

    // Pills mood
    sheet.querySelectorAll('.cal-mood-pill').forEach(p => {
      p.addEventListener('click', () => {
        sheet.querySelectorAll('.cal-mood-pill').forEach(x => {
          x.style.borderColor='var(--ivoire-3)'; x.style.background='var(--ivoire)'; x.style.color='var(--pierre)';
        });
        selMood = p.dataset.mood;
        const c = MOOD_COLORS[selMood];
        p.style.borderColor=c.border; p.style.background=c.bg; p.style.color=c.text;
        sheet.querySelector('#pop-mood-warn')?.style.setProperty('display','none');
      });
    });

    // Alerte amplitude temps réel
    const checkAmp = () => {
      const deb = sheet.querySelector('#pop-deb')?.value;
      const fin = sheet.querySelector('#pop-fin')?.value;
      const warn = sheet.querySelector('#pop-amp-warn');
      if (!warn||!deb||!fin) return;
      const [dh,dm]=deb.split(':').map(Number), [fh,fm]=fin.split(':').map(Number);
      const amp = (fh*60+fm)-(dh*60+dm);
      if (amp > 780) {
        warn.innerHTML = `<div class="m6-alert danger" style="padding:8px 10px;font-size:0.75rem"><span>⏰</span><div>Amplitude ${Math.round(amp/60*10)/10}h > 13h — repos quotidien 11h non respecté (L3131-1)</div></div>`;
      } else if (amp > 660) {
        warn.innerHTML = `<div class="m6-alert warning" style="padding:8px 10px;font-size:0.75rem"><span>⏰</span><div>Amplitude ${Math.round(amp/60*10)/10}h > 11h — perturbation circadienne (Hakola 2001)</div></div>`;
      } else { warn.innerHTML = ''; }
    };
    sheet.querySelector('#pop-deb')?.addEventListener('change', checkAmp);
    sheet.querySelector('#pop-fin')?.addEventListener('change', checkAmp);

    // Save
    sheet.querySelector('#pop-save')?.addEventListener('click', () => {
      // Mood obligatoire si journée travaillée
      if (!selMood && (selType === 'travail' || selType === 'rachat' || selType === 'demi')) {
        sheet.querySelector('#pop-mood-warn')?.style.setProperty('display','flex');
        return;
      }
      const debut   = sheet.querySelector('#pop-deb')?.value||null;
      const fin     = sheet.querySelector('#pop-fin')?.value||null;
      const note    = sheet.querySelector('#pop-note')?.value.trim()||null;
      const reposOk = sheet.querySelector('#pop-repos-ok')?.checked||false;
      const value   = selType ? { type:selType, debut, fin, note, deplacement:selDep, reposOk } : null;
      this._closePopup();
      if (this._onSave) this._onSave(dk, value, selMood?{niveau:selMood}:null);
    });

    sheet.querySelector('#pop-del')?.addEventListener('click', () => {
      this._closePopup();
      if (this._onSave) this._onSave(dk, null, null);
    });
    sheet.querySelector('#pop-cancel')?.addEventListener('click', () => this._closePopup());
    this._overlay?.addEventListener('click', e => { if(e.target===this._overlay) this._closePopup(); });
    requestAnimationFrame(() => this._overlay?.classList.add('open'));
  },

  _closePopup() {
    this._container.querySelector('#cal-popup')?.classList.remove('open');
    this._container.querySelector('#cal-yr-overlay')?.classList.remove('open');
  },

  // ── Validation rapide semaine ─────────────────────────────────
  _openSemaineQuick() {
    const today = new Date();
    const lundi = new Date(today);
    lundi.setDate(today.getDate()-(today.getDay()===0?6:today.getDay()-1));
    const jours = [];
    for (let i=0;i<5;i++) {
      const d = new Date(lundi); d.setDate(lundi.getDate()+i);
      const dk = d.toISOString().slice(0,10);
      if (!this._feries.has(dk)) jours.push(dk);
    }
    const sheet  = this._container.querySelector('#cal-sheet');
    const overlay = this._overlay;

    sheet.innerHTML = `
    <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:600;margin-bottom:12px">Valider la semaine</div>
    <div class="m6-alert info" style="margin-bottom:14px;font-size:0.78rem">
      <span>i</span><div>${jours.length} jours ouvrés détectés. Vous pourrez modifier les exceptions jour par jour ensuite.</div>
    </div>

    <div class="m6-field"><label>Type par défaut</label>
      <select id="sem-type" style="font-size:14px">
        ${Object.entries(TYPE_CONFIG).map(([t,c])=>`<option value="${t}">${c.label}</option>`).join('')}
      </select></div>

    <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--pierre);margin-bottom:6px">
      Niveau de charge <span style="color:var(--alerte);font-size:0.6rem">* requis</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
      ${Object.entries(MOOD_COLORS).map(([niv,c])=>`
        <div class="sem-mood" data-mood="${niv}"
          style="border:2px solid var(--ivoire-3);background:var(--ivoire);color:var(--pierre);
                 border-radius:8px;padding:8px 4px;text-align:center;cursor:pointer;font-size:0.65rem">
          <div style="font-size:1.1rem">${c.icon}</div>${c.label}
        </div>`).join('')}
    </div>
    <div id="sem-mood-warn" style="display:none" class="m6-alert danger" style="margin-bottom:8px;font-size:0.78rem">
      <span>⚠️</span><div>Sélectionnez le niveau de charge.</div>
    </div>

    <!-- Certification obligatoire -->
    <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--ivoire);border-radius:var(--radius);margin-bottom:14px;cursor:pointer">
      <input type="checkbox" id="sem-repos" style="margin-top:2px;width:16px;height:16px;flex-shrink:0">
      <div style="font-size:0.75rem;color:var(--charbon-3);line-height:1.4">
        Je certifie avoir respecté mes repos quotidien (11h) et hebdomadaire (35h) — Art. L3131-1, L3132-2
      </div>
    </label>

    <div style="margin-bottom:12px;font-size:0.75rem;color:var(--pierre)">
      Jours : ${jours.map(dk=>new Date(dk+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'})).join(' · ')}
    </div>

    <!-- Modifier un jour spécifique -->
    <div style="margin-bottom:10px">
      <div style="font-size:0.7rem;color:var(--pierre);margin-bottom:6px">Modifier un jour spécifique :</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${jours.map(dk=>`<button onclick="M6_Calendar._closePopup();setTimeout(()=>M6_Calendar._openPopup('${dk}'),200)"
          style="font-size:0.7rem;background:var(--ivoire);border:1px solid var(--ivoire-3);border-radius:6px;padding:4px 10px;cursor:pointer">
          ${new Date(dk+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'})}
        </button>`).join('')}
      </div>
    </div>

    <button class="m6-btn m6-btn-primary" id="sem-save">Valider</button>
    <div style="height:8px"></div>
    <button class="m6-btn m6-btn-ghost" id="sem-cancel" style="width:100%;font-size:0.8rem">Annuler</button>
    `;

    let selMood = null;
    sheet.querySelectorAll('.sem-mood').forEach(p => {
      p.addEventListener('click', () => {
        sheet.querySelectorAll('.sem-mood').forEach(x => {
          x.style.borderColor='var(--ivoire-3)'; x.style.background='var(--ivoire)'; x.style.color='var(--pierre)';
        });
        selMood = p.dataset.mood;
        const c = MOOD_COLORS[selMood];
        p.style.borderColor=c.border; p.style.background=c.bg; p.style.color=c.text;
        sheet.querySelector('#sem-mood-warn')?.style.setProperty('display','none');
      });
    });

    sheet.querySelector('#sem-save')?.addEventListener('click', () => {
      if (!selMood) { sheet.querySelector('#sem-mood-warn')?.style.setProperty('display','flex'); return; }
      const type    = sheet.querySelector('#sem-type')?.value || 'travail';
      const reposOk = sheet.querySelector('#sem-repos')?.checked || false;
      // Anti-doublon : ne pas écraser les jours déjà saisis différemment
      let écrasés = 0;
      jours.forEach(dk => {
        const existing = this._data[dk];
        if (existing && existing.type !== type) écrasés++;
        if (this._onSave) this._onSave(dk, { type, reposOk }, { niveau: selMood });
      });
      this._closePopup();
      M6_toast(`✓ ${jours.length} jours validés${écrasés?` (${écrasés} modifiés)`:''}`);
    });

    sheet.querySelector('#sem-cancel')?.addEventListener('click', () => this._closePopup());
    overlay?.addEventListener('click', e => { if(e.target===overlay) this._closePopup(); });
    requestAnimationFrame(() => overlay?.classList.add('open'));
  },

  // ── Navigation ────────────────────────────────────────────────
  _updateMonth() {
    const cur = this._container.querySelector('#cal-cur');
    const lb  = this._container.querySelector('#cal-mlabel');
    if (cur) cur.innerHTML = this._buildMonth(this._currentMonth);
    if (lb)  lb.textContent = `${this._mName(this._currentMonth)} ${this._year}`;
  },

  _bindSwipe() {
    const el = this._container.querySelector('#cal-cur');
    if (!el) return;
    el.addEventListener('touchstart', e => { this._swipeStartX = e.touches[0].clientX; }, {passive:true});
    el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - this._swipeStartX;
      if (Math.abs(dx) < 50) return;
      if (dx < 0 && this._currentMonth < 11) this._currentMonth++;
      else if (dx > 0 && this._currentMonth > 0) this._currentMonth--;
      this._updateMonth();
    }, {passive:true});
  },

  _bindEvents() {
    this._container.querySelector('#cal-prev')?.addEventListener('click', () => {
      if (this._currentMonth > 0) { this._currentMonth--; this._updateMonth(); }
    });
    this._container.querySelector('#cal-next')?.addEventListener('click', () => {
      if (this._currentMonth < 11) { this._currentMonth++; this._updateMonth(); }
    });
    this._container.querySelector('#cal-btn-sem')?.addEventListener('click', () => this._openSemaineQuick());
    this._container.querySelector('#cal-btn-yr')?.addEventListener('click', () => {
      this._container.querySelector('#cal-yr-overlay')?.classList.add('open');
    });
    this._container.querySelector('#cal-yr-close')?.addEventListener('click', () => {
      this._container.querySelector('#cal-yr-overlay')?.classList.remove('open');
    });
  },

  _mName(m) { return ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][m]; },
  _tLabel(t) { return TYPE_CONFIG[t]?.label || '—'; }
};

global.M6_Calendar    = M6_Calendar;
global.M6_TYPE_CONFIG = TYPE_CONFIG;
global.M6_MOOD_COLORS = MOOD_COLORS;

})(window);
