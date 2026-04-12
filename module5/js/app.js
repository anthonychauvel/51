/**
 * APP.JS — Orchestrateur M5 Temps Partiel
 * Gère l'UI, la navigation, les appels aux modules
 */

(function() {
'use strict';

// ── État global ───────────────────────────────────────────────────
let currentSection = 'accueil';
let currentAnalysis = null;

// ── Toast ─────────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 2800) {
  const c = document.getElementById('m5-toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'm5-toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ── Navigation sections ───────────────────────────────────────────
function showSection(id) {
  document.querySelectorAll('.m5-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.m5-bottom-btn').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  if (sec) sec.classList.add('active');
  const btn = document.getElementById('nav-' + id);
  if (btn) btn.classList.add('active');
  currentSection = id;
  if (id === 'historique') renderHistorique();
  if (id === 'stats')      renderStats();
}

// ── Modales ───────────────────────────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

// ── Analyse complète ──────────────────────────────────────────────
function runAnalysis() {
  const contract = M5_Contract.get();
  if (!contract.hoursBase) return null;

  const year    = M5_DataStore.getYear();
  const weeks   = M5_DataStore.getWeeksSorted(year);
  const monday  = M5_getCurrentMonday();
  const curWeek = M5_DataStore.getDay(monday, year);
  const isVac   = M5_DataStore.isVacWeek(monday, year);

  let weekResult = null;
  if (curWeek && !isVac) {
    weekResult = CalcEngine.calcWeek(
      contract.hoursBase,
      curWeek.worked,
      contract,
      contract.hourlyRate || 0
    );
  }

  const rule12 = CalcEngine.check12WeeksRule(weeks, contract.hoursBase);
  const stats  = M5_DataStore.getAnnualStats(year, contract.hoursBase, contract);

  currentAnalysis = { weekResult, rule12, isVacWeek: isVac, annualStats: stats, contract, weeks };
  return currentAnalysis;
}

// ── Mise à jour UI principale ─────────────────────────────────────
function refreshUI() {
  const contract = M5_Contract.get();

  if (!contract.hoursBase) {
    document.getElementById('view-no-contract').style.display = 'block';
    document.getElementById('view-main').style.display        = 'none';
    return;
  }
  document.getElementById('view-no-contract').style.display = 'none';
  document.getElementById('view-main').style.display        = 'block';

  const analysis = runAnalysis();
  if (!analysis) return;

  // Bulle Mizuki
  const bubbleText = Mizuki.getBubbleText(analysis);
  const bubbleEl   = document.getElementById('mizuki-bubble-text');
  if (bubbleEl) bubbleEl.textContent = bubbleText;

  // Semaine courante
  renderCurrentWeek(analysis);

  // Stats rapides
  renderQuickStats(analysis);
}

// ── Semaine courante ──────────────────────────────────────────────
function renderCurrentWeek(analysis) {
  const { weekResult, isVacWeek, contract } = analysis;
  const monday    = M5_getCurrentMonday();
  const dateLabel = M5_formatMonday(monday);
  const el        = document.getElementById('current-week-content');
  if (!el) return;

  if (isVacWeek) {
    el.innerHTML = `
      <div class="m5-alert ok">
        <span class="m5-alert-icon">🌴</span>
        <div>Semaine de congés — Mizuki surveille pour toi. Profite !</div>
      </div>`;
    return;
  }

  const year    = M5_DataStore.getYear();
  const curWeek = M5_DataStore.getDay(monday, year);
  const worked  = curWeek ? curWeek.worked : null;

  if (worked === null) {
    el.innerHTML = `
      <div class="m5-empty">
        <div class="m5-empty-icon">✏️</div>
        <div class="m5-empty-text">Saisis tes heures de la semaine en cours<br>pour que Mizuki puisse analyser ta situation.</div>
      </div>
      <button class="m5-btn m5-btn-primary m5-btn-full" onclick="openSaisie('${monday}')">
        ➕ Saisir mes heures cette semaine
      </button>`;
    return;
  }

  const diff     = Math.max(0, worked - contract.hoursBase);
  const pctFull  = Math.round(worked / 35 * 100);
  let alertHtml  = '';

  if (weekResult && weekResult.alerts.length) {
    weekResult.alerts.forEach(a => {
      alertHtml += `<div class="m5-alert ${a.level}"><span class="m5-alert-icon">${a.level === 'critique' ? '🚨' : a.level === 'alerte' ? '⚠️' : '👀'}</span><div>${a.msg}</div></div>`;
    });
  }

  el.innerHTML = `
    <div class="m5-stat-grid" style="margin-bottom:14px;">
      <div class="m5-stat">
        <div class="m5-stat-val">${worked}h</div>
        <div class="m5-stat-label">Heures travaillées</div>
      </div>
      <div class="m5-stat">
        <div class="m5-stat-val ${diff > 0 ? 'warn' : 'ok'}">${diff > 0 ? '+' + diff.toFixed(1) + 'h' : '—'}</div>
        <div class="m5-stat-label">Heures comp.</div>
      </div>
      <div class="m5-stat">
        <div class="m5-stat-val ${pctFull >= 95 ? 'danger' : pctFull >= 80 ? 'warn' : 'ok'}">${pctFull}%</div>
        <div class="m5-stat-label">Du temps plein</div>
      </div>
    </div>
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--miz-text2);margin-bottom:4px;">
        <span>${contract.hoursBase}h contrat</span>
        <span>35h max légal</span>
      </div>
      <div class="m5-progress-wrap">
        <div class="m5-progress-bar ${pctFull >= 95 ? 'danger' : pctFull >= 80 ? 'warn' : ''}" style="width:${Math.min(pctFull,100)}%"></div>
      </div>
    </div>
    ${alertHtml}
    ${weekResult && weekResult.totalAmount > 0 ? `
    <div class="m5-alert info" style="margin-top:8px;">
      <span class="m5-alert-icon">💰</span>
      <div>Montant estimé brut : <strong>${weekResult.totalAmount.toFixed(2)} €</strong>
        ${weekResult.comp1Amount > 0 ? `<br><small>+${weekResult.compH1.toFixed(1)}h à +${Math.round(weekResult.rate1*100)}% = ${weekResult.comp1Amount.toFixed(2)} €</small>` : ''}
        ${weekResult.comp2Amount > 0 ? `<br><small>+${weekResult.compH2.toFixed(1)}h à +${Math.round(weekResult.rate2*100)}% = ${weekResult.comp2Amount.toFixed(2)} €</small>` : ''}
      </div>
    </div>` : ''}
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="m5-btn m5-btn-outline m5-btn-sm" style="flex:1" onclick="openSaisie('${monday}')">✏️ Modifier</button>
      <button class="m5-btn m5-btn-outline m5-btn-sm" style="flex:1" onclick="deleteSemaine('${monday}')">🗑️ Supprimer</button>
    </div>`;
}

// ── Stats rapides ─────────────────────────────────────────────────
function renderQuickStats(analysis) {
  const { annualStats, rule12, contract } = analysis;
  const el = document.getElementById('quick-stats');
  if (!el || !annualStats) return;

  const capH    = contract.hoursBase * (contract.cap || 0.10);
  const r12Cls  = rule12.triggered ? 'danger' : rule12.maxConsec >= 8 ? 'warn' : 'ok';

  el.innerHTML = `
    <div class="m5-stat-grid">
      <div class="m5-stat">
        <div class="m5-stat-val">${annualStats.totalWeeks}</div>
        <div class="m5-stat-label">Semaines saisies</div>
      </div>
      <div class="m5-stat">
        <div class="m5-stat-val ${annualStats.totalComp > 0 ? 'warn' : 'ok'}">${annualStats.totalComp.toFixed(1)}h</div>
        <div class="m5-stat-label">Total comp. année</div>
      </div>
      <div class="m5-stat">
        <div class="m5-stat-val ${r12Cls}">${rule12.maxConsec}</div>
        <div class="m5-stat-label">Semaines consécutives</div>
      </div>
    </div>
    ${rule12.triggered ? `<div class="m5-alert critique" style="margin-top:10px;"><span class="m5-alert-icon">⚖️</span><div>${rule12.msg}</div></div>` :
      rule12.maxConsec >= 8 ? `<div class="m5-alert warn" style="margin-top:10px;"><span class="m5-alert-icon">👀</span><div>${rule12.msg || 'Surveille les 12 semaines consécutives.'}</div></div>` : ''}`;
}

// ── Historique ────────────────────────────────────────────────────
function renderHistorique() {
  const el       = document.getElementById('historique-list');
  const contract = M5_Contract.get();
  if (!el) return;

  const year  = M5_DataStore.getYear();
  const weeks = M5_DataStore.getWeeksSorted(year).slice().reverse();

  if (!weeks.length) {
    el.innerHTML = '<div class="m5-empty"><div class="m5-empty-icon">📋</div><div class="m5-empty-text">Aucune semaine saisie pour ' + year + '.</div></div>';
    return;
  }

  el.innerHTML = weeks.map(w => {
    const isVac  = M5_DataStore.isVacWeek(w.monday, year);
    const worked = w.worked || 0;
    const diff   = Math.max(0, worked - contract.hoursBase);
    const pct35  = Math.round(worked / 35 * 100);

    const d  = new Date(w.monday + 'T12:00:00');
    const fn = new Date(w.monday + 'T12:00:00'); fn.setDate(fn.getDate() + 4);
    const label = `${d.getDate()}/${d.getMonth()+1} → ${fn.getDate()}/${fn.getMonth()+1}`;

    let compClass = 'normal';
    if (isVac)          compClass = 'vacances';
    else if (pct35 >= 95) compClass = 'danger';
    else if (diff > 0)  compClass = 'warn';

    const compLabel = isVac ? '🌴 Congé' : diff > 0 ? `+${diff.toFixed(1)}h` : '✓';

    return `<div class="m5-week-item" onclick="openSaisie('${w.monday}')">
      <div class="m5-week-date">${label}</div>
      <div class="m5-week-hours">${isVac ? '—' : worked + 'h'}</div>
      <div class="m5-week-comp ${compClass}">${compLabel}</div>
    </div>`;
  }).join('');
}

// ── Stats annuelles ───────────────────────────────────────────────
function renderStats() {
  const el = document.getElementById('stats-content');
  const contract = M5_Contract.get();
  if (!el || !contract.hoursBase) return;

  const year   = M5_DataStore.getYear();
  const stats  = M5_DataStore.getAnnualStats(year, contract.hoursBase, contract);
  const caps   = CalcEngine.calcAnnualCap(contract.hoursBase, contract);

  if (!stats) {
    el.innerHTML = '<div class="m5-empty"><div class="m5-empty-icon">📊</div><div class="m5-empty-text">Pas encore assez de données pour afficher les statistiques.</div></div>';
    return;
  }

  const netEst = contract.hourlyRate > 0
    ? CalcEngine.estimateNet(stats.totalComp * contract.hourlyRate * (1 + (contract.rate1 || 0.10)))
    : null;

  el.innerHTML = `
    <div class="m5-card" style="margin:12px 0;">
      <div class="m5-card-header"><span class="m5-card-title">📊 Bilan ${year}</span></div>
      <div class="m5-card-body">
        <div class="m5-stat-grid" style="margin-bottom:14px;">
          <div class="m5-stat">
            <div class="m5-stat-val">${stats.totalWeeks}</div>
            <div class="m5-stat-label">Semaines</div>
          </div>
          <div class="m5-stat">
            <div class="m5-stat-val">${stats.avgWorked}h</div>
            <div class="m5-stat-label">Moy. hebdo</div>
          </div>
          <div class="m5-stat">
            <div class="m5-stat-val">${stats.pctOverContract}%</div>
            <div class="m5-stat-label">Semaines en dépassement</div>
          </div>
        </div>
        <div class="m5-alert ${stats.totalComp > caps.annual ? 'warn' : 'info'}" style="margin-bottom:10px;">
          <span class="m5-alert-icon">⏱️</span>
          <div>
            <strong>${stats.totalComp.toFixed(1)}h</strong> complémentaires au total
            <br><small>Plafond annuel estimé : ${caps.annual.toFixed(1)}h</small>
          </div>
        </div>
        ${stats.totalComp1 > 0 ? `<div class="m5-alert ok" style="margin-bottom:6px;"><span class="m5-alert-icon">💰</span><div>${stats.totalComp1.toFixed(1)}h à +${Math.round((contract.rate1||0.10)*100)}% | ${stats.totalComp2 > 0 ? stats.totalComp2.toFixed(1) + 'h à +' + Math.round((contract.rate2||0.25)*100) + '%' : 'Aucune tranche à 25%'}</div></div>` : ''}
        ${netEst ? `<div class="m5-alert info"><span class="m5-alert-icon">💶</span><div>Estimation net défiscalisé : <strong>${netEst.toFixed(2)} €</strong><br><small>Heures comp. exonérées IR depuis 2019</small></div></div>` : ''}
      </div>
    </div>
    <button class="m5-btn m5-btn-primary m5-btn-full" onclick="exportPDF()">
      📄 Exporter en PDF
    </button>`;
}

// ── Saisie semaine ────────────────────────────────────────────────
function openSaisie(monday) {
  const contract = M5_Contract.get();
  const year     = M5_DataStore.getYear();
  const existing = M5_DataStore.getDay(monday, year);
  const label    = M5_formatMonday(monday);

  document.getElementById('saisie-title').textContent = label;
  document.getElementById('saisie-monday').value      = monday;

  const inp = document.getElementById('saisie-hours');
  inp.value = existing ? existing.worked : contract.hoursBase;
  inp.min   = 0;
  inp.max   = 35;
  inp.step  = 0.5;

  // Preview en temps réel
  updateSaisiePreview();
  openModal('modal-saisie');
}

function updateSaisiePreview() {
  const contract = M5_Contract.get();
  const worked   = parseFloat(document.getElementById('saisie-hours')?.value) || 0;
  const prev     = document.getElementById('saisie-preview');
  if (!prev || !contract.hoursBase) return;

  const result = CalcEngine.calcWeek(contract.hoursBase, worked, contract, contract.hourlyRate || 0);
  const pct35  = Math.round(worked / 35 * 100);

  let html = `<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
    <span style="font-size:13px;background:var(--miz-bg2);padding:4px 10px;border-radius:8px;">
      ${worked}h travaillées
    </span>
    <span style="font-size:13px;background:${result.totalCompH > 0 ? '#fff8e1' : '#e8f5e9'};padding:4px 10px;border-radius:8px;color:${result.totalCompH > 0 ? '#e65100' : '#2e7d32'};">
      ${result.totalCompH > 0 ? '+' + result.totalCompH.toFixed(1) + 'h comp.' : '✓ Dans le contrat'}
    </span>
    <span style="font-size:13px;background:${pct35 >= 95 ? '#ffebee' : '#f5f0ff'};padding:4px 10px;border-radius:8px;color:${pct35 >= 95 ? '#c62828' : 'var(--miz-primary)'};">
      ${pct35}% du temps plein
    </span>
  </div>`;

  if (result.alerts.length) {
    result.alerts.forEach(a => {
      html += `<div class="m5-alert ${a.level}" style="font-size:12px;padding:6px 10px;"><span>${a.level==='critique'?'🚨':'⚠️'}</span> ${a.msg}</div>`;
    });
  }

  if (result.totalAmount > 0) {
    html += `<div class="m5-alert info" style="font-size:12px;padding:6px 10px;"><span>💰</span> Montant estimé : <strong>${result.totalAmount.toFixed(2)} €</strong> brut</div>`;
  }

  prev.innerHTML = html;
}

function saveSaisie() {
  const monday = document.getElementById('saisie-monday').value;
  const worked = parseFloat(document.getElementById('saisie-hours').value);

  if (!monday || isNaN(worked) || worked < 0) {
    toast('Saisis un nombre d\'heures valide.', 'error');
    return;
  }

  const year = M5_DataStore.getYear();
  M5_DataStore.saveWeek(monday, worked, year);
  Mizuki.clearCache();
  closeModal('modal-saisie');
  toast('Semaine enregistrée ✓', 'success');
  refreshUI();
}

function deleteSemaine(monday) {
  if (!confirm('Supprimer les données de cette semaine ?')) return;
  const year = M5_DataStore.getYear();
  M5_DataStore.deleteWeek(monday, year);
  Mizuki.clearCache();
  toast('Semaine supprimée', 'info');
  refreshUI();
}

// ── Popup Mizuki ──────────────────────────────────────────────────
function openMizukiPopup() {
  const analysis = currentAnalysis || runAnalysis();
  if (!analysis) return;

  const popup = Mizuki.getPopupContent(analysis);
  if (!popup) return;

  const lvlMap = { ok: '✅ Tout va bien', info: '📋 Info', vigilance: '👀 Vigilance', alerte: '⚠️ Alerte', critique: '🚨 Critique' };

  document.getElementById('mizuki-popup-body').innerHTML = `
    <div class="mizuki-popup-icon">${popup.icon}</div>
    <div>
      <span class="mizuki-popup-level ${popup.level}">${lvlMap[popup.level] || popup.level}</span>
    </div>
    <div class="mizuki-popup-title" style="font-size:17px;font-weight:700;color:var(--miz-dark);margin-bottom:10px;">${popup.titre}</div>
    <div class="mizuki-popup-msg">${popup.message}</div>
    ${popup.actions && popup.actions.length ? `
    <div style="font-size:12px;color:var(--miz-text2);font-weight:600;letter-spacing:.05em;margin-bottom:6px;">À FAIRE</div>
    <div class="mizuki-popup-actions">
      ${popup.actions.map(a => `<div class="mizuki-popup-action">${a}</div>`).join('')}
    </div>` : ''}
    <div style="font-size:11px;color:var(--miz-text3);text-align:center;margin-top:14px;">
      🦊 Mizuki est ton alliée — pas un avis juridique
    </div>`;

  openModal('modal-mizuki');
}

// ── Contrat ───────────────────────────────────────────────────────
function openContractModal() {
  const c = M5_Contract.get();
  document.getElementById('contract-hours').value    = c.hoursBase    || '';
  document.getElementById('contract-rate').value     = c.hourlyRate   || '';
  document.getElementById('contract-ccn').value      = c.idcc         || '0';
  document.getElementById('contract-cap').value      = c.cap === 0.33 ? '0.33' : '0.10';

  // Nom utilisatrice
  const name = localStorage.getItem('M5_USER_NAME') || '';
  document.getElementById('contract-name').value = name;

  openModal('modal-contract');
}

function saveContract() {
  const hoursBase  = parseFloat(document.getElementById('contract-hours').value);
  const hourlyRate = parseFloat(document.getElementById('contract-rate').value) || 0;
  const idcc       = parseInt(document.getElementById('contract-ccn').value)    || 0;
  const cap        = parseFloat(document.getElementById('contract-cap').value)  || 0.10;
  const name       = document.getElementById('contract-name').value.trim();

  if (!hoursBase || hoursBase <= 0 || hoursBase >= 35) {
    toast('Saisis une durée entre 1 et 34,5h.', 'error');
    return;
  }

  const ccnRules = typeof CCN_PARTIEL_API !== 'undefined'
    ? CCN_PARTIEL_API.getRules(idcc)
    : { rate1: 0.10, rate2: 0.25, threshold: 0.10 };

  const contract = {
    hoursBase,
    hourlyRate,
    idcc,
    ccnNom:    ccnRules.nom || 'Droit commun',
    cap,
    rate1:     ccnRules.rate1     || 0.10,
    rate2:     ccnRules.rate2     || 0.25,
    threshold: ccnRules.threshold || 0.10,
  };

  M5_Contract.save(contract);
  if (name) localStorage.setItem('M5_USER_NAME', name);
  Mizuki.clearCache();
  closeModal('modal-contract');
  toast('Contrat enregistré ✓', 'success');
  refreshUI();
}

// ── Export PDF ────────────────────────────────────────────────────
function exportPDF() {
  const year = M5_DataStore.getYear();
  try {
    PDFReportM5.generate(year);
  } catch(e) {
    toast('Erreur lors de la génération du PDF.', 'error');
    console.error(e);
  }
}

// ── Init CCN select ───────────────────────────────────────────────
function initCCNSelect() {
  const sel = document.getElementById('contract-ccn');
  if (!sel || typeof CCN_PARTIEL_API === 'undefined') return;

  const secteurs = CCN_PARTIEL_API.getSecteurs();
  sel.innerHTML = '';

  secteurs.forEach(sec => {
    const group = document.createElement('optgroup');
    group.label = sec.icon + ' ' + sec.label;
    const ccns = CCN_PARTIEL_API.getBySecteur(sec.id);
    ccns.forEach(ccn => {
      const opt = document.createElement('option');
      opt.value       = ccn.idcc;
      opt.textContent = ccn.nom + (ccn.idcc ? ` (IDCC ${ccn.idcc})` : '');
      group.appendChild(opt);
    });
    sel.appendChild(group);
  });
}

// ── Exposition globale ────────────────────────────────────────────
window.showSection      = showSection;
window.openModal        = openModal;
window.closeModal       = closeModal;
window.openSaisie       = openSaisie;
window.saveSaisie       = saveSaisie;
window.deleteSemaine    = deleteSemaine;
window.updateSaisiePreview = updateSaisiePreview;
window.openMizukiPopup  = openMizukiPopup;
window.openContractModal= openContractModal;
window.saveContract     = saveContract;
window.exportPDF        = exportPDF;
window.M5_toast         = toast;

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCCNSelect();
  showSection('accueil');
  refreshUI();

  // Polling léger (10s) pour sync avec M4 vacances
  setInterval(() => {
    if (currentSection === 'accueil') refreshUI();
  }, 10000);
});

}());
