/**
 * SAISIE — Gestion du stockage et lecture des heures complémentaires M5
 * Support double mode : saisie journalière (type:"day") ou hebdomadaire (type:"week")
 */
(function(global) {
'use strict';

const K = {
  DATA:        y => 'M5_DATA_' + y,
  VACANCES:    y => 'M5_VACANCES_' + y,
  CONTRACT:    'M5_CONTRACT',
  USER_NAME:   'M5_USER_NAME',
  WELCOMED:    'M5_WELCOMED',
  ACTIVE_YEAR: 'M5_ACTIVE_YEAR',
};

function _get(k, def='') { try{return localStorage.getItem(k)??def;}catch(_){return def;} }
function _set(k,v)       { try{localStorage.setItem(k,String(v));}catch(_){} }
function _json(k,def={}) { try{return JSON.parse(localStorage.getItem(k))??def;}catch(_){return def;} }
function _save(k,v)      { try{localStorage.setItem(k,JSON.stringify(v));}catch(_){} }

function localDK(d) {
  const dt=d||new Date();
  return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
}
function weekStartOf(dateStr, startDow) {
  // startDow : 0=Lun, 1=Mar, 2=Mer, 3=Jeu, 4=Ven, 5=Sam, 6=Dim
  const d = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  const sd = (startDow !== undefined ? startDow : 0);
  let diff = dayOfWeek - sd;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() - diff);
  return localDK(d);
}
// Alias rétrocompat
function mondayOf(dateStr) { return weekStartOf(dateStr, Contract.get().weekStartDay || 0); }

const Contract = {
  get() { return _json(K.CONTRACT,{hoursBase:0,hourlyRate:0,idcc:0,ccnNom:'',cap:0.10,rate1:0.10,rate2:0.25,threshold:0.10,weekStartDay:0}); },
  save(data) { _save(K.CONTRACT,data); },
  isSet() { return this.get().hoursBase>0; }
};

const DataStore = {
  getYear()  { return _get(K.ACTIVE_YEAR,String(new Date().getFullYear())); },
  setYear(y) { _set(K.ACTIVE_YEAR,String(y)); },
  getAll(year) { return _json(K.DATA(year||this.getYear()),{}); },

  // Saisie journalière
  saveDay(dateStr, workedH, year) {
    const yr=year||this.getYear();
    const data=this.getAll(yr);
    const mon=mondayOf(dateStr);
    if(data[mon]&&data[mon].type==='week') delete data[mon]; // retire saisie hebdo si on passe en journalier
    if(workedH===null||workedH===undefined) { delete data[dateStr]; }
    else { data[dateStr]={worked:Math.round(workedH*100)/100,type:'day',savedAt:new Date().toISOString()}; }
    _save(K.DATA(yr),data);
  },

  deleteDay(dateStr, year) {
    const yr=year||this.getYear();
    const data=this.getAll(yr);
    delete data[dateStr];
    _save(K.DATA(yr),data);
  },

  // Saisie hebdomadaire (total semaine d'un coup)
  saveWeekTotal(mondayStr, workedH, year) {
    const yr=year||this.getYear();
    const data=this.getAll(yr);
    // Retire les saisies journalières de la semaine
    for(let d=0;d<7;d++){
      const dt=new Date(mondayStr+'T12:00:00'); dt.setDate(dt.getDate()+d);
      const dk=localDK(dt);
      if(data[dk]&&data[dk].type==='day') delete data[dk];
    }
    if(workedH===null||workedH===undefined) { delete data[mondayStr]; }
    else { data[mondayStr]={worked:Math.round(workedH*100)/100,type:'week',savedAt:new Date().toISOString()}; }
    _save(K.DATA(yr),data);
  },

  deleteWeek(mondayStr, year) {
    const yr=year||this.getYear();
    const data=this.getAll(yr);
    delete data[mondayStr];
    for(let d=0;d<7;d++){
      const dt=new Date(mondayStr+'T12:00:00'); dt.setDate(dt.getDate()+d);
      delete data[localDK(dt)];
    }
    _save(K.DATA(yr),data);
  },

  // Total semaine (journalier ou hebdo)
  getWeekTotal(mondayStr, year) {
    const data=this.getAll(year);
    if(data[mondayStr]&&data[mondayStr].type==='week') {
      return {total:data[mondayStr].worked,mode:'week',days:[]};
    }
    const days=[]; let total=0;
    for(let d=0;d<7;d++){
      const dt=new Date(mondayStr+'T12:00:00'); dt.setDate(dt.getDate()+d);
      const dk=localDK(dt);
      const e=data[dk];
      days.push({dk,worked:e?e.worked:null,dow:d});
      if(e&&e.type==='day') total+=e.worked;
    }
    const hasAny=days.some(d=>d.worked!==null);
    return {total:hasAny?Math.round(total*100)/100:null,mode:'day',days};
  },

  // Détail jours d'une semaine
  getWeekDays(mondayStr, year) {
    const data=this.getAll(year);
    const today=localDK(new Date());
    const days=[];
    const hasWeekly=data[mondayStr]&&data[mondayStr].type==='week';
    const startDow=Contract.get().weekStartDay||0; // jour de début de semaine
    for(let d=0;d<7;d++){
      const dt=new Date(mondayStr+'T12:00:00'); dt.setDate(dt.getDate()+d);
      const dk=localDK(dt);
      const e=data[dk];
      // dow réel = (startDow + d) % 7 en convention Mon=0
      const realDow = (startDow + d) % 7;
      days.push({
        dk, dow:d, realDow,
        worked: e&&e.type==='day'?e.worked:null,
        isPast: dk<=today,
        isToday: dk===today,
        isFuture: dk>today,
      });
    }
    days.weeklyTotal = hasWeekly?data[mondayStr].worked:null;
    days.mode = hasWeekly?'week':'day';
    return days;
  },

  // Semaines avec données
  getWeeksSorted(year) {
    const data=this.getAll(year);
    const mondays=new Set();
    Object.keys(data).forEach(dk=>{
      if(/^\d{4}-\d{2}-\d{2}$/.test(dk)) mondays.add(mondayOf(dk));
    });
    return [...mondays].sort().map(mon=>{
      const wk=this.getWeekTotal(mon,year);
      return {monday:mon,worked:wk.total,mode:wk.mode};
    }).filter(w=>w.worked!==null);
  },

  getLast12Weeks(year) { return this.getWeeksSorted(year).slice(-12); },

  getAnnualStats(year, contractH, ccnRules) {
    const weeks=this.getWeeksSorted(year);
    if(!weeks.length) return null;
    let totalWorked=0,totalComp=0,totalComp1=0,totalComp2=0,weeksWithComp=0,maxWorked=0;
    weeks.forEach(w=>{
      const wh=w.worked||0; totalWorked+=wh;
      if(wh>maxWorked) maxWorked=wh;
      if(wh>contractH){
        const diff=wh-contractH, th1=contractH*(ccnRules.threshold||0.10);
        totalComp+=diff; totalComp1+=Math.min(diff,th1); totalComp2+=Math.max(0,diff-th1);
        weeksWithComp++;
      }
    });
    return {
      totalWeeks:weeks.length,weeksWithComp,
      totalWorked:Math.round(totalWorked*100)/100,
      totalComp:Math.round(totalComp*100)/100,
      totalComp1:Math.round(totalComp1*100)/100,
      totalComp2:Math.round(totalComp2*100)/100,
      avgWorked:Math.round(totalWorked/weeks.length*100)/100,
      maxWorked:Math.round(maxWorked*100)/100,
      pctOverContract:weeks.length>0?Math.round(weeksWithComp/weeks.length*100):0,
    };
  },

  // ── Congés / vacances M5 (indépendant de M4) ─────────────────────
  getVacances(year) {
    try { return JSON.parse(localStorage.getItem(K.VACANCES(year||this.getYear()))||'{}'); } catch(_){ return {}; }
  },

  saveVacances(data, year) {
    try { localStorage.setItem(K.VACANCES(year||this.getYear()), JSON.stringify(data)); } catch(_){}
  },

  isVacWeek(mondayStr, year) {
    const yr=year||this.getYear();
    const vac=this.getVacances(yr);
    const today=localDK(new Date());
    for(let d=0;d<7;d++){
      const dt=new Date(mondayStr+'T12:00:00'); dt.setDate(dt.getDate()+d);
      const dk=localDK(dt);
      if(dk>today) continue;
      if(vac[dk]) return true;
    }
    return false;
  },

  addVacWeek(mondayStr, year) {
    const yr=year||this.getYear();
    const vac=this.getVacances(yr);
    // Supprimer les saisies heures de la semaine si elles existent
    const data=this.getAll(yr);
    let changed=false;
    for(let d=0;d<7;d++){
      const dt=new Date(mondayStr+'T12:00:00'); dt.setDate(dt.getDate()+d);
      const dk=localDK(dt);
      vac[dk]=true;
      if(data[dk]){delete data[dk];changed=true;}
    }
    if(data[mondayStr]&&data[mondayStr].type==='week'){delete data[mondayStr];changed=true;}
    if(changed) _save(K.DATA(yr),data);
    this.saveVacances(vac,yr);
  },

  removeVacWeek(mondayStr, year) {
    const yr=year||this.getYear();
    const vac=this.getVacances(yr);
    for(let d=0;d<7;d++){
      const dt=new Date(mondayStr+'T12:00:00'); dt.setDate(dt.getDate()+d);
      delete vac[localDK(dt)];
    }
    this.saveVacances(vac,yr);
  },

  getVacWeeksSorted(year) {
    const yr=year||this.getYear();
    const vac=this.getVacances(yr);
    const mondays=new Set();
    Object.keys(vac).forEach(dk=>{ if(vac[dk]) mondays.add(mondayOf(dk)); });
    return [...mondays].sort();
  },
};

function getCurrentMonday() {
  const sd = Contract.get().weekStartDay || 0;
  return weekStartOf(localDK(new Date()), sd);
}
function formatMonday(mondayStr) {
  const d=new Date(mondayStr+'T12:00:00'),fn=new Date(mondayStr+'T12:00:00');
  fn.setDate(fn.getDate()+4);
  const mn=d.toLocaleDateString('fr-FR',{month:'long'});
  return `${d.getDate()} → ${fn.getDate()} ${mn} ${d.getFullYear()}`;
}
function getExistingYears() {
  const years=new Set();
  try{ for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('M5_DATA_')){const y=k.replace('M5_DATA_','');if(/^\d{4}$/.test(y))years.add(y);}} }catch(_){}
  if(!years.size) years.add(String(new Date().getFullYear()));
  return [...years].sort();
}

const JOURS_COURTS=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const JOURS_LONGS=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

global.M5_Contract=Contract;
global.M5_DataStore=DataStore;
global.M5_getCurrentMonday=getCurrentMonday;
global.M5_formatMonday=formatMonday;
global.M5_getExistingYears=getExistingYears;
global.M5_localDK=localDK;
global.M5_mondayOf=mondayOf;
global.M5_weekStartOf=weekStartOf;
global.M5_JOURS_COURTS=JOURS_COURTS;
global.M5_JOURS_LONGS=JOURS_LONGS;

}(typeof window!=='undefined'?window:global));
