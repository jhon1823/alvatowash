/* ══════════════════════════════════════════════════════════════════
   CENTROS · Configuración por sucursal (solo superadmin)
   ─────────────────────────────────────────────────────────────────
   Lista de los 19 centros con su WhatsApp, email, dirección, horario.
   El dueño edita y se guarda en localStorage (cuando el backend tenga
   el endpoint `updateCentro`, se persistirá en el sheet Cuentas).

   Lo crítico: WhatsApp distinto por centro → los leads de cada
   ciudad caen en el número correcto.
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_CENTROS_CONFIG__) return;
  window.__ALVATO_CENTROS_CONFIG__ = true;

  const STYLE = `
    #page-centros-config{padding:24px;max-width:1280px;margin:0 auto}
    .cc-head-sub{font-size:13.5px;color:#86868B;margin-bottom:18px}

    .cc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
    .cc-card{
      background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:14px;padding:18px 20px;
      box-shadow:0 1px 2px rgba(0,0,0,.04);cursor:pointer;
      transition:transform .15s,border-color .15s,box-shadow .15s;
    }
    .cc-card:hover{transform:translateY(-2px);border-color:rgba(0,0,0,.12);box-shadow:0 6px 16px rgba(0,0,0,.06)}
    .cc-card-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}
    .cc-avatar{
      width:42px;height:42px;border-radius:12px;flex-shrink:0;
      background:linear-gradient(135deg,#DC2626,#991B1B);color:#fff;
      font-weight:700;font-size:14px;letter-spacing:-.3px;
      display:flex;align-items:center;justify-content:center;
    }
    .cc-name{font-size:15px;font-weight:700;color:#1D1D1F;letter-spacing:-.3px;line-height:1.2}
    .cc-city{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#DC2626;margin-top:2px}
    .cc-fields{display:flex;flex-direction:column;gap:6px;font-size:12.5px}
    .cc-field{display:flex;gap:8px;align-items:center;color:#424245}
    .cc-field svg{width:13px;height:13px;color:#86868B;stroke-width:2;flex-shrink:0}
    .cc-field-val{font-weight:500;color:#1D1D1F;font-family:ui-monospace,SF Mono,monospace}
    .cc-field-val.missing{color:#FF453A}

    .cc-edit-icon{width:14px;height:14px;color:#86868B;flex-shrink:0;margin-left:auto}

    /* Modal */
    .cc-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:none;align-items:flex-start;justify-content:center;padding:50px 20px 20px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);overflow-y:auto}
    .cc-modal.show{display:flex}
    .cc-modal-box{background:#fff;border-radius:18px;width:100%;max-width:520px;box-shadow:0 24px 60px rgba(0,0,0,.18);padding:26px 24px}
    .cc-modal-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:12px}
    .cc-modal-head h3{font-size:18px;font-weight:700;letter-spacing:-.4px;line-height:1.2}
    .cc-modal-head-sub{font-size:12px;color:#86868B;margin-top:3px;font-weight:600;letter-spacing:1px;text-transform:uppercase}
    .cc-modal-close{width:28px;height:28px;border-radius:50%;background:#F5F5F7;color:#86868B;display:inline-flex;align-items:center;justify-content:center;transition:background .15s,color .15s;flex-shrink:0}
    .cc-modal-close:hover{background:rgba(0,0,0,.08);color:#1D1D1F}
    .cc-modal-close svg{width:13px;height:13px;stroke-width:2.4}
    .cc-modal-field{margin-bottom:14px}
    .cc-modal-label{display:block;font-size:11.5px;font-weight:600;color:#424245;margin-bottom:6px;letter-spacing:-.15px}
    .cc-modal-input{width:100%;padding:11px 14px;background:#FAFAFA;border:1px solid rgba(0,0,0,.08);border-radius:10px;outline:none;font-family:inherit;font-size:14px;color:#1D1D1F;transition:border-color .15s,background .15s}
    .cc-modal-input:focus{border-color:#DC2626;background:#fff}
    .cc-modal-help{font-size:11.5px;color:#86868B;margin-top:6px;line-height:1.4}
    .cc-modal-cta{display:flex;gap:8px;margin-top:18px}
    .cc-modal-btn-primary{flex:1;padding:12px;background:#DC2626;color:#fff;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:-.2px;transition:background .15s,transform .1s}
    .cc-modal-btn-primary:hover{background:#991B1B}
    .cc-modal-btn-ghost{padding:12px 18px;background:#F5F5F7;color:#1D1D1F;border-radius:10px;font-weight:600;font-size:14px}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  function getOverrides(){
    try { return JSON.parse(localStorage.getItem('alvato_centros_override')||'{}'); } catch(e){ return {}; }
  }
  function setOverride(id, fields){
    const o = getOverrides();
    o[id] = Object.assign(o[id]||{}, fields);
    localStorage.setItem('alvato_centros_override', JSON.stringify(o));
    /* Aplicar a CONFIG.centros en vivo */
    const c = (window.CONFIG?.centros||[]).find(x => x.id === id);
    if (c) Object.assign(c, fields);
  }
  function loadOverridesIntoConfig(){
    const overrides = getOverrides();
    (window.CONFIG?.centros||[]).forEach(c => {
      if (overrides[c.id]) Object.assign(c, overrides[c.id]);
    });
  }

  function initials(name){
    return String(name||'?').replace('Alvato ','').split(' ').filter(Boolean).slice(0,2).map(s => s[0].toUpperCase()).join('') || '?';
  }
  function maskPhone(p){
    if (!p) return '';
    return String(p).replace(/(\d{2})(\d{3})(\d{3})(\d{3})/,'+$1 $2 $3 $4');
  }

  function renderCard(c){
    const waOk = c.whatsapp && !/00000000/.test(c.whatsapp);
    const emailOk = c.email && c.email.includes('@');
    return `
      <div class="cc-card" data-id="${c.id}">
        <div class="cc-card-head">
          <div class="cc-avatar">${initials(c.nombre)}</div>
          <div style="flex:1">
            <div class="cc-name">${c.nombre}</div>
            <div class="cc-city">${c.ciudad}</div>
          </div>
          <svg class="cc-edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
        <div class="cc-fields">
          <div class="cc-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span class="cc-field-val ${waOk?'':'missing'}">${c.whatsapp ? maskPhone(c.whatsapp) : 'Sin WhatsApp'}</span>
          </div>
          <div class="cc-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span class="cc-field-val ${emailOk?'':'missing'}">${c.email || 'Sin email'}</span>
          </div>
          <div class="cc-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span class="cc-field-val" style="font-family:inherit;font-weight:400">${c.direccion || '—'}</span>
          </div>
        </div>
      </div>
    `;
  }

  function render(){
    const page = document.getElementById('page-centros-config');
    if (!page) return;
    const centros = (window.CONFIG?.centros||[]);
    page.innerHTML = `
      <div class="cc-head-sub">19 centros · cada uno con su WhatsApp y email propios para que los leads de cada ciudad lleguen al lugar correcto. Click en cualquiera para editarlo.</div>
      <div class="cc-grid">${centros.map(renderCard).join('')}</div>
    `;
    page.querySelectorAll('.cc-card').forEach(card => card.addEventListener('click', () => openModal(card.dataset.id)));
  }

  /* ─── Modal de edición ─── */
  function openModal(id){
    const c = (window.CONFIG?.centros||[]).find(x => x.id === id);
    if (!c) return;
    const modal = document.getElementById('ccModal');
    modal.innerHTML = `
      <div class="cc-modal-box">
        <div class="cc-modal-head">
          <div>
            <h3>${c.nombre}</h3>
            <div class="cc-modal-head-sub">${c.ciudad} · ID ${c.id}</div>
          </div>
          <button class="cc-modal-close" onclick="document.getElementById('ccModal').classList.remove('show')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="cc-modal-field">
          <label class="cc-modal-label">WhatsApp (donde llegan los leads de esta ciudad)</label>
          <input class="cc-modal-input" id="ccWA" type="text" placeholder="34600123456" value="${(c.whatsapp||'').replace(/"/g,'&quot;')}">
          <div class="cc-modal-help">Número con código de país sin "+" · Ej: 34611234567 (España) · 37612345678 (Andorra)</div>
        </div>

        <div class="cc-modal-field">
          <label class="cc-modal-label">Email del centro</label>
          <input class="cc-modal-input" id="ccEmail" type="email" placeholder="madrid@alvato.com" value="${(c.email||'').replace(/"/g,'&quot;')}">
        </div>

        <div class="cc-modal-field">
          <label class="cc-modal-label">Dirección</label>
          <input class="cc-modal-input" id="ccDir" type="text" value="${(c.direccion||'').replace(/"/g,'&quot;')}">
        </div>

        <div class="cc-modal-field">
          <label class="cc-modal-label">Horario</label>
          <input class="cc-modal-input" id="ccHorario" type="text" value="${(c.horario||'').replace(/"/g,'&quot;')}">
        </div>

        <div class="cc-modal-cta">
          <button class="cc-modal-btn-ghost" onclick="document.getElementById('ccModal').classList.remove('show')">Cancelar</button>
          <button class="cc-modal-btn-primary" onclick="window.saveCentroConfig('${id}')">Guardar cambios</button>
        </div>
      </div>
    `;
    modal.classList.add('show');
  }

  window.saveCentroConfig = function(id){
    setOverride(id, {
      whatsapp: document.getElementById('ccWA').value.trim(),
      email: document.getElementById('ccEmail').value.trim(),
      direccion: document.getElementById('ccDir').value.trim(),
      horario: document.getElementById('ccHorario').value.trim()
    });
    document.getElementById('ccModal').classList.remove('show');
    render();
  };

  /* ─── Inyectar overrides desde localStorage tan pronto como CONFIG esté cargado ─── */
  if (window.CONFIG) loadOverridesIntoConfig();
  else {
    const wait = setInterval(() => {
      if (window.CONFIG) { loadOverridesIntoConfig(); clearInterval(wait); }
    }, 200);
  }

  function inject(){
    if (!window.CURRENT_USER) return false; // todavía no hay login → reintentar
    const isSuper = window.CURRENT_USER.rol === 'superadmin' || window.CURRENT_USER.centro === '*';
    if (!isSuper) return true; // hay usuario pero no es dueño → no inyectar

    const refBtn = document.querySelector('.sb-item[data-page="team"]');
    if (!refBtn) return false;

    if (!document.querySelector('.sb-item[data-page="centros-config"]')) {
      const item = document.createElement('button');
      item.className = 'sb-item';
      item.setAttribute('data-page', 'centros-config');
      item.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Centros
      `;
      refBtn.parentNode.insertBefore(item, refBtn);
      item.addEventListener('click', () => {
        if (typeof window.navTo === 'function') window.navTo('centros-config');
        render();
      });
    }

    if (!document.getElementById('page-centros-config')) {
      const page = document.createElement('section');
      page.className = 'page';
      page.id = 'page-centros-config';
      const refPage = document.querySelector('#page-team') || document.querySelector('.page');
      if (refPage && refPage.parentNode) refPage.parentNode.insertBefore(page, refPage);
      else document.body.appendChild(page);
    }

    if (!document.getElementById('ccModal')) {
      const m = document.createElement('div');
      m.id = 'ccModal';
      m.className = 'cc-modal';
      document.body.appendChild(m);
    }

    try { if (window.titles && !window.titles['centros-config']) window.titles['centros-config'] = 'Centros'; } catch(e){}

    return true;
  }
  function retry(){ if (inject()) return; setTimeout(retry, 500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else retry();
  /* Si el usuario aún no estaba cargado, escuchar el evento de login */
  document.addEventListener('alvatoUserReady', () => { inject(); });

  window.refreshCentrosConfig = render;
})();
