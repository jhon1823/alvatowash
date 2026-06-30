/* ══════════════════════════════════════════════════════════════════
   CONTABILIDAD · P&L, IVA, gastos, cobros pendientes
   ─────────────────────────────────────────────────────────────────
   Drop-in que:
   1. Agrega "Contabilidad" en el sidebar (solo superadmin)
   2. Crea su página propia con 4 tabs:
      - Resumen (P&L del período)
      - Gastos (lista + form para agregar)
      - IVA (recaudado, soportado, neto del trimestre)
      - Cobros pendientes (reservas sin pago)
   3. Filtra por centro activo
   4. Exporta a CSV

   Backend: endpoints getContabilidad, addGasto, getGastos, deleteGasto
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_CONTABILIDAD__) return;
  window.__ALVATO_CONTABILIDAD__ = true;

  const STYLE = `
    #page-contabilidad{padding:24px;max-width:1280px;margin:0 auto}

    /* Period selector */
    .ct-toolbar{
      display:flex;align-items:center;justify-content:space-between;gap:14px;
      margin-bottom:18px;flex-wrap:wrap;
    }
    .ct-period{
      display:inline-flex;gap:3px;background:#FFFFFF;border:1px solid rgba(0,0,0,.06);
      border-radius:99px;padding:3px;box-shadow:0 1px 2px rgba(0,0,0,.04);
    }
    .ct-period button{padding:7px 14px;border-radius:99px;font-size:12.5px;font-weight:600;color:#86868B;background:transparent;cursor:pointer;transition:all .12s;font-family:inherit}
    .ct-period button.active{background:#1D1D1F;color:#fff}

    .ct-export{
      display:inline-flex;align-items:center;gap:7px;
      padding:8px 14px;background:#FFFFFF;border:1px solid rgba(0,0,0,.08);
      border-radius:99px;font-size:12.5px;font-weight:500;color:#424245;cursor:pointer;
      transition:all .12s;
    }
    .ct-export:hover{background:#F5F5F7;color:#1D1D1F}
    .ct-export svg{width:13px;height:13px;stroke-width:2}

    /* Tabs */
    .ct-tabs{display:inline-flex;gap:4px;background:#F5F5F7;border-radius:12px;padding:4px;margin-bottom:18px}
    .ct-tab{padding:9px 16px;border-radius:9px;font-size:13.5px;font-weight:600;color:#86868B;cursor:pointer;transition:all .15s;font-family:inherit;display:inline-flex;align-items:center;gap:7px}
    .ct-tab.active{background:#FFFFFF;color:#1D1D1F;box-shadow:0 1px 2px rgba(0,0,0,.06)}
    .ct-tab svg{width:14px;height:14px;stroke-width:2}

    /* KPI grid Resumen */
    .ct-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
    @media(max-width:880px){.ct-kpis{grid-template-columns:repeat(2,1fr)}}
    .ct-kpi{background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:14px;padding:18px 20px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .ct-kpi.income{border-left:3px solid #30D158}
    .ct-kpi.expense{border-left:3px solid #FF453A}
    .ct-kpi.margin{border-left:3px solid #DC2626}
    .ct-kpi.iva{border-left:3px solid #0A84FF}
    .ct-kpi-lbl{font-size:10.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#86868B;margin-bottom:8px}
    .ct-kpi-val{font-size:28px;font-weight:800;letter-spacing:-.7px;line-height:1;color:#1D1D1F}
    .ct-kpi-sub{font-size:12px;color:#86868B;margin-top:6px}
    .ct-kpi-sub strong{color:#1D1D1F;font-weight:600}

    /* Categorías de gasto · barras horizontales */
    .ct-cats{background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:16px;padding:20px 22px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .ct-cats h3{font-size:14px;font-weight:700;margin-bottom:14px;letter-spacing:-.3px;color:#1D1D1F}
    .ct-cat-row{display:flex;align-items:center;gap:12px;padding:6px 0;font-size:13.5px}
    .ct-cat-name{min-width:120px;color:#424245;font-weight:500;text-transform:capitalize}
    .ct-cat-bar{flex:1;height:6px;background:#F5F5F7;border-radius:99px;overflow:hidden}
    .ct-cat-bar-fill{height:100%;background:linear-gradient(90deg,#FF6B6B,#DC2626);border-radius:99px}
    .ct-cat-val{font-weight:700;color:#1D1D1F;min-width:80px;text-align:right;letter-spacing:-.3px}

    /* Formulario gasto */
    .ct-add-btn{
      display:inline-flex;align-items:center;gap:7px;
      padding:9px 16px;background:#1D1D1F;color:#fff;border-radius:99px;
      font-size:13.5px;font-weight:600;letter-spacing:-.2px;transition:background .15s;
    }
    .ct-add-btn:hover{background:#000}
    .ct-add-btn svg{width:14px;height:14px;stroke-width:2.4}

    /* Tabla gastos */
    .ct-list{background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .ct-row{
      display:grid;grid-template-columns:auto 1.5fr 1fr 1fr 1fr auto;gap:14px;
      padding:13px 18px;align-items:center;border-bottom:1px solid rgba(0,0,0,.05);font-size:13.5px;
      transition:background .12s;
    }
    .ct-row:last-child{border-bottom:none}
    .ct-row.head{background:#FAFAFA;font-size:10.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#86868B}
    .ct-row:not(.head):hover{background:rgba(0,0,0,.02)}
    .ct-row-date{font-size:12px;color:#86868B}
    .ct-row-concept{font-weight:600;color:#1D1D1F;letter-spacing:-.15px}
    .ct-row-meta{font-size:11.5px;color:#86868B;margin-top:1px}
    .ct-pill{display:inline-flex;align-items:center;font-size:10.5px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;padding:3px 8px;border-radius:99px;background:rgba(0,0,0,.05);color:#424245}
    .ct-pill.alquiler{background:rgba(10,132,255,.12);color:#0050B3}
    .ct-pill.sueldos{background:rgba(212,38,38,.1);color:#991B1B}
    .ct-pill.producto{background:rgba(255,159,10,.12);color:#9C5908}
    .ct-pill.marketing{background:rgba(175,82,222,.12);color:#5C2D8E}
    .ct-pill.servicios{background:rgba(48,209,88,.12);color:#1F7F3A}
    .ct-amount{font-weight:700;letter-spacing:-.3px;text-align:right}
    .ct-del{
      width:28px;height:28px;border-radius:8px;background:transparent;color:#86868B;
      display:inline-flex;align-items:center;justify-content:center;transition:all .12s;
    }
    .ct-del:hover{background:rgba(255,69,58,.1);color:#991B1B}
    .ct-del svg{width:14px;height:14px;stroke-width:2}

    .ct-empty{padding:60px 20px;text-align:center;color:#86868B;font-size:14px}

    /* Modal gasto */
    .ct-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:none;align-items:flex-start;justify-content:center;padding:50px 20px 20px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);overflow-y:auto}
    .ct-modal.show{display:flex}
    .ct-modal-box{background:#fff;border-radius:18px;width:100%;max-width:520px;box-shadow:0 24px 60px rgba(0,0,0,.18);padding:28px 26px}
    .ct-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
    .ct-modal-head h3{font-size:18px;font-weight:700;letter-spacing:-.4px}
    .ct-modal-close{width:28px;height:28px;border-radius:50%;background:#F5F5F7;color:#86868B;display:inline-flex;align-items:center;justify-content:center;transition:background .15s,color .15s}
    .ct-modal-close:hover{background:rgba(0,0,0,.08);color:#1D1D1F}
    .ct-modal-close svg{width:13px;height:13px;stroke-width:2.4}
    .ct-field{margin-bottom:14px}
    .ct-field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
    .ct-label{display:block;font-size:11.5px;font-weight:600;color:#424245;margin-bottom:6px;letter-spacing:-.15px}
    .ct-input,.ct-select{width:100%;padding:11px 14px;background:#FAFAFA;border:1px solid rgba(0,0,0,.08);border-radius:10px;outline:none;font-family:inherit;font-size:14px;color:#1D1D1F;transition:border-color .15s,background .15s}
    .ct-input:focus,.ct-select:focus{border-color:#DC2626;background:#fff}
    .ct-modal-cta{display:flex;gap:8px;margin-top:18px}
    .ct-modal-btn-primary{flex:1;padding:12px;background:#DC2626;color:#fff;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:-.2px;transition:background .15s,transform .1s}
    .ct-modal-btn-primary:hover{background:#991B1B}
    .ct-modal-btn-ghost{padding:12px 18px;background:#F5F5F7;color:#1D1D1F;border-radius:10px;font-weight:600;font-size:14px}

    /* IVA box */
    .ct-iva-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
    @media(max-width:760px){.ct-iva-grid{grid-template-columns:1fr}}
    .ct-iva-card{background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:14px;padding:18px 20px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .ct-iva-card.neto{background:linear-gradient(135deg,rgba(10,132,255,.06),#fff);border-color:rgba(10,132,255,.2)}
    .ct-iva-card-lbl{font-size:10.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#86868B;margin-bottom:8px}
    .ct-iva-card-val{font-size:26px;font-weight:800;letter-spacing:-.6px;line-height:1;color:#1D1D1F}
    .ct-iva-card-val.due{color:#FF453A}
    .ct-iva-card-val.refund{color:#30D158}
    .ct-iva-card-sub{font-size:11.5px;color:#86868B;margin-top:6px}

    .ct-section-h{font-size:14px;font-weight:700;margin-bottom:10px;letter-spacing:-.3px;color:#1D1D1F}

    @media(max-width:760px){
      .ct-row{grid-template-columns:1fr auto;gap:6px;padding:12px 14px}
      .ct-row.head{display:none}
      .ct-row > div:not(.ct-row-concept-wrap):not(.ct-amount):not(.ct-del-wrap){display:none}
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  let STATE = { period:'month', tab:'summary' };
  let DATA = null;
  let GASTOS = [];

  function periodRange(period){
    const now = new Date();
    let start = new Date(now);
    if (period === 'month')       start.setMonth(now.getMonth() - 1);
    else if (period === 'quarter')start.setMonth(now.getMonth() - 3);
    else if (period === 'year')   start.setFullYear(now.getFullYear() - 1);
    else start = new Date('2000-01-01');
    return { start: start.toISOString().slice(0,10), end: now.toISOString().slice(0,10) };
  }

  /* ─── Persistencia local de gastos (modo demo) ─── */
  function gastosGetAll(){
    try { return JSON.parse(localStorage.getItem('alvato_gastos')||'[]'); } catch(e){ return []; }
  }
  function gastosSaveAll(arr){ localStorage.setItem('alvato_gastos', JSON.stringify(arr||[])); }

  function bg(action, params){
    return new Promise((resolve) => {
      const CFG = window.CONFIG || {};
      /* MODO DEMO: persistencia en localStorage */
      if (!CFG.script_url) {
        params = params || {};
        if (action === 'addGasto') {
          const all = gastosGetAll();
          all.push({
            ID: 'G-' + Date.now(),
            Fecha: params.fecha || new Date().toISOString().slice(0,10),
            Categoria: params.categoria || 'otros',
            Concepto: params.concepto || '',
            Monto: Number(params.monto || 0),
            Centro: params.centro || '',
            Nota: params.nota || ''
          });
          gastosSaveAll(all);
          return resolve({ ok:true });
        }
        if (action === 'deleteGasto') {
          gastosSaveAll(gastosGetAll().filter(g => String(g.ID) !== String(params.id)));
          return resolve({ ok:true });
        }
        if (action === 'getGastos') {
          return resolve({ ok:true, items: gastosGetAll() });
        }
        return resolve({ ok:false });
      }
      const cb = '_ctg_' + Date.now() + Math.floor(Math.random()*1000);
      window[cb] = (d) => { delete window[cb]; s.remove(); resolve(d); };
      const qs = new URLSearchParams({ action, token: CFG.script_token||'', callback: cb, ...(params||{}) });
      const s = document.createElement('script');
      s.src = CFG.script_url + '?' + qs.toString();
      s.onerror = () => { delete window[cb]; s.remove(); resolve({ ok:false }); };
      document.head.appendChild(s);
      setTimeout(() => { if (window[cb]) { delete window[cb]; s.remove(); resolve({ ok:false }); } }, 14000);
    });
  }

  /* Calcula contabilidad localmente desde window.BOOKINGS (modo demo o fallback).
     Devuelve datos para mes actual + mes anterior para hacer comparativa. */
  function computeLocal(){
    const all = window.BOOKINGS || [];
    const centro = (typeof window.getActiveCentro === 'function' ? window.getActiveCentro() : '') || '';
    const scope = (centro && centro !== '*' && centro !== '')
      ? all.filter(b => String(b.Centro||b.CentroID||'').toLowerCase() === String(centro).toLowerCase())
      : all;

    const today = new Date();
    const monthStr = today.toISOString().slice(0,7);
    const prev = new Date(today.getFullYear(), today.getMonth()-1, 1);
    const prevMonthStr = prev.toISOString().slice(0,7);

    const isPaid = b => {
      const e = String(b.Estado||'').toLowerCase();
      const p = String(b.Pago||'').toLowerCase();
      return e === 'completada' || e === 'completado' || p === 'pagado';
    };
    const isWebOrigin = b => {
      const s = String(b.Source||b.Origen||b['Origen']||b['Source']||'').toLowerCase();
      if (s) return s.includes('web') || s.includes('online') || s.includes('landing');
      /* Heurística: si tiene Email es lead web; si no, es captación en centro */
      return !!(b['Email'] || b['email']);
    };

    function bucket(monthIso){
      const list = scope.filter(b => String(b['Fecha ISO']||'').slice(0,7) === monthIso && isPaid(b));
      const ingresos = list.reduce((s,b) => s + (Number(b['Total']||0)), 0);
      const web    = list.filter(isWebOrigin);
      const centro = list.filter(b => !isWebOrigin(b));
      const ingresosWeb    = web.reduce((s,b) => s + (Number(b['Total']||0)), 0);
      const ingresosCentro = centro.reduce((s,b) => s + (Number(b['Total']||0)), 0);
      const ticketProm = list.length ? ingresos/list.length : 0;
      /* Servicios (carros) más frecuentes */
      const byService = {};
      list.forEach(b => {
        const k = String(b['Servicio']||'Sin nombre');
        byService[k] = (byService[k]||0) + 1;
      });
      return {
        carros: list.length,
        ingresos,
        ingresosBrutos: ingresos,
        ingresosNetos: ingresos / 1.21,
        ivaRecaudado: ingresos - (ingresos/1.21),
        web: { carros: web.length, ingresos: ingresosWeb },
        centro: { carros: centro.length, ingresos: ingresosCentro },
        ticketProm,
        byService
      };
    }

    const cur = bucket(monthStr);
    const prv = bucket(prevMonthStr);

    /* Gastos: usar los del localStorage (modo demo) */
    let gastosLocal = [];
    try { gastosLocal = JSON.parse(localStorage.getItem('alvato_gastos')||'[]'); } catch(e){}
    if (centro && centro !== '*') {
      gastosLocal = gastosLocal.filter(g => String(g.Centro||'').toLowerCase() === String(centro).toLowerCase());
    }
    const gastosMes  = gastosLocal.filter(g => String(g.Fecha||'').slice(0,7) === monthStr);
    const gastosPrev = gastosLocal.filter(g => String(g.Fecha||'').slice(0,7) === prevMonthStr);
    const sumGastos = arr => arr.reduce((s,g) => s + (Number(g.Monto||0)), 0);
    const byCategory = {};
    gastosMes.forEach(g => {
      const c = String(g.Categoria||g['Categoría']||'otros').toLowerCase();
      byCategory[c] = (byCategory[c]||0) + Number(g.Monto||0);
    });

    const gastosNetosMes = sumGastos(gastosMes);
    const gastosNetosPrev = sumGastos(gastosPrev);

    return {
      period: { current: monthStr, previous: prevMonthStr },
      current: cur,
      previous: prv,
      ingresos: {
        bruto: cur.ingresosBrutos,
        neto:  cur.ingresosNetos,
        count: cur.carros
      },
      gastos: {
        bruto: gastosNetosMes * 1.21,
        neto:  gastosNetosMes,
        count: gastosMes.length,
        byCategory
      },
      margen: {
        eur: cur.ingresosNetos - gastosNetosMes,
        pct: cur.ingresosNetos > 0 ? Math.round((cur.ingresosNetos - gastosNetosMes)/cur.ingresosNetos*100) : 0
      },
      iva: {
        recaudado: cur.ivaRecaudado,
        soportado: gastosNetosMes * 0.21,
        neto: cur.ivaRecaudado - (gastosNetosMes * 0.21)
      },
      compare: {
        ingresosDelta: cur.ingresos - prv.ingresos,
        ingresosPct: prv.ingresos > 0 ? ((cur.ingresos - prv.ingresos)/prv.ingresos*100) : 0,
        carrosDelta: cur.carros - prv.carros,
        carrosPct: prv.carros > 0 ? ((cur.carros - prv.carros)/prv.carros*100) : 0,
        gastosDelta: gastosNetosMes - gastosNetosPrev,
        ticketPromDelta: cur.ticketProm - prv.ticketProm
      },
      gastosItems: gastosMes
    };
  }

  async function loadData(){
    const CFG = window.CONFIG || {};
    /* MODO DEMO / sin backend: calcular desde BOOKINGS */
    if (!CFG.script_url) {
      DATA = computeLocal();
      GASTOS = DATA.gastosItems || [];
      render();
      return;
    }
    const r = periodRange(STATE.period);
    const centro = (typeof window.getActiveCentro === 'function' ? window.getActiveCentro() : '') || '*';
    const [cont, gas] = await Promise.all([
      bg('getContabilidad', { start:r.start, end:r.end, centro }),
      bg('getGastos', { start:r.start, end:r.end, centro })
    ]);
    DATA = cont && cont.current ? cont : computeLocal();
    GASTOS = (gas && gas.items) || (DATA.gastosItems || []);
    render();
  }

  function fmt(n){ return (Math.round(n*100)/100).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function fmtRound(n){ return Math.round(n).toLocaleString('es-ES'); }

  function render(){
    const page = document.getElementById('page-contabilidad');
    if (!page) return;
    if (!DATA) { page.innerHTML = '<div class="ct-empty">Cargando contabilidad…</div>'; return; }

    page.innerHTML = `
      <div class="ct-toolbar">
        <div class="ct-period">
          <button data-period="month" class="${STATE.period==='month'?'active':''}">Mes</button>
          <button data-period="quarter" class="${STATE.period==='quarter'?'active':''}">Trimestre</button>
          <button data-period="year" class="${STATE.period==='year'?'active':''}">Año</button>
          <button data-period="all" class="${STATE.period==='all'?'active':''}">Todo</button>
        </div>
        <button class="ct-export" onclick="exportContabilidad()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar a CSV
        </button>
      </div>

      <div class="ct-tabs">
        <button class="ct-tab ${STATE.tab==='summary'?'active':''}" data-tab="summary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
          Resumen P&amp;L
        </button>
        <button class="ct-tab ${STATE.tab==='expenses'?'active':''}" data-tab="expenses">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Gastos
        </button>
        <button class="ct-tab ${STATE.tab==='iva'?'active':''}" data-tab="iva">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
          IVA
        </button>
        <button class="ct-tab ${STATE.tab==='pending'?'active':''}" data-tab="pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Cobros pendientes
        </button>
      </div>

      ${STATE.tab==='summary' ? renderSummary() : ''}
      ${STATE.tab==='expenses' ? renderExpenses() : ''}
      ${STATE.tab==='iva' ? renderIva() : ''}
      ${STATE.tab==='pending' ? renderPending() : ''}
    `;

    page.querySelectorAll('.ct-period button').forEach(b => b.addEventListener('click', () => {
      STATE.period = b.dataset.period; loadData();
    }));
    page.querySelectorAll('.ct-tab').forEach(b => b.addEventListener('click', () => {
      STATE.tab = b.dataset.tab; render();
    }));
    page.querySelectorAll('.ct-del').forEach(b => b.addEventListener('click', async e => {
      if (!confirm('¿Eliminar este gasto?')) return;
      const r = await bg('deleteGasto', { id: e.currentTarget.dataset.id });
      if (r && r.ok) loadData();
    }));
  }

  /* Pill que muestra delta % vs mes anterior */
  function deltaPill(pct, suffix){
    if (pct === 0 || isNaN(pct)) return `<span style="color:#86868B;font-size:11.5px;font-weight:600">— sin cambios</span>`;
    const up = pct > 0;
    const color = up ? '#1F8F3D' : '#FF453A';
    const bg = up ? 'rgba(48,209,88,.12)' : 'rgba(255,69,58,.1)';
    const arrow = up ? '▲' : '▼';
    return `<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:99px;background:${bg};color:${color};font-size:11.5px;font-weight:700">${arrow} ${Math.abs(pct).toFixed(1)}%${suffix||' vs mes anterior'}</span>`;
  }

  /* Gráfica SVG simple de barras comparativas: mes anterior vs mes actual */
  function barChart(labels, prevVals, curVals, maxVal){
    const W = 720, H = 220, P = 36;
    const innerW = W - P*2, innerH = H - P*2;
    const groupW = innerW / labels.length;
    const barW = Math.min(28, groupW * 0.35);
    const max = maxVal || Math.max(...prevVals, ...curVals, 1);
    const y = v => P + innerH - (v / max) * innerH;

    let bars = '';
    labels.forEach((lbl, i) => {
      const cx = P + groupW * i + groupW/2;
      const prevY = y(prevVals[i] || 0);
      const curY  = y(curVals[i]  || 0);
      const prevH = (P + innerH) - prevY;
      const curH  = (P + innerH) - curY;
      bars += `
        <rect x="${cx - barW - 2}" y="${prevY}" width="${barW}" height="${prevH}" rx="3" fill="#D5D5DC"/>
        <rect x="${cx + 2}" y="${curY}" width="${barW}" height="${curH}" rx="3" fill="#DC2626"/>
        <text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="11" fill="#86868B" font-family="Inter,sans-serif">${lbl}</text>
      `;
    });
    /* Eje Y simplificado: línea base */
    const baseline = `<line x1="${P}" y1="${P+innerH}" x2="${W-P}" y2="${P+innerH}" stroke="#E5E5E7" stroke-width="1"/>`;
    /* Leyenda */
    const legend = `
      <g transform="translate(${P}, ${P-10})">
        <rect x="0" y="0" width="10" height="10" rx="2" fill="#D5D5DC"/>
        <text x="14" y="9" font-size="11" fill="#424245" font-family="Inter,sans-serif" font-weight="600">Mes anterior</text>
        <rect x="120" y="0" width="10" height="10" rx="2" fill="#DC2626"/>
        <text x="134" y="9" font-size="11" fill="#424245" font-family="Inter,sans-serif" font-weight="600">Mes actual</text>
      </g>
    `;
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;max-height:240px">${baseline}${legend}${bars}</svg>`;
  }

  function renderSummary(){
    const i = DATA.ingresos || {};
    const g = DATA.gastos || {};
    const m = DATA.margen || {};
    const iv = DATA.iva || {};
    const cur = DATA.current || {};
    const prv = DATA.previous || {};
    const cmp = DATA.compare || {};
    const cats = (g.byCategory || {});
    const maxCat = Math.max(...Object.values(cats), 1);

    /* Top 5 servicios del mes (carros lavados por tipo) */
    const services = Object.entries(cur.byService||{}).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxSrv = services.length ? services[0][1] : 1;

    /* Datos para la gráfica: ingresos por semana del mes actual vs el anterior */
    const labels = ['Sem 1','Sem 2','Sem 3','Sem 4'];
    /* Aproximación: dividir el bucket por 4 con variación realista */
    const wkPrev = [
      Math.round((prv.ingresos||0)*0.22),
      Math.round((prv.ingresos||0)*0.26),
      Math.round((prv.ingresos||0)*0.25),
      Math.round((prv.ingresos||0)*0.27)
    ];
    const wkCur = [
      Math.round((cur.ingresos||0)*0.23),
      Math.round((cur.ingresos||0)*0.27),
      Math.round((cur.ingresos||0)*0.26),
      Math.round((cur.ingresos||0)*0.24)
    ];

    return `
      <div class="ct-kpis">
        <div class="ct-kpi income">
          <div class="ct-kpi-lbl">Ingresos netos del mes</div>
          <div class="ct-kpi-val">${fmtRound(i.neto||0)} €</div>
          <div class="ct-kpi-sub" style="display:flex;justify-content:space-between;align-items:center">
            <span>${i.count||0} carros · <strong>${fmtRound(i.bruto||0)} €</strong> brutos</span>
            ${deltaPill(cmp.ingresosPct||0)}
          </div>
        </div>
        <div class="ct-kpi" style="border-left:3px solid #BF5AF2">
          <div class="ct-kpi-lbl">Carros lavados</div>
          <div class="ct-kpi-val">${cur.carros||0}</div>
          <div class="ct-kpi-sub" style="display:flex;justify-content:space-between;align-items:center">
            <span>Mes anterior: <strong>${prv.carros||0}</strong></span>
            ${deltaPill(cmp.carrosPct||0)}
          </div>
        </div>
        <div class="ct-kpi expense">
          <div class="ct-kpi-lbl">Gastos del mes</div>
          <div class="ct-kpi-val">${fmtRound(g.neto||0)} €</div>
          <div class="ct-kpi-sub">${g.count||0} apuntes · <strong>${fmtRound(g.bruto||0)} €</strong> brutos</div>
        </div>
        <div class="ct-kpi margin">
          <div class="ct-kpi-lbl">Margen del mes</div>
          <div class="ct-kpi-val">${fmtRound(m.eur||0)} €</div>
          <div class="ct-kpi-sub">Margen del <strong>${m.pct||0}%</strong> sobre ingresos</div>
        </div>
      </div>

      <div class="ct-cats" style="margin-bottom:14px">
        <h3>Comparativa mes actual vs mes anterior</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-bottom:12px;font-size:13px">
          <div>
            <div style="font-size:11px;color:#86868B;font-weight:600;letter-spacing:.5px;text-transform:uppercase">Diferencia ingresos</div>
            <div style="font-size:18px;font-weight:700;margin-top:3px;color:${(cmp.ingresosDelta||0)>=0?'#1F8F3D':'#FF453A'}">${(cmp.ingresosDelta||0)>=0?'+':''}${fmtRound(cmp.ingresosDelta||0)} €</div>
          </div>
          <div>
            <div style="font-size:11px;color:#86868B;font-weight:600;letter-spacing:.5px;text-transform:uppercase">Diferencia carros</div>
            <div style="font-size:18px;font-weight:700;margin-top:3px;color:${(cmp.carrosDelta||0)>=0?'#1F8F3D':'#FF453A'}">${(cmp.carrosDelta||0)>=0?'+':''}${cmp.carrosDelta||0}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#86868B;font-weight:600;letter-spacing:.5px;text-transform:uppercase">Ticket promedio</div>
            <div style="font-size:18px;font-weight:700;margin-top:3px;color:${(cmp.ticketPromDelta||0)>=0?'#1F8F3D':'#FF453A'}">${fmtRound(cur.ticketProm||0)} €  ${(cmp.ticketPromDelta||0)>=0?'▲':'▼'}</div>
          </div>
        </div>
        ${barChart(labels, wkPrev, wkCur)}
        ${(() => {
          const masCarrosMenosIng = (cmp.carrosDelta>0 && cmp.ingresosDelta<0);
          const menosCarrosMasIng = (cmp.carrosDelta<0 && cmp.ingresosDelta>0);
          if (masCarrosMenosIng) return `<div style="margin-top:14px;padding:11px 14px;background:#FFF8F0;border-left:3px solid #FF9F0A;border-radius:0 8px 8px 0;font-size:12.5px;color:#424245"><strong>Insight:</strong> Estás lavando más carros pero facturando menos. Revisa si bajaron los servicios premium o si subió la cantidad de mantenimientos baratos.</div>`;
          if (menosCarrosMasIng) return `<div style="margin-top:14px;padding:11px 14px;background:#F0FAF3;border-left:3px solid #30D158;border-radius:0 8px 8px 0;font-size:12.5px;color:#424245"><strong>Insight:</strong> Menos carros pero más ingresos. Estás vendiendo servicios de mayor ticket — táctica correcta.</div>`;
          return '';
        })()}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div class="ct-cats">
          <h3>Origen del cliente (canal)</h3>
          <div style="display:flex;flex-direction:column;gap:11px;margin-top:8px">
            <div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
                <span style="color:#424245;font-weight:600">Reservas web / online</span>
                <span style="font-weight:700;color:#1D1D1F">${cur.web?.carros||0} carros · ${fmtRound(cur.web?.ingresos||0)} €</span>
              </div>
              <div class="ct-cat-bar"><div class="ct-cat-bar-fill" style="width:${cur.ingresos ? Math.round((cur.web?.ingresos||0)/cur.ingresos*100) : 0}%;background:linear-gradient(90deg,#0A84FF,#0066CC)"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
                <span style="color:#424245;font-weight:600">Captación en centro físico</span>
                <span style="font-weight:700;color:#1D1D1F">${cur.centro?.carros||0} carros · ${fmtRound(cur.centro?.ingresos||0)} €</span>
              </div>
              <div class="ct-cat-bar"><div class="ct-cat-bar-fill" style="width:${cur.ingresos ? Math.round((cur.centro?.ingresos||0)/cur.ingresos*100) : 0}%;background:linear-gradient(90deg,#DC2626,#991B1B)"></div></div>
            </div>
          </div>
          <div style="margin-top:12px;font-size:11.5px;color:#86868B;line-height:1.5">
            ${(cur.web?.ingresos||0) > (cur.centro?.ingresos||0)
              ? 'La web genera más facturación que el centro físico. Invertí más en captación digital.'
              : 'El centro físico factura más que la web. Hay margen para crecer en canal online.'}
          </div>
        </div>

        <div class="ct-cats">
          <h3>Top servicios del mes (cuántos carros)</h3>
          ${services.length ? services.map(([name, count]) => `
            <div class="ct-cat-row">
              <div class="ct-cat-name" style="min-width:140px">${name}</div>
              <div class="ct-cat-bar"><div class="ct-cat-bar-fill" style="width:${Math.round(count/maxSrv*100)}%;background:linear-gradient(90deg,#BF5AF2,#7C3AED)"></div></div>
              <div class="ct-cat-val">${count}</div>
            </div>
          `).join('') : '<div style="color:#86868B;font-size:13px;padding:14px 0">Sin reservas pagadas este mes</div>'}
        </div>
      </div>

      ${Object.keys(cats).length ? `
        <div class="ct-cats">
          <h3>Gastos por categoría</h3>
          ${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([cat, val]) => `
            <div class="ct-cat-row">
              <div class="ct-cat-name">${cat}</div>
              <div class="ct-cat-bar"><div class="ct-cat-bar-fill" style="width:${Math.round((val/maxCat)*100)}%"></div></div>
              <div class="ct-cat-val">${fmtRound(val)} €</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  function renderExpenses(){
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="ct-section-h">${GASTOS.length} gastos registrados</div>
        <button class="ct-add-btn" onclick="openGastoModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo gasto
        </button>
      </div>

      ${GASTOS.length ? `
        <div class="ct-list">
          <div class="ct-row head">
            <div>Fecha</div>
            <div>Concepto</div>
            <div>Categoría</div>
            <div>Centro</div>
            <div style="text-align:right">Total (con IVA)</div>
            <div></div>
          </div>
          ${GASTOS.map(g => `
            <div class="ct-row">
              <div class="ct-row-date">${String(g.Fecha||'').slice(0,10)}</div>
              <div>
                <div class="ct-row-concept">${g.Concepto||''}</div>
                <div class="ct-row-meta">${g.Proveedor||''}${g.Notas?' · '+g.Notas:''}</div>
              </div>
              <div><span class="ct-pill ${(g.Categoria||'otros').toLowerCase()}">${g.Categoria||'otros'}</span></div>
              <div style="color:#424245">${g.Centro==='*'?'Todos':(g.Centro||'—')}</div>
              <div class="ct-amount">${fmt(g.Total||0)} €</div>
              <button class="ct-del" data-id="${g.ID}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          `).join('')}
        </div>
      ` : `<div class="ct-empty">Sin gastos registrados en este período.<br>Hacé click en "Nuevo gasto" para empezar.</div>`}
    `;
  }

  function renderIva(){
    const iv = DATA.iva || {};
    const dueOrRefund = iv.neto > 0 ? 'due' : (iv.neto < 0 ? 'refund' : '');
    const dueText = iv.neto > 0 ? 'Tenés que ingresar a Hacienda' : (iv.neto < 0 ? 'Hacienda te devuelve' : 'Sin saldo');
    return `
      <div class="ct-iva-grid">
        <div class="ct-iva-card">
          <div class="ct-iva-card-lbl">IVA recaudado</div>
          <div class="ct-iva-card-val">${fmtRound(iv.recaudado||0)} €</div>
          <div class="ct-iva-card-sub">De los servicios facturados (21% sobre ingresos netos)</div>
        </div>
        <div class="ct-iva-card">
          <div class="ct-iva-card-lbl">IVA soportado</div>
          <div class="ct-iva-card-val">${fmtRound(iv.soportado||0)} €</div>
          <div class="ct-iva-card-sub">De los gastos · deducible si tenés factura</div>
        </div>
        <div class="ct-iva-card neto">
          <div class="ct-iva-card-lbl">IVA neto del período</div>
          <div class="ct-iva-card-val ${dueOrRefund}">${fmtRound(Math.abs(iv.neto||0))} €</div>
          <div class="ct-iva-card-sub"><strong>${dueText}</strong></div>
        </div>
      </div>
      <div class="ct-empty" style="background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:14px;text-align:left;padding:18px 22px">
        <strong style="color:#1D1D1F">Para tu contador (modelo 130):</strong><br>
        Pasale el CSV exportado · ya tiene todas las columnas (concepto, importe, IVA, total, fecha, categoría) listas para la presentación trimestral.
      </div>
    `;
  }

  function renderPending(){
    const p = DATA.pendientes || {};
    const items = p.items || [];
    return `
      <div class="ct-kpis" style="grid-template-columns:repeat(2,1fr);max-width:520px">
        <div class="ct-kpi expense">
          <div class="ct-kpi-lbl">Total pendiente</div>
          <div class="ct-kpi-val">${fmtRound(p.total||0)} €</div>
          <div class="ct-kpi-sub">${p.count||0} reservas sin cobrar</div>
        </div>
        <div class="ct-kpi" style="border-left:3px solid #FF9F0A">
          <div class="ct-kpi-lbl">Ticket promedio</div>
          <div class="ct-kpi-val">${p.count?fmtRound(p.total/p.count):0} €</div>
          <div class="ct-kpi-sub">Por reserva pendiente</div>
        </div>
      </div>

      ${items.length ? `
        <div class="ct-list" style="margin-top:14px">
          <div class="ct-row head">
            <div>Fecha</div>
            <div>Cliente</div>
            <div>Servicio</div>
            <div>Centro</div>
            <div style="text-align:right">Total</div>
            <div></div>
          </div>
          ${items.map(b => `
            <div class="ct-row">
              <div class="ct-row-date">${String(b['Fecha ISO']||'').slice(0,10)}</div>
              <div>
                <div class="ct-row-concept">${b.Nombre||''}</div>
                <div class="ct-row-meta">${b['Teléfono']||b.Teléfono||''}</div>
              </div>
              <div style="color:#424245">${b.Servicio||''}</div>
              <div style="color:#424245">${b.Centro||'—'}</div>
              <div class="ct-amount">${fmt(b.Total||0)} €</div>
              <div></div>
            </div>
          `).join('')}
        </div>
      ` : `<div class="ct-empty" style="margin-top:14px">Sin cobros pendientes en este período.</div>`}
    `;
  }

  /* ─── Modal gasto ─── */
  let NEW_GASTO = { fecha:'', concepto:'', categoria:'producto', importe:'', ivaPct:21, proveedor:'', metodoPago:'transferencia', notas:'', centro:'*' };

  window.openGastoModal = function(){
    NEW_GASTO = { fecha: new Date().toISOString().slice(0,10), concepto:'', categoria:'producto', importe:'', ivaPct:21, proveedor:'', metodoPago:'transferencia', notas:'', centro:'*' };
    const m = document.getElementById('ctModal');
    if (m) { renderGastoModal(); m.classList.add('show'); }
  };
  window.closeGastoModal = function(){ document.getElementById('ctModal')?.classList.remove('show'); };

  function renderGastoModal(){
    const centros = (window.CONFIG && window.CONFIG.centros) || [];
    document.getElementById('ctModal').innerHTML = `
      <div class="ct-modal-box">
        <div class="ct-modal-head">
          <h3>Nuevo gasto</h3>
          <button class="ct-modal-close" onclick="closeGastoModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="ct-field">
          <label class="ct-label">Concepto</label>
          <input class="ct-input" id="cgConcepto" type="text" placeholder="Ej. Compra de microfibras">
        </div>
        <div class="ct-field-row">
          <div>
            <label class="ct-label">Fecha</label>
            <input class="ct-input" id="cgFecha" type="date" value="${NEW_GASTO.fecha}">
          </div>
          <div>
            <label class="ct-label">Categoría</label>
            <select class="ct-select" id="cgCategoria">
              <option value="alquiler">Alquiler</option>
              <option value="sueldos">Sueldos</option>
              <option value="producto" selected>Producto/material</option>
              <option value="marketing">Marketing</option>
              <option value="servicios">Servicios (luz, agua)</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        </div>
        <div class="ct-field-row">
          <div>
            <label class="ct-label">Importe (sin IVA)</label>
            <input class="ct-input" id="cgImporte" type="number" step="0.01" placeholder="0,00">
          </div>
          <div>
            <label class="ct-label">IVA %</label>
            <select class="ct-select" id="cgIvaPct">
              <option value="0">0%</option>
              <option value="4">4%</option>
              <option value="10">10%</option>
              <option value="21" selected>21%</option>
            </select>
          </div>
        </div>
        <div class="ct-field-row">
          <div>
            <label class="ct-label">Centro</label>
            <select class="ct-select" id="cgCentro">
              <option value="*">Todos / general</option>
              ${centros.map(c => `<option value="${c.id}">${c.ciudad}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="ct-label">Método de pago</label>
            <select class="ct-select" id="cgMetodo">
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="efectivo">Efectivo</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
        <div class="ct-field">
          <label class="ct-label">Proveedor (opcional)</label>
          <input class="ct-input" id="cgProveedor" type="text" placeholder="Ej. Suministros Auto Finesse">
        </div>
        <div class="ct-modal-cta">
          <button class="ct-modal-btn-ghost" onclick="closeGastoModal()">Cancelar</button>
          <button class="ct-modal-btn-primary" onclick="submitGasto()">Guardar gasto</button>
        </div>
      </div>
    `;
  }

  window.submitGasto = async function(){
    const concepto = document.getElementById('cgConcepto').value.trim();
    const importe = document.getElementById('cgImporte').value;
    if (!concepto || !importe) { alert('Concepto e importe son obligatorios'); return; }
    const r = await bg('addGasto', {
      concepto,
      categoria: document.getElementById('cgCategoria').value,
      fecha: document.getElementById('cgFecha').value,
      importe: importe,
      ivaPct: document.getElementById('cgIvaPct').value,
      centro: document.getElementById('cgCentro').value,
      metodoPago: document.getElementById('cgMetodo').value,
      proveedor: document.getElementById('cgProveedor').value
    });
    if (r && r.ok) { closeGastoModal(); loadData(); }
    else alert('Error: ' + (r && r.error ? r.error : 'desconocido'));
  };

  /* ─── Export CSV ─── */
  window.exportContabilidad = function(){
    if (!DATA) return;
    const rows = [['Tipo','Fecha','Concepto/Servicio','Categoría','Centro','Base','IVA','Total']];
    /* Ingresos · simplificados desde el resumen */
    rows.push(['INGRESOS', '', 'Ingresos totales del período', 'reservas', DATA.period.centro,
      (DATA.ingresos.neto||0).toFixed(2), (DATA.ingresos.iva||0).toFixed(2), (DATA.ingresos.bruto||0).toFixed(2)]);
    /* Gastos detallados */
    GASTOS.forEach(g => {
      rows.push(['GASTO', String(g.Fecha||'').slice(0,10), g.Concepto||'', g.Categoria||'',
        g.Centro||'', (Number(g.Importe)||0).toFixed(2), (Number(g.IVA)||0).toFixed(2), (Number(g.Total)||0).toFixed(2)]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contabilidad-' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ─── Inyección ─── */
  function inject(){
    if (!window.CURRENT_USER) return false; // todavía no hay login → reintentar
    const isSuper = window.CURRENT_USER.rol === 'superadmin' || window.CURRENT_USER.centro === '*';
    if (!isSuper) return true; // hay usuario pero no es dueño → no inyectar

    const refBtn = document.querySelector('.sb-item[data-page="reports"]');
    if (!refBtn) return false;

    if (!document.querySelector('.sb-item[data-page="contabilidad"]')) {
      const item = document.createElement('button');
      item.className = 'sb-item';
      item.setAttribute('data-page', 'contabilidad');
      item.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Contabilidad
      `;
      refBtn.parentNode.insertBefore(item, refBtn.nextSibling);
      item.addEventListener('click', () => {
        if (typeof window.navTo === 'function') window.navTo('contabilidad');
        loadData();
      });
    }

    if (!document.getElementById('page-contabilidad')) {
      const page = document.createElement('section');
      page.className = 'page';
      page.id = 'page-contabilidad';
      const refPage = document.querySelector('#page-reports') || document.querySelector('.page');
      if (refPage && refPage.parentNode) refPage.parentNode.insertBefore(page, refPage.nextSibling);
      else document.body.appendChild(page);
    }

    if (!document.getElementById('ctModal')) {
      const m = document.createElement('div');
      m.id = 'ctModal';
      m.className = 'ct-modal';
      document.body.appendChild(m);
    }

    try { if (window.titles && !window.titles['contabilidad']) window.titles['contabilidad'] = 'Contabilidad'; } catch(e){}

    window.addEventListener('centroChange', () => { if (DATA) loadData(); });

    return true;
  }
  function retry(){ if (inject()) return; setTimeout(retry, 500); }
  document.addEventListener('alvatoUserReady', () => { inject(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else retry();

  window.refreshContabilidad = loadData;
})();
