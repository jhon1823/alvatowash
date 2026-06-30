/* ══════════════════════════════════════════════════════════════════
   RANKING DE CENTROS · 3 podios: facturación · fidelización · volumen
   ─────────────────────────────────────────────────────────────────
   Drop-in que:
   1. Agrega "Ranking centros" en el sidebar (después de Reportes)
   2. Crea su página propia con 3 tabs y podio visual
   3. Calcula rankings en frontend leyendo de BOOKINGS · sin backend nuevo

   Tabs:
   - €: facturación total del período (top 10)
   - Fidelización: % de clientes que repiten en 30/60/90 días + VIPs nuevos
   - Volumen: cantidad de servicios completados (útil porque hay centros
     que lavan muchos coches baratos vs pocos caros)

   Solo visible para superadmin (no encargados).
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_RANKING_CENTROS__) return;
  window.__ALVATO_RANKING_CENTROS__ = true;

  const STYLE = `
    /* ─── Coherente con admin pro (light · SF Pro · #DC2626) ─── */
    #page-ranking-centros{padding:24px;max-width:1280px;margin:0 auto}

    /* Period selector */
    .rk-period-row{
      display:flex;gap:14px;align-items:center;flex-wrap:wrap;
      margin-bottom:18px;
    }
    .rk-period{
      display:inline-flex;gap:4px;background:#FFFFFF;
      border:1px solid rgba(0,0,0,.06);border-radius:99px;padding:3px;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
    }
    .rk-period button{
      padding:7px 16px;border-radius:99px;font-size:12.5px;font-weight:600;
      color:#424245;background:transparent;cursor:pointer;
      transition:all .15s;font-family:inherit;
    }
    .rk-period button.active{background:#1D1D1F;color:#fff}
    .rk-sub{font-size:13px;color:#86868B;margin-left:auto}

    /* Tabs */
    .rk-tabs{
      display:inline-flex;gap:4px;background:#F5F5F7;
      border-radius:12px;padding:4px;margin-bottom:20px;
    }
    .rk-tab{
      padding:9px 16px;border-radius:9px;font-size:13.5px;font-weight:600;
      color:#86868B;cursor:pointer;transition:all .15s;font-family:inherit;
      display:inline-flex;align-items:center;gap:7px;
    }
    .rk-tab.active{background:#FFFFFF;color:#1D1D1F;box-shadow:0 1px 2px rgba(0,0,0,.06)}
    .rk-tab svg{width:14px;height:14px;stroke-width:2}

    /* Podio top 3 */
    .rk-podium{
      display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:14px;
      align-items:end;margin-bottom:22px;
    }
    @media(max-width:760px){.rk-podium{grid-template-columns:1fr;gap:8px}}
    .rk-podium-card{
      background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:16px;
      padding:22px 18px 18px;text-align:center;position:relative;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
    }
    .rk-podium-card.gold{
      background:linear-gradient(180deg,#FFFAE6 0%,#FFFFFF 70%);
      border-color:rgba(212,175,55,.35);box-shadow:0 8px 20px rgba(212,175,55,.18);
      padding-top:28px;padding-bottom:24px;
    }
    .rk-podium-card.silver{background:linear-gradient(180deg,#F6F6F6 0%,#FFFFFF 70%);border-color:rgba(0,0,0,.08)}
    .rk-podium-card.bronze{background:linear-gradient(180deg,#FBF1E7 0%,#FFFFFF 70%);border-color:rgba(205,127,50,.25)}
    .rk-medal{
      width:36px;height:36px;border-radius:50%;
      display:inline-flex;align-items:center;justify-content:center;
      font-weight:800;font-size:14px;color:#fff;margin-bottom:10px;
      letter-spacing:-.3px;
    }
    .rk-medal.gold{background:linear-gradient(135deg,#F4D76E,#C9B679);color:#5C4A0E}
    .rk-medal.silver{background:linear-gradient(135deg,#E0E0E0,#A0A0A0);color:#333}
    .rk-medal.bronze{background:linear-gradient(135deg,#D9926A,#A65E2F);color:#fff}
    .rk-podium-name{font-size:16px;font-weight:700;letter-spacing:-.3px;color:#1D1D1F;line-height:1.2;margin-bottom:4px}
    .rk-podium-city{font-size:10.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#86868B;margin-bottom:14px}
    .rk-podium-val{font-size:30px;font-weight:800;letter-spacing:-.8px;line-height:1;color:#1D1D1F}
    .rk-podium-card.gold .rk-podium-val{font-size:36px;color:#5C4A0E}
    .rk-podium-unit{font-size:12.5px;font-weight:500;color:#86868B;margin-top:4px}
    .rk-podium-delta{
      display:inline-flex;align-items:center;gap:3px;
      font-size:11.5px;font-weight:600;margin-top:8px;
      padding:3px 8px;border-radius:99px;
    }
    .rk-podium-delta.up{background:rgba(48,209,88,.12);color:#1F7F3A}
    .rk-podium-delta.down{background:rgba(255,69,58,.12);color:#991B1B}
    .rk-podium-delta.flat{background:rgba(0,0,0,.05);color:#86868B}

    /* Lista del 4 al 10 */
    .rk-list{background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .rk-list-row{
      display:grid;grid-template-columns:36px 1fr 1fr auto auto;gap:14px;
      padding:13px 18px;align-items:center;
      border-bottom:1px solid rgba(0,0,0,.05);font-size:13.5px;
      transition:background .12s;
    }
    .rk-list-row:last-child{border-bottom:none}
    .rk-list-row:hover{background:rgba(0,0,0,.02)}
    .rk-list-row.head{background:#FAFAFA;font-size:10.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#86868B;padding:10px 18px}
    .rk-rank{font-weight:700;color:#86868B;font-size:14px;text-align:center}
    .rk-name{font-weight:600;color:#1D1D1F;letter-spacing:-.2px}
    .rk-city{font-size:11.5px;color:#86868B;margin-top:1px}
    .rk-val{font-weight:700;font-size:15px;letter-spacing:-.3px;text-align:right}
    .rk-secondary{font-size:12.5px;color:#86868B;text-align:right;font-weight:500}
    .rk-delta{
      display:inline-flex;align-items:center;gap:3px;
      font-size:11px;font-weight:600;padding:2px 7px;border-radius:99px;min-width:48px;justify-content:center;
    }
    .rk-delta.up{background:rgba(48,209,88,.12);color:#1F7F3A}
    .rk-delta.down{background:rgba(255,69,58,.12);color:#991B1B}
    .rk-delta.flat{background:transparent;color:#86868B}

    .rk-empty{padding:60px 20px;text-align:center;color:#86868B;font-size:14px}

    @media(max-width:760px){
      .rk-list-row{grid-template-columns:32px 1fr auto;gap:8px;padding:12px 14px}
      .rk-list-row.head{display:none}
      .rk-secondary{display:none}
      .rk-delta{display:none}
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* ─── Estado ─── */
  let STATE = { period:'month', tab:'revenue' };

  /* ─── Helpers ─── */
  function getBookings(){ return window.BOOKINGS || []; }
  function getCentros(){ return (window.CONFIG && window.CONFIG.centros) || []; }

  function periodRange(period){
    const now = new Date();
    let start = new Date(now), prev = new Date(now);
    if (period === 'week')      { start.setDate(now.getDate() - 7);  prev.setDate(now.getDate() - 14); }
    else if (period === 'month'){ start.setMonth(now.getMonth() - 1); prev.setMonth(now.getMonth() - 2); }
    else if (period === 'quarter'){ start.setMonth(now.getMonth() - 3); prev.setMonth(now.getMonth() - 6); }
    else if (period === 'year') { start.setFullYear(now.getFullYear() - 1); prev.setFullYear(now.getFullYear() - 2); }
    else { start = new Date('2000-01-01'); prev = new Date('2000-01-01'); }
    return {
      start: start.toISOString().slice(0,10),
      end: now.toISOString().slice(0,10),
      prevStart: prev.toISOString().slice(0,10),
      prevEnd: start.toISOString().slice(0,10)
    };
  }

  function bookingsInRange(bookings, start, end){
    return bookings.filter(b => {
      const iso = String(b['Fecha ISO']||b.fechaISO||'').slice(0,10);
      return iso && iso >= start && iso < end;
    });
  }

  /* ─── Cálculos de ranking ─── */
  function calcRevenue(bookings, centroId){
    const sub = bookings.filter(b => (b.Centro||b.centro) === centroId);
    return sub.reduce((s,b) => s + (Number(b.Total||b.total)||0), 0);
  }
  function calcVolume(bookings, centroId){
    return bookings.filter(b => (b.Centro||b.centro) === centroId && (b.Estado||b.estado)==='completado').length;
  }
  function calcFidelization(bookings, centroId){
    /* % de clientes que volvieron en el período */
    const sub = bookings.filter(b => (b.Centro||b.centro) === centroId);
    const byEmail = {};
    sub.forEach(b => {
      const email = b.Email||b.email||b.Teléfono||b.telefono||'';
      if (!email) return;
      byEmail[email] = (byEmail[email]||0) + 1;
    });
    const unique = Object.keys(byEmail).length;
    const repeaters = Object.values(byEmail).filter(c => c >= 2).length;
    const pct = unique ? Math.round((repeaters / unique) * 100) : 0;
    return { pct, repeaters, unique };
  }
  function calcAvgTicket(bookings, centroId){
    const sub = bookings.filter(b => (b.Centro||b.centro) === centroId);
    if (!sub.length) return 0;
    return Math.round(sub.reduce((s,b)=>s+(Number(b.Total||b.total)||0), 0) / sub.length);
  }

  function pctDelta(now, prev){
    if (!prev) return now > 0 ? 999 : 0;
    return Math.round(((now - prev) / prev) * 100);
  }

  /* ─── Build ranking por tab ─── */
  function buildRanking(){
    const r = periodRange(STATE.period);
    const all = getBookings();
    const cur = bookingsInRange(all, r.start, r.end);
    const prev = bookingsInRange(all, r.prevStart, r.prevEnd);
    const centros = getCentros();
    const rows = centros.map(c => {
      const revenue = calcRevenue(cur, c.id);
      const revenuePrev = calcRevenue(prev, c.id);
      const volume = calcVolume(cur, c.id);
      const volumePrev = calcVolume(prev, c.id);
      const fid = calcFidelization(cur, c.id);
      const fidPrev = calcFidelization(prev, c.id);
      const ticket = calcAvgTicket(cur, c.id);
      return {
        id: c.id, name: c.nombre.replace('Alvato ',''), ciudad: c.ciudad,
        revenue, revenueDelta: pctDelta(revenue, revenuePrev),
        volume, volumeDelta: pctDelta(volume, volumePrev),
        fid: fid.pct, fidPrev: fidPrev.pct,
        fidDelta: pctDelta(fid.pct, fidPrev.pct),
        repeaters: fid.repeaters, unique: fid.unique,
        ticket
      };
    });

    let sortKey, displayVal, displayUnit, displaySecondary, deltaKey;
    if (STATE.tab === 'revenue') {
      sortKey = 'revenue';
      displayVal = r => Math.round(r.revenue).toLocaleString('es-ES');
      displayUnit = '€';
      displaySecondary = r => `Ticket promedio ${r.ticket} €`;
      deltaKey = 'revenueDelta';
    } else if (STATE.tab === 'volume') {
      sortKey = 'volume';
      displayVal = r => r.volume.toLocaleString('es-ES');
      displayUnit = 'lavados';
      displaySecondary = r => `Ticket promedio ${r.ticket} €`;
      deltaKey = 'volumeDelta';
    } else { /* fidelization */
      sortKey = 'fid';
      displayVal = r => r.fid;
      displayUnit = '%';
      displaySecondary = r => `${r.repeaters} de ${r.unique} clientes repiten`;
      deltaKey = 'fidDelta';
    }

    rows.sort((a,b) => (b[sortKey]||0) - (a[sortKey]||0));
    return { rows, displayVal, displayUnit, displaySecondary, deltaKey };
  }

  /* ─── Render ─── */
  function renderPodiumCard(row, idx, rk){
    if (!row) return '';
    const cls = ['gold','silver','bronze'][idx] || '';
    const medalLbl = ['1°','2°','3°'][idx] || '';
    const d = row[rk.deltaKey];
    const dCls = d > 5 ? 'up' : (d < -5 ? 'down' : 'flat');
    const dStr = d === 0 ? '0%' : (d > 0 ? '+'+d+'%' : d+'%');
    return `
      <div class="rk-podium-card ${cls}">
        <div class="rk-medal ${cls}">${medalLbl}</div>
        <div class="rk-podium-name">${row.name}</div>
        <div class="rk-podium-city">${row.ciudad}</div>
        <div class="rk-podium-val">${rk.displayVal(row)}<span class="rk-podium-unit"> ${rk.displayUnit}</span></div>
        <div class="rk-podium-delta ${dCls}">${dStr} vs período anterior</div>
      </div>
    `;
  }

  function renderListRow(row, idx, rk){
    const d = row[rk.deltaKey];
    const dCls = d > 5 ? 'up' : (d < -5 ? 'down' : 'flat');
    const dStr = d === 0 ? '0%' : (d > 0 ? '+'+d+'%' : d+'%');
    return `
      <div class="rk-list-row">
        <div class="rk-rank">${idx + 4}</div>
        <div>
          <div class="rk-name">${row.name}</div>
          <div class="rk-city">${row.ciudad}</div>
        </div>
        <div class="rk-secondary">${rk.displaySecondary(row)}</div>
        <div class="rk-val">${rk.displayVal(row)} ${rk.displayUnit}</div>
        <div class="rk-delta ${dCls}">${dStr}</div>
      </div>
    `;
  }

  function render(){
    const page = document.getElementById('page-ranking-centros');
    if (!page) return;
    const rk = buildRanking();
    const top3 = rk.rows.slice(0, 3);
    const rest = rk.rows.slice(3, 10);
    const empty = rk.rows.every(r => !r.revenue && !r.volume && !r.fid);

    page.innerHTML = `
      <div class="rk-period-row">
        <div class="rk-period">
          <button data-period="week" class="${STATE.period==='week'?'active':''}">Semana</button>
          <button data-period="month" class="${STATE.period==='month'?'active':''}">Mes</button>
          <button data-period="quarter" class="${STATE.period==='quarter'?'active':''}">Trimestre</button>
          <button data-period="year" class="${STATE.period==='year'?'active':''}">Año</button>
          <button data-period="all" class="${STATE.period==='all'?'active':''}">Todo</button>
        </div>
        <div class="rk-sub">Delta comparada con período anterior</div>
      </div>

      <div class="rk-tabs">
        <button class="rk-tab ${STATE.tab==='revenue'?'active':''}" data-tab="revenue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Facturación
        </button>
        <button class="rk-tab ${STATE.tab==='fidelization'?'active':''}" data-tab="fidelization">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Fidelización
        </button>
        <button class="rk-tab ${STATE.tab==='volume'?'active':''}" data-tab="volume">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
          Volumen
        </button>
      </div>

      ${empty ? `
        <div class="rk-list"><div class="rk-empty">Todavía no hay datos de reservas para calcular ranking en este período.</div></div>
      ` : `
        <div class="rk-podium">
          ${renderPodiumCard(top3[1], 1, rk)}
          ${renderPodiumCard(top3[0], 0, rk)}
          ${renderPodiumCard(top3[2], 2, rk)}
        </div>
        ${rest.length ? `
          <div class="rk-list">
            <div class="rk-list-row head">
              <div>#</div>
              <div>Centro</div>
              <div>${STATE.tab==='fidelization' ? 'Repetidores' : 'Ticket'}</div>
              <div style="text-align:right">${STATE.tab==='revenue' ? 'Facturación' : (STATE.tab==='volume' ? 'Lavados' : '% Repite')}</div>
              <div style="text-align:center">Delta</div>
            </div>
            ${rest.map((r,i) => renderListRow(r, i, rk)).join('')}
          </div>
        ` : ''}
      `}
    `;

    /* Wire eventos */
    page.querySelectorAll('.rk-period button').forEach(b => b.addEventListener('click', () => {
      STATE.period = b.dataset.period; render();
    }));
    page.querySelectorAll('.rk-tab').forEach(b => b.addEventListener('click', () => {
      STATE.tab = b.dataset.tab; render();
    }));
  }

  /* ─── Inyección ─── */
  function inject(){
    /* Solo para superadmin */
    const user = window.CURRENT_USER || {};
    const isSuper = user.rol === 'superadmin' || user.centro === '*';
    if (!isSuper) return true; /* "true" = no reintentamos, no es para encargados */

    const reportsBtn = document.querySelector('.sb-item[data-page="reports"]');
    if (!reportsBtn) return false;

    /* 1. Sidebar item */
    if (!document.querySelector('.sb-item[data-page="ranking-centros"]')) {
      const item = document.createElement('button');
      item.className = 'sb-item';
      item.setAttribute('data-page', 'ranking-centros');
      item.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        Ranking centros
      `;
      reportsBtn.parentNode.insertBefore(item, reportsBtn.nextSibling);
      item.addEventListener('click', () => {
        if (typeof window.navTo === 'function') window.navTo('ranking-centros');
        render();
      });
    }

    /* 2. Página */
    if (!document.getElementById('page-ranking-centros')) {
      const page = document.createElement('section');
      page.className = 'page';
      page.id = 'page-ranking-centros';
      const refPage = document.querySelector('#page-reports') || document.querySelector('.page');
      if (refPage && refPage.parentNode) refPage.parentNode.insertBefore(page, refPage.nextSibling);
      else document.body.appendChild(page);
    }

    /* 3. Título */
    try {
      if (window.titles && !window.titles['ranking-centros']) window.titles['ranking-centros'] = 'Ranking de centros';
    } catch(e){}

    /* 4. Render inicial */
    render();

    /* 5. Refresh */
    window.addEventListener('bookingsUpdated', render);

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

  window.refreshRankingCentros = render;
})();
