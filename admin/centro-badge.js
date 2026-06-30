/* ══════════════════════════════════════════════════════════════════
   CENTRO BADGE · Indicador del centro activo en el topbar del admin
   ─────────────────────────────────────────────────────────────────
   El dueño superadmin ve un selector clickable con todos los centros.
   Los encargados ven un chip de solo lectura con su centro asignado.

   Uso: incluir <script src="centro-badge.js"></script> en index-pro.html
   Lee CURRENT_USER (que ya carga el admin pro) para saber si es super/encargado.
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_CENTRO_BADGE__) return;
  window.__ALVATO_CENTRO_BADGE__ = true;

  /* ─── Estilos coherentes con admin pro (light · SF Pro · accent #DC2626) ─── */
  const style = document.createElement('style');
  style.textContent = `
    .centro-badge{
      display:inline-flex;align-items:center;gap:10px;
      background:#FFFFFF;border:1px solid rgba(0,0,0,.08);
      padding:8px 14px 8px 12px;border-radius:99px;
      font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter',sans-serif;
      font-size:13px;color:#1D1D1F;letter-spacing:-.2px;
      box-shadow:0 1px 2px rgba(0,0,0,.04),0 1px 3px rgba(0,0,0,.06);
      transition:border-color .15s,box-shadow .15s;
      cursor:pointer;
    }
    .centro-badge.locked{cursor:default}
    .centro-badge:hover:not(.locked){border-color:rgba(0,0,0,.16);box-shadow:0 4px 12px rgba(0,0,0,.08)}
    .centro-badge-dot{
      width:8px;height:8px;border-radius:50%;background:#30D158;
      box-shadow:0 0 0 3px rgba(48,209,88,.18);flex-shrink:0;
    }
    .centro-badge-lbl{
      font-size:9.5px;font-weight:700;letter-spacing:1.2px;
      text-transform:uppercase;color:#86868B;line-height:1;
    }
    .centro-badge-name{
      font-weight:600;font-size:14px;color:#1D1D1F;letter-spacing:-.3px;line-height:1.1;
    }
    .centro-badge-arrow{
      width:13px;height:13px;color:#86868B;margin-left:2px;flex-shrink:0;
      transition:transform .2s;
    }
    .centro-badge.open .centro-badge-arrow{transform:rotate(180deg)}
    .centro-badge.locked .centro-badge-arrow{display:none}
    .centro-badge-content{display:flex;flex-direction:column;gap:1px}

    /* Dropdown */
    .centro-badge-menu{
      position:fixed;background:#FFFFFF;border:1px solid rgba(0,0,0,.08);
      border-radius:14px;padding:6px;z-index:200;min-width:240px;
      box-shadow:0 24px 60px rgba(0,0,0,.18),0 4px 12px rgba(0,0,0,.06);
      max-height:420px;overflow-y:auto;
      opacity:0;transform:translateY(-6px);pointer-events:none;
      transition:opacity .18s,transform .18s;
    }
    .centro-badge-menu.show{opacity:1;transform:translateY(0);pointer-events:auto}
    .centro-badge-menu-head{
      font-size:10.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;
      color:#86868B;padding:8px 12px 6px;
    }
    .centro-badge-menu-item{
      display:flex;align-items:center;gap:10px;
      padding:9px 12px;border-radius:9px;
      font-size:13.5px;color:#1D1D1F;cursor:pointer;
      transition:background .12s;
    }
    .centro-badge-menu-item:hover{background:rgba(0,0,0,.04)}
    .centro-badge-menu-item.active{background:rgba(220,38,38,.08);color:#991B1B}
    .centro-badge-menu-item.active .centro-badge-menu-item-check{display:flex}
    .centro-badge-menu-item-city{
      font-size:11px;font-weight:600;letter-spacing:.3px;color:#86868B;
      margin-right:auto;text-transform:uppercase;
    }
    .centro-badge-menu-item.active .centro-badge-menu-item-city{color:#DC2626}
    .centro-badge-menu-item-name{font-weight:500;letter-spacing:-.15px;flex:1}
    .centro-badge-menu-item-check{
      display:none;width:16px;height:16px;border-radius:50%;background:#DC2626;color:#fff;
      align-items:center;justify-content:center;flex-shrink:0;
    }
    .centro-badge-menu-item-check svg{width:9px;height:9px;stroke-width:3}
    .centro-badge-menu-divider{height:1px;background:rgba(0,0,0,.05);margin:4px 0}
    .centro-badge-menu-all{
      padding:9px 12px;border-radius:9px;font-size:13.5px;font-weight:600;
      color:#0A84FF;cursor:pointer;display:flex;align-items:center;gap:10px;
      transition:background .12s;
    }
    .centro-badge-menu-all:hover{background:rgba(10,132,255,.08)}
    .centro-badge-menu-all svg{width:14px;height:14px;stroke-width:2.4}
  `;
  document.head.appendChild(style);

  /* ─── Estado ─── */
  function getActiveCentro(){
    try { return localStorage.getItem('alvato_centro_activo') || null; } catch(e){ return null; }
  }
  function setActiveCentro(id){
    try { localStorage.setItem('alvato_centro_activo', id || ''); } catch(e){}
    /* Disparar evento para que el resto del admin sepa */
    window.dispatchEvent(new CustomEvent('centroChange', { detail: { centro: id } }));
  }

  function getUser(){
    /* CURRENT_USER es la variable global que setea el admin pro tras login */
    return window.CURRENT_USER || null;
  }
  function getCentros(){
    return (window.CONFIG && window.CONFIG.centros) || [];
  }

  /* ─── Render del badge ─── */
  function buildBadge(){
    const user = getUser();
    const centros = getCentros();
    if (!user || !centros.length) return null;

    const isSuper = user.rol === 'superadmin' || user.centro === '*';
    const activeId = isSuper ? (getActiveCentro() || 'all') : user.centro;
    const activeCentro = activeId === 'all' ? null : centros.find(c => c.id === activeId);

    const wrap = document.createElement('div');
    wrap.className = 'centro-badge' + (isSuper ? '' : ' locked');
    wrap.id = 'centroBadge';
    wrap.innerHTML = `
      <span class="centro-badge-dot"></span>
      <span class="centro-badge-content">
        <span class="centro-badge-lbl">${isSuper ? 'Viendo' : 'Tu centro'}</span>
        <span class="centro-badge-name" id="centroBadgeName">${
          activeCentro ? activeCentro.ciudad : (isSuper ? 'Todos los centros' : 'Centro')
        }</span>
      </span>
      ${isSuper ? `<svg class="centro-badge-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>` : ''}
    `;

    if (isSuper) {
      wrap.addEventListener('click', toggleMenu);
    }
    return wrap;
  }

  /* ─── Dropdown menu ─── */
  function buildMenu(){
    const menu = document.createElement('div');
    menu.className = 'centro-badge-menu';
    menu.id = 'centroBadgeMenu';
    return menu;
  }
  function renderMenu(){
    const menu = document.getElementById('centroBadgeMenu');
    if (!menu) return;
    const centros = getCentros();
    const activeId = getActiveCentro() || 'all';

    menu.innerHTML = `
      <div class="centro-badge-menu-head">Centros</div>
      <div class="centro-badge-menu-all" data-id="all">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>Ver todos los centros (consolidado)</span>
      </div>
      <div class="centro-badge-menu-divider"></div>
      ${centros.map(c => `
        <div class="centro-badge-menu-item ${activeId===c.id?'active':''}" data-id="${c.id}">
          <span class="centro-badge-menu-item-city">${c.ciudad}</span>
          <span class="centro-badge-menu-item-name">${c.nombre.replace('Alvato ','')}</span>
          <span class="centro-badge-menu-item-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
        </div>
      `).join('')}
    `;
    menu.querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', e => {
      e.stopPropagation();
      const id = el.dataset.id;
      setActiveCentro(id === 'all' ? '' : id);
      const badge = document.getElementById('centroBadge');
      const nameEl = document.getElementById('centroBadgeName');
      const centro = id === 'all' ? null : (getCentros().find(c => c.id === id));
      nameEl.textContent = centro ? centro.ciudad : 'Todos los centros';
      closeMenu();
    }));
  }
  function positionMenu(){
    const badge = document.getElementById('centroBadge');
    const menu = document.getElementById('centroBadgeMenu');
    if (!badge || !menu) return;
    const r = badge.getBoundingClientRect();
    menu.style.top = (r.bottom + 6) + 'px';
    menu.style.left = r.left + 'px';
  }
  function openMenu(){
    const menu = document.getElementById('centroBadgeMenu');
    const badge = document.getElementById('centroBadge');
    if (!menu || !badge) return;
    renderMenu();
    positionMenu();
    menu.classList.add('show');
    badge.classList.add('open');
    setTimeout(() => document.addEventListener('click', onOutside), 0);
  }
  function closeMenu(){
    const menu = document.getElementById('centroBadgeMenu');
    const badge = document.getElementById('centroBadge');
    if (menu) menu.classList.remove('show');
    if (badge) badge.classList.remove('open');
    document.removeEventListener('click', onOutside);
  }
  function onOutside(e){
    if (!e.target.closest('#centroBadge') && !e.target.closest('#centroBadgeMenu')) closeMenu();
  }
  function toggleMenu(){
    const menu = document.getElementById('centroBadgeMenu');
    if (menu && menu.classList.contains('show')) closeMenu();
    else openMenu();
  }

  /* ─── Insertar en topbar ─── */
  function inject(){
    if (document.getElementById('centroBadge')) return true;
    const badge = buildBadge();
    if (!badge) return false;
    const menu = buildMenu();

    /* Buscar el topbar del admin · varios selectores posibles */
    const candidates = ['.topbar','.app-topbar','.header-bar','header','.app-header','#topbar'];
    let topbar = null;
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) { topbar = el; break; }
    }
    if (!topbar) {
      /* Fallback: lo metemos como floating arriba a la derecha */
      badge.style.position = 'fixed';
      badge.style.top = '14px';
      badge.style.right = '24px';
      badge.style.zIndex = '60';
      document.body.appendChild(badge);
    } else {
      /* Prioridad 1: insertarlo en .tb-actions (área derecha del topbar del admin pro) */
      const tbActions = topbar.querySelector('.tb-actions');
      if (tbActions) {
        /* Lo insertamos como primer elemento dentro de las acciones, antes de search/refresh */
        tbActions.insertBefore(badge, tbActions.firstChild);
      } else {
        /* Prioridad 2: después del título o brand si existen */
        const anchor = topbar.querySelector('.tb-title, h1, .brand, .sb-brand, .logo, .app-brand');
        if (anchor && anchor.parentNode) {
          anchor.parentNode.insertBefore(badge, anchor.nextSibling);
        } else {
          /* Fallback final: al final del topbar */
          topbar.appendChild(badge);
        }
      }
    }
    document.body.appendChild(menu);
    window.addEventListener('resize', positionMenu);
    return true;
  }

  let attempts = 0;
  function retry(){
    attempts++;
    if (inject() || attempts > 25) return;
    setTimeout(retry, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else retry();

  /* Helper público para el resto del admin */
  window.getActiveCentro = getActiveCentro;
})();
