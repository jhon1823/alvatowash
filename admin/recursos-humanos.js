/* ══════════════════════════════════════════════════════════════════
   RECURSOS HUMANOS · v2
   ─────────────────────────────────────────────────────────────────
   - Solo superadmin (dueña)
   - Departamentos: Operaciones · RRHH · Contabilidad · Marketing
   - Documentación por empleado: DNI, contrato, nóminas, fecha alta,
     salario base, % comisión
   - Cálculo de nómina con base + comisión sobre servicios
   - Filtros: por centro y por departamento
   - Sin emojis · Estilo Apple light · paleta admin
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_RRHH_V2__) return;
  window.__ALVATO_RRHH_V2__ = true;

  const DEPARTAMENTOS = [
    { id:'operaciones', label:'Operaciones',   color:'#0A84FF' },
    { id:'rrhh',        label:'RRHH',          color:'#BF5AF2' },
    { id:'contabilidad',label:'Contabilidad',  color:'#30D158' },
    { id:'marketing',   label:'Marketing',     color:'#FF9F0A' }
  ];

  const STYLE = `
    #page-rrhh{padding:24px;max-width:1280px;margin:0 auto}
    .rh-head-sub{font-size:13.5px;color:#86868B;margin-bottom:18px}

    .rh-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:18px;padding:14px 16px;background:#fff;border:1px solid rgba(0,0,0,.05);border-radius:14px}
    .rh-bar-lbl{font-size:11.5px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;color:#86868B;margin-right:6px}
    .rh-chip{padding:7px 13px;border-radius:999px;background:#F5F5F7;color:#1D1D1F;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:background .15s,color .15s,border-color .15s}
    .rh-chip:hover{background:#EBEBED}
    .rh-chip.active{background:#1D1D1F;color:#fff}
    .rh-chip.dept[data-dep="operaciones"].active{background:#0A84FF}
    .rh-chip.dept[data-dep="rrhh"].active{background:#BF5AF2}
    .rh-chip.dept[data-dep="contabilidad"].active{background:#30D158}
    .rh-chip.dept[data-dep="marketing"].active{background:#FF9F0A}
    .rh-btn-add{margin-left:auto;background:#DC2626;color:#fff;padding:9px 16px;border-radius:10px;font-size:13px;font-weight:600;letter-spacing:-.2px;display:inline-flex;align-items:center;gap:6px;transition:background .15s}
    .rh-btn-add:hover{background:#991B1B}
    .rh-btn-add svg{width:14px;height:14px;stroke-width:2.2}

    .rh-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:18px}
    .rh-stat{background:#fff;border:1px solid rgba(0,0,0,.05);border-radius:14px;padding:16px 18px}
    .rh-stat-lbl{font-size:11.5px;font-weight:600;color:#86868B;letter-spacing:.4px;text-transform:uppercase;margin-bottom:4px}
    .rh-stat-val{font-size:22px;font-weight:700;color:#1D1D1F;letter-spacing:-.6px}
    .rh-stat-sub{font-size:11.5px;color:#86868B;margin-top:2px}

    .rh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
    .rh-card{background:#fff;border:1px solid rgba(0,0,0,.05);border-radius:14px;padding:16px 18px;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .rh-card:hover{transform:translateY(-2px);border-color:rgba(0,0,0,.12);box-shadow:0 6px 16px rgba(0,0,0,.06)}
    .rh-card-head{display:flex;align-items:center;gap:11px;margin-bottom:10px}
    .rh-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#DC2626,#991B1B);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;letter-spacing:-.3px;flex-shrink:0}
    .rh-card-name{font-size:14.5px;font-weight:700;letter-spacing:-.3px;color:#1D1D1F;line-height:1.2}
    .rh-card-role{font-size:11.5px;color:#86868B;margin-top:2px;font-weight:500}
    .rh-pill{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase}
    .rh-pill.operaciones{background:rgba(10,132,255,.1);color:#0A84FF}
    .rh-pill.rrhh{background:rgba(191,90,242,.12);color:#BF5AF2}
    .rh-pill.contabilidad{background:rgba(48,209,88,.12);color:#1F8F3D}
    .rh-pill.marketing{background:rgba(255,159,10,.12);color:#D97706}
    .rh-card-foot{display:flex;justify-content:space-between;align-items:center;margin-top:11px;padding-top:11px;border-top:1px solid rgba(0,0,0,.05);font-size:12px;color:#424245}
    .rh-card-foot strong{font-weight:700;color:#1D1D1F}

    .rh-doc-state{display:flex;gap:5px;margin-top:8px}
    .rh-doc-dot{width:7px;height:7px;border-radius:50%;background:#E5E5E7}
    .rh-doc-dot.ok{background:#30D158}
    .rh-doc-dot.missing{background:#FF453A}

    .rh-empty{padding:60px 24px;text-align:center;color:#86868B;background:#fff;border:1px dashed rgba(0,0,0,.1);border-radius:14px}

    /* Modal detalle empleado */
    .rh-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:none;align-items:flex-start;justify-content:center;padding:40px 20px 20px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);overflow-y:auto}
    .rh-modal.show{display:flex}
    .rh-modal-box{background:#fff;border-radius:18px;width:100%;max-width:600px;box-shadow:0 24px 60px rgba(0,0,0,.18);padding:26px 26px 22px}
    .rh-modal-head{display:flex;align-items:center;gap:13px;margin-bottom:18px}
    .rh-modal-head .rh-avatar{width:50px;height:50px;font-size:15px}
    .rh-modal-title{font-size:18px;font-weight:700;letter-spacing:-.4px;color:#1D1D1F;line-height:1.2}
    .rh-modal-sub{font-size:12px;color:#86868B;margin-top:2px;font-weight:500}
    .rh-modal-close{margin-left:auto;width:28px;height:28px;border-radius:50%;background:#F5F5F7;color:#86868B;display:inline-flex;align-items:center;justify-content:center;transition:background .15s,color .15s;flex-shrink:0}
    .rh-modal-close:hover{background:rgba(0,0,0,.08);color:#1D1D1F}
    .rh-modal-close svg{width:13px;height:13px;stroke-width:2.4}

    .rh-tabs{display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid rgba(0,0,0,.06)}
    .rh-tab{padding:9px 14px;font-size:13px;font-weight:600;color:#86868B;border-bottom:2px solid transparent;cursor:pointer;letter-spacing:-.2px;transition:color .15s,border-color .15s;margin-bottom:-1px}
    .rh-tab:hover{color:#1D1D1F}
    .rh-tab.active{color:#DC2626;border-bottom-color:#DC2626}

    .rh-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .rh-modal-field{margin-bottom:12px}
    .rh-modal-field.full{grid-column:1/-1}
    .rh-modal-label{display:block;font-size:11.5px;font-weight:600;color:#424245;margin-bottom:6px}
    .rh-modal-input,.rh-modal-select{width:100%;padding:10px 13px;background:#FAFAFA;border:1px solid rgba(0,0,0,.08);border-radius:9px;outline:none;font-family:inherit;font-size:13.5px;color:#1D1D1F;transition:border-color .15s,background .15s}
    .rh-modal-input:focus,.rh-modal-select:focus{border-color:#DC2626;background:#fff}
    .rh-modal-help{font-size:11px;color:#86868B;margin-top:4px;line-height:1.4}

    .rh-doc-row{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:11px 13px;background:#FAFAFA;border-radius:10px;margin-bottom:8px}
    .rh-doc-row-name{font-size:13px;font-weight:600;color:#1D1D1F}
    .rh-doc-row-sub{font-size:11px;color:#86868B;margin-top:1px}
    .rh-doc-row-state{font-size:11.5px;font-weight:600;color:#86868B}
    .rh-doc-row-state.ok{color:#1F8F3D}
    .rh-doc-row-state.missing{color:#FF453A}
    .rh-doc-row-btn{padding:6px 11px;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:8px;font-size:11.5px;font-weight:600;color:#1D1D1F;cursor:pointer}
    .rh-doc-row-btn:hover{background:#F5F5F7}

    .rh-nom-summary{background:linear-gradient(135deg,#1D1D1F,#000);color:#fff;border-radius:12px;padding:16px 18px;margin-bottom:14px}
    .rh-nom-summary-lbl{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#A1A1A6;margin-bottom:6px}
    .rh-nom-summary-val{font-size:28px;font-weight:700;letter-spacing:-.8px}
    .rh-nom-summary-detail{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12)}
    .rh-nom-summary-detail-lbl{font-size:10.5px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:#A1A1A6}
    .rh-nom-summary-detail-val{font-size:16px;font-weight:700;margin-top:2px}

    .rh-cta{display:flex;gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(0,0,0,.06)}
    .rh-btn-primary{flex:1;padding:11px;background:#DC2626;color:#fff;border-radius:10px;font-weight:600;font-size:13.5px;letter-spacing:-.2px;transition:background .15s}
    .rh-btn-primary:hover{background:#991B1B}
    .rh-btn-ghost{padding:11px 18px;background:#F5F5F7;color:#1D1D1F;border-radius:10px;font-weight:600;font-size:13.5px}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* ─── Estado ─── */
  let EMPLEADOS = [];
  let ACTIVE_CENTRO = '*';
  let ACTIVE_DEPT = '*';
  let ACTIVE_TAB = 'datos';
  let CURRENT_EMP = null;

  /* ─── Persistencia local (mientras backend no tenga estos campos) ─── */
  function getEmpData(id){
    try { return JSON.parse(localStorage.getItem('alvato_emp_data')||'{}')[id] || {}; } catch(e){ return {}; }
  }
  function setEmpData(id, fields){
    let all = {};
    try { all = JSON.parse(localStorage.getItem('alvato_emp_data')||'{}'); } catch(e){}
    all[id] = Object.assign(all[id]||{}, fields);
    localStorage.setItem('alvato_emp_data', JSON.stringify(all));
  }

  /* ─── Empleados CREADOS localmente (los que no vienen del backend).
     Se guardan completos para que sobrevivan a recargas. ─── */
  function getEmpLocales(){
    try { return JSON.parse(localStorage.getItem('alvato_emp_locales')||'[]'); } catch(e){ return []; }
  }
  function saveEmpLocales(arr){
    localStorage.setItem('alvato_emp_locales', JSON.stringify(arr||[]));
  }
  function addEmpLocal(emp){
    const arr = getEmpLocales();
    const i = arr.findIndex(x => String(x.ID||x.id) === String(emp.ID||emp.id));
    if (i >= 0) arr[i] = Object.assign(arr[i], emp);
    else arr.push(emp);
    saveEmpLocales(arr);
  }
  function removeEmpLocal(id){
    saveEmpLocales(getEmpLocales().filter(x => String(x.ID||x.id) !== String(id)));
  }
  /* Cargar empleados locales a la lista global de empleados, una sola vez por recarga */
  function hydrateEmpLocales(){
    if (!window.EMPLEADOS_ALL) window.EMPLEADOS_ALL = window.EMPLOYEES || [];
    const locales = getEmpLocales();
    locales.forEach(emp => {
      const id = String(emp.ID||emp.id);
      const exists = window.EMPLEADOS_ALL.some(x => String(x.ID||x.id) === id);
      if (!exists) window.EMPLEADOS_ALL.push(emp);
    });
  }

  function mergeEmp(e){
    const id = e.ID || e.id;
    const local = getEmpData(id);
    /* IMPORTANTE: lo que esté en localStorage es lo que el dueño guardó
       desde la UI. Tiene que GANAR sobre lo que devuelve el backend.
       Empezamos copiando el empleado del backend y aplicamos local encima. */
    const merged = Object.assign({}, e);
    const overridable = [
      'Departamento','DNI','ContratoURL','NominaURL','DNIURL',
      'PrevencionURL','SeguridadURL','FechaAlta',
      'SalarioBase','ComisionPct','Telefono','Email',
      'UltimaEvaluacion','NotasRH','Nombre','Rol','CentroID'
    ];
    overridable.forEach(k => {
      if (local[k] !== undefined && local[k] !== '' && local[k] !== null) {
        merged[k] = local[k];
      }
    });
    /* Defaults solo si todavía no hay valor */
    if (!merged.Departamento) merged.Departamento = 'operaciones';
    if (merged.SalarioBase === undefined || merged.SalarioBase === '' || merged.SalarioBase === null) merged.SalarioBase = 1300;
    if (merged.ComisionPct === undefined || merged.ComisionPct === '' || merged.ComisionPct === null) merged.ComisionPct = 5;
    merged.SalarioBase = Number(merged.SalarioBase) || 1300;
    merged.ComisionPct = Number(merged.ComisionPct);
    if (isNaN(merged.ComisionPct)) merged.ComisionPct = 5;
    return merged;
  }

  function initials(name){
    return String(name||'?').split(' ').filter(Boolean).slice(0,2).map(s => s[0].toUpperCase()).join('') || '?';
  }
  function centroLabel(id){
    const c = (window.CONFIG?.centros||[]).find(x => x.id === id);
    return c ? c.ciudad : id || '—';
  }

  /* ─── Cálculo de nómina (mes en curso) ─── */
  function calcNomina(emp){
    const reservas = (window.RESERVAS_ALL || window.BOOKINGS || []);
    const hoy = new Date();
    const month0 = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`;
    const myBookings = reservas.filter(r => {
      const isMine = (r.EmpleadoID === emp.ID || r.Empleado === emp.Nombre || r.empleadoId === emp.ID);
      const fecha = String(r.Fecha || r.fecha || '');
      const isThisMonth = fecha.startsWith(month0);
      const estado = (r.Estado || r.estado || '').toLowerCase();
      const pago = (r.Pago || r.pago || '').toLowerCase();
      const isDone = estado === 'completada' || pago === 'pagado';
      return isMine && isThisMonth && isDone;
    });
    const facturacion = myBookings.reduce((s,b) => s + Number(b.Total || b.total || b.Precio || 0), 0);
    const comision = facturacion * (emp.ComisionPct / 100);
    const total = emp.SalarioBase + comision;
    return {
      mes: month0, base: emp.SalarioBase, comisionPct: emp.ComisionPct,
      comision, total, facturacion, cantidad: myBookings.length
    };
  }

  /* ─── Render ─── */
  function render(){
    const page = document.getElementById('page-rrhh');
    if (!page) return;

    /* 1. Asegurar que los empleados creados localmente estén en la lista global */
    hydrateEmpLocales();
    /* 2. Mezclar con datos editados localmente */
    EMPLEADOS = (window.EMPLEADOS_ALL || window.EMPLOYEES || []).map(mergeEmp);

    const filtered = EMPLEADOS.filter(e => {
      const okCentro = ACTIVE_CENTRO === '*' || e.CentroID === ACTIVE_CENTRO || e.Centro === ACTIVE_CENTRO;
      const okDept = ACTIVE_DEPT === '*' || e.Departamento === ACTIVE_DEPT;
      return okCentro && okDept;
    });

    const totalSalarios = filtered.reduce((s,e) => s + calcNomina(e).total, 0);
    const expedientesOk = filtered.filter(e => e.DNI && e.ContratoURL).length;
    const stats = `
      <div class="rh-stats">
        <div class="rh-stat">
          <div class="rh-stat-lbl">Total personal</div>
          <div class="rh-stat-val">${filtered.length}</div>
          <div class="rh-stat-sub">de ${EMPLEADOS.length} en plantilla</div>
        </div>
        <div class="rh-stat">
          <div class="rh-stat-lbl">Coste salarial</div>
          <div class="rh-stat-val">${Math.round(totalSalarios).toLocaleString('es-ES')}€</div>
          <div class="rh-stat-sub">mes en curso (base + comisión)</div>
        </div>
        <div class="rh-stat">
          <div class="rh-stat-lbl">Documentación</div>
          <div class="rh-stat-val">${expedientesOk}/${filtered.length}</div>
          <div class="rh-stat-sub">expedientes completos</div>
        </div>
      </div>
    `;

    const centros = (window.CONFIG?.centros||[]);
    const chipsCentro = `
      <div class="rh-bar">
        <div class="rh-bar-lbl">Centro</div>
        <button class="rh-chip ${ACTIVE_CENTRO==='*'?'active':''}" data-centro="*">Todos</button>
        ${centros.map(c => `<button class="rh-chip ${ACTIVE_CENTRO===c.id?'active':''}" data-centro="${c.id}">${c.ciudad}</button>`).join('')}
      </div>
    `;
    const chipsDept = `
      <div class="rh-bar">
        <div class="rh-bar-lbl">Departamento</div>
        <button class="rh-chip dept ${ACTIVE_DEPT==='*'?'active':''}" data-dep="*">Todos</button>
        ${DEPARTAMENTOS.map(d => `<button class="rh-chip dept ${ACTIVE_DEPT===d.id?'active':''}" data-dep="${d.id}">${d.label}</button>`).join('')}
        <button class="rh-btn-add" onclick="window.rhAddEmpleado()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Añadir persona
        </button>
      </div>
    `;

    let cards;
    if (!filtered.length) {
      cards = `<div class="rh-empty">No hay personal con estos filtros.<br><span style="font-size:11.5px">Usa el botón "Añadir persona" arriba a la derecha.</span></div>`;
    } else {
      cards = '<div class="rh-grid">' + filtered.map(e => {
        const dept = DEPARTAMENTOS.find(d => d.id === e.Departamento) || DEPARTAMENTOS[0];
        const docs = [!!e.DNI, !!e.ContratoURL, !!e.NominaURL, !!e.FechaAlta];
        const nomina = calcNomina(e);
        return `
          <div class="rh-card" data-id="${e.ID||e.id}">
            <div class="rh-card-head">
              <div class="rh-avatar">${initials(e.Nombre || e.nombre)}</div>
              <div style="flex:1;min-width:0">
                <div class="rh-card-name">${e.Nombre || e.nombre || '—'}</div>
                <div class="rh-card-role">${e.Rol || e.cargo || '—'} · ${centroLabel(e.CentroID || e.Centro)}</div>
              </div>
              <span class="rh-pill ${dept.id}">${dept.label}</span>
            </div>
            <div class="rh-doc-state" title="DNI · Contrato · Nóminas · Fecha alta">
              ${docs.map(ok => `<div class="rh-doc-dot ${ok?'ok':'missing'}"></div>`).join('')}
            </div>
            <div class="rh-card-foot">
              <span>Salario este mes</span>
              <strong>${Math.round(nomina.total).toLocaleString('es-ES')}€</strong>
            </div>
          </div>
        `;
      }).join('') + '</div>';
    }

    page.innerHTML = `
      <div class="rh-head-sub">Documentación de TODO el personal (operaciones, RRHH, contabilidad, marketing) separada por centro. Click en cualquier persona para ver y editar su expediente.</div>
      ${stats}
      ${chipsCentro}
      ${chipsDept}
      ${cards}
    `;

    page.querySelectorAll('.rh-chip[data-centro]').forEach(btn => btn.addEventListener('click', () => {
      ACTIVE_CENTRO = btn.dataset.centro; render();
    }));
    page.querySelectorAll('.rh-chip[data-dep]').forEach(btn => btn.addEventListener('click', () => {
      ACTIVE_DEPT = btn.dataset.dep; render();
    }));
    page.querySelectorAll('.rh-card').forEach(card => card.addEventListener('click', () => openModal(card.dataset.id)));
  }

  /* ─── Modal ─── */
  function openModal(id){
    const e = EMPLEADOS.find(x => String(x.ID||x.id) === String(id));
    if (!e) return;
    CURRENT_EMP = e;
    ACTIVE_TAB = 'datos';
    renderModal();
    document.getElementById('rhModal').classList.add('show');
  }

  function renderModal(){
    const e = CURRENT_EMP;
    if (!e) return;
    const dept = DEPARTAMENTOS.find(d => d.id === e.Departamento) || DEPARTAMENTOS[0];

    const tabs = ['datos','documentos','nomina','evaluacion'].map(t => `
      <button class="rh-tab ${ACTIVE_TAB===t?'active':''}" data-tab="${t}">${
        t==='datos' ? 'Datos' : t==='documentos' ? 'Documentación' : t==='nomina' ? 'Nómina' : 'Evaluación'
      }</button>
    `).join('');

    let body = '';
    if (ACTIVE_TAB === 'datos') {
      body = `
        <div class="rh-modal-grid">
          <div class="rh-modal-field">
            <label class="rh-modal-label">Nombre completo</label>
            <input class="rh-modal-input" id="rhFNombre" value="${(e.Nombre||'').replace(/"/g,'&quot;')}">
          </div>
          <div class="rh-modal-field">
            <label class="rh-modal-label">Rol / Cargo</label>
            <input class="rh-modal-input" id="rhFRol" value="${(e.Rol||'').replace(/"/g,'&quot;')}">
          </div>
          <div class="rh-modal-field">
            <label class="rh-modal-label">Departamento</label>
            <select class="rh-modal-select" id="rhFDept">
              ${DEPARTAMENTOS.map(d => `<option value="${d.id}" ${e.Departamento===d.id?'selected':''}>${d.label}</option>`).join('')}
            </select>
          </div>
          <div class="rh-modal-field">
            <label class="rh-modal-label">Centro</label>
            <select class="rh-modal-select" id="rhFCentro">
              ${(window.CONFIG?.centros||[]).map(c => `<option value="${c.id}" ${(e.CentroID||e.Centro)===c.id?'selected':''}>${c.ciudad}</option>`).join('')}
            </select>
          </div>
          <div class="rh-modal-field">
            <label class="rh-modal-label">Teléfono</label>
            <input class="rh-modal-input" id="rhFTel" value="${(e.Telefono||'').replace(/"/g,'&quot;')}">
          </div>
          <div class="rh-modal-field">
            <label class="rh-modal-label">Email</label>
            <input class="rh-modal-input" id="rhFEmail" type="email" value="${(e.Email||'').replace(/"/g,'&quot;')}">
          </div>
          <div class="rh-modal-field">
            <label class="rh-modal-label">Salario base mensual (€)</label>
            <input class="rh-modal-input" id="rhFBase" type="number" value="${e.SalarioBase}">
          </div>
          <div class="rh-modal-field">
            <label class="rh-modal-label">% Comisión sobre servicios</label>
            <input class="rh-modal-input" id="rhFCom" type="number" step="0.5" value="${e.ComisionPct}">
          </div>
          <div class="rh-modal-field">
            <label class="rh-modal-label">Fecha de alta</label>
            <input class="rh-modal-input" id="rhFAlta" type="date" value="${e.FechaAlta||''}">
          </div>
          <div class="rh-modal-field">
            <label class="rh-modal-label">DNI / Identificación</label>
            <input class="rh-modal-input" id="rhFDNI" value="${(e.DNI||'').replace(/"/g,'&quot;')}">
          </div>
        </div>
      `;
    } else if (ACTIVE_TAB === 'documentos') {
      const docs = [
        { id:'ContratoURL', name:'Contrato laboral',  sub:'PDF del contrato firmado',          val:e.ContratoURL },
        { id:'NominaURL',   name:'Histórico de nóminas', sub:'Carpeta Drive con nóminas mensuales', val:e.NominaURL },
        { id:'DNIURL',      name:'Copia DNI / NIE',   sub:'Documento escaneado de identidad',  val:e.DNIURL },
        { id:'PrevencionURL', name:'Prevención de riesgos', sub:'Certificado PRL obligatorio',  val:e.PrevencionURL },
        { id:'SeguridadURL', name:'Alta en Seg. Social', sub:'Modelo TA.2 de alta',             val:e.SeguridadURL }
      ];
      body = `
        <div class="rh-modal-help" style="margin-bottom:14px">Pega un enlace de Google Drive, Dropbox o cualquier URL al documento. Los archivos no se suben aquí (solo se enlazan), así no consumes almacenamiento.</div>
        ${docs.map(d => `
          <div class="rh-doc-row">
            <div>
              <div class="rh-doc-row-name">${d.name}</div>
              <div class="rh-doc-row-sub">${d.sub}</div>
              <input class="rh-modal-input" id="rh_${d.id}" placeholder="https://drive.google.com/..." value="${(d.val||'').replace(/"/g,'&quot;')}" style="margin-top:7px">
            </div>
            <div class="rh-doc-row-state ${d.val?'ok':'missing'}">${d.val?'OK':'Falta'}</div>
            ${d.val ? `<a class="rh-doc-row-btn" href="${d.val}" target="_blank" rel="noopener">Abrir</a>` : `<span class="rh-doc-row-btn" style="opacity:.4;cursor:default">Abrir</span>`}
          </div>
        `).join('')}
      `;
    } else if (ACTIVE_TAB === 'nomina') {
      const n = calcNomina(e);
      body = `
        <div class="rh-nom-summary">
          <div class="rh-nom-summary-lbl">Nómina ${n.mes}</div>
          <div class="rh-nom-summary-val">${Math.round(n.total).toLocaleString('es-ES')}€</div>
          <div class="rh-nom-summary-detail">
            <div>
              <div class="rh-nom-summary-detail-lbl">Salario base</div>
              <div class="rh-nom-summary-detail-val">${n.base.toLocaleString('es-ES')}€</div>
            </div>
            <div>
              <div class="rh-nom-summary-detail-lbl">Comisión ${n.comisionPct}%</div>
              <div class="rh-nom-summary-detail-val">${Math.round(n.comision).toLocaleString('es-ES')}€</div>
            </div>
            <div>
              <div class="rh-nom-summary-detail-lbl">Facturación generada</div>
              <div class="rh-nom-summary-detail-val">${Math.round(n.facturacion).toLocaleString('es-ES')}€</div>
            </div>
            <div>
              <div class="rh-nom-summary-detail-lbl">Servicios atendidos</div>
              <div class="rh-nom-summary-detail-val">${n.cantidad}</div>
            </div>
          </div>
        </div>
        <div class="rh-modal-help">La comisión se calcula sobre los servicios completados/pagados del mes en curso atribuidos a este empleado. El % se edita en "Datos".</div>
        <button class="rh-btn-ghost" style="margin-top:12px;width:100%" onclick="window.rhDescargarNomina()">Descargar nómina del mes (CSV)</button>
      `;
    } else {
      body = `
        <div class="rh-modal-field full">
          <label class="rh-modal-label">Última evaluación</label>
          <input class="rh-modal-input" id="rhFEvalFecha" type="date" value="${e.UltimaEvaluacion||''}">
        </div>
        <div class="rh-modal-field full">
          <label class="rh-modal-label">Notas internas (no visibles al empleado)</label>
          <textarea class="rh-modal-input" id="rhFNotas" rows="6" style="resize:vertical">${(e.NotasRH||'').replace(/</g,'&lt;')}</textarea>
        </div>
        <div class="rh-modal-help">Cualquier nota de seguimiento, conversación o acuerdo. Solo visible para superadmin.</div>
      `;
    }

    const dniLabel = e.DNI ? `DNI ${e.DNI} · ` : '';
    document.getElementById('rhModal').innerHTML = `
      <div class="rh-modal-box">
        <div class="rh-modal-head">
          <div class="rh-avatar">${initials(e.Nombre)}</div>
          <div style="flex:1;min-width:0">
            <div class="rh-modal-title">${e.Nombre||'—'}</div>
            <div class="rh-modal-sub">${dniLabel}${(e.Rol||'')} · <span class="rh-pill ${dept.id}" style="margin-left:4px">${dept.label}</span></div>
          </div>
          <button class="rh-modal-close" onclick="document.getElementById('rhModal').classList.remove('show')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="rh-tabs">${tabs}</div>
        ${body}
        <div class="rh-cta">
          <button class="rh-btn-ghost" onclick="document.getElementById('rhModal').classList.remove('show')">Cerrar</button>
          ${ (e._local || String(e.ID||'').startsWith('local_') || String(e.ID||'').startsWith('tmp_')) ? `<button class="rh-btn-ghost" style="background:#FFF0F0;color:#FF453A;border:1px solid rgba(255,69,58,.18)" onclick="window.rhEliminarEmpleado('${e.ID||e.id}')">Eliminar</button>` : '' }
          <button class="rh-btn-primary" onclick="window.rhGuardar()">Guardar cambios</button>
        </div>
      </div>
    `;

    document.querySelectorAll('.rh-tab').forEach(t => t.addEventListener('click', () => {
      captureForm();
      ACTIVE_TAB = t.dataset.tab;
      renderModal();
    }));
  }

  function captureForm(){
    const e = CURRENT_EMP;
    if (!e) return;
    const get = id => { const el = document.getElementById(id); return el ? el.value : undefined; };
    if (ACTIVE_TAB === 'datos') {
      const upd = {
        Nombre: get('rhFNombre'), Rol: get('rhFRol'), Departamento: get('rhFDept'),
        CentroID: get('rhFCentro'), Telefono: get('rhFTel'), Email: get('rhFEmail'),
        SalarioBase: Number(get('rhFBase')||0), ComisionPct: Number(get('rhFCom')||0),
        FechaAlta: get('rhFAlta'), DNI: get('rhFDNI')
      };
      Object.keys(upd).forEach(k => { if (upd[k] !== undefined) e[k] = upd[k]; });
    } else if (ACTIVE_TAB === 'documentos') {
      ['ContratoURL','NominaURL','DNIURL','PrevencionURL','SeguridadURL'].forEach(k => {
        const v = get('rh_'+k); if (v !== undefined) e[k] = v;
      });
    } else if (ACTIVE_TAB === 'evaluacion') {
      const f = get('rhFEvalFecha'); if (f !== undefined) e.UltimaEvaluacion = f;
      const n = get('rhFNotas');     if (n !== undefined) e.NotasRH = n;
    }
  }

  window.rhGuardar = function(){
    captureForm();
    const e = CURRENT_EMP;
    if (!e) return;
    const id = e.ID || e.id;
    /* 1. Persistir en localStorage */
    setEmpData(id, {
      Departamento: e.Departamento, DNI: e.DNI,
      ContratoURL: e.ContratoURL, NominaURL: e.NominaURL,
      DNIURL: e.DNIURL, PrevencionURL: e.PrevencionURL, SeguridadURL: e.SeguridadURL,
      FechaAlta: e.FechaAlta,
      SalarioBase: Number(e.SalarioBase) || 1300,
      ComisionPct: Number(e.ComisionPct) || 0,
      Telefono: e.Telefono, Email: e.Email,
      UltimaEvaluacion: e.UltimaEvaluacion, NotasRH: e.NotasRH,
      Nombre: e.Nombre, Rol: e.Rol, CentroID: e.CentroID
    });
    /* 2. Actualizar también la lista global en memoria, para que
       otras vistas del admin (Equipo, Dashboard) vean el cambio
       sin necesidad de recargar la página. */
    const lista = window.EMPLEADOS_ALL || window.EMPLOYEES || [];
    const idx = lista.findIndex(x => String(x.ID || x.id) === String(id));
    if (idx >= 0) Object.assign(lista[idx], {
      SalarioBase: Number(e.SalarioBase) || 1300,
      ComisionPct: Number(e.ComisionPct) || 0,
      Departamento: e.Departamento, DNI: e.DNI,
      Nombre: e.Nombre, Rol: e.Rol, CentroID: e.CentroID,
      Telefono: e.Telefono, Email: e.Email
    });
    /* 3. Si el empleado fue creado localmente, actualizar también su entrada
       en la lista persistente de locales, para que se conserven los cambios
       de nombre/rol/centro al recargar */
    if (e._local || String(id).startsWith('local_') || String(id).startsWith('tmp_')) {
      addEmpLocal(Object.assign({}, e));
    }
    /* 4. Backend (si está disponible) */
    if (typeof window.callBackend === 'function' && id) {
      try { window.callBackend('updateEmpleado', { id, data: JSON.stringify(e) }); } catch(err){}
    }
    /* 5. Cerrar y re-render con el valor nuevo */
    document.getElementById('rhModal').classList.remove('show');
    render();
  };

  window.rhDescargarNomina = function(){
    const e = CURRENT_EMP;
    const n = calcNomina(e);
    const rows = [
      ['Empleado', e.Nombre || ''],
      ['DNI', e.DNI || ''],
      ['Centro', centroLabel(e.CentroID || e.Centro)],
      ['Departamento', e.Departamento],
      ['Mes', n.mes],
      ['Salario base', n.base],
      ['Comisión %', n.comisionPct],
      ['Servicios atendidos', n.cantidad],
      ['Facturación generada', Math.round(n.facturacion)],
      ['Comisión calculada', Math.round(n.comision)],
      ['TOTAL', Math.round(n.total)]
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Nomina_${(e.Nombre||'empleado').replace(/\s+/g,'_')}_${n.mes}.csv`;
    a.click();
  };

  window.rhAddEmpleado = function(){
    const nombre = prompt('Nombre completo de la nueva persona:');
    if (!nombre) return;
    const newId = 'local_' + Date.now();
    const nuevo = {
      ID: newId, Nombre: nombre, Rol:'',
      Departamento: ACTIVE_DEPT === '*' ? 'operaciones' : ACTIVE_DEPT,
      Centro:   ACTIVE_CENTRO === '*' ? ((window.CONFIG?.centros||[])[0]?.id||'') : ACTIVE_CENTRO,
      CentroID: ACTIVE_CENTRO === '*' ? ((window.CONFIG?.centros||[])[0]?.id||'') : ACTIVE_CENTRO,
      SalarioBase: 1300, ComisionPct: 5,
      _local: true   /* marca para distinguir de empleados del backend */
    };
    if (!window.EMPLEADOS_ALL) window.EMPLEADOS_ALL = [];
    window.EMPLEADOS_ALL.push(nuevo);
    /* CRÍTICO: guardar también en la lista de empleados locales persistente
       para que sobreviva a recarga de página */
    addEmpLocal(nuevo);
    setEmpData(newId, nuevo);
    if (typeof window.callBackend === 'function') {
      try { window.callBackend('addEmpleado', { data: JSON.stringify(nuevo) }); } catch(err){}
    }
    render();
    setTimeout(() => openModal(newId), 100);
  };

  window.rhEliminarEmpleado = function(id){
    if (!confirm('¿Eliminar a este empleado? Esto no se puede deshacer.')) return;
    /* Quitar de lista global */
    if (window.EMPLEADOS_ALL) {
      window.EMPLEADOS_ALL = window.EMPLEADOS_ALL.filter(x => String(x.ID||x.id) !== String(id));
    }
    /* Quitar de locales persistentes */
    removeEmpLocal(id);
    /* Quitar datos locales */
    try {
      const all = JSON.parse(localStorage.getItem('alvato_emp_data')||'{}');
      delete all[id];
      localStorage.setItem('alvato_emp_data', JSON.stringify(all));
    } catch(e){}
    document.getElementById('rhModal').classList.remove('show');
    render();
  };

  /* ─── Inyectar sidebar + página ─── */
  function inject(){
    if (!window.CURRENT_USER) return false; // todavía no hay login → reintentar
    const isSuper = window.CURRENT_USER.rol === 'superadmin' || window.CURRENT_USER.centro === '*';
    if (!isSuper) return true; // hay usuario pero no es dueño → no inyectar

    const refBtn = document.querySelector('.sb-item[data-page="team"]');
    if (!refBtn) return false;

    if (!document.querySelector('.sb-item[data-page="rrhh"]')) {
      const item = document.createElement('button');
      item.className = 'sb-item';
      item.setAttribute('data-page', 'rrhh');
      item.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Recursos Humanos
      `;
      refBtn.parentNode.insertBefore(item, refBtn.nextSibling);
      item.addEventListener('click', () => {
        if (typeof window.navTo === 'function') window.navTo('rrhh');
        render();
      });
    }

    if (!document.getElementById('page-rrhh')) {
      const page = document.createElement('section');
      page.className = 'page';
      page.id = 'page-rrhh';
      const refPage = document.querySelector('#page-team') || document.querySelector('.page');
      if (refPage && refPage.parentNode) refPage.parentNode.insertBefore(page, refPage.nextSibling);
      else document.body.appendChild(page);
    }

    if (!document.getElementById('rhModal')) {
      const m = document.createElement('div');
      m.id = 'rhModal';
      m.className = 'rh-modal';
      document.body.appendChild(m);
    }

    try { if (window.titles && !window.titles['rrhh']) window.titles['rrhh'] = 'Recursos Humanos'; } catch(e){}
    return true;
  }

  function retry(){ if (inject()) return; setTimeout(retry, 500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else retry();
  document.addEventListener('alvatoUserReady', () => { inject(); });

  document.addEventListener('employeesUpdated', render);
  document.addEventListener('bookingsUpdated', () => {
    const modal = document.getElementById('rhModal');
    if (modal && modal.classList.contains('show') && ACTIVE_TAB === 'nomina') renderModal();
  });

  window.refreshRRHH = render;
})();
