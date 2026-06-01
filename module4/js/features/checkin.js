/* ── SAFE localStorage WRAPPER (iOS Private Mode) ─────────────── */
const _safeLS = {
  get: (k, def='') => { try { return localStorage.getItem(k) ?? def; } catch(_) { return def; } },
  set: (k, v)      => { try { localStorage.setItem(k, v); } catch(_) {} },
  del: (k)         => { try { localStorage.removeItem(k); } catch(_) {} },
  json:(k, def={}) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch(_) { return def; } },
};

/**
 * Check-in quotidien v2 — statut jour + créneau horaire + bien-être
 * Reset automatique à 00h00
 */
(function(global){
'use strict';

const QUESTIONS_WELLBEING = [
  {id:'sleep',  text:'Comment avez-vous dormi cette nuit ?', emoji:'😴',
    opts:[{v:0,e:'😵',l:'Très mal (< 4h)'},{v:1,e:'😞',l:'Mal (4-5h)'},{v:2,e:'😐',l:'Moyen (6h)'},{v:3,e:'😊',l:'Bien (7h)'},{v:4,e:'😄',l:'Très bien (8h+)'}]},
  {id:'energy', text:'Quel est votre niveau d\'énergie ?', emoji:'⚡',
    opts:[{v:0,e:'💀',l:'Épuisé'},{v:1,e:'😴',l:'Fatigué'},{v:2,e:'😐',l:'Neutre'},{v:3,e:'😊',l:'Énergique'},{v:4,e:'🔥',l:'Excellent'}]},
  {id:'stress', text:'Quel est votre niveau de stress ?', emoji:'😰',
    opts:[{v:0,e:'😌',l:'Aucun'},{v:1,e:'🙂',l:'Léger'},{v:2,e:'😐',l:'Modéré'},{v:3,e:'😟',l:'Élevé'},{v:4,e:'😱',l:'Critique'}]},
  {id:'pain',   text:'Ressentez-vous des douleurs physiques ?', emoji:'🩹',
    opts:[{v:0,e:'✅',l:'Aucune'},{v:1,e:'🟡',l:'Légère'},{v:2,e:'🟠',l:'Modérée'},{v:3,e:'🔴',l:'Forte'},{v:4,e:'🚨',l:'Intense'}]},
  {id:'motiv',  text:'Votre motivation aujourd\'hui ?', emoji:'🎯',
    opts:[{v:0,e:'😶',l:'Inexistante'},{v:1,e:'😕',l:'Basse'},{v:2,e:'😐',l:'Normale'},{v:3,e:'😊',l:'Bonne'},{v:4,e:'🚀',l:'Maximale'}]},
];

const Q_STATUS = {
  id:'dayStatus', text:'Comment se passe votre journée ?', emoji:'📅',
  opts:[
    {v:'work',    e:'💼', l:'Je travaille'},
    {v:'rest',    e:'🏠', l:'Repos / Day off'},
    {v:'holiday', e:'🌴', l:'Congé / Vacances'},
    {v:'sick',    e:'🤒', l:'Arrêt maladie'},
  ]
};

const Q_SLOT = {
  id:'timeSlot', text:'Quel est votre créneau de travail ?', emoji:'🕐',
  opts:[
    {v:'morning',   e:'🌅', l:'Matin (avant 12h)'},
    {v:'day',       e:'☀️', l:'Journée (9h-18h)'},
    {v:'afternoon', e:'🌆', l:'Après-midi / Soir (après 17h)'},
    {v:'night',     e:'🌙', l:'Nuit (après 22h)'},
    {v:'split',     e:'🔄', l:'Horaires coupés / Variable'},
  ]
};

const SLOT_REGIME = {
  morning:   {startH:6,  endH:14, regimeType:'matin'},
  day:       {startH:9,  endH:18, regimeType:'standard'},
  afternoon: {startH:13, endH:21, regimeType:'decale'},
  night:     {startH:22, endH:6,  regimeType:'nuit_partielle'},
  split:     {startH:9,  endH:19, regimeType:'standard'},
};

class Checkin {
  constructor(){
    this._modal   = document.getElementById('checkin-modal');
    this._content = document.getElementById('checkin-content');
    this._close   = document.getElementById('checkin-close');
    this._step    = 0;
    this._answers = {};
    this._questions = [];
    if(this._close) this._close.addEventListener('click', () => this.close());
    if(this._modal) this._modal.querySelector('.modal-overlay')?.addEventListener('click', () => this.close());
    this._scheduleMidnightReset();
  }



  _scheduleMidnightReset(){
    const now = new Date();
    const midnight = new Date(now); midnight.setHours(24,0,0,0);
    setTimeout(() => {
      _safeLS.del('DTE_CHECKIN_DATE');
      document.getElementById('checkin-edit-badge')?.remove();
      this._scheduleMidnightReset();
    }, midnight - now);
  }

  checkIfNeeded(){
    const today = new Date().toISOString().slice(0,10);
    if (_safeLS.get('DTE_CHECKIN_DATE') !== today) {
      setTimeout(() => this.open(), 800);
    } else {
      setTimeout(() => this._showEditBadge(), 1000);
    }
  }

  openForEdit(){
    const _ldk = (d) => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const today = _ldk(new Date()); // date locale, pas UTC
    // Lundi : réinitialiser la confirmation N-1 pour permettre la re-modification
    const dow = new Date().getDay();
    if(dow === 1) _safeLS.del('DTE_N1_CONFIRMED');
    const history = _safeLS.json('DTE_CHECKIN_HISTORY', []);
    const existing = history.find(h => h.date === today);
    this._step = 0;
    this._answers = existing ? {...existing} : {};
    delete this._answers.date;
    this._editMode = true;
    this._buildSequence();
    this._render();
    if(this._modal) this._modal.classList.remove('hidden');
  }

  _showEditBadge(){
    if(document.getElementById('checkin-edit-badge')) return;
    const btn = document.getElementById('btn-checkin');
    if(!btn) return;
    const badge = document.createElement('span');
    badge.id = 'checkin-edit-badge';
    badge.style.cssText = 'font-size:10px;color:rgba(0,255,204,0.6);cursor:pointer;margin-left:6px;border:1px solid rgba(0,255,204,0.25);padding:1px 5px;border-radius:3px;';
    badge.textContent = '✅ fait · ✏️';
    badge.addEventListener('click', e => { e.stopPropagation(); this.openForEdit(); });
    btn.parentNode.insertBefore(badge, btn.nextSibling);
  }

  open(){
    this._step = 0; this._editMode = false;
    // Lundi : toujours réinitialiser la confirmation N-1
    // → la question réapparaît à chaque ouverture du check-in ce jour-là
    if(new Date().getDay() === 1) _safeLS.del('DTE_N1_CONFIRMED');
    // Si check-in déjà fait aujourd'hui, pré-remplir les réponses
    const _ldk0 = (d) => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const today = _ldk0(new Date());
    const history = _safeLS.json('DTE_CHECKIN_HISTORY', []);
    const existing = history.find(h => h.date === today);
    this._answers = existing ? {...existing} : {};
    delete this._answers.date;
    delete this._answers.n1confirm; // toujours reposer la question N-1
    this._buildSequence(); this._render();
    if(this._modal) this._modal.classList.remove('hidden');
  }

  close(){ if(this._modal) this._modal.classList.add('hidden'); }

  _buildSequence(){
    const s = this._answers.dayStatus;
    // Question N-1 supprimée : le lundi repart sur le seuil CCN (0 HS).
    // La fatigue cumulée rolling 28j conserve la mémoire des semaines précédentes.
    if(!s) this._questions = [Q_STATUS, ...QUESTIONS_WELLBEING];
    else if(s === 'work') this._questions = [Q_STATUS, Q_SLOT, ...QUESTIONS_WELLBEING];
    else this._questions = [Q_STATUS, ...QUESTIONS_WELLBEING];
  }


  // _mondayN1Question, _saveN1Confirmed, _renderN1Edit supprimées :
  // le lundi repart désormais sur le seuil CCN (weeklyExtra=0).
  // La question N-1 "semaine passée" n'est plus posée au check-in.

  getLatest(){
    const h = _safeLS.json('DTE_CHECKIN_HISTORY', []);
    return h.length ? h[h.length-1] : null;
  }
}

global.Checkin = Checkin;
}(typeof window!=='undefined'?window:global));
