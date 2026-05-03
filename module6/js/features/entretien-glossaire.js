/**
 * ENTRETIEN ANNUEL + GLOSSAIRE UI — M6 Cadres
 * Entretien : trame L3121-65, compte-rendu, coffre-fort
 * Glossaire : recherche, filtres tags, affichage modal
 */
'use strict';

(function(global) {

// ══════════════════════════════════════════════════════════════════
//  MODULE ENTRETIEN ANNUEL
// ══════════════════════════════════════════════════════════════════
const M6_Entretien = {

  /**
   * Rend le formulaire d'entretien dans un conteneur.
   */
  renderForm(container, regime, year, contract, analysis, onSave) {
    const entretiens = M6_Storage.getEntretiens(regime);
    const dernierE   = entretiens.length ? entretiens[entretiens.length-1] : null;

    container.innerHTML = `
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Entretien annuel — Art. L3121-65</div>
      <div class="m6-ornement-line"></div>
    </div>

    <div class="m6-alert info" style="margin-bottom:16px">
      <span class="m6-alert-icon">⚖️</span>
      <div>L'entretien annuel est <strong>obligatoire</strong> pour valider le forfait jours. Son absence peut entraîner la nullité de la convention (Cass. Soc. 29 juin 2011).</div>
    </div>

    ${dernierE ? `
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-header">
        <div class="m6-card-icon">✅</div>
        <div>
          <div class="m6-card-label">Dernier entretien enregistré</div>
          <div class="m6-card-title">${new Date(dernierE.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <button onclick="M6_PDF.exportEntretien({regime:'${regime}',year:${year},contract:${JSON.stringify(contract).replace(/'/g,'\\\'')},analysis:${JSON.stringify(analysis||{}).replace(/'/g,'\\\'')},entretien:${JSON.stringify(dernierE).replace(/'/g,'\\\'')}})" 
          class="m6-btn m6-btn-ghost" style="font-size:0.75rem;padding:6px 10px">📄 PDF</button>
      </div>
      ${dernierE.charge ? `
      <div class="m6-card-body" style="padding:10px 14px">
        <div class="m6-row"><span class="m6-row-label">Charge évaluée</span><span class="m6-row-val">${dernierE.charge}/5</span></div>
        ${dernierE.actions ? `<div style="font-size:0.78rem;color:var(--pierre);margin-top:6px">${dernierE.actions}</div>` : ''}
      </div>` : ''}
    </div>` : ''}

    ${entretiens.length > 1 ? `
    <div class="m6-card" style="margin-bottom:14px">
      <div class="m6-card-body">
        <div class="m6-card-label" style="margin-bottom:8px">Historique des entretiens</div>
        ${entretiens.slice(-5).reverse().map(e=>`
          <div class="m6-row">
            <span class="m6-row-label">${new Date(e.date+'T12:00:00').toLocaleDateString('fr-FR')}</span>
            <span class="m6-row-val">${e.charge?'Charge '+e.charge+'/5':''} ${e.manager?'· '+e.manager:''}</span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- Nouveau formulaire -->
    <div class="m6-card">
      <div class="m6-card-header">
        <div class="m6-card-icon">📝</div>
        <div><div class="m6-card-label">Enregistrer un entretien</div>
             <div class="m6-card-title">Nouveau compte-rendu</div></div>
      </div>
      <div class="m6-card-body">

        <div class="m6-field">
          <label>Date de l'entretien *</label>
          <input type="date" id="ent-date" value="${new Date().toISOString().slice(0,10)}" style="font-size:14px">
        </div>

        <div class="m6-field">
          <label>Manager / RH présent</label>
          <input type="text" id="ent-manager" value="${contract.nomManager||''}" placeholder="Prénom Nom" style="font-size:14px">
        </div>

        <div class="m6-field">
          <label>1. Évaluation de la charge de travail (1=très difficile / 5=excellente)</label>
          <select id="ent-charge" style="font-size:14px">
            <option value="">— Sélectionner —</option>
            <option value="1">1 — Charge excessive, insoutenable</option>
            <option value="2">2 — Difficile mais gérable</option>
            <option value="3">3 — Normale, conforme au forfait</option>
            <option value="4">4 — Bonne, équilibrée</option>
            <option value="5">5 — Excellente, idéale</option>
          </select>
        </div>

        <div class="m6-field">
          <label>2. Articulation vie pro / personnelle</label>
          <select id="ent-equilibre" style="font-size:14px">
            <option value="">— Sélectionner —</option>
            <option value="difficile">Difficile — déséquilibre notable</option>
            <option value="moyen">Moyen — quelques tensions</option>
            <option value="bon">Bon — globalement satisfaisant</option>
            <option value="excellent">Excellent — pleinement satisfait</option>
          </select>
        </div>

        <div class="m6-field">
          <label>3. Organisation du travail — observations</label>
          <textarea id="ent-organisation" rows="3" placeholder="Télétravail, déplacements, astreintes, outils…" style="font-size:14px;width:100%;border:1px solid var(--ivoire-3);border-radius:8px;padding:8px;font-family:var(--font-body)"></textarea>
        </div>

        <div class="m6-field">
          <label>4. Plan d'action et objectifs</label>
          <textarea id="ent-actions" rows="3" placeholder="Actions prévues, objectifs de la prochaine période…" style="font-size:14px;width:100%;border:1px solid var(--ivoire-3);border-radius:8px;padding:8px;font-family:var(--font-body)"></textarea>
        </div>

        <div class="m6-field">
          <label>5. Demande d'ajustement de charge ou de forfait</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;font-weight:400;cursor:pointer">
              <input type="radio" name="ent-ajust" value="non" checked style="width:auto"> Non, situation satisfaisante
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;font-weight:400;cursor:pointer">
              <input type="radio" name="ent-ajust" value="oui" style="width:auto"> Oui, ajustement demandé
            </label>
          </div>
        </div>

        <!-- Données M6 au moment de l'entretien -->
        <div style="background:var(--ivoire);border-radius:8px;padding:12px;margin-bottom:14px;font-size:0.78rem;color:var(--pierre)">
          <div style="font-weight:600;color:var(--charbon);margin-bottom:6px">📊 Données M6 au ${new Date().toLocaleDateString('fr-FR')}</div>
          ${analysis ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
            <div>Jours travaillés : <strong>${analysis.joursEffectifs||0}/${analysis.plafond||218}</strong></div>
            <div>RTT solde : <strong>${analysis.rttSolde>=0?'+':''}${analysis.rttSolde||0}j</strong></div>
            <div>Alertes : <strong>${analysis.alertes?.length||0}</strong></div>
            <div>Avancement : <strong>${analysis.tauxRemplissage||0}%</strong></div>
          </div>` : ''}
        </div>

        <button class="m6-btn m6-btn-gold" id="ent-save">Enregistrer l'entretien</button>
      </div>
    </div>
    `;

    container.querySelector('#ent-save')?.addEventListener('click', () => {
      const date = container.querySelector('#ent-date')?.value;
      if (!date) { M6_toast('Saisissez la date de l\'entretien'); return; }
      const e = {
        date,
        manager:      container.querySelector('#ent-manager')?.value.trim(),
        charge:       container.querySelector('#ent-charge')?.value,
        equilibre:    container.querySelector('#ent-equilibre')?.value,
        organisation: container.querySelector('#ent-organisation')?.value.trim(),
        actions:      container.querySelector('#ent-actions')?.value.trim(),
        ajustement:   container.querySelector('input[name="ent-ajust"]:checked')?.value,
        year, snapshotAnalysis: {
          joursEffectifs: analysis?.joursEffectifs,
          rttSolde: analysis?.rttSolde,
          alertes: analysis?.alertes?.length
        }
      };
      M6_Storage.addEntretien(regime, year || new Date().getFullYear(), e);
      // Mettre à jour date dans le contrat
      const ctr = M6_Storage.getContract(regime);
      ctr.entretienDate = date;
      M6_Storage.setContract(regime, ctr);
      M6_toast('✅ Entretien enregistré');
      if (onSave) onSave(e);
    });
  }
};

// ══════════════════════════════════════════════════════════════════
//  GLOSSAIRE UI
// ══════════════════════════════════════════════════════════════════
const M6_GlossaireUI = {

  render(container) {
    container.innerHTML = `
    <div class="m6-ornement">
      <div class="m6-ornement-line"></div>
      <div class="m6-ornement-text">Glossaire Cadres & Forfait</div>
      <div class="m6-ornement-line"></div>
    </div>

    <div class="m6-field" style="margin-bottom:10px">
      <input type="text" id="gloss-search" placeholder="🔍 Rechercher un terme, article, mot-clé…" style="font-size:16px">
    </div>

    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px" id="gloss-tags">
      ${this._buildTags()}
    </div>

    <div id="gloss-results"></div>
    `;

    container.querySelector('#gloss-search')?.addEventListener('input', e => {
      this._search(container, e.target.value, null);
    });
    container.querySelectorAll('.gloss-tag').forEach(t => {
      t.addEventListener('click', () => {
        container.querySelectorAll('.gloss-tag').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        const tag = t.dataset.tag;
        this._search(container, '', tag === '_all' ? null : tag);
      });
    });

    this._search(container, '', null);
  },

  _buildTags() {
    const tags = new Set(['forfait','RTT','congés','santé','heures supplémentaires','CCN','télétravail']);
    return `<button class="gloss-tag active" data-tag="_all" style="font-size:0.7rem;border:1px solid var(--champagne);border-radius:99px;padding:3px 10px;background:var(--champagne-3);color:var(--champagne-2);cursor:pointer">Tous</button>` +
      Array.from(tags).map(t =>
        `<button class="gloss-tag" data-tag="${t}" style="font-size:0.7rem;border:1px solid var(--ivoire-3);border-radius:99px;padding:3px 10px;background:var(--ivoire);color:var(--pierre);cursor:pointer">${t}</button>`
      ).join('');
  },

  _search(container, q, tag) {
    let results = q ? M6_GlossaireAPI.search(q) : M6_GlossaireAPI.getAll();
    if (tag) results = results.filter(e => e.tags.includes(tag));
    const el = container.querySelector('#gloss-results');
    if (!el) return;
    if (!results.length) { el.innerHTML = '<div class="m6-alert info" style="font-size:0.8rem"><span>🔍</span><div>Aucun résultat pour cette recherche.</div></div>'; return; }
    el.innerHTML = results.map(e => `
    <div class="m6-card" style="margin-bottom:10px">
      <div class="m6-card-body" style="padding:12px 14px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <div style="font-family:var(--font-display);font-size:1rem;font-weight:600;color:var(--charbon)">${e.terme}</div>
          <span class="m6-badge m6-badge-neutral" style="flex-shrink:0;margin-left:8px;font-size:0.6rem">${e.art}</span>
        </div>
        <div style="font-size:0.82rem;color:var(--charbon-3);line-height:1.55;margin-bottom:8px">${e.def}</div>
        <div style="background:var(--ivoire);border-radius:6px;padding:8px 10px;font-size:0.75rem;color:var(--pierre);line-height:1.5;border-left:3px solid var(--champagne)">
          <strong style="color:var(--champagne-2)">Exemple :</strong> ${e.exemple}
        </div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">
          ${e.tags.map(t=>`<span style="font-size:0.6rem;background:var(--ivoire-2);color:var(--pierre);border-radius:4px;padding:1px 6px">${t}</span>`).join('')}
        </div>
      </div>
    </div>`).join('');
  }
};

global.M6_Entretien   = M6_Entretien;
global.M6_GlossaireUI = M6_GlossaireUI;

})(window);
