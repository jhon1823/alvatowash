/* ════════════════════════════════════════════════════════════════════
   ALVATOWASH — DASHBOARD EJECUTIVO DE REPORTES
   ──────────────────────────────────────────────────────────────────
   Visualiza KPIs profundos: ingresos por día, top servicios, ranking
   empleados, distribución por centro, conversión leads, ticket promedio,
   retención, tasa de no-show.
═════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* CSS scoped */
const CSS = `
.rep-root{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#1D1D1F}
.rep-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:14px}
.rep-eye{font-size:11.5px;font-weight:700;color:#86868B;letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px}
.rep-title{font-size:22px;font-weight:600;letter-spacing:-.5px;line-height:1.1}
.rep-period{display:inline-flex;background:rgba(0,0,0,.04);border-radius:9px;padding:3px;gap:2px}
.rep-period button{padding:6px 12px;border-radius:7px;font-size:12.5px;font-weight:600;color:#6E6E73;background:transparent;border:none;cursor:pointer;font-family:inherit;letter-spacing:-.1px}
.rep-period button.active{background:#fff;color:#1D1D1F;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.rep-period button:hover{color:#1D1D1F}

/* KPIs */
.rep-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}
@media(max-width:760px){.rep-kpis{grid-template-columns:repeat(2,1fr)}}
.rep-kpi{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:16px;padding:20px}
.rep-kpi-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
.rep-kpi-ic{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(220,38,38,.1);color:#DC2626}
.rep-kpi-ic.blue{background:rgba(10,132,255,.1);color:#0A84FF}
.rep-kpi-ic.green{background:rgba(48,209,88,.1);color:#1F8E3F}
.rep-kpi-ic.orange{background:rgba(255,159,10,.1);color:#9C5F00}
.rep-kpi-ic svg{width:16px;height:16px;stroke-width:1.8}
.rep-trend{display:inline-flex;align-items:center;gap:3px;font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:99px;letter-spacing:-.1px}
.rep-trend.up{background:rgba(48,209,88,.12);color:#1F8E3F}
.rep-trend.down{background:rgba(255,69,58,.12);color:#C42E22}
.rep-trend.flat{background:rgba(0,0,0,.06);color:#6E6E73}
.rep-trend svg{width:10px;height:10px;stroke-width:3}
.rep-kpi-lbl{font-size:12.5px;color:#6E6E73;font-weight:500;letter-spacing:-.1px}
.rep-kpi-val{font-size:30px;font-weight:700;letter-spacing:-1px;line-height:1.05;margin-top:2px}
.rep-kpi-foot{font-size:11.5px;color:#86868B;margin-top:6px;letter-spacing:-.1px}

/* Chart de ingresos por día (barras simples) */
.rep-card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:16px;padding:20px 22px;margin-bottom:14px}
.rep-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.rep-card-title{font-size:15px;font-weight:600;letter-spacing:-.3px}
.rep-card-sub{font-size:12px;color:#86868B;margin-top:2px}
.rep-chart{display:flex;gap:6px;align-items:flex-end;height:160px;padding:10px 0}
.rep-bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}
.rep-bar-track{flex:1;width:100%;background:#FAFAFA;border-radius:5px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;position:relative}
.rep-bar-fill{width:100%;background:linear-gradient(180deg,#DC2626,#991B1B);border-radius:4px 4px 0 0;transition:height .4s cubic-bezier(.22,1,.36,1)}
.rep-bar-val{font-size:10.5px;color:#6E6E73;font-weight:600;letter-spacing:-.1px;min-height:14px;line-height:1;font-variant-numeric:tabular-nums}
.rep-bar-lbl{font-size:10px;color:#86868B;font-weight:500;text-transform:uppercase;letter-spacing:.3px}

/* Rankings */
.rep-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px}
@media(max-width:760px){.rep-grid{grid-template-columns:1fr}}
.rank-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(0,0,0,.04)}
.rank-row:last-child{border-bottom:none}
.rank-pos{width:24px;height:24px;border-radius:7px;background:#FAFAFA;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#6E6E73;flex-shrink:0}
.rank-pos.gold{background:rgba(255,215,0,.12);color:#9C5F00}
.rank-pos.silver{background:rgba(192,192,192,.18);color:#525252}
.rank-pos.bronze{background:rgba(205,127,50,.15);color:#7C4A1E}
.rank-info{flex:1;min-width:0}
.rank-name{font-size:13.5px;font-weight:600;letter-spacing:-.2px;line-height:1.2}
.rank-meta{font-size:11.5px;color:#86868B;margin-top:1px}
.rank-val{font-size:14px;font-weight:700;color:#1D1D1F;letter-spacing:-.3px;flex-shrink:0;font-variant-numeric:tabular-nums}
.rank-progress{height:4px;background:rgba(0,0,0,.04);border-radius:2px;overflow:hidden;margin-top:6px}
.rank-progress-fill{height:100%;background:#DC2626;border-radius:2px;transition:width .4s}

/* Distribución por centro */
.rep-dist-bar{height:10px;border-radius:6px;display:flex;overflow:hidden;background:#FAFAFA;margin:14px 0 12px}
.rep-dist-segment{height:100%;transition:width .4s}
.rep-dist-legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
.rep-dist-item{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#6E6E73}
.rep-dist-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
.rep-dist-num{font-weight:600;color:#1D1D1F;margin-left:auto;letter-spacing:-.1px}

/* Empty */
.rep-empty{padding:32px 22px;text-align:center;color:#86868B;font-size:13.5px}
`;

(function injectCss(){
  if (document.getElementById('rep-styles')) return;
  const s = document.createElement('style'); s.id='rep-styles'; s.textContent=CSS;
  document.head.appendChild(s);
})();

let CURRENT_PERIOD = 'month'; // 'today' | 'week' | 'month' | 'all'

function fmtEur(n){ return '€' + Math.round(n).toLocaleString('es-ES'); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function isoToday(){ return new Date().toISOString().slice(0,10); }

function filterByPeriod(bookings){
  const today = isoToday();
  const m = today.slice(0,7);
  switch(CURRENT_PERIOD){
    case 'today':
      return bookings.filter(b => String(b['Fecha ISO']||'').slice(0,10) === today);
    case 'week': {
      const wkAgo = new Date(); wkAgo.setDate(wkAgo.getDate()-7);
      const wkIso = wkAgo.toISOString().slice(0,10);
      return bookings.filter(b => String(b['Fecha ISO']||'').slice(0,10) >= wkIso && String(b['Fecha ISO']||'').slice(0,10) <= today);
    }
    case 'month':
      return bookings.filter(b => String(b['Fecha ISO']||'').slice(0,7) === m);
    default: return bookings.slice();
  }
}

function previousPeriodBookings(){
  const today = isoToday();
  switch(CURRENT_PERIOD){
    case 'today': {
      const y = new Date(); y.setDate(y.getDate()-1);
      const iso = y.toISOString().slice(0,10);
      return (window.BOOKINGS||[]).filter(b => String(b['Fecha ISO']||'').slice(0,10) === iso);
    }
    case 'week': {
      const wk2 = new Date(); wk2.setDate(wk2.getDate()-14);
      const wk1 = new Date(); wk1.setDate(wk1.getDate()-7);
      const wk2Iso = wk2.toISOString().slice(0,10);
      const wk1Iso = wk1.toISOString().slice(0,10);
      return (window.BOOKINGS||[]).filter(b => {
        const d = String(b['Fecha ISO']||'').slice(0,10);
        return d >= wk2Iso && d < wk1Iso;
      });
    }
    case 'month': {
      const d = new Date(); d.setMonth(d.getMonth()-1);
      const lastMonth = d.toISOString().slice(0,7);
      return (window.BOOKINGS||[]).filter(b => String(b['Fecha ISO']||'').slice(0,7) === lastMonth);
    }
    default: return [];
  }
}

function calcTrend(current, previous){
  if (previous === 0 && current === 0) return { pct:0, dir:'flat' };
  if (previous === 0) return { pct:100, dir:'up' };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), dir: pct > 2 ? 'up' : (pct < -2 ? 'down' : 'flat') };
}

function render(){
  const root = document.getElementById('reportsRoot');
  if (!root) return;

  const allBookings = window.BOOKINGS || [];
  /* Filtrar por centro según el usuario logueado (si la función existe en el admin) */
  const scopedAll = typeof window.filterByCenter === 'function' ? window.filterByCenter(allBookings,'Centro') : allBookings;
  const periodBookings = filterByPeriod(scopedAll);
  const previousBookings = previousPeriodBookings().filter(b => {
    if (typeof window.filterByCenter !== 'function') return true;
    return window.filterByCenter([b],'Centro').length > 0;
  });

  /* KPIs */
  const ingresos = periodBookings.reduce((s,b) => s + (Number(b['Total'])||0), 0);
  const ingresosPrev = previousBookings.reduce((s,b) => s + (Number(b['Total'])||0), 0);
  const reservas = periodBookings.length;
  const reservasPrev = previousBookings.length;
  const ticket = reservas > 0 ? Math.round(ingresos/reservas) : 0;
  const ticketPrev = reservasPrev > 0 ? Math.round(ingresosPrev/reservasPrev) : 0;
  const completadas = periodBookings.filter(b => String(b['Estado']||'').toLowerCase() === 'completado').length;
  const tasaCompletado = reservas > 0 ? Math.round((completadas/reservas)*100) : 0;

  /* Leads */
  const allLeads = window.LEADS || [];
  const conversion = allLeads.length > 0 ? Math.round((allLeads.filter(l => l['Estado']==='confirmado').length / allLeads.length)*100) : 0;

  const trendIngresos = calcTrend(ingresos, ingresosPrev);
  const trendReservas = calcTrend(reservas, reservasPrev);
  const trendTicket = calcTrend(ticket, ticketPrev);

  /* Top servicios */
  const svcMap = new Map();
  periodBookings.forEach(b => {
    const svc = b['Servicio'] || '—';
    if (!svcMap.has(svc)) svcMap.set(svc, { name:svc, count:0, total:0 });
    const o = svcMap.get(svc);
    o.count++;
    o.total += Number(b['Total'])||0;
  });
  const topSvc = Array.from(svcMap.values()).sort((a,b) => b.total - a.total).slice(0,5);

  /* Top empleados */
  const empMap = new Map();
  periodBookings.forEach(b => {
    const emp = b['Empleado'];
    if (!emp) return;
    if (!empMap.has(emp)) empMap.set(emp, { name:emp, count:0, total:0 });
    const o = empMap.get(emp);
    o.count++;
    o.total += Number(b['Total'])||0;
  });
  const topEmp = Array.from(empMap.values()).sort((a,b) => b.total - a.total).slice(0,5);

  /* Distribución por centro */
  const cenMap = new Map();
  periodBookings.forEach(b => {
    const c = String(b['Centro']||'').toLowerCase() || 'sin-centro';
    if (!cenMap.has(c)) cenMap.set(c, { id:c, count:0, total:0 });
    const o = cenMap.get(c);
    o.count++;
    o.total += Number(b['Total'])||0;
  });
  const centrosList = Array.from(cenMap.values()).sort((a,b) => b.total - a.total);
  const centrosCfg = (window.CONFIG && window.CONFIG.centros) || [];
  const centrosTotal = centrosList.reduce((s,c) => s+c.total, 0);
  const CENTRO_COLORS = ['#DC2626','#0A84FF','#1F8E3F','#9C5F00','#BF5AF2','#FF375F','#5AC8FA','#FF9F0A','#30D158','#0563CC'];

  /* Chart: ingresos por día (últimos 14 días si period='month', 7 si week, 24h si today) */
  let chartDays = [];
  if (CURRENT_PERIOD === 'today') {
    for (let h=8; h<=20; h++) chartDays.push({ label: String(h).padStart(2,'0')+'h', value:0 });
    periodBookings.forEach(b => {
      const h = parseInt(String(b['Hora']||'').split(':')[0], 10);
      if (h >= 8 && h <= 20) chartDays[h-8].value += Number(b['Total'])||0;
    });
  } else {
    const ndays = CURRENT_PERIOD === 'week' ? 7 : 30;
    for (let i = ndays-1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0,10);
      const lbl = String(d.getDate());
      chartDays.push({ label: lbl, value: 0, iso });
    }
    periodBookings.forEach(b => {
      const iso = String(b['Fecha ISO']||'').slice(0,10);
      const day = chartDays.find(d => d.iso === iso);
      if (day) day.value += Number(b['Total'])||0;
    });
  }
  const chartMax = Math.max(1, ...chartDays.map(d => d.value));

  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
  const arrowDown = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  const periodLabel = { today:'Hoy', week:'Últimos 7 días', month:'Este mes', all:'Histórico' }[CURRENT_PERIOD];

  root.innerHTML = `
    <div class="rep-root">
      <div class="rep-head">
        <div>
          <div class="rep-eye">Panel ejecutivo</div>
          <div class="rep-title">${periodLabel}</div>
        </div>
        <div class="rep-period">
          <button data-p="today" class="${CURRENT_PERIOD==='today'?'active':''}">Hoy</button>
          <button data-p="week" class="${CURRENT_PERIOD==='week'?'active':''}">Semana</button>
          <button data-p="month" class="${CURRENT_PERIOD==='month'?'active':''}">Mes</button>
          <button data-p="all" class="${CURRENT_PERIOD==='all'?'active':''}">Todo</button>
        </div>
      </div>

      <div class="rep-kpis">
        <div class="rep-kpi">
          <div class="rep-kpi-head">
            <div class="rep-kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/></svg></div>
            ${CURRENT_PERIOD !== 'all' ? `<span class="rep-trend ${trendIngresos.dir}">${trendIngresos.dir==='up'?arrow:trendIngresos.dir==='down'?arrowDown:''}${trendIngresos.pct}%</span>` : ''}
          </div>
          <div class="rep-kpi-val">${fmtEur(ingresos)}</div>
          <div class="rep-kpi-lbl">Ingresos</div>
          <div class="rep-kpi-foot">vs ${fmtEur(ingresosPrev)} período anterior</div>
        </div>

        <div class="rep-kpi">
          <div class="rep-kpi-head">
            <div class="rep-kpi-ic blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
            ${CURRENT_PERIOD !== 'all' ? `<span class="rep-trend ${trendReservas.dir}">${trendReservas.dir==='up'?arrow:trendReservas.dir==='down'?arrowDown:''}${trendReservas.pct}%</span>` : ''}
          </div>
          <div class="rep-kpi-val">${reservas}</div>
          <div class="rep-kpi-lbl">Reservas</div>
          <div class="rep-kpi-foot">${completadas} completadas (${tasaCompletado}%)</div>
        </div>

        <div class="rep-kpi">
          <div class="rep-kpi-head">
            <div class="rep-kpi-ic orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
            ${CURRENT_PERIOD !== 'all' ? `<span class="rep-trend ${trendTicket.dir}">${trendTicket.dir==='up'?arrow:trendTicket.dir==='down'?arrowDown:''}${trendTicket.pct}%</span>` : ''}
          </div>
          <div class="rep-kpi-val">${fmtEur(ticket)}</div>
          <div class="rep-kpi-lbl">Ticket promedio</div>
          <div class="rep-kpi-foot">por reserva</div>
        </div>

        <div class="rep-kpi">
          <div class="rep-kpi-head">
            <div class="rep-kpi-ic green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          </div>
          <div class="rep-kpi-val">${conversion}%</div>
          <div class="rep-kpi-lbl">Conversión leads</div>
          <div class="rep-kpi-foot">${allLeads.length} leads · ${allLeads.filter(l => l['Estado']==='confirmado').length} reservaron</div>
        </div>
      </div>

      <!-- Chart -->
      <div class="rep-card">
        <div class="rep-card-head">
          <div>
            <div class="rep-card-title">Ingresos por ${CURRENT_PERIOD==='today'?'hora':'día'}</div>
            <div class="rep-card-sub">${periodLabel}</div>
          </div>
        </div>
        ${chartDays.length === 0 || chartMax === 1
          ? `<div class="rep-empty">No hay datos en este período</div>`
          : `<div class="rep-chart">${chartDays.map(d => {
              const h = (d.value / chartMax) * 100;
              return `<div class="rep-bar" title="${esc(d.label)}: ${fmtEur(d.value)}">
                <div class="rep-bar-val">${d.value > 0 ? '€'+Math.round(d.value) : ''}</div>
                <div class="rep-bar-track">
                  <div class="rep-bar-fill" style="height:${Math.max(h,3)}%"></div>
                </div>
                <div class="rep-bar-lbl">${esc(d.label)}</div>
              </div>`;
            }).join('')}</div>`
        }
      </div>

      <!-- Rankings: 2 columnas -->
      <div class="rep-grid">
        <!-- Top servicios -->
        <div class="rep-card">
          <div class="rep-card-head"><div><div class="rep-card-title">Top servicios</div><div class="rep-card-sub">Por ingresos</div></div></div>
          ${topSvc.length === 0 ? `<div class="rep-empty">Sin reservas</div>` : topSvc.map((s,i) => {
            const cls = i===0?'gold':i===1?'silver':i===2?'bronze':'';
            const pctMax = topSvc[0].total > 0 ? (s.total/topSvc[0].total)*100 : 0;
            return `<div class="rank-row">
              <div class="rank-pos ${cls}">${i+1}</div>
              <div class="rank-info">
                <div class="rank-name">${esc(s.name)}</div>
                <div class="rank-meta">${s.count} reserva${s.count===1?'':'s'} · ${fmtEur(s.total/s.count)} promedio</div>
                <div class="rank-progress"><div class="rank-progress-fill" style="width:${pctMax}%"></div></div>
              </div>
              <div class="rank-val">${fmtEur(s.total)}</div>
            </div>`;
          }).join('')}
        </div>

        <!-- Top empleados -->
        <div class="rep-card">
          <div class="rep-card-head"><div><div class="rep-card-title">Top empleados</div><div class="rep-card-sub">Por ventas generadas</div></div></div>
          ${topEmp.length === 0 ? `<div class="rep-empty">Sin asignaciones</div>` : topEmp.map((e,i) => {
            const cls = i===0?'gold':i===1?'silver':i===2?'bronze':'';
            const pctMax = topEmp[0].total > 0 ? (e.total/topEmp[0].total)*100 : 0;
            return `<div class="rank-row">
              <div class="rank-pos ${cls}">${i+1}</div>
              <div class="rank-info">
                <div class="rank-name" style="text-transform:capitalize">${esc(e.name)}</div>
                <div class="rank-meta">${e.count} servicio${e.count===1?'':'s'} · ${fmtEur(e.total/e.count)} promedio</div>
                <div class="rank-progress"><div class="rank-progress-fill" style="width:${pctMax}%"></div></div>
              </div>
              <div class="rank-val">${fmtEur(e.total)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      ${centrosList.length > 1 ? `
        <!-- Distribución por centro -->
        <div class="rep-card">
          <div class="rep-card-head"><div><div class="rep-card-title">Distribución por centro</div><div class="rep-card-sub">% de ingresos por sucursal</div></div></div>
          <div class="rep-dist-bar">
            ${centrosList.map((c,i) => {
              const pct = centrosTotal > 0 ? (c.total/centrosTotal)*100 : 0;
              const col = CENTRO_COLORS[i % CENTRO_COLORS.length];
              return `<div class="rep-dist-segment" style="width:${pct}%;background:${col}"></div>`;
            }).join('')}
          </div>
          <div class="rep-dist-legend">
            ${centrosList.map((c,i) => {
              const pct = centrosTotal > 0 ? Math.round((c.total/centrosTotal)*100) : 0;
              const col = CENTRO_COLORS[i % CENTRO_COLORS.length];
              const cn = centrosCfg.find(x => String(x.id).toLowerCase() === String(c.id).toLowerCase());
              const lbl = cn ? cn.ciudad : (c.id === 'sin-centro' ? 'Sin centro' : c.id.toUpperCase());
              return `<div class="rep-dist-item">
                <span class="rep-dist-dot" style="background:${col}"></span>
                <span>${esc(lbl)} · ${pct}%</span>
                <span class="rep-dist-num">${fmtEur(c.total)}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  root.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
    CURRENT_PERIOD = b.dataset.p;
    render();
  }));
}

window.renderReports = render;

/* Hook: cuando se navega a Reportes, renderizar */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('[data-page="reports"]');
  if (btn) btn.addEventListener('click', () => setTimeout(render, 60));
});

})();
