/* ══════════════════════════════════════════════════════════════════
   SERVICIOS · Editor de catálogo
   ─────────────────────────────────────────────────────────────────
   Solo superadmin (dueña).
   La dueña puede editar nombre, descripción y precio de cada
   servicio del albarán. Hoy puede ser "Combo Verano" y mañana
   cambiarlo a "Combo Invierno" sin tocar código.
   Los cambios se guardan en localStorage 'alvato_servicios_editados'
   y los lee automáticamente empleados/albaran.html.
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_SVC_EDITOR__) return;
  window.__ALVATO_SVC_EDITOR__ = true;

  /* Catálogo por defecto (igual que en empleados/albaran.html) */
  const DEFAULT = {
    principal: [
      { id:'lim_int',  name:'Limpieza Interior',           desc:'Aspirado completo, limpieza de consola y salpicadero.', price:39.90 },
      { id:'lim_ext',  name:'Limpieza Exterior',           desc:'Limpieza de la carrocería, cristales y llantas.', price:39.90 },
      { id:'lim_pack', name:'Limpieza Interior + Exterior',desc:'El pack con 1€ de descuento por reserva online.', price:78.80, tag:'popular' },
      { id:'lim_tap',  name:'Limpieza Tapicería',          desc:'Limpieza profunda de tapicería. Máximo 5 asientos.', price:139.90 },
      { id:'lim_full', name:'Limpieza Integral',           desc:'El pack completo: Interior + Exterior + Tapicería.', price:212.70, tag:'premium' },
      { id:'abri_3d',  name:'Abrillantado 3D - Pulido',    desc:'Pulido profesional en 4 pasos.', price:289.90, tag:'premium' },
      { id:'lim_mot',  name:'Limpieza Motor',              desc:'Levantamos el capó y limpiamos el motor.', price:79.90 },
      { id:'nano',     name:'NanoDiamond - Escudo Invisible', desc:'Escudo cerámico de nanotecnología avanzada.', price:949.00, tag:'premium' },
      { id:'nano_glass',name:'Nano4Life CarGlass',         desc:'Protección invisible para cristales.', price:204.00, tag:'premium' }
    ],
    extras: [
      { id:'ex_pelo',  name:'Pelo de Mascota',             desc:'Eliminación completa con maquinaria especializada.', price:59.90 },
      { id:'ex_barro', name:'Coche con Barro',             desc:'Limpieza especial para barro incrustado.', price:59.90 },
      { id:'ex_alf',   name:'Alfombrillas del Coche',      desc:'Limpieza profunda. Máximo 5 unidades.', price:59.90 },
      { id:'ex_moq',   name:'Moqueta del Coche',           desc:'Limpieza profunda de toda la moqueta.', price:59.90 },
      { id:'ex_cera',  name:'Doble Cera Protectora',       desc:'Doble capa de cera para máxima protección.', price:59.90 },
      { id:'ex_brill', name:'Recuperador Brillo Rápido',   desc:'Brillo rápido estilo concesionario. 15 min.', price:59.90 },
      { id:'ex_pul3d', name:'Pulido Abrillantado 3D por Pieza', desc:'Pulido profesional por pieza para arañazos.', price:59.90 },
      { id:'ex_piel',  name:'Hidratación Asientos Piel',   desc:'Hidratación y acondicionamiento de piel.', price:59.90 },
      { id:'ex_ozono', name:'Desinfección con Ozono',      desc:'Elimina lo que no ves pero respiras.', price:49.90 },
      { id:'ex_aire',  name:'Higiene Aire - Air Purifyer', desc:'Renueva el ambiente del coche en minutos.', price:39.90 },
      { id:'ex_bebe',  name:'Silla Bebé / Cochecito',      desc:'Limpieza y desinfección.', price:24.90 },
      { id:'ex_faro1', name:'Pulido 1 Faro',               desc:'Pulido profesional de un faro.', price:34.90 },
      { id:'ex_faro2', name:'Pulido 2 Faros',              desc:'Pulido profesional de ambos faros.', price:64.90 },
      { id:'ex_resin', name:'Resina / Alquitrán',          desc:'Eliminación de resina, alquitrán, hollín.', price:59.90 },
      { id:'ex_graf',  name:'Eliminación de Graffiti',     desc:'Quitar graffiti sin dañar la pintura.', price:51.90 }
    ]
  };

  const STYLE = `
    #page-servicios-editor{padding:24px;max-width:1280px;margin:0 auto}
    .se-head{margin-bottom:18px}
    .se-head-sub{font-size:13.5px;color:#86868B}
    .se-tabs{display:inline-flex;gap:4px;background:#F5F5F7;border-radius:12px;padding:4px;margin-bottom:18px}
    .se-tab{padding:9px 16px;border-radius:9px;font-size:13.5px;font-weight:600;color:#86868B;cursor:pointer;transition:all .15s}
    .se-tab.active{background:#FFFFFF;color:#1D1D1F;box-shadow:0 1px 2px rgba(0,0,0,.06)}
    .se-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;flex-wrap:wrap}
    .se-btn-add{background:#DC2626;color:#fff;padding:10px 17px;border-radius:10px;font-weight:700;font-size:13px;letter-spacing:-.2px;display:inline-flex;align-items:center;gap:6px;transition:background .15s}
    .se-btn-add:hover{background:#991B1B}
    .se-btn-add svg{width:14px;height:14px;stroke-width:2.4}
    .se-btn-reset{background:#F5F5F7;color:#424245;padding:10px 16px;border-radius:10px;font-weight:600;font-size:12.5px}
    .se-btn-reset:hover{background:#EBEBED}

    .se-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
    .se-card{background:#FFFFFF;border:.5px solid rgba(0,0,0,.06);border-radius:14px;padding:16px;box-shadow:0 0 0 .5px rgba(0,0,0,.05),0 1px 2px rgba(0,0,0,.04);position:relative}
    .se-card.popular{border:1.5px solid #34C759;background:linear-gradient(180deg,rgba(52,199,89,.04),transparent 60%)}
    .se-card.premium{border:1.5px solid #C9B679;background:linear-gradient(180deg,rgba(201,182,121,.08),transparent 60%)}
    .se-card-tag{position:absolute;top:-10px;left:14px;font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;padding:3px 9px;border-radius:99px}
    .se-card-tag.popular{background:#34C759;color:#fff}
    .se-card-tag.premium{background:#C9B679;color:#fff}

    .se-card-actions{position:absolute;top:12px;right:12px;display:flex;gap:6px}
    .se-card-actions button{width:26px;height:26px;border-radius:50%;background:#F5F5F7;display:flex;align-items:center;justify-content:center;transition:background .15s}
    .se-card-actions button:hover{background:#EBEBED}
    .se-card-actions button.danger:hover{background:#FFE4E4}
    .se-card-actions svg{width:12px;height:12px;color:#1D1D1F;stroke-width:2.2}
    .se-card-actions button.danger svg{color:#FF453A}

    .se-card-name{font-size:14.5px;font-weight:700;letter-spacing:-.3px;line-height:1.3;color:#1D1D1F;margin-bottom:5px;padding-right:80px}
    .se-card-desc{font-size:12.5px;color:#86868B;line-height:1.45;margin-bottom:10px;min-height:36px}
    .se-card-price{font-size:18px;font-weight:800;color:#1F8F3D;letter-spacing:-.4px}
    .se-card-id{font-size:10.5px;color:#86868B;font-family:ui-monospace,SF Mono,monospace;margin-top:5px;opacity:.7}

    /* Modal edición */
    .se-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:none;align-items:flex-start;justify-content:center;padding:40px 20px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);overflow-y:auto}
    .se-modal.show{display:flex}
    .se-modal-box{background:#fff;border-radius:18px;width:100%;max-width:520px;box-shadow:0 24px 60px rgba(0,0,0,.18);padding:26px 24px}
    .se-modal-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:18px}
    .se-modal-head h3{font-size:18px;font-weight:800;letter-spacing:-.4px;flex:1}
    .se-modal-head h3 span{display:block;font-size:11.5px;color:#86868B;font-weight:500;margin-top:2px}
    .se-modal-close{width:28px;height:28px;border-radius:50%;background:#F5F5F7;display:flex;align-items:center;justify-content:center}
    .se-modal-close svg{width:13px;height:13px;stroke-width:2.4}
    .se-modal-field{margin-bottom:12px}
    .se-modal-field label{display:block;font-size:11px;font-weight:700;color:#424245;margin-bottom:5px;letter-spacing:.4px;text-transform:uppercase}
    .se-modal-field input,.se-modal-field select,.se-modal-field textarea{width:100%;padding:11px 14px;background:#FAFAFA;border:1px solid rgba(0,0,0,.08);border-radius:10px;outline:none;font-family:inherit;font-size:14px;transition:border-color .15s,background .15s}
    .se-modal-field input:focus,.se-modal-field select:focus,.se-modal-field textarea:focus{border-color:#DC2626;background:#fff}
    .se-modal-field textarea{resize:vertical;min-height:60px}
    .se-modal-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .se-modal-cta{display:flex;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid rgba(0,0,0,.05)}
    .se-modal-cta button{flex:1;padding:11px;border-radius:10px;font-weight:700;font-size:13.5px}
    .se-btn-ghost{background:#F5F5F7;color:#1D1D1F}
    .se-btn-primary{background:#DC2626;color:#fff}
    .se-btn-primary:hover{background:#991B1B}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* Estado */
  let CATALOGO = null;
  let ACTIVE_TAB = 'principal';
  let EDIT_ID = null;

  function load(){
    try {
      const saved = localStorage.getItem('alvato_servicios_editados');
      CATALOGO = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT));
    } catch(e){ CATALOGO = JSON.parse(JSON.stringify(DEFAULT)); }
  }
  function save(){
    localStorage.setItem('alvato_servicios_editados', JSON.stringify(CATALOGO));
  }

  /* Render */
  function render(){
    const page = document.getElementById('page-servicios-editor');
    if (!page) return;
    if (!CATALOGO) load();
    const lista = CATALOGO[ACTIVE_TAB] || [];
    page.innerHTML = `
      <div class="se-head">
        <div class="se-head-sub">Editá nombre, descripción y precio de los servicios del albarán. Hoy "Combo Verano", mañana "Combo Invierno" — todo sin tocar código.</div>
      </div>
      <div class="se-tabs">
        <button class="se-tab ${ACTIVE_TAB==='principal'?'active':''}" data-tab="principal">Servicios principales</button>
        <button class="se-tab ${ACTIVE_TAB==='extras'?'active':''}" data-tab="extras">Otros servicios (extras)</button>
      </div>
      <div class="se-toolbar">
        <div style="font-size:13px;color:#424245"><strong>${lista.length}</strong> servicios en este catálogo</div>
        <div style="display:flex;gap:8px">
          <button class="se-btn-reset" onclick="window.seResetCatalogo()">Restaurar por defecto</button>
          <button class="se-btn-add" onclick="window.seAbrirEdit('nuevo')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Añadir servicio
          </button>
        </div>
      </div>
      <div class="se-grid">
        ${lista.map(s => `
          <div class="se-card ${s.tag||''}" onclick="window.seAbrirEdit('${s.id}')">
            ${s.tag === 'popular' ? '<span class="se-card-tag popular">Popular</span>' : ''}
            ${s.tag === 'premium' ? '<span class="se-card-tag premium">Premium</span>' : ''}
            <div class="se-card-actions" onclick="event.stopPropagation()">
              <button onclick="window.seAbrirEdit('${s.id}')" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="danger" onclick="window.seEliminar('${s.id}')" title="Eliminar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1.5 14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
            <div class="se-card-name">${escapeHTML(s.name)}</div>
            <div class="se-card-desc">${escapeHTML(s.desc||'')}</div>
            <div class="se-card-price">${Number(s.price||0).toFixed(2).replace('.',',')} €</div>
            <div class="se-card-id">${s.id}</div>
          </div>
        `).join('')}
      </div>
    `;
    page.querySelectorAll('.se-tab').forEach(b => b.addEventListener('click', () => {
      ACTIVE_TAB = b.dataset.tab; render();
    }));
  }

  /* Modal edición */
  function abrirEdit(id){
    EDIT_ID = id;
    const lista = CATALOGO[ACTIVE_TAB];
    const s = id === 'nuevo' ? { id:'', name:'', desc:'', price:0, tag:'' } : lista.find(x => x.id === id);
    if (!s) return;
    const modal = document.getElementById('seModal');
    modal.innerHTML = `
      <div class="se-modal-box">
        <div class="se-modal-head">
          <h3>${id==='nuevo' ? 'Nuevo servicio' : 'Editar servicio'}<span>${id==='nuevo' ? '' : 'Cambios aplicados al instante'}</span></h3>
          <button class="se-modal-close" onclick="document.getElementById('seModal').classList.remove('show')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="se-modal-field">
          <label>Nombre del servicio</label>
          <input id="seFNombre" type="text" placeholder="Ej: Combo Verano" value="${escapeAttr(s.name)}">
        </div>
        <div class="se-modal-field">
          <label>Descripción</label>
          <textarea id="seFDesc" placeholder="Qué incluye este servicio">${escapeHTML(s.desc||'')}</textarea>
        </div>
        <div class="se-modal-row">
          <div class="se-modal-field">
            <label>Precio base (€)</label>
            <input id="seFPrecio" type="number" step="0.01" min="0" value="${Number(s.price||0)}">
          </div>
          <div class="se-modal-field">
            <label>Etiqueta destacada</label>
            <select id="seFTag">
              <option value="" ${!s.tag?'selected':''}>Sin etiqueta</option>
              <option value="popular" ${s.tag==='popular'?'selected':''}>★ Popular (verde)</option>
              <option value="premium" ${s.tag==='premium'?'selected':''}>✦ Premium (dorado)</option>
            </select>
          </div>
        </div>
        ${id === 'nuevo' ? `
          <div class="se-modal-field">
            <label>ID interno (solo letras, números y guion bajo)</label>
            <input id="seFID" type="text" placeholder="Ej: combo_invierno">
            <div style="font-size:11px;color:#86868B;margin-top:5px">Si lo dejás vacío, lo generamos automáticamente.</div>
          </div>
        ` : ''}
        <div class="se-modal-cta">
          <button class="se-btn-ghost" onclick="document.getElementById('seModal').classList.remove('show')">Cancelar</button>
          <button class="se-btn-primary" onclick="window.seGuardar()">${id==='nuevo' ? 'Crear servicio' : 'Guardar cambios'}</button>
        </div>
      </div>
    `;
    modal.classList.add('show');
  }
  window.seAbrirEdit = abrirEdit;

  window.seGuardar = function(){
    const nombre = document.getElementById('seFNombre').value.trim();
    const desc   = document.getElementById('seFDesc').value.trim();
    const precio = parseFloat(document.getElementById('seFPrecio').value);
    const tag    = document.getElementById('seFTag').value;
    if (!nombre || isNaN(precio)) { alert('Faltan nombre o precio'); return; }
    if (EDIT_ID === 'nuevo') {
      let id = document.getElementById('seFID').value.trim();
      if (!id) id = nombre.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
      CATALOGO[ACTIVE_TAB].push({ id, name:nombre, desc, price:precio, tag });
    } else {
      const s = CATALOGO[ACTIVE_TAB].find(x => x.id === EDIT_ID);
      if (s) Object.assign(s, { name:nombre, desc, price:precio, tag });
    }
    save();
    document.getElementById('seModal').classList.remove('show');
    render();
  };

  window.seEliminar = function(id){
    if (!confirm('¿Eliminar este servicio del catálogo? Los albaranes ya creados no se ven afectados.')) return;
    CATALOGO[ACTIVE_TAB] = CATALOGO[ACTIVE_TAB].filter(x => x.id !== id);
    save(); render();
  };

  window.seResetCatalogo = function(){
    if (!confirm('¿Restaurar el catálogo por defecto? Perderás todos los cambios y servicios añadidos.')) return;
    CATALOGO = JSON.parse(JSON.stringify(DEFAULT));
    save(); render();
  };

  function escapeHTML(s){ return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }

  /* ─── Inyección en sidebar ─── */
  function inject(){
    if (!window.CURRENT_USER) return false;
    const isSuper = window.CURRENT_USER.rol === 'superadmin' || window.CURRENT_USER.centro === '*';
    if (!isSuper) return true;
    const refBtn = document.querySelector('.sb-item[data-page="products"]')
                || document.querySelector('.sb-item[data-page="team"]');
    if (!refBtn) return false;
    if (!document.querySelector('.sb-item[data-page="servicios-editor"]')) {
      const item = document.createElement('button');
      item.className = 'sb-item';
      item.setAttribute('data-page', 'servicios-editor');
      item.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="7"/><circle cx="15" cy="15" r="7"/></svg>
        Servicios catálogo
      `;
      refBtn.parentNode.insertBefore(item, refBtn.nextSibling);
      item.addEventListener('click', () => {
        if (typeof window.navTo === 'function') window.navTo('servicios-editor');
        load(); render();
      });
    }
    if (!document.getElementById('page-servicios-editor')) {
      const page = document.createElement('section');
      page.className = 'page';
      page.id = 'page-servicios-editor';
      const refPage = document.querySelector('#page-products') || document.querySelector('.page');
      if (refPage && refPage.parentNode) refPage.parentNode.insertBefore(page, refPage.nextSibling);
      else document.body.appendChild(page);
    }
    if (!document.getElementById('seModal')) {
      const m = document.createElement('div');
      m.id = 'seModal'; m.className = 'se-modal';
      document.body.appendChild(m);
    }
    try { if (window.titles && !window.titles['servicios-editor']) window.titles['servicios-editor'] = 'Servicios catálogo'; } catch(e){}
    return true;
  }
  function retry(){ if (inject()) return; setTimeout(retry, 500); }
  document.addEventListener('alvatoUserReady', () => { inject(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else retry();
})();
