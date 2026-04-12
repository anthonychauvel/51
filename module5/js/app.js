/**
 * APP.JS — Orchestrateur M5 Temps Partiel
 * Calendrier semaine + popup saisie journalière + saisie hebdo
 */
(function() {
'use strict';

let currentSection  = 'accueil';
let currentAnalysis = null;
let calendarMonday  = M5_getCurrentMonday(); // semaine affichée dans le calendrier

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, type='info', duration=2800) {
  const c=document.getElementById('m5-toast-container'); if(!c) return;
  const t=document.createElement('div'); t.className='m5-toast '+type; t.textContent=msg;
  c.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},duration);
}

// ── Navigation ────────────────────────────────────────────────────
function showSection(id) {
  document.querySelectorAll('.m5-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.m5-bottom-btn').forEach(b=>b.classList.remove('active'));
  const sec=document.getElementById('sec-'+id); if(sec) sec.classList.add('active');
  const btn=document.getElementById('nav-'+id);  if(btn) btn.classList.add('active');
  currentSection=id;
  if(id==='historique') renderHistorique();
  if(id==='stats')      renderStats();
}

function openModal(id)  { const m=document.getElementById(id); if(m) m.classList.add('open'); }
function closeModal(id) { const m=document.getElementById(id); if(m) m.classList.remove('open'); }

// ── Analyse ───────────────────────────────────────────────────────
function runAnalysis() {
  const contract=M5_Contract.get(); if(!contract.hoursBase) return null;
  const year=M5_DataStore.getYear();
  const monday=calendarMonday;
  const wk=M5_DataStore.getWeekTotal(monday,year);
  const isVac=M5_DataStore.isVacWeek(monday,year);
  let weekResult=null;
  if(wk.total!==null&&!isVac) {
    weekResult=CalcEngine.calcWeek(contract.hoursBase,wk.total,contract,contract.hourlyRate||0);
  }
  const weeks=M5_DataStore.getLast12Weeks(year);
  const rule12=CalcEngine.check12WeeksRule(weeks,contract.hoursBase);
  const stats=M5_DataStore.getAnnualStats(year,contract.hoursBase,contract);
  currentAnalysis={weekResult,rule12,isVacWeek:isVac,annualStats:stats,contract,weeks,weekMode:wk.mode};
  return currentAnalysis;
}

// ── Refresh UI ────────────────────────────────────────────────────
function refreshUI() {
  const contract=M5_Contract.get();
  const noContract=document.getElementById('view-no-contract');
  const main=document.getElementById('view-main');
  if(!contract.hoursBase) {
    if(noContract) noContract.style.display='block';
    if(main)       main.style.display='none';
    return;
  }
  if(noContract) noContract.style.display='none';
  if(main)       main.style.display='block';
  const analysis=runAnalysis();
  if(!analysis) return;
  const bubbleText=Mizuki.getBubbleText(analysis);
  const bubbleEl=document.getElementById('mizuki-bubble-text');
  if(bubbleEl) bubbleEl.textContent=bubbleText;
  renderCalendar();
  renderWeekSummary(analysis);
}

// ── CALENDRIER SEMAINE ────────────────────────────────────────────
function renderCalendar() {
  const contract=M5_Contract.get();
  const year=M5_DataStore.getYear();
  const days=M5_DataStore.getWeekDays(calendarMonday,year);
  const wk=M5_DataStore.getWeekTotal(calendarMonday,year);
  const today=M5_localDK(new Date());
  const label=M5_formatMonday(calendarMonday);
  const isVac=M5_DataStore.isVacWeek(calendarMonday,year);

  const el=document.getElementById('calendar-grid'); if(!el) return;
  document.getElementById('cal-week-label').textContent=label;

  // Noms des jours dans l'ordre de la semaine configurée
  const sd=M5_Contract.get().weekStartDay||0;
  const JOURS_SEMAINE=M5_JOURS_COURTS.slice(sd).concat(M5_JOURS_COURTS.slice(0,sd));

  // Mode hebdo = une seule case "total semaine"
  if(days.mode==='week') {
    el.innerHTML=`
      <div class="m5-cal-weekly-badge">Mode hebdomadaire</div>
      <div class="m5-cal-week-total-cell" onclick="openWeeklySaisie()">
        <div class="m5-cal-week-total-val">${wk.total}h</div>
        <div class="m5-cal-week-total-sub">total semaine — tap pour modifier</div>
      </div>`;
    return;
  }

  // Mode journalier
  let html='<div class="m5-cal-grid">';
  days.forEach(d=>{
    const dt=new Date(d.dk+'T12:00:00');
    const dayNum=dt.getDate();
    const dow=d.dow;
    const realDow=d.realDow!==undefined?d.realDow:dow;
    const isToday=d.dk===today;
    const isFuture=d.isFuture;
    const isWeekend=realDow>=5; // Sam=5, Dim=6 en Mon=0
    const worked=d.worked;
    const contract_daily=contract.hoursBase/5;
    let cellClass='m5-cal-day';
    let hoursHtml='<span class="m5-cal-day-empty">—</span>';

    if(isVac) {
      cellClass+=' vac';
      hoursHtml='<span class="m5-cal-day-vac">🌴</span>';
    } else if(isFuture) {
      cellClass+=' future';
    } else if(isWeekend && worked===null) {
      cellClass+=' weekend';
    } else if(worked!==null) {
      const diff=worked-contract_daily;
      cellClass+= diff>0?' over': diff<-0.5?' under':' normal';
      hoursHtml=`<span class="m5-cal-day-hours">${worked}h</span>`;
      if(diff>0) hoursHtml+=`<span class="m5-cal-day-diff">+${diff.toFixed(1)}</span>`;
    }

    if(isToday) cellClass+=' today';

    const clickable=!isFuture&&!isVac;
    html+=`<div class="${cellClass}" ${clickable?`onclick="openDaySaisie('${d.dk}','${JOURS_SEMAINE[dow]}')"`:''}>`
      +`<div class="m5-cal-day-name">${JOURS_SEMAINE[dow]}</div>`
      +`<div class="m5-cal-day-num">${dayNum}</div>`
      +`${hoursHtml}`
      +`</div>`;
  });
  html+='</div>';

  // Total semaine
  const total=wk.total;
  if(total!==null) {
    const diff=total-contract.hoursBase;
    const pct35=Math.round(total/35*100);
    html+=`<div class="m5-cal-total">
      <span>Total semaine</span>
      <span style="font-weight:700;color:${diff>0?'var(--miz-warning)':'var(--miz-success)'}">
        ${total}h ${diff>0?'(+'+diff.toFixed(1)+'h comp.)':''}
      </span>
      <span style="font-size:11px;color:var(--miz-text3)">${pct35}% du temps plein</span>
    </div>`;
  } else if(!isVac) {
    html+=`<div class="m5-cal-total-empty">Saisir les jours pour voir le total</div>`;
  }

  // Bouton saisie hebdo rapide
  html+=`<div style="display:flex;gap:8px;margin-top:10px;">
    <button class="m5-btn m5-btn-outline m5-btn-sm" style="flex:1" onclick="openWeeklySaisie()">📊 Saisir le total semaine</button>
  </div>`;

  el.innerHTML=html;
}

// ── Navigation semaines ───────────────────────────────────────────
function calPrev() {
  const d=new Date(calendarMonday+'T12:00:00');
  d.setDate(d.getDate()-7);
  calendarMonday=M5_localDK(d);
  refreshUI();
}
function calNext() {
  const today=M5_getCurrentMonday();
  const d=new Date(calendarMonday+'T12:00:00');
  d.setDate(d.getDate()+7);
  const next=M5_localDK(d);
  if(next>today) return; // pas dans le futur
  calendarMonday=next;
  refreshUI();
}
function calToday() {
  calendarMonday=M5_getCurrentMonday();
  refreshUI();
}

// ── Popup saisie journalière ───────────────────────────────────────
function openDaySaisie(dateStr, jourLabel) {
  const contract=M5_Contract.get();
  const year=M5_DataStore.getYear();
  const existing=M5_DataStore.getAll(year)[dateStr];

  document.getElementById('day-saisie-title').textContent=`${jourLabel} ${dateStr.slice(8)}/${dateStr.slice(5,7)}`;
  document.getElementById('day-saisie-date').value=dateStr;

  const inp=document.getElementById('day-saisie-hours');
  inp.value=existing?existing.worked:'';

  // Propositions rapides basées sur le contrat
  const base=contract.hoursBase/5; // base journalière
  const proposals=[];
  const steps=[0, base-1, base-0.5, base, base+0.5, base+1, base+2, base+3];
  steps.forEach(h=>{
    if(h>=0&&h<=12) proposals.push(Math.round(h*2)/2);
  });
  const unique=[...new Set(proposals)].sort((a,b)=>a-b);

  let quickHtml='';
  unique.forEach(h=>{
    const isSelected=existing&&existing.worked===h;
    quickHtml+=`<button class="m5-quick-btn ${isSelected?'selected':''}" onclick="selectQuickHour(${h})">${h}h</button>`;
  });

  document.getElementById('day-quick-hours').innerHTML=quickHtml;
  updateDayPreview();
  openModal('modal-day-saisie');
  setTimeout(()=>inp.focus(),200);
}

function selectQuickHour(h) {
  document.getElementById('day-saisie-hours').value=h;
  document.querySelectorAll('.m5-quick-btn').forEach(b=>{
    b.classList.toggle('selected', parseFloat(b.textContent)===h);
  });
  updateDayPreview();
}

function updateDayPreview() {
  const contract=M5_Contract.get();
  const worked=parseFloat(document.getElementById('day-saisie-hours')?.value)||0;
  const prev=document.getElementById('day-saisie-preview');
  if(!prev||!contract.hoursBase) return;
  const base=contract.hoursBase/5;
  const diff=worked-base;
  prev.innerHTML=diff>0.09
    ?`<span style="color:var(--miz-warning);font-size:13px;">+${diff.toFixed(1)}h au-delà de ta base journalière (${base}h)</span>`
    :diff<-0.1
      ?`<span style="color:var(--miz-text3);font-size:13px;">${diff.toFixed(1)}h — en dessous de la base journalière</span>`
      :`<span style="color:var(--miz-success);font-size:13px;">✓ Dans ta base journalière</span>`;
}

function saveDaySaisie() {
  const dateStr=document.getElementById('day-saisie-date').value;
  const worked=parseFloat(document.getElementById('day-saisie-hours').value);
  if(!dateStr||isNaN(worked)||worked<0||worked>24) {
    toast('Saisis un nombre d\'heures valide (0-24).','error'); return;
  }
  const year=M5_DataStore.getYear();
  M5_DataStore.saveDay(dateStr,worked,year);
  Mizuki.clearCache();
  closeModal('modal-day-saisie');
  toast('Journée enregistrée ✓','success');
  refreshUI();
}

function deleteDaySaisie() {
  const dateStr=document.getElementById('day-saisie-date').value;
  if(!dateStr) return;
  M5_DataStore.deleteDay(dateStr,M5_DataStore.getYear());
  Mizuki.clearCache();
  closeModal('modal-day-saisie');
  toast('Journée supprimée','info');
  refreshUI();
}

// ── Popup saisie hebdomadaire ─────────────────────────────────────
function openWeeklySaisie() {
  const contract=M5_Contract.get();
  const year=M5_DataStore.getYear();
  const wk=M5_DataStore.getWeekTotal(calendarMonday,year);
  const label=M5_formatMonday(calendarMonday);

  document.getElementById('week-saisie-title').textContent=label;
  document.getElementById('week-saisie-monday').value=calendarMonday;

  const inp=document.getElementById('week-saisie-hours');
  inp.value=wk.total!==null?wk.total:contract.hoursBase;

  // Propositions rapides semaine
  const base=contract.hoursBase;
  const props=[base-2,base-1,base,base+1,base+2,base+3,base+5,base+8].filter(h=>h>0&&h<35);
  let quickHtml='';
  [...new Set(props)].forEach(h=>{
    quickHtml+=`<button class="m5-quick-btn" onclick="selectWeekQuick(${h})">${h}h</button>`;
  });
  document.getElementById('week-quick-hours').innerHTML=quickHtml;
  updateWeekPreview();
  openModal('modal-week-saisie');
}

function selectWeekQuick(h) {
  document.getElementById('week-saisie-hours').value=h;
  document.querySelectorAll('#week-quick-hours .m5-quick-btn').forEach(b=>{
    b.classList.toggle('selected',parseFloat(b.textContent)===h);
  });
  updateWeekPreview();
}

function updateWeekPreview() {
  const contract=M5_Contract.get();
  const worked=parseFloat(document.getElementById('week-saisie-hours')?.value)||0;
  const prev=document.getElementById('week-saisie-preview');
  if(!prev||!contract.hoursBase) return;
  const result=CalcEngine.calcWeek(contract.hoursBase,worked,contract,contract.hourlyRate||0);
  const pct35=Math.round(worked/35*100);
  let html=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
    <span class="m5-preview-tag ${result.totalCompH>0?'warn':'ok'}">${result.totalCompH>0?'+'+result.totalCompH.toFixed(1)+'h comp.':'✓ Dans le contrat'}</span>
    <span class="m5-preview-tag ${pct35>=95?'danger':''}">${pct35}% du temps plein</span>
  </div>`;
  if(result.alerts.length) result.alerts.forEach(a=>{
    html+=`<div class="m5-alert ${a.level}" style="font-size:12px;padding:6px 10px;margin-bottom:4px;"><span>${a.level==='critique'?'🚨':'⚠️'}</span> ${a.msg}</div>`;
  });
  if(result.totalAmount>0) html+=`<div class="m5-alert info" style="font-size:12px;padding:6px 10px;"><span>💰</span> Estimé : <strong>${result.totalAmount.toFixed(2)} €</strong> brut</div>`;
  prev.innerHTML=html;
}

function saveWeeklySaisie() {
  const monday=document.getElementById('week-saisie-monday').value;
  const worked=parseFloat(document.getElementById('week-saisie-hours').value);
  if(!monday||isNaN(worked)||worked<0||worked>=35) {
    toast('Saisis un total entre 0 et 34,5h.','error'); return;
  }
  M5_DataStore.saveWeekTotal(monday,worked,M5_DataStore.getYear());
  Mizuki.clearCache();
  closeModal('modal-week-saisie');
  toast('Semaine enregistrée ✓','success');
  refreshUI();
}

function deleteWeeklySaisie() {
  const monday=document.getElementById('week-saisie-monday').value;
  M5_DataStore.deleteWeek(monday,M5_DataStore.getYear());
  Mizuki.clearCache();
  closeModal('modal-week-saisie');
  toast('Semaine supprimée','info');
  refreshUI();
}

// ── Résumé semaine sous le calendrier ────────────────────────────
function renderWeekSummary(analysis) {
  const {weekResult,isVacWeek,contract,weekMode}=analysis;
  const el=document.getElementById('week-summary'); if(!el) return;
  if(isVacWeek) { el.innerHTML=`<div class="m5-alert ok"><span>🌴</span><div>Semaine de congés — bon repos !</div></div>`; return; }
  if(!weekResult||weekResult.workedH<=0) { el.innerHTML=''; return; }
  const alerts=weekResult.alerts||[];
  let html='';
  if(alerts.length) alerts.forEach(a=>{
    html+=`<div class="m5-alert ${a.level}"><span>${a.level==='critique'?'🚨':'⚠️'}</span><div>${a.msg}</div></div>`;
  });
  if(weekResult.totalAmount>0&&!html) {
    html+=`<div class="m5-alert info"><span>💰</span><div>Estimé : <strong>${weekResult.totalAmount.toFixed(2)} € brut</strong> pour ${weekResult.totalCompH}h comp.</div></div>`;
  }
  el.innerHTML=html;
}

// ── Historique ────────────────────────────────────────────────────
function renderHistorique() {
  const el=document.getElementById('historique-list');
  const contract=M5_Contract.get();
  if(!el) return;
  const year=M5_DataStore.getYear();
  const weeks=M5_DataStore.getWeeksSorted(year).slice().reverse();
  if(!weeks.length) {
    el.innerHTML='<div class="m5-empty"><div class="m5-empty-icon">📋</div><div class="m5-empty-text">Aucune semaine saisie pour '+year+'.</div></div>';
    return;
  }
  el.innerHTML=weeks.map(w=>{
    const isVac=M5_DataStore.isVacWeek(w.monday,year);
    const worked=w.worked||0;
    const diff=Math.max(0,worked-contract.hoursBase);
    const pct35=Math.round(worked/35*100);
    const d=new Date(w.monday+'T12:00:00'),fn=new Date(w.monday+'T12:00:00');
    fn.setDate(fn.getDate()+4);
    const label=`${d.getDate()}/${d.getMonth()+1} → ${fn.getDate()}/${fn.getMonth()+1}`;
    let cls='normal';
    if(isVac) cls='vacances'; else if(pct35>=95) cls='danger'; else if(diff>0) cls='warn';
    const compLabel=isVac?'🌴':diff>0?`+${diff.toFixed(1)}h`:'✓';
    return `<div class="m5-week-item" onclick="goToWeek('${w.monday}')">
      <div class="m5-week-date">${label} <span style="font-size:10px;color:var(--miz-text3)">${w.mode==='week'?'hebdo':'journal.'}</span></div>
      <div class="m5-week-hours">${isVac?'—':worked+'h'}</div>
      <div class="m5-week-comp ${cls}">${compLabel}</div>
    </div>`;
  }).join('');
}

function goToWeek(monday) {
  calendarMonday=monday;
  showSection('accueil');
  refreshUI();
}

// ── Stats ─────────────────────────────────────────────────────────
function renderStats() {
  const el=document.getElementById('stats-content');
  const contract=M5_Contract.get();
  if(!el||!contract.hoursBase) return;
  const year=M5_DataStore.getYear();
  const stats=M5_DataStore.getAnnualStats(year,contract.hoursBase,contract);
  const caps=CalcEngine.calcAnnualCap(contract.hoursBase,contract);
  if(!stats) { el.innerHTML='<div class="m5-empty"><div class="m5-empty-icon">📊</div><div class="m5-empty-text">Pas encore assez de données.</div></div>'; return; }
  const netEst=contract.hourlyRate>0?CalcEngine.estimateNet(stats.totalComp*contract.hourlyRate*(1+(contract.rate1||0.10))):null;
  el.innerHTML=`
    <div class="m5-card" style="margin:12px 0;">
      <div class="m5-card-header"><span class="m5-card-title">📊 Bilan ${year}</span></div>
      <div class="m5-card-body">
        <div class="m5-stat-grid" style="margin-bottom:14px;">
          <div class="m5-stat"><div class="m5-stat-val">${stats.totalWeeks}</div><div class="m5-stat-label">Semaines</div></div>
          <div class="m5-stat"><div class="m5-stat-val">${stats.avgWorked}h</div><div class="m5-stat-label">Moy. hebdo</div></div>
          <div class="m5-stat"><div class="m5-stat-val">${stats.pctOverContract}%</div><div class="m5-stat-label">En dépassement</div></div>
        </div>
        <div class="m5-alert ${stats.totalComp>caps.annual?'warn':'info'}" style="margin-bottom:10px;">
          <span>⏱️</span><div><strong>${stats.totalComp.toFixed(1)}h</strong> complémentaires au total<br><small>Plafond annuel estimé : ${caps.annual.toFixed(1)}h</small></div>
        </div>
        ${stats.totalComp1>0?`<div class="m5-alert ok" style="margin-bottom:6px;"><span>💰</span><div>${stats.totalComp1.toFixed(1)}h à +${Math.round((contract.rate1||0.10)*100)}% | ${stats.totalComp2>0?stats.totalComp2.toFixed(1)+'h à +'+Math.round((contract.rate2||0.25)*100)+'%':'Aucune tranche à 25%'}</div></div>`:''}
        ${netEst?`<div class="m5-alert info"><span>💶</span><div>Estimation net défiscalisé : <strong>${netEst.toFixed(2)} €</strong><br><small>Exonéré IR depuis 2019</small></div></div>`:''}
      </div>
    </div>
    <button class="m5-btn m5-btn-primary m5-btn-full" onclick="exportPDF()">📄 Exporter en PDF</button>`;
}

// ── Popup Mizuki ──────────────────────────────────────────────────
function openMizukiPopup() {
  const analysis=currentAnalysis||runAnalysis(); if(!analysis) return;
  const popup=Mizuki.getPopupContent(analysis); if(!popup) return;
  const lvlMap={ok:'✅ Tout va bien',info:'📋 Info',vigilance:'👀 Vigilance',alerte:'⚠️ Alerte',critique:'🚨 Critique'};
  document.getElementById('mizuki-popup-body').innerHTML=`
    <div class="mizuki-popup-icon">${popup.icon}</div>
    <div><span class="mizuki-popup-level ${popup.level}">${lvlMap[popup.level]||popup.level}</span></div>
    <div style="font-size:17px;font-weight:700;color:var(--miz-dark);margin-bottom:10px;">${popup.titre}</div>
    <div class="mizuki-popup-msg">${popup.message}</div>
    ${popup.actions&&popup.actions.length?`<div style="font-size:12px;color:var(--miz-text2);font-weight:600;letter-spacing:.05em;margin-bottom:6px;">À FAIRE</div>
    <div class="mizuki-popup-actions">${popup.actions.map(a=>`<div class="mizuki-popup-action">${a}</div>`).join('')}</div>`:''}
    <div style="font-size:11px;color:var(--miz-text3);text-align:center;margin-top:14px;">🦊 Mizuki est ton alliée — pas un avis juridique</div>`;
  openModal('modal-mizuki');
}

// ── Contrat ───────────────────────────────────────────────────────
function openContractModal() {
  const c=M5_Contract.get();
  document.getElementById('contract-hours').value   =c.hoursBase||'';
  document.getElementById('contract-rate').value    =c.hourlyRate||'';
  document.getElementById('contract-ccn').value     =c.idcc||'0';
  document.getElementById('contract-cap').value     =c.cap===0.33?'0.33':'0.10';
  document.getElementById('contract-name').value    =localStorage.getItem('M5_USER_NAME')||'';
  const startDayEl=document.getElementById('contract-start-day');
  if(startDayEl) startDayEl.value=String(c.weekStartDay||0);
  // Restaurer la recherche CCN
  const ccnSearch=document.getElementById('contract-ccn-search');
  const ccnSel=document.getElementById('contract-ccn-selected');
  if(ccnSearch) ccnSearch.value=c.ccnNom||'';
  if(ccnSel)   ccnSel.textContent=c.idcc?'✓ IDCC '+c.idcc+' — '+c.ccnNom:'';
  openModal('modal-contract');
}

function saveContract() {
  const hoursBase =parseFloat(document.getElementById('contract-hours').value);
  const hourlyRate=parseFloat(document.getElementById('contract-rate').value)||0;
  const idcc      =parseInt(document.getElementById('contract-ccn').value)||0;
  const cap       =parseFloat(document.getElementById('contract-cap').value)||0.10;
  const name      =document.getElementById('contract-name').value.trim();
  if(!hoursBase||hoursBase<=0||hoursBase>=35) { toast('Saisis une durée entre 1 et 34,5h.','error'); return; }
  const ccnRules=typeof CCN_PARTIEL_API!=='undefined'?CCN_PARTIEL_API.getRules(idcc):{rate1:0.10,rate2:0.25,threshold:0.10};
  const weekStartDay=parseInt(document.getElementById('contract-start-day')?.value||'0');
  M5_Contract.save({hoursBase,hourlyRate,idcc,ccnNom:ccnRules.nom||'Droit commun',cap,rate1:ccnRules.rate1||0.10,rate2:ccnRules.rate2||0.25,threshold:ccnRules.threshold||0.10,weekStartDay});
  if(name) localStorage.setItem('M5_USER_NAME',name);
  Mizuki.clearCache();
  closeModal('modal-contract');
  toast('Contrat enregistré ✓','success');
  refreshUI();
}

function exportPDF() {
  try { PDFReportM5.generate(M5_DataStore.getYear()); }
  catch(e) { toast('Erreur PDF.','error'); console.error(e); }
}

function initCCNSelect() {
  // Recherche dynamique — pas de select statique avec 422 entrées
}

function searchCCN(term) {
  const res=document.getElementById('contract-ccn-results');
  if(!res) return;
  if(!term||term.length<2) { res.style.display='none'; return; }
  if(typeof CCN_PARTIEL_API==='undefined') return;
  const results=CCN_PARTIEL_API.search(term);
  if(!results.length) { res.style.display='none'; return; }
  res.style.display='block';
  res.innerHTML=results.map(ccn=>`
    <div onclick="selectCCN(${ccn.i},'${ccn.n.replace(/'/g,"\\'")}','${ccn.s}')"
      style="padding:8px 12px;font-size:13px;cursor:pointer;border-bottom:1px solid var(--miz-border);display:flex;flex-direction:column;gap:2px;"
      onmouseenter="this.style.background='var(--miz-accent)'"
      onmouseleave="this.style.background=''">
      <span style="font-weight:600;color:var(--miz-text)">${ccn.n}</span>
      <span style="font-size:11px;color:var(--miz-text3)">${ccn.s} — IDCC ${ccn.i} — plafond ${ccn.cap===0.33?'1/3':'10%'}</span>
    </div>`).join('');
}

function selectCCN(idcc, nom, secteur) {
  document.getElementById('contract-ccn').value=idcc;
  document.getElementById('contract-ccn-search').value=nom;
  const sel=document.getElementById('contract-ccn-selected');
  if(sel) sel.textContent='✓ IDCC '+idcc+' — '+secteur;
  const res=document.getElementById('contract-ccn-results');
  if(res) res.style.display='none';
  // Auto-appliquer le plafond si CCN a un accord étendu
  if(typeof CCN_PARTIEL_API!=='undefined') {
    const rules=CCN_PARTIEL_API.getRules(idcc);
    const capEl=document.getElementById('contract-cap');
    if(capEl && rules.cap) capEl.value=String(rules.cap);
  }
}

// ── Exposition ────────────────────────────────────────────────────
window.showSection=showSection;
window.searchCCN=searchCCN;
window.selectCCN=selectCCN; window.openModal=openModal; window.closeModal=closeModal;
window.openDaySaisie=openDaySaisie; window.selectQuickHour=selectQuickHour;
window.updateDayPreview=updateDayPreview; window.saveDaySaisie=saveDaySaisie;
window.deleteDaySaisie=deleteDaySaisie;
window.openWeeklySaisie=openWeeklySaisie; window.selectWeekQuick=selectWeekQuick;
window.updateWeekPreview=updateWeekPreview; window.saveWeeklySaisie=saveWeeklySaisie;
window.deleteWeeklySaisie=deleteWeeklySaisie;
window.calPrev=calPrev; window.calNext=calNext; window.calToday=calToday;
window.goToWeek=goToWeek; window.openMizukiPopup=openMizukiPopup;
window.openContractModal=openContractModal; window.saveContract=saveContract;
window.exportPDF=exportPDF; window.M5_toast=toast;

document.addEventListener('DOMContentLoaded',()=>{
  initCCNSelect(); showSection('accueil'); refreshUI();
  setInterval(()=>{ if(currentSection==='accueil') refreshUI(); },15000);
});

}());
