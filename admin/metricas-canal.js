/* ══════════════════════════════════════════════════════════════════
   MÉTRICAS DE CANAL · Web vs Centro + Upsell
   ─────────────────────────────────────────────────────────────────
   Inyecta una banda de KPIs al inicio del dashboard que compara:
   - Clientes captados por web/Instagram vs walk-in en centro
   - Ticket promedio web vs centro
   - % de reservas web con upsell aplicado
   - Conversión de leads a reservas

   Lee window.BOOKINGS · sin backend nuevo.
   El campo `source` de cada booking define el origen:
   - 'web', 'instagram', 'google' → captado online
   - 'walk_in', 'centro', 'phone' → captado en centro
   - vacío → asume web (legacy)

   El campo `upsell_applied` (booleano) indica si el cliente sumó extras
   o cambió a un servicio superior al llegar al centro.
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_METRICAS_CANAL__) return;
  window.__ALVATO_METRICAS_CANAL__ = true;

  const STYLE = `
    .mc-wrap{
      max-width:1280px;margin:0 auto 18px;padding:0 24px;
      font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter',sans-serif;
    }
    .mc-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;gap:10px;flex-wrap:wrap}
    .mc-title{font-size:14px;font-weight:700;color:#1D1D1F;letter-spacing:-.3px;display:inline-flex;align-items:center;gap:8px}
    .mc-title svg{width:15px;height:15px;color:#DC2626;stroke-width:2}
    .mc-period{display:inline-flex;gap:3px;background:#FFFFFF;border:1px solid rgba(0,0,0,.06);border-radius:99px;padding:3px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .mc-period button{padding:5px 11px;border-radius:99px;font-size:11.5px;font-weight:600;color:#86868B;background:transparent;cursor:pointer;transition:all .12s;font-family:inherit}
    .mc-period button.active{background:#1D1D1F;color:#fff}

    .mc-grid{
      display:grid;grid-template-columns:repeat(4,1fr);gap:10px;
    }
    @media(max-width:980px){.mc-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:520px){.mc-grid{grid-template-columns:1fr}}

    .mc-card{
      background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:14px;
      padding:16px 18px;box-shadow:0 1px 2px rgba(0,0,0,.04);
      transition:transform .15s,border-color .15s;
    }
    .mc-card:hover{transform:translateY(-1px);border-color:rgba(0,0,0,.1)}
    .mc-lbl{font-size:10.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#86868B;margin-bottom:8px;display:flex;align-items:center;gap:6px}
    .mc-lbl svg{width:11px;height:11px;stroke-width:2}
    .mc-val-row{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
    .mc-val{font-size:24px;font-weight:800;letter-spacing:-.6px;line-height:1;color:#1D1D1F}
    .mc-val-unit{font-size:12.5px;color:#86868B;font-weight:600}
    .mc-delta{
      display:inline-flex;align-items:center;gap:2px;
      font-size:11px;font-weight:700;padding:3px 7px;border-radius:99px;
    }
    .mc-delta.up{background:rgba(48,209,88,.12);color:#1F7F3A}
    .mc-delta.down{background:rgba(255,69,58,.12);color:#991B1B}
    .mc-delta.flat{background:rgba(0,0,0,.04);color:#86868B}
    .mc-sub{font-size:12px;color:#86868B;margin-top:8px;line-height:1.4}
    .mc-sub strong{color:#1D1D1F;font-weight:600}

    /* Mini barra comparativa horizontal · web vs centro */
    .mc-bar{display:flex;height:6px;border-radius:99px;overflow:hidden;background:#F5F5F7;margin-top:10px}
    .mc-bar-web{background:linear-gradient(90deg,#0A84FF,#5856D6)}
    .mc-bar-centro{background:linear-gradient(90deg,#FF9F0A,#FF6F0A)}
    .mc-legend{display:flex;gap:14px;margin-top:8px;font-size:11px;color:#86868B}
    .mc-legend-item{display:inline-flex;align-items:center;gap:5px}
    .mc-legend-dot{width:8px;height:8px;border-radius:50%}
    .mc-legend-dot.web{background:#0A84FF}
    .mc-legend-dot.centro{background:#FF9F0A}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* ─── Estado ─── */
  let STATE = { period: 'month' };

  /* ─── Helpers ─── */
  function getBookings(){ return window.BOOKINGS || []; }

  function periodRange(period){
    const now = new Date();
    let start = new Date(now), prev = new Date(now);
    if (period === 'week')        { start.setDate(now.getDate() - 7);  prev.setDate(now.getDate() - 14); }
    else if (period === 'month')  { start.setMonth(now.getMonth() - 1); prev.setMonth(now.getMonth() - 2); }
    else if (period === 'quarter'){ start.setMonth(now.getMonth() - 3); prev.setMonth(now.getMonth() - 6); }
    else { start.setFullYear(now.getFullYear() - 1); prev.setFullYear(now.getFullYear() - 2); }
    return {
      start: start.toISOString().slice(0,10),
      end: now.toISOString().slice(0,10),
      prevStart: prev.toISOString().slice(0,10),
      prevEnd: start.toISOString().slice(0,10)
    };
  }

  function bookingsInRange(bookings, start, end){
    /* Si hay centro activo del dueño, filtrar por centro también */
    const activeCentro = (typeof window.getActiveCentro === 'function' ? window.getActiveCentro() : null) || '';
    return bookings.filter(b => {
      const iso = String(b['Fecha ISO']||b.fechaISO||'').slice(0,10);
      if (!iso || iso < start || iso >= end) return false;
      if (activeCentro && (b.Centro||b.centro) && (b.Centro||b.centro) !== activeCentro) return false;
      return true;
    });
  }

  function isWeb(b){
    const src = String(b.source||b.Source||'').toLowerCase();
    if (!src) return true; /* legacy: si no hay source, asume web */
    return ['web','instagram','google','tiktok','facebook','reserva-instagram','organico'].some(s => src.includes(s));
  }
  function isCentro(b){
    return !isWeb(b);
  }
  function hadUpsell(b){
    return !!(b.upsell_applied || b.UpsellApplied || b.upsell);
  }

  function calcMetrics(bookings){
    const total = bookings.length;
    const web = bookings.filter(isWeb);
    const centro = bookings.filter(isCentro);
    const webRev = web.reduce((s,b)=>s+(Number(b.Total||b.total)||0), 0);
    const centroRev = centro.reduce((s,b)=>s+(Number(b.Total||b.total)||0), 0);
    const webTicket = web.length ? Math.round(webRev/web.length) : 0;
    const centroTicket = centro.length ? Math.round(centroRev/centro.length) : 0;
    const upsellWeb = web.filter(hadUpsell).length;
    const upsellPct = web.length ? Math.round((upsellWeb/web.length)*100) : 0;
    return {
      total, web:web.length, centro:centro.length,
      webRev, centroRev, webTicket, centroTicket,
      upsellWeb, upsellPct,
      webPct: total ? Math.round((web.length/total)*100) : 0,
      centroPct: total ? Math.round((centro.length/total)*100) : 0
    };
  }

  function pctDelta(now, prev){
    if (!prev) return now > 0 ? null : 0;
    return Math.round(((now - prev) / prev) * 100);
  }
  function fmtDelta(d){
    if (d === null || d === undefined) return { cls:'flat', txt:'—' };
    if (d === 0) return { cls:'flat', txt:'0%' };
    if (d > 0) return { cls:'up', txt:'+'+d+'%' };
    return { cls:'down', txt:d+'%' };
  }

  function render(){
    const wrap = document.getElementById('mcWrap');
    if (!wrap) return;
    const r = periodRange(STATE.period);
    const all = getBookings();
    const cur = calcMetrics(bookingsInRange(all, r.start, r.end));
    const prev = calcMetrics(bookingsInRange(all, r.prevStart, r.prevEnd));

    const periodNames = { week:'7 días', month:'mes', quarter:'trimestre', year:'año' };
    const periodName = periodNames[STATE.period] || 'mes';

    const dWeb       = fmtDelta(pctDelta(cur.web, prev.web));
    const dCentro    = fmtDelta(pctDelta(cur.centro, prev.centro));
    const dWebTicket = fmtDelta(pctDelta(cur.webTicket, prev.webTicket));
    const dUpsell    = fmtDelta(pctDelta(cur.upsellPct, prev.upsellPct));

    wrap.innerHTML = `
      <div class="mc-head">
        <div class="mc-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
          Canal de captación
        </div>
        <div class="mc-period">
          <button data-period="week" class="${STATE.period==='week'?'active':''}">7d</button>
          <button data-period="month" class="${STATE.period==='month'?'active':''}">Mes</button>
          <button data-period="quarter" class="${STATE.period==='quarter'?'active':''}">Trimestre</button>
          <button data-period="year" class="${STATE.period==='year'?'active':''}">Año</button>
        </div>
      </div>

      <div class="mc-grid">

        <div class="mc-card">
          <div class="mc-lbl">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0A84FF" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20"/><path d="M2 12h20"/></svg>
            Captados por web
          </div>
          <div class="mc-val-row">
            <div class="mc-val">${cur.web}</div>
            <div class="mc-val-unit">${cur.webPct}% del total</div>
            <div class="mc-delta ${dWeb.cls}">${dWeb.txt}</div>
          </div>
          <div class="mc-bar"><div style="width:${cur.webPct}%" class="mc-bar-web"></div></div>
          <div class="mc-legend">
            <span class="mc-legend-item"><span class="mc-legend-dot web"></span>Web · Instagram · Google</span>
          </div>
        </div>

        <div class="mc-card">
          <div class="mc-lbl">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Captados en centro
          </div>
          <div class="mc-val-row">
            <div class="mc-val">${cur.centro}</div>
            <div class="mc-val-unit">${cur.centroPct}% del total</div>
            <div class="mc-delta ${dCentro.cls}">${dCentro.txt}</div>
          </div>
          <div class="mc-bar"><div style="width:${cur.centroPct}%" class="mc-bar-centro"></div></div>
          <div class="mc-legend">
            <span class="mc-legend-item"><span class="mc-legend-dot centro"></span>Walk-in · teléfono · referidos</span>
          </div>
        </div>

        <div class="mc-card">
          <div class="mc-lbl">
            <svg viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Ticket promedio
          </div>
          <div class="mc-val-row">
            <div class="mc-val">${cur.webTicket}€</div>
            <div class="mc-val-unit">web</div>
            <div class="mc-delta ${dWebTicket.cls}">${dWebTicket.txt}</div>
          </div>
          <div class="mc-sub">
            En centro: <strong>${cur.centroTicket}€</strong>
            ${cur.webTicket > cur.centroTicket
              ? ` · web es <strong>+${Math.round(((cur.webTicket-cur.centroTicket)/Math.max(cur.centroTicket,1))*100)}%</strong> más alto`
              : (cur.centroTicket > cur.webTicket
                ? ` · centro es <strong>+${Math.round(((cur.centroTicket-cur.webTicket)/Math.max(cur.webTicket,1))*100)}%</strong> más alto`
                : '')}
          </div>
        </div>

        <div class="mc-card">
          <div class="mc-lbl">
            <svg viewBox="0 0 24 24" fill="none" stroke="#30D158" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            Upsell en centro
          </div>
          <div class="mc-val-row">
            <div class="mc-val">${cur.upsellPct}%</div>
            <div class="mc-val-unit">de reservas web</div>
            <div class="mc-delta ${dUpsell.cls}">${dUpsell.txt}</div>
          </div>
          <div class="mc-sub">
            <strong>${cur.upsellWeb}</strong> clientes web sumaron extras o subieron a un servicio superior al llegar
          </div>
        </div>

      </div>
    `;
    wrap.querySelectorAll('.mc-period button').forEach(b => b.addEventListener('click', () => {
      STATE.period = b.dataset.period;
      render();
    }));
  }

  /* ─── Inyección al dashboard ─── */
  function inject(){
    if (document.getElementById('mcWrap')) return true;
    const dashboard = document.getElementById('page-dashboard');
    if (!dashboard) return false;

    const wrap = document.createElement('section');
    wrap.id = 'mcWrap';
    wrap.className = 'mc-wrap';
    /* Lo insertamos al inicio del dashboard */
    dashboard.insertBefore(wrap, dashboard.firstChild);

    render();
    window.addEventListener('bookingsUpdated', render);
    window.addEventListener('centroChange', render);
    return true;
  }
  let attempts = 0;
  function retry(){
    attempts++;
    if (inject() || attempts > 30) return;
    setTimeout(retry, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else retry();

  window.refreshMetricasCanal = render;
})();
