/* ══════════════════════════════════════════════════════════════════
   ALVATOWASH · DASHBOARD TILES (drop-in)
   ─────────────────────────────────────────────────────────────────
   Inyecta 4 tiles en el dashboard del área cliente sin tocar el HTML.
   Estilo Apple sobrio · sin emojis · SVG monocromos.
   ══════════════════════════════════════════════════════════════════ */

(function() {
  if (window.__ALVATO_TILES_LOADED__) return;
  window.__ALVATO_TILES_LOADED__ = true;

  const style = document.createElement('style');
  style.textContent = `
    .at-tiles{
      max-width:980px;margin:24px auto;padding:0 16px;
      font-family:'Inter',-apple-system,system-ui,sans-serif;letter-spacing:-.005em;
    }
    .at-tiles-h{
      font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;
      color:#A1A1A8;margin-bottom:14px;padding-left:4px;
    }
    .at-tiles-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    @media(max-width:760px){.at-tiles-grid{grid-template-columns:repeat(2,1fr)}}
    .at-tile{
      background:#16161A;border:1px solid rgba(255,255,255,.06);border-radius:16px;
      padding:22px 20px;display:flex;flex-direction:column;gap:14px;
      cursor:pointer;text-decoration:none;color:#F5F5F7;
      transition:transform .25s cubic-bezier(.32,.72,0,1),border-color .25s,background .25s;
      position:relative;overflow:hidden;min-height:160px;
    }
    .at-tile:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.14);background:#1E1E23}
    .at-tile-accent{background:#16161A;border-color:rgba(229,62,62,.35)}
    .at-tile-accent:hover{background:rgba(229,62,62,.06);border-color:#E53E3E}
    .at-tile-gold{background:#16161A;border-color:rgba(201,182,121,.22)}
    .at-tile-gold:hover{background:rgba(201,182,121,.04);border-color:rgba(201,182,121,.5)}

    .at-tile-icon{
      width:32px;height:32px;border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(255,255,255,.04);
      color:#A1A1A8;
    }
    .at-tile-icon svg{width:16px;height:16px;stroke-width:1.6}
    .at-tile-accent .at-tile-icon{background:rgba(229,62,62,.1);color:#FF6363}
    .at-tile-gold .at-tile-icon{background:rgba(201,182,121,.08);color:#D9C892}

    .at-tile-body{flex:1;display:flex;flex-direction:column;gap:4px}
    .at-tile-name{
      font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-weight:400;
      font-size:23px;line-height:1.1;letter-spacing:-.015em;color:#F5F5F7;
    }
    .at-tile-desc{font-size:12.5px;color:#A1A1A8;line-height:1.45;font-weight:400}

    .at-tile-arrow{
      position:absolute;top:20px;right:20px;
      width:18px;height:18px;color:#6B6B72;
      transition:transform .2s,color .2s;
    }
    .at-tile-arrow svg{width:100%;height:100%;stroke-width:1.8}
    .at-tile:hover .at-tile-arrow{transform:translate(2px,-2px);color:#F5F5F7}

    .at-tile-badge{
      position:absolute;top:18px;right:48px;
      font-size:9.5px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;
      background:rgba(201,182,121,.12);color:#D9C892;
      padding:3px 8px;border-radius:99px;border:1px solid rgba(201,182,121,.22);
    }
  `;
  document.head.appendChild(style);

  function buildTiles() {
    const wrap = document.createElement('div');
    wrap.className = 'at-tiles';
    wrap.id = 'atTiles';
    wrap.innerHTML = `
      <div class="at-tiles-h">Atajos rápidos</div>
      <div class="at-tiles-grid">

        <a href="../reserva/?express=1" class="at-tile at-tile-accent">
          <div class="at-tile-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
          <div class="at-tile-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div class="at-tile-body">
            <div class="at-tile-name">Reservar express</div>
            <div class="at-tile-desc">En 30 segundos · sin volver a pedir tus datos.</div>
          </div>
        </a>

        <a href="master.html" class="at-tile at-tile-gold">
          <div class="at-tile-badge">Nuevo</div>
          <div class="at-tile-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
          <div class="at-tile-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </div>
          <div class="at-tile-body">
            <div class="at-tile-name">El Master del Brillo</div>
            <div class="at-tile-desc">Siete niveles para convertirte en experto.</div>
          </div>
        </a>

        <a href="puntos.html" class="at-tile">
          <div class="at-tile-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
          <div class="at-tile-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
          </div>
          <div class="at-tile-body">
            <div class="at-tile-name">Cómo ganar puntos</div>
            <div class="at-tile-desc">Tabla completa · sin letra chica.</div>
          </div>
        </a>

        <a href="invitar.html" class="at-tile">
          <div class="at-tile-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
          <div class="at-tile-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="at-tile-body">
            <div class="at-tile-name">Invitar un amigo</div>
            <div class="at-tile-desc">350 puntos para vos · 100 para tu amigo.</div>
          </div>
        </a>

      </div>
    `;
    return wrap;
  }

  function tryInject() {
    if (document.getElementById('atTiles')) return true;
    const authSelectors = ['#authScreen','.auth-screen','[data-screen="auth"]'];
    for (const sel of authSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return false;
    }
    const dashSelectors = ['#dashboard','.dashboard','[data-screen="dashboard"]','main','.main','.app','.app-content','.vip-card','.vip-hero','.greeting'];
    let target = null;
    for (const sel of dashSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) { target = el; break; }
    }
    if (!target) target = document.body;
    const tiles = buildTiles();
    if (target === document.body) target.insertBefore(tiles, target.firstChild);
    else target.parentNode.insertBefore(tiles, target.nextSibling);
    return true;
  }

  let attempts = 0;
  function retry() {
    attempts++;
    if (tryInject() || attempts > 20) return;
    setTimeout(retry, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else retry();

  const observer = new MutationObserver(() => { if (!document.getElementById('atTiles')) tryInject(); });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
})();
