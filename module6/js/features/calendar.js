/**
 * CALENDAR M6 — Calendrier complet avec popup riche
 * Mood tracking · Amplitude heure debut/fin · 1-clic semaine · Swipe
 * Couleurs douces (vert de gris, ambre, bleu nuit) — style bienveillant
 */
'use strict';

(function(global) {

// ── Palette douce (non anxiogène) ────────────────────────────────
const MOOD_COLORS = {
  faible:   { bg:'#E8F5F0', border:'#4A7C6F', text:'#2D5A4E', label:'Légère',   icon:'🌿' },
  ok:       { bg:'#EEF3FA', border:'#3B6098', text:'#1E3A5F', label:'Normale',   icon:'✓'  },
  elevé:    { bg:'#FFF7E6', border:'#C4853A', text:'#8B5A1A', label:'Soutenue',  icon:'⚡' },
  critique: { bg:'#FFF0EE', border:'#B85C50', text:'#7A3028', label:'Critique',  icon:'🔥' },
};

const TYPE_CONFIG = {
  travail: { icon:'💼', label:'Travail',    bg:'#1E3A5F', border:'#2C4F7C', text:'#fff' },
  rtt:     { icon:'🌿', label:'RTT',        bg:'#4A7C6F', border:'#3A6A5F', text:'#fff' },
  cp:      { icon:'✈️',  label:'Congé',     bg:'#2D6A4F', border:'#1E5A3F', text:'#fff' },
  ferie:   { icon:'🎉', label:'Férié',      bg:'#3B6098', border:'#2C4F7C', text:'#fff' },
  repos:   { icon:'😴', label:'Repos',      bg:'#6B7280', border:'#4B5563', text:'#fff' },
  rachat:  { icon:'💰', label:'Rachat',     bg:'#C4853A', border:'#A06428', text:'#fff' },
  demi:    { icon:'◑',  label:'Demi-journée',bg:'#5C3F9B',border:'#4A2F7C', text:'#fff' },
  deplacement:{ icon:'🚆',label:'Déplacement',bg:'#7C3D8F',border:'#6A2D7C', text:'#fff' },
};

const M6_Calendar = {

  _container: null,
  _regime: null,
  _year: null,
  _data: {},
  _moods: {},
  _feries: null,
  _onSave: null,
  _overlay: null,
  _currentMonth: null,
  _swipeStartX: 0,

  // ── Init ──────────────────────────────────────────────────────
  init(container, regime, year, data, moods, onSave) {
    this._container = container;
    this._regime    = regime;
    this._year      = year;
    this._data      = data || {};
    this._moods     = moods || {};
    this._feries    = M6_Feries.getSet(year);
    this._onSave    = onSave;
    this._currentMonth = new Date().getMonth();
    this._render();
    this._bindSwipe();
  },

  refresh(data, moods) {
    this._data  = data || {};
    this._moods = moods || {};
    this._render();
  },

  // ── Render ────────────────────────────────────────────────────
  _render() {
    const months = [];
    for (let m = 0; m < 12; m++) months.push(this._buildMonth(m));
    const stats = this._buildStats();

    this._container.innerHTML = `
    <!-- Navigation mois -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <button id="cal-prev-month" class="m6-btn m6-btn-ghost" style="padding:8px 14px;font-size:1rem">‹</button>
      <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;color:var(--charbon)" id="cal-month-label">
        ${this._monthName(this._currentMonth)} ${this._year}
      </div>
      <button id="cal-next-month" class="m6-btn m6-btn-ghost" style="padding:8px 14px;font-size:1rem">›</button>
    </div>

    <!-- Légende -->
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
      ${Object.entries(TYPE_CONFIG).map(([t,c]) => `
        <div style="display:flex;align-items:center;gap:4px;font-size:0.65rem;color:var(--pierre)">
          <div style="width:10px;height:10px;border-radius:2px;background:${c.bg}"></div>${c.label}
        </div>`).join('')}
    </div>

    <!-- Calendrier courant -->
    <div id="cal-current-month">${months[this._currentMonth]}</div>

    <!-- Stats annuelles -->
    <div id="cal-stats">${stats}</div>

    <!-- Actions rapides -->
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
      <button class="m6-btn m6-btn-ghost" id="cal-btn-semaine" style="flex:1;font-size:0.8rem">
        ✓ Valider semaine en 1 clic
      </button>
      <button class="m6-btn m6-btn-ghost" id="cal-btn-all-months" style="flex:1;font-size:0.8rem">
        📅 Voir toute l'année
      </button>
    </div>

    <!-- Overlay popup -->
    <div class="m6-overlay" id="cal-popup">
      <div class="m6-sheet" id="cal-sheet" style="max-height:85dvh;overflow-y:auto"></div>
    </div>

    <!-- Overlay toute l'année -->
    <div class="m6-overlay" id="cal-fullyr-overlay">
      <div class="m6-sheet" style="max-height:90dvh;overflow-y:auto;border-radius:16px 16px 0 0;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="m6-ornement-text" style="font-family:var(--font-display);font-size:1.2rem;font-weight:600">Calendrier ${this._year}</div>
          <button id="cal-fullyr-close" class="m6-btn m6-btn-ghost" style="padding:6px 12px;font-size:0.8rem">✕ Fermer</button>
        </div>
        <div id="cal-fullyr-body">${months.join('')}</div>
      </div>
    </div>
    `;

    this._overlay = this._container.querySelector('#cal-popup');
    this._bindEvents();
  },

  _buildMonth(mois) {
    const labels = ['L','M','M','J','V','S','D'];
    const mName  = this._monthName(mois);
    const premier = new Date(this._year, mois, 1);
    let dow = premier.getDay(); // 0=dim
    dow = dow === 0 ? 6 : dow - 1; // lundi=0
    const nbJ  = new Date(this._year, mois+1, 0).getDate();
    const today = new Date().toISOString().slice(0,10);
    let cells = '';

    for (let i = 0; i < dow; i++) cells += `<div style="aspect-ratio:1"></div>`;

    for (let j = 1; j <= nbJ; j++) {
      const dk  = `${this._year}-${String(mois+1).padStart(2,'0')}-${String(j).padStart(2,'0')}`;
      const d   = new Date(this._year, mois, j);
      const dow2 = d.getDay();
      const isWE = dow2===0||dow2===6;
      const isFerie = this._feries.has(dk);
      const entry  = this._data[dk];
      let type     = entry?.type;
      if (!type) { if (isFerie) type='ferie'; else if (isWE) type='repos'; }
      const mood = this._moods[dk];
      const isToday = dk === today;
      const cfg = type ? TYPE_CONFIG[type] : null;
      const moodDot = mood ? `<div style="position:absolute;bottom:1px;right:1px;width:5px;height:5px;border-radius:50%;background:${MOOD_COLORS[mood.niveau]?.border||'#ccc'}"></div>` : '';

      cells += `
        <div onclick="M6_Calendar._openPopup('${dk}')"
          style="
            aspect-ratio:1;border-radius:4px;cursor:pointer;position:relative;
            display:flex;align-items:center;justify-content:center;
            font-size:0.62rem;font-weight:${isToday?'700':'400'};
            background:${cfg?cfg.bg:'var(--ivoire-2)'};
            color:${cfg?cfg.text:'var(--pierre)'};
            box-shadow:${isToday?'inset 0 0 0 2px var(--champagne)':isWE&&!cfg?'inset 0 0 0 1px var(--ivoire-3)':'none'};
            transition:opacity 0.15s;
          "
          title="${this._typeLabel(type)}${isFerie?' (Férié)':''} — ${dk}"
        >
          ${j}${moodDot}
        </div>`;
    }

    const jTravailles = Object.entries(this._data)
      .filter(([k,v]) => k.startsWith(`${this._year}-${String(mois+1).padStart(2,'0')}`) && ['travail','rachat'].includes(v.type||'travail'))
      .length;

    return `
    <div class="m6-card" style="margin-bottom:10px">
      <div class="m6-card-header" style="padding:10px 12px">
        <div style="flex:1">
          <div class="m6-card-label">${this._year}</div>
          <div class="m6-card-title">${mName}</div>
        </div>
        <span class="m6-badge m6-badge-neutral">${jTravailles}j travaillés</span>
      </div>
      <div style="padding:8px 10px 10px">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:2px">
          ${labels.map(l=>`<div style="text-align:center;font-size:0.55rem;color:var(--pierre);padding:2px 0;text-transform:uppercase">${l}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">${cells}</div>
      </div>
    </div>`;
  },

  _buildStats() {
    const counts = {};
    Object.values(this._data).forEach(v => {
      const t = v.type||'travail';
      counts[t] = (counts[t]||0)+1;
    });
    const moods = Object.values(this._moods);
    const moodCounts = {};
    moods.forEach(m => { moodCounts[m.niveau] = (moodCounts[m.niveau]||0)+1; });
    if (!moods.length) return '';
    return `
    <div class="m6-card" style="margin-top:10px">
      <div class="m6-card-body">
        <div class="m6-card-label" style="margin-bottom:8px">Répartition de la charge</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${Object.entries(moodCounts).map(([niv,n]) => {
            const c = MOOD_COLORS[niv]||{};
            return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:8px;padding:6px 10px;font-size:0.72rem;color:${c.text}">
              ${c.icon||''} ${c.label||niv} <strong>${n}j</strong>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  },

  // ── Popup jour ────────────────────────────────────────────────
  _openPopup(dk) {
    if (!this._overlay) return;
    const d = new Date(dk+'T12:00:00');
    const label = d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const entry = this._data[dk] || {};
    const mood  = this._moods[dk] || {};
    const isFerie = this._feries.has(dk);
    const isWE = [0,6].includes(d.getDay());
    const sheet = this._container.querySelector('#cal-sheet');

    sheet.innerHTML = `
    <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:600;margin-bottom:4px;color:var(--charbon)">${label}</div>
    ${isFerie ? '<div class="m6-badge m6-badge-champagne" style="margin-bottom:12px">🎉 Jour férié</div>' : ''}
    ${isWE    ? '<div class="m6-badge m6-badge-neutral"  style="margin-bottom:12px">😴 Week-end</div>' : ''}

    <!-- Type de journée -->
    <div class="m6-card-label" style="margin-bottom:8px">Type de journée</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px">
      ${Object.entries(TYPE_CONFIG).map(([t,c]) => `
        <div class="m6-type-pill ${entry.type===t?`selected-${t}`:''}"
             data-type="${t}"
             style="${entry.type===t?`background:${c.bg};border-color:${c.border};color:${c.text}`:''};font-size:0.65rem;padding:8px 4px">
          <span style="font-size:1rem">${c.icon}</span>${c.label}
        </div>`).join('')}
    </div>

    <!-- Amplitude (optionnel) -->
    <div class="m6-card-label" style="margin-bottom:8px">Amplitude horaire (optionnel)</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div class="m6-field" style="margin:0">
        <label>Début</label>
        <input type="time" id="popup-debut" value="${entry.debut||''}" style="font-size:14px">
      </div>
      <div class="m6-field" style="margin:0">
        <label>Fin</label>
        <input type="time" id="popup-fin" value="${entry.fin||''}" style="font-size:14px">
      </div>
    </div>
    <div id="popup-amplitude-warn" style="margin-bottom:10px"></div>

    <!-- Mood / charge -->
    <div class="m6-card-label" style="margin-bottom:8px">Niveau de charge ressentie</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px">
      ${Object.entries(MOOD_COLORS).map(([niv,c]) => `
        <div class="mood-pill" data-mood="${niv}"
          style="border:2px solid ${mood.niveau===niv?c.border:'var(--ivoire-3)'};
                 background:${mood.niveau===niv?c.bg:'var(--ivoire)'};
                 color:${mood.niveau===niv?c.text:'var(--pierre)'};
                 border-radius:8px;padding:8px 4px;text-align:center;cursor:pointer;
                 font-size:0.65rem;transition:all 0.15s">
          <div style="font-size:1.1rem">${c.icon}</div>${c.label}
        </div>`).join('')}
    </div>

    <!-- Note -->
    <div class="m6-field" style="margin-bottom:14px">
      <label>Note / contexte (optionnel)</label>
      <input type="text" id="popup-note" value="${entry.note||''}" placeholder="ex: déplacement, réunion critique…" style="font-size:14px">
    </div>

    <!-- Actions -->
    <button class="m6-btn m6-btn-primary" id="popup-save" style="margin-bottom:8px">Enregistrer</button>
    ${entry.type ? `<button class="m6-btn m6-btn-ghost" id="popup-del" style="width:100%;font-size:0.8rem;margin-bottom:8px">🗑️ Effacer ce jour</button>` : ''}
    <button class="m6-btn m6-btn-ghost" id="popup-cancel" style="width:100%;font-size:0.8rem">Annuler</button>
    `;

    // Bind pills type
    let selectedType = entry.type || null;
    let selectedMood = mood.niveau || null;

    sheet.querySelectorAll('.m6-type-pill').forEach(p => {
      p.addEventListener('click', () => {
        sheet.querySelectorAll('.m6-type-pill').forEach(x => {
          x.className = 'm6-type-pill'; x.style.background=''; x.style.borderColor=''; x.style.color='';
        });
        selectedType = p.dataset.type;
        const cfg = TYPE_CONFIG[selectedType];
        p.style.background = cfg.bg; p.style.borderColor = cfg.border; p.style.color = cfg.text;
      });
    });

    // Bind pills mood
    sheet.querySelectorAll('.mood-pill').forEach(p => {
      p.addEventListener('click', () => {
        sheet.querySelectorAll('.mood-pill').forEach(x => {
          x.style.borderColor='var(--ivoire-3)'; x.style.background='var(--ivoire)'; x.style.color='var(--pierre)';
        });
        selectedMood = p.dataset.mood;
        const c = MOOD_COLORS[selectedMood];
        p.style.borderColor = c.border; p.style.background = c.bg; p.style.color = c.text;
      });
    });

    // Alerte amplitude en temps réel
    const checkAmp = () => {
      const deb = sheet.querySelector('#popup-debut')?.value;
      const fin = sheet.querySelector('#popup-fin')?.value;
      const warn = sheet.querySelector('#popup-amplitude-warn');
      if (deb && fin) {
        const [dh,dm]=[...deb.split(':').map(Number)],[fh,fm]=[...fin.split(':').map(Number)];
        const amp = (fh*60+fm)-(dh*60+dm);
        if (amp > 780) { // 13h
          if(warn) warn.innerHTML = `<div class="m6-alert warning" style="font-size:0.75rem;padding:8px 10px"><span>⏰</span> Amplitude ${Math.round(amp/60*10)/10}h > 13h — repos quotidien à risque (L3131-1)</div>`;
        } else if (warn) warn.innerHTML = '';
      }
    };
    sheet.querySelector('#popup-debut')?.addEventListener('change', checkAmp);
    sheet.querySelector('#popup-fin')?.addEventListener('change', checkAmp);

    // Save
    sheet.querySelector('#popup-save')?.addEventListener('click', () => {
      const debut = sheet.querySelector('#popup-debut')?.value || null;
      const fin   = sheet.querySelector('#popup-fin')?.value   || null;
      const note  = sheet.querySelector('#popup-note')?.value.trim() || null;
      const value = selectedType ? { type:selectedType, debut, fin, note } : null;
      this._closePopup();
      if (this._onSave) this._onSave(dk, value, selectedMood);
    });

    // Del
    sheet.querySelector('#popup-del')?.addEventListener('click', () => {
      this._closePopup();
      if (this._onSave) this._onSave(dk, null, null);
    });

    sheet.querySelector('#popup-cancel')?.addEventListener('click', () => this._closePopup());
    this._overlay.addEventListener('click', e => { if(e.target===this._overlay) this._closePopup(); });

    requestAnimationFrame(() => this._overlay.classList.add('open'));
  },

  _closePopup() {
    this._container.querySelector('#cal-popup')?.classList.remove('open');
    this._container.querySelector('#cal-fullyr-overlay')?.classList.remove('open');
  },

  // ── 1-clic semaine ────────────────────────────────────────────
  _openSemaineQuick() {
    const today = new Date();
    const lundi = new Date(today);
    lundi.setDate(today.getDate() - (today.getDay()===0?6:today.getDay()-1));
    const overlay = this._container.querySelector('#cal-popup');
    const sheet   = this._container.querySelector('#cal-sheet');
    const jours = [];
    for (let i=0;i<5;i++) {
      const d = new Date(lundi); d.setDate(lundi.getDate()+i);
      const dk = d.toISOString().slice(0,10);
      if (!this._feries.has(dk)) jours.push(dk);
    }
    sheet.innerHTML = `
    <div class="m6-sheet-title">✓ Valider la semaine</div>
    <div class="m6-alert info" style="margin-bottom:14px;font-size:0.8rem">
      <span>ℹ️</span><div>Validation rapide des ${jours.length} jours ouvrés de la semaine en cours.<br>Modifiez les exceptions manuellement ensuite.</div>
    </div>
    <div class="m6-field">
      <label>Type par défaut pour tous les jours</label>
      <select id="semaine-type" style="font-size:14px">
        ${Object.entries(TYPE_CONFIG).map(([t,c])=>`<option value="${t}">${c.icon} ${c.label}</option>`).join('')}
      </select>
    </div>
    <div class="m6-field">
      <label>Niveau de charge (semaine)</label>
      <select id="semaine-mood" style="font-size:14px">
        <option value="">— Non renseigné —</option>
        ${Object.entries(MOOD_COLORS).map(([n,c])=>`<option value="${n}">${c.icon} ${c.label}</option>`).join('')}
      </select>
    </div>
    <div style="margin-bottom:14px;font-size:0.8rem;color:var(--pierre)">
      Jours concernés : ${jours.map(dk=>new Date(dk+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'})).join(', ')}
    </div>
    <button class="m6-btn m6-btn-primary" id="semaine-save">Valider</button>
    <div style="height:8px"></div>
    <button class="m6-btn m6-btn-ghost" id="semaine-cancel" style="width:100%">Annuler</button>
    `;
    sheet.querySelector('#semaine-save').addEventListener('click', () => {
      const type = sheet.querySelector('#semaine-type')?.value;
      const mood = sheet.querySelector('#semaine-mood')?.value;
      jours.forEach(dk => {
        if (this._onSave) this._onSave(dk, { type }, mood || null);
      });
      this._closePopup();
      M6_toast(`✓ ${jours.length} jours validés`);
    });
    sheet.querySelector('#semaine-cancel').addEventListener('click', () => this._closePopup());
    overlay.addEventListener('click', e => { if(e.target===overlay) this._closePopup(); });
    requestAnimationFrame(() => overlay.classList.add('open'));
  },

  // ── Swipe ────────────────────────────────────────────────────
  _bindSwipe() {
    const el = this._container.querySelector('#cal-current-month');
    if (!el) return;
    el.addEventListener('touchstart', e => { this._swipeStartX = e.touches[0].clientX; }, {passive:true});
    el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - this._swipeStartX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0 && this._currentMonth < 11) this._currentMonth++;
      else if (dx > 0 && this._currentMonth > 0) this._currentMonth--;
      this._updateCurrentMonth();
    }, {passive:true});
  },

  _updateCurrentMonth() {
    const el = this._container.querySelector('#cal-current-month');
    const lb = this._container.querySelector('#cal-month-label');
    if (el) el.innerHTML = this._buildMonth(this._currentMonth);
    if (lb) lb.textContent = `${this._monthName(this._currentMonth)} ${this._year}`;
    // Rebind cells
    el?.querySelectorAll('[onclick]').forEach(c => {
      const dk = c.getAttribute('onclick')?.match(/'([\d-]+)'/)?.[1];
      if (dk) c.addEventListener('click', () => this._openPopup(dk));
    });
  },

  _bindEvents() {
    this._container.querySelector('#cal-prev-month')?.addEventListener('click', () => {
      if (this._currentMonth > 0) { this._currentMonth--; this._updateCurrentMonth(); }
    });
    this._container.querySelector('#cal-next-month')?.addEventListener('click', () => {
      if (this._currentMonth < 11) { this._currentMonth++; this._updateCurrentMonth(); }
    });
    this._container.querySelector('#cal-btn-semaine')?.addEventListener('click', () => this._openSemaineQuick());
    this._container.querySelector('#cal-btn-all-months')?.addEventListener('click', () => {
      this._container.querySelector('#cal-fullyr-overlay')?.classList.add('open');
    });
    this._container.querySelector('#cal-fullyr-close')?.addEventListener('click', () => {
      this._container.querySelector('#cal-fullyr-overlay')?.classList.remove('open');
    });
  },

  // ── Helpers ──────────────────────────────────────────────────
  _monthName(m) {
    return ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][m];
  },
  _typeLabel(type) {
    return TYPE_CONFIG[type]?.label || '—';
  }
};

// Exposer pour onclick HTML inline
global.M6_Calendar     = M6_Calendar;
global.M6_TYPE_CONFIG  = TYPE_CONFIG;
global.M6_MOOD_COLORS  = MOOD_COLORS;

})(window);
