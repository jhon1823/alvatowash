/* ══════════════════════════════════════════════════════════════════
   CLIENTES VIP · Item en sidebar + página propia
   ─────────────────────────────────────────────────────────────────
   Drop-in que:
   1. Agrega "Clientes VIP" en el sidebar debajo de "Conocé tu cliente"
   2. Crea su propia <section class="page" id="page-clients-vip">
   3. Respeta el sistema navTo() del admin (se oculta al navegar a otras)
   4. Renderiza KPIs + filtros + tabla solo cuando estamos en su página

   Lee window.VIP_USERS o deriva de BOOKINGS · sin backend nuevo.
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_CLIENTES_VIP__) return;
  window.__ALVATO_CLIENTES_VIP__ = true;

  const STYLE = `
    /* ─── Coherente con admin pro (light · SF Pro · #DC2626) ─── */
    #page-clients-vip{padding:24px;max-width:1280px;margin:0 auto}
    #page-clients-vip .vip-head{margin-bottom:8px}
    #page-clients-vip .vip-head h2{display:none}  /* el título lo pone el topbar */
    #page-clients-vip .vip-head-sub{font-size:13.5px;color:#86868B;margin-bottom:20px}

    /* KPIs */
    .vip-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
    @media(max-width:760px){.vip-kpis{grid-template-columns:repeat(2,1fr)}}
    .vip-kpi{background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:14px;padding:16px 18px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .vip-kpi-lbl{font-size:10.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#86868B;margin-bottom:6px}
    .vip-kpi-val{font-size:24px;font-weight:700;letter-spacing:-.5px;line-height:1}
    .vip-kpi-val.gold{color:#996600}
    .vip-kpi-val.diamond{color:#0050B3}
    .vip-kpi-sub{font-size:11.5px;color:#86868B;margin-top:4px}

    /* Toolbar filtros */
    .vip-toolbar{
      background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:14px;
      padding:14px 16px;margin-bottom:14px;
      display:flex;gap:10px;align-items:center;flex-wrap:wrap;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
    }
    .vip-search{
      flex:1;min-width:220px;position:relative;
      display:flex;align-items:center;background:#FAFAFA;
      border:1px solid rgba(0,0,0,.06);border-radius:99px;
      padding:0 14px 0 36px;transition:border-color .15s,background .15s;
    }
    .vip-search:focus-within{border-color:#DC2626;background:#fff}
    .vip-search svg{position:absolute;left:12px;width:14px;height:14px;color:#86868B;stroke-width:2}
    .vip-search input{flex:1;background:transparent;border:none;outline:none;color:#1D1D1F;font-size:13.5px;padding:9px 0;font-family:inherit}

    .vip-filter-group{display:inline-flex;gap:4px;flex-wrap:wrap}
    .vip-filter{
      padding:7px 12px;background:#FAFAFA;border:1px solid rgba(0,0,0,.05);
      border-radius:99px;font-size:12.5px;font-weight:500;color:#424245;
      cursor:pointer;transition:all .15s;font-family:inherit;
    }
    .vip-filter:hover{background:rgba(0,0,0,.04)}
    .vip-filter.active{background:#1D1D1F;color:#fff;border-color:#1D1D1F}

    /* Tabla */
    .vip-table{background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .vip-row{
      display:grid;grid-template-columns:auto 1.2fr 1fr 1fr 1fr 1fr auto;
      gap:14px;padding:14px 18px;align-items:center;
      border-bottom:1px solid rgba(0,0,0,.05);font-size:13.5px;
      transition:background .12s;
    }
    .vip-row:last-child{border-bottom:none}
    .vip-row.head{background:#FAFAFA;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#86868B;padding:11px 18px}
    .vip-row:not(.head):hover{background:rgba(0,0,0,.025)}
    .vip-avatar{
      width:38px;height:38px;border-radius:50%;
      background:linear-gradient(135deg,#DC2626,#991B1B);
      color:#fff;font-weight:700;font-size:14px;letter-spacing:-.3px;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .vip-avatar.bronce{background:linear-gradient(135deg,#CD7F32,#8B5A2B)}
    .vip-avatar.plata{background:linear-gradient(135deg,#C0C0C0,#888)}
    .vip-avatar.oro{background:linear-gradient(135deg,#C9B679,#8A7544)}
    .vip-avatar.diamante{background:linear-gradient(135deg,#7DD3FC,#0284C7)}
    .vip-name{font-weight:600;color:#1D1D1F;letter-spacing:-.2px;line-height:1.3}
    .vip-name-sub{font-size:11.5px;color:#86868B;margin-top:1px}
    .vip-tier{display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:13px}
    .vip-tier-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
    .vip-tier-dot.bronce{background:#CD7F32}
    .vip-tier-dot.plata{background:#C0C0C0}
    .vip-tier-dot.oro{background:#C9B679}
    .vip-tier-dot.diamante{background:#7DD3FC}
    .vip-points{font-weight:700;font-size:15px;letter-spacing:-.3px}
    .vip-spent{font-weight:600;font-size:14px;color:#1D1D1F}
    .vip-days{font-size:12.5px;color:#86868B}
    .vip-days.cold{color:#FF9F0A;font-weight:600}
    .vip-days.frozen{color:#FF453A;font-weight:600}

    .vip-actions{display:inline-flex;gap:4px}
    .vip-action{
      width:30px;height:30px;border-radius:8px;background:transparent;color:#424245;
      display:inline-flex;align-items:center;justify-content:center;
      transition:background .12s,color .12s;
    }
    .vip-action:hover{background:rgba(0,0,0,.06);color:#1D1D1F}
    .vip-action.wa:hover{background:rgba(37,211,102,.12);color:#075E54}
    .vip-action.discount:hover{background:rgba(220,38,38,.12);color:#DC2626}
    .vip-action svg{width:15px;height:15px;stroke-width:2}

    .vip-empty{padding:60px 20px;text-align:center;color:#86868B;font-size:14px}

    @media(max-width:880px){
      .vip-row{grid-template-columns:auto 1fr auto;gap:10px}
      .vip-row.head{display:none}
      .vip-tier,.vip-points,.vip-spent,.vip-days{display:none}
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* ─── Estado ─── */
  let STATE = { tier:'all', spent:'all', days:'all', search:'' };

  function getVipUsers(){
    const fromVip = window.VIP_USERS || [];
    if (fromVip.length) return fromVip;
    /* Fallback · agregamos por email desde BOOKINGS */
    const bookings = window.BOOKINGS || [];
    const byEmail = {};
    bookings.forEach(b => {
      const email = b.Email || b.email || '';
      if (!email) return;
      if (!byEmail[email]) byEmail[email] = { nombre:b.Nombre||b.nombre||'', email, telefono:b.Teléfono||b.telefono||'', puntos:0, gastoTotal:0, ultimaVisita:null, centro:b.Centro||b.centro||'', visitas:0 };
      byEmail[email].gastoTotal += Number(b.Total||b.total||0);
      byEmail[email].visitas += 1;
      const f = b['Fecha ISO'] || b.fechaISO || '';
      if (f && (!byEmail[email].ultimaVisita || f > byEmail[email].ultimaVisita)) byEmail[email].ultimaVisita = f;
    });
    return Object.values(byEmail).map(u => ({ ...u, puntos: Math.round(u.gastoTotal) }));
  }

  function tierFromPoints(pts){
    if (pts >= 5000) return 'diamante';
    if (pts >= 2000) return 'oro';
    if (pts >= 500)  return 'plata';
    return 'bronce';
  }
  function daysSince(iso){
    if (!iso) return 999;
    const d = new Date(iso);
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }
  function initials(name){
    return String(name||'?').split(' ').filter(Boolean).slice(0,2).map(s => s[0].toUpperCase()).join('') || '?';
  }

  /* ─── Filtros ─── */
  function applyFilters(users){
    const activeCentro = (typeof window.getActiveCentro === 'function' ? window.getActiveCentro() : null) || '';
    return users.filter(u => {
      const tier = tierFromPoints(u.puntos||0);
      if (STATE.tier !== 'all' && tier !== STATE.tier) return false;
      const s = u.gastoTotal || 0;
      if (STATE.spent === 'high'   && s < 2000) return false;
      if (STATE.spent === 'medium' && (s < 500 || s >= 2000)) return false;
      if (STATE.spent === 'low'    && (s < 200 || s >= 500)) return false;
      const d = daysSince(u.ultimaVisita);
      if (STATE.days === 'active'  && d > 30) return false;
      if (STATE.days === 'cold'    && (d < 60 || d > 120)) return false;
      if (STATE.days === 'frozen'  && d < 120) return false;
      /* Si hay centro activo (no superadmin viendo todos), filtrar por centro */
      if (activeCentro && u.centro && u.centro !== activeCentro) return false;
      if (STATE.search) {
        const hay = ((u.nombre||'') + ' ' + (u.email||'') + ' ' + (u.telefono||'')).toLowerCase();
        if (!hay.includes(STATE.search.toLowerCase())) return false;
      }
      return true;
    });
  }

  /* ─── Render ─── */
  function renderKPIs(users){
    const total = users.length;
    const counts = { bronce:0, plata:0, oro:0, diamante:0 };
    let spent = 0;
    users.forEach(u => { counts[tierFromPoints(u.puntos||0)]++; spent += u.gastoTotal||0; });
    return `
      <div class="vip-kpis">
        <div class="vip-kpi"><div class="vip-kpi-lbl">Total VIPs</div><div class="vip-kpi-val">${total}</div><div class="vip-kpi-sub">activos en programa</div></div>
        <div class="vip-kpi"><div class="vip-kpi-lbl">Oro + Diamante</div><div class="vip-kpi-val gold">${counts.oro + counts.diamante}</div><div class="vip-kpi-sub">${counts.oro} oro · ${counts.diamante} diamante</div></div>
        <div class="vip-kpi"><div class="vip-kpi-lbl">Gasto total VIP</div><div class="vip-kpi-val">${spent.toLocaleString('es-ES',{maximumFractionDigits:0})} €</div><div class="vip-kpi-sub">acumulado de por vida</div></div>
        <div class="vip-kpi"><div class="vip-kpi-lbl">Promedio por VIP</div><div class="vip-kpi-val">${total?Math.round(spent/total):0} €</div><div class="vip-kpi-sub">LTV promedio</div></div>
      </div>
    `;
  }

  function renderToolbar(){
    return `
      <div class="vip-toolbar">
        <div class="vip-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="vipSearch" placeholder="Buscar por nombre, email o teléfono…" value="${(STATE.search||'').replace(/"/g,'&quot;')}">
        </div>
        <div class="vip-filter-group">
          <button class="vip-filter ${STATE.tier==='all'?'active':''}" data-filter="tier" data-value="all">Todos</button>
          <button class="vip-filter ${STATE.tier==='bronce'?'active':''}" data-filter="tier" data-value="bronce">Bronce</button>
          <button class="vip-filter ${STATE.tier==='plata'?'active':''}" data-filter="tier" data-value="plata">Plata</button>
          <button class="vip-filter ${STATE.tier==='oro'?'active':''}" data-filter="tier" data-value="oro">Oro</button>
          <button class="vip-filter ${STATE.tier==='diamante'?'active':''}" data-filter="tier" data-value="diamante">Diamante</button>
        </div>
        <div class="vip-filter-group">
          <button class="vip-filter ${STATE.spent==='all'?'active':''}" data-filter="spent" data-value="all">Gasto</button>
          <button class="vip-filter ${STATE.spent==='low'?'active':''}" data-filter="spent" data-value="low">200€+</button>
          <button class="vip-filter ${STATE.spent==='medium'?'active':''}" data-filter="spent" data-value="medium">500€+</button>
          <button class="vip-filter ${STATE.spent==='high'?'active':''}" data-filter="spent" data-value="high">2.000€+</button>
        </div>
        <div class="vip-filter-group">
          <button class="vip-filter ${STATE.days==='all'?'active':''}" data-filter="days" data-value="all">Actividad</button>
          <button class="vip-filter ${STATE.days==='active'?'active':''}" data-filter="days" data-value="active">Activo</button>
          <button class="vip-filter ${STATE.days==='cold'?'active':''}" data-filter="days" data-value="cold">Tibio</button>
          <button class="vip-filter ${STATE.days==='frozen'?'active':''}" data-filter="days" data-value="frozen">Frío</button>
        </div>
      </div>
    `;
  }

  function renderRow(u){
    const tier = tierFromPoints(u.puntos||0);
    const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
    const d = daysSince(u.ultimaVisita);
    const dCls = d > 120 ? 'frozen' : (d > 60 ? 'cold' : '');
    const dStr = d > 999 ? '—' : (d === 0 ? 'Hoy' : (d === 1 ? 'Ayer' : `${d} días`));
    const tel = (u.telefono||'').replace(/[^0-9+]/g,'');
    const waLink = tel ? `https://wa.me/${tel.replace(/^\+/,'')}` : '#';
    return `
      <div class="vip-row" data-email="${u.email||''}">
        <div class="vip-avatar ${tier}">${initials(u.nombre)}</div>
        <div>
          <div class="vip-name">${u.nombre||'Sin nombre'}</div>
          <div class="vip-name-sub">${u.email||''}${u.telefono?' · '+u.telefono:''}</div>
        </div>
        <div class="vip-tier"><span class="vip-tier-dot ${tier}"></span>${tierName}</div>
        <div class="vip-points">${(u.puntos||0).toLocaleString('es-ES')} pts</div>
        <div class="vip-spent">${(u.gastoTotal||0).toFixed(0)} €</div>
        <div class="vip-days ${dCls}">${dStr}</div>
        <div class="vip-actions">
          <a class="vip-action wa" href="${waLink}" target="_blank" title="WhatsApp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </a>
          <button class="vip-action discount" data-action="discount" title="Ofrecer descuento">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
          </button>
          <button class="vip-action" data-action="email" title="Copiar email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  function renderTable(users){
    if (!users.length) {
      return `<div class="vip-table"><div class="vip-empty">No hay clientes VIP que coincidan con los filtros.</div></div>`;
    }
    return `
      <div class="vip-table">
        <div class="vip-row head">
          <div></div>
          <div>Cliente</div>
          <div>Nivel</div>
          <div>Puntos</div>
          <div>Gasto total</div>
          <div>Última visita</div>
          <div>Acciones</div>
        </div>
        ${users.map(renderRow).join('')}
      </div>
    `;
  }

  function render(){
    const page = document.getElementById('page-clients-vip');
    if (!page) return;
    const users = getVipUsers();
    const filtered = applyFilters(users);
    page.innerHTML = `
      <div class="vip-head">
        <div class="vip-head-sub">Base de datos completa con filtros · ofertas especiales · seguimiento de churn</div>
      </div>
      ${renderKPIs(users)}
      ${renderToolbar()}
      ${renderTable(filtered)}
    `;
    wireEvents();
  }

  function wireEvents(){
    const page = document.getElementById('page-clients-vip');
    if (!page) return;

    const searchInput = page.querySelector('#vipSearch');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        STATE.search = e.target.value;
        const sel = e.target.selectionStart;
        render();
        const i = document.getElementById('vipSearch');
        if (i) { i.focus(); i.setSelectionRange(sel, sel); }
      });
    }

    page.querySelectorAll('.vip-filter[data-filter]').forEach(btn => btn.addEventListener('click', () => {
      STATE[btn.dataset.filter] = btn.dataset.value;
      render();
    }));

    page.querySelectorAll('.vip-action[data-action]').forEach(btn => btn.addEventListener('click', e => {
      const row = e.currentTarget.closest('.vip-row');
      const email = row?.dataset.email || '';
      const action = btn.dataset.action;
      if (action === 'email' && email) {
        navigator.clipboard?.writeText(email);
        btn.style.color = '#30D158';
        setTimeout(() => btn.style.color = '', 1200);
      }
      if (action === 'discount' && email) {
        const desc = prompt('Descuento personalizado para ' + email + ' (€):', '10');
        if (desc) alert('Cupón de ' + desc + '€ generado para ' + email + ' (se enviará por email)');
      }
    }));
  }

  /* ─── Inyectar item en sidebar + crear página ─── */
  function inject(){
    /* Buscar sidebar items */
    const clientsBtn = document.querySelector('.sb-item[data-page="clients"]');
    if (!clientsBtn) return false;

    /* 1. Sidebar: nuevo item después de Conocé tu cliente */
    if (!document.querySelector('.sb-item[data-page="clients-vip"]')) {
      const item = document.createElement('button');
      item.className = 'sb-item';
      item.setAttribute('data-page', 'clients-vip');
      item.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L14.39 8.26 21 9.27 16.18 13.97 17.45 20.5 12 17.27 6.55 20.5 7.82 13.97 3 9.27 9.61 8.26 12 2 z"/></svg>
        Clientes VIP
      `;
      clientsBtn.parentNode.insertBefore(item, clientsBtn.nextSibling);
      /* Wire al sistema navTo del admin */
      item.addEventListener('click', () => {
        if (typeof window.navTo === 'function') window.navTo('clients-vip');
        else {
          /* fallback · simular navegación */
          document.querySelectorAll('.sb-item').forEach(b => b.classList.toggle('active', b === item));
          document.querySelectorAll('.page').forEach(p => p.classList.toggle('show', p.id === 'page-clients-vip'));
          const t = document.getElementById('pageTitle');
          if (t) t.textContent = 'Clientes VIP';
        }
      });
    }

    /* 2. Crear página si no existe */
    if (!document.getElementById('page-clients-vip')) {
      const page = document.createElement('section');
      page.className = 'page';
      page.id = 'page-clients-vip';
      const refPage = document.querySelector('#page-clients') || document.querySelector('.page');
      if (refPage && refPage.parentNode) refPage.parentNode.insertBefore(page, refPage.nextSibling);
      else document.body.appendChild(page);
    }

    /* 3. Sumar al diccionario de títulos */
    try {
      if (window.titles && !window.titles['clients-vip']) window.titles['clients-vip'] = 'Clientes VIP';
    } catch(e){}

    /* 4. Render inicial */
    render();

    /* 5. Re-render cuando se navega a esta página o cambian datos */
    window.addEventListener('hashchange', () => { if (location.hash === '#clients-vip') render(); });
    window.addEventListener('vipUsersUpdated', render);
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

  /* Helper público */
  window.refreshClientesVIP = render;
})();
