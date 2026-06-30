/* ══════════════════════════════════════════════════════════════════
   NOTICIAS INTERNAS · Dueño → Centros
   ─────────────────────────────────────────────────────────────────
   Drop-in que:
   1. Agrega "Noticias" en el sidebar (cerca de Reportes)
   2. Crea su página propia con editor + lista
   3. Solo el superadmin puede crear/borrar
   4. Encargados/empleados ven un banner arriba con noticias activas
   5. Botón "marcar como leída" + "confirmar" si requiere

   Backend: endpoints addNoticia/getNoticias/markNoticiaLeida en Code.gs
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_NOTICIAS__) return;
  window.__ALVATO_NOTICIAS__ = true;

  const STYLE = `
    /* ─── Estética coherente admin pro ─── */
    #page-noticias{padding:24px;max-width:1180px;margin:0 auto}
    .nt-head-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px}
    .nt-head-sub{font-size:13.5px;color:#86868B}
    .nt-new-btn{
      display:inline-flex;align-items:center;gap:8px;
      padding:11px 20px;background:#DC2626;color:#fff;
      border-radius:11px;font-size:14px;font-weight:700;letter-spacing:-.2px;
      transition:background .15s,transform .1s,box-shadow .15s;
      box-shadow:0 4px 12px rgba(220,38,38,.25);
    }
    .nt-new-btn:hover{background:#991B1B;box-shadow:0 6px 18px rgba(220,38,38,.35);transform:translateY(-1px)}
    .nt-new-btn:active{transform:scale(.97)}
    .nt-new-btn svg{width:15px;height:15px;stroke-width:2.4}
    #page-noticias{padding:24px;max-width:1280px;margin:0 auto}
    .nt-page-title{font-size:22px;font-weight:700;letter-spacing:-.5px;color:#1D1D1F;margin-bottom:4px}

    /* Tarjetas de noticias */
    .nt-list{display:flex;flex-direction:column;gap:12px}
    .nt-card{
      background:#FFFFFF;border:1px solid rgba(0,0,0,.05);border-radius:14px;
      padding:18px 20px;box-shadow:0 1px 2px rgba(0,0,0,.04);
      transition:border-color .15s;
    }
    .nt-card:hover{border-color:rgba(0,0,0,.1)}
    .nt-card.urgente{border-left:3px solid #FF453A}
    .nt-card.importante{border-left:3px solid #FF9F0A}
    .nt-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:10px}
    .nt-card-title{font-size:16px;font-weight:700;color:#1D1D1F;letter-spacing:-.3px;line-height:1.3;margin-bottom:4px}
    .nt-card-meta{font-size:11.5px;color:#86868B;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .nt-card-prio{font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:2px 7px;border-radius:99px}
    .nt-card-prio.urgente{background:rgba(255,69,58,.12);color:#991B1B}
    .nt-card-prio.importante{background:rgba(255,159,10,.12);color:#9C5908}
    .nt-card-prio.normal{background:rgba(0,0,0,.05);color:#86868B}
    .nt-card-body{font-size:14px;color:#424245;line-height:1.55;white-space:pre-wrap}
    .nt-card-img{margin-top:12px;border-radius:10px;max-width:100%;border:1px solid rgba(0,0,0,.05)}
    .nt-card-foot{
      display:flex;justify-content:space-between;align-items:center;
      gap:14px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(0,0,0,.05);
      flex-wrap:wrap;
    }
    .nt-card-stats{font-size:11.5px;color:#86868B;display:inline-flex;gap:14px;align-items:center}
    .nt-card-stats strong{color:#1D1D1F;font-weight:600}
    .nt-card-actions{display:inline-flex;gap:6px}
    .nt-card-btn{
      padding:6px 12px;background:transparent;border:1px solid rgba(0,0,0,.1);
      border-radius:99px;font-size:11.5px;font-weight:500;color:#424245;
      cursor:pointer;transition:all .12s;font-family:inherit;
    }
    .nt-card-btn:hover{background:rgba(0,0,0,.04);color:#1D1D1F}
    .nt-card-btn.delete:hover{background:rgba(255,69,58,.08);color:#991B1B;border-color:rgba(255,69,58,.2)}

    /* Modal compositor */
    .nt-modal{
      position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;
      display:none;align-items:flex-start;justify-content:center;padding:60px 20px 20px;
      backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);overflow-y:auto;
    }
    .nt-modal.show{display:flex}
    .nt-modal-box{
      background:#FFFFFF;border-radius:18px;width:100%;max-width:560px;
      box-shadow:0 24px 60px rgba(0,0,0,.18);
      padding:28px 26px;
    }
    .nt-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
    .nt-modal-head h3{font-size:18px;font-weight:700;letter-spacing:-.4px}
    .nt-modal-close{width:28px;height:28px;border-radius:50%;background:#F5F5F7;color:#86868B;display:inline-flex;align-items:center;justify-content:center;transition:background .15s,color .15s}
    .nt-modal-close:hover{background:rgba(0,0,0,.08);color:#1D1D1F}
    .nt-modal-close svg{width:13px;height:13px;stroke-width:2.4}

    .nt-field{margin-bottom:14px}
    .nt-label{display:block;font-size:11.5px;font-weight:600;color:#424245;margin-bottom:6px;letter-spacing:-.15px}
    .nt-input,.nt-textarea,.nt-select{
      width:100%;padding:11px 14px;background:#FAFAFA;border:1px solid rgba(0,0,0,.08);
      border-radius:10px;outline:none;font-family:inherit;font-size:14px;color:#1D1D1F;
      transition:border-color .15s,background .15s;
    }
    .nt-input:focus,.nt-textarea:focus,.nt-select:focus{border-color:#DC2626;background:#fff}
    .nt-textarea{min-height:120px;resize:vertical;line-height:1.5}

    .nt-centros{
      display:flex;gap:6px;flex-wrap:wrap;
      max-height:140px;overflow-y:auto;
      padding:10px;background:#FAFAFA;border:1px solid rgba(0,0,0,.06);border-radius:10px;
    }
    .nt-centro-chip{
      padding:5px 11px;background:#FFFFFF;border:1px solid rgba(0,0,0,.08);
      border-radius:99px;font-size:11.5px;font-weight:500;color:#424245;
      cursor:pointer;transition:all .12s;
    }
    .nt-centro-chip.active{background:#1D1D1F;color:#fff;border-color:#1D1D1F}
    .nt-centro-all{background:#DC2626;color:#fff;border-color:#DC2626}
    .nt-centro-all.active{background:#991B1B;border-color:#991B1B}

    .nt-toggles{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
    .nt-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#FAFAFA;border:1px solid rgba(0,0,0,.06);border-radius:10px;cursor:pointer;font-size:13px}
    .nt-toggle-info{flex:1}
    .nt-toggle-name{font-weight:600;color:#1D1D1F;margin-bottom:2px;letter-spacing:-.15px}
    .nt-toggle-desc{font-size:11.5px;color:#86868B}
    .nt-switch{width:36px;height:22px;background:#D1D1D6;border-radius:99px;position:relative;transition:background .2s;flex-shrink:0}
    .nt-switch::after{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;background:#fff;border-radius:50%;transition:left .2s;box-shadow:0 1px 2px rgba(0,0,0,.18)}
    .nt-toggle.on .nt-switch{background:#30D158}
    .nt-toggle.on .nt-switch::after{left:16px}

    .nt-modal-cta{
      display:flex;gap:8px;margin-top:18px;
    }
    .nt-modal-btn-primary{
      flex:1;padding:12px;background:#DC2626;color:#fff;border-radius:10px;
      font-weight:600;font-size:14px;letter-spacing:-.2px;
      transition:background .15s,transform .1s;
    }
    .nt-modal-btn-primary:hover{background:#991B1B}
    .nt-modal-btn-primary:active{transform:scale(.98)}
    .nt-modal-btn-ghost{
      padding:12px 18px;background:#F5F5F7;color:#1D1D1F;border-radius:10px;
      font-weight:600;font-size:14px;
    }

    .nt-empty{padding:60px 20px;text-align:center;color:#86868B;font-size:14px;background:#FFFFFF;border:1px dashed rgba(0,0,0,.08);border-radius:14px}

    /* ───── BANNER para encargados/empleados (dentro del dashboard como banda) ───── */
    .nt-banner-wrap{max-width:1280px;margin:0 auto 18px;padding:0 24px;display:flex;flex-direction:column;gap:10px}
    .nt-banner{
      background:#FFFFFF;border:1px solid rgba(0,0,0,.08);border-radius:16px;
      padding:16px 20px;box-shadow:0 1px 2px rgba(0,0,0,.04);
      display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;
      animation:slideDown .35s cubic-bezier(.32,.72,0,1);
    }
    @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
    .nt-banner.urgente{border-left:4px solid #FF453A;background:linear-gradient(90deg,rgba(255,69,58,.04),#FFFFFF 30%)}
    .nt-banner.importante{border-left:4px solid #FF9F0A;background:linear-gradient(90deg,rgba(255,159,10,.04),#FFFFFF 30%)}
    .nt-banner-icon{
      width:42px;height:42px;border-radius:12px;flex-shrink:0;
      background:rgba(220,38,38,.1);color:#DC2626;
      display:flex;align-items:center;justify-content:center;
    }
    .nt-banner.urgente .nt-banner-icon{background:rgba(255,69,58,.12);color:#991B1B}
    .nt-banner.importante .nt-banner-icon{background:rgba(255,159,10,.12);color:#9C5908}
    .nt-banner-icon svg{width:20px;height:20px;stroke-width:1.8}
    .nt-banner-content{min-width:0;display:flex;flex-direction:column;gap:4px}
    .nt-banner-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .nt-banner-title{font-size:14.5px;font-weight:700;color:#1D1D1F;letter-spacing:-.25px}
    .nt-banner-prio{font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:99px}
    .nt-banner-prio.urgente{background:rgba(255,69,58,.12);color:#991B1B}
    .nt-banner-prio.importante{background:rgba(255,159,10,.12);color:#9C5908}
    .nt-banner-body{font-size:13px;color:#424245;line-height:1.5;max-height:60px;overflow:hidden}
    .nt-banner-cta{display:flex;gap:6px;flex-shrink:0;align-items:center}
    .nt-banner-cta button{padding:7px 14px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s}
    .nt-banner-cta .ok{background:#1D1D1F;color:#fff}
    .nt-banner-cta .ok:hover{background:#000}
    .nt-banner-cta .confirm{background:#DC2626;color:#fff}
    .nt-banner-cta .confirm:hover{background:#991B1B}
    .nt-banner-cta .later{background:transparent;color:#86868B;border:1px solid rgba(0,0,0,.1)}
    .nt-banner-cta .later:hover{background:#F5F5F7}
    .nt-banner-close{width:26px;height:26px;border-radius:50%;background:transparent;color:#86868B;display:inline-flex;align-items:center;justify-content:center;transition:background .12s}
    .nt-banner-close:hover{background:#F5F5F7;color:#1D1D1F}
    .nt-banner-close svg{width:12px;height:12px;stroke-width:2.4}
    @media(max-width:760px){.nt-banner{grid-template-columns:auto 1fr;gap:12px}.nt-banner-cta{grid-column:1/-1}}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  function getUser(){ return window.CURRENT_USER || {}; }
  function isSuper(){ const u = getUser(); return u.rol === 'superadmin' || u.centro === '*'; }
  function userId(){ const u = getUser(); return u.usuario || u.username || u.email || 'anon'; }
  function userCentro(){ const u = getUser(); return u.centro || ''; }

  /* ─── Persistencia local de noticias (modo demo / fallback) ─── */
  function localGetAll(){
    try { return JSON.parse(localStorage.getItem('alvato_noticias')||'[]'); } catch(e){ return []; }
  }
  function localSaveAll(arr){ localStorage.setItem('alvato_noticias', JSON.stringify(arr||[])); }
  function localAdd(noticia){
    const all = localGetAll();
    all.unshift(noticia);
    localSaveAll(all);
  }
  function localDelete(id){
    localSaveAll(localGetAll().filter(n => String(n.ID) !== String(id)));
  }

  function bg(action, params){
    return new Promise((resolve) => {
      const CFG = window.CONFIG || {};
      /* MODO DEMO / FALLBACK: si no hay backend conectado, usar localStorage */
      if (!CFG.script_url) {
        if (action === 'getNoticias') {
          return resolve({ ok:true, items: localGetAll() });
        }
        if (action === 'addNoticia') {
          const noticia = {
            ID: 'N-' + Date.now(),
            Titulo: params.titulo || '',
            Cuerpo: params.cuerpo || '',
            ImagenURL: params.imagenURL || '',
            Centros: params.centros || '*',
            Prioridad: params.prioridad || 'normal',
            RequiereConfirm: params.requiereConfirm === '1',
            EnviarEmail: params.enviarEmail === '1',
            Autor: params.autor || '',
            Fecha: new Date().toISOString(),
            LeidasCount: 0
          };
          localAdd(noticia);
          return resolve({ ok:true, id: noticia.ID });
        }
        if (action === 'deleteNoticia') {
          localDelete(params.id);
          return resolve({ ok:true });
        }
        if (action === 'markNoticiaLeida') {
          return resolve({ ok:true });
        }
        return resolve({ ok:false, error:'No script_url' });
      }
      const cbName = '_nbg_' + Date.now() + Math.floor(Math.random()*1000);
      window[cbName] = (d) => { delete window[cbName]; s.remove(); resolve(d); };
      const qs = new URLSearchParams({ action, token: CFG.script_token||'', callback: cbName, ...(params||{}) });
      const s = document.createElement('script');
      s.src = CFG.script_url + '?' + qs.toString();
      s.onerror = () => { delete window[cbName]; s.remove(); resolve({ ok:false, error:'network' }); };
      document.head.appendChild(s);
      setTimeout(() => { if (window[cbName]) { delete window[cbName]; s.remove(); resolve({ ok:false, error:'timeout' }); } }, 14000);
    });
  }

  /* ─── Modal compositor ─── */
  let NEW_NOTICIA = { titulo:'', cuerpo:'', imagenURL:'', centros:['*'], prioridad:'normal', requiereConfirm:false, enviarEmail:false };

  function openModal(){
    NEW_NOTICIA = { titulo:'', cuerpo:'', imagenURL:'', centros:['*'], prioridad:'normal', requiereConfirm:false, enviarEmail:false };
    const modal = document.getElementById('ntModal');
    if (modal) { renderModal(); modal.classList.add('show'); }
  }
  function closeModal(){
    const modal = document.getElementById('ntModal');
    if (modal) modal.classList.remove('show');
  }
  window.openNoticiaModal = openModal;

  function renderModal(){
    const centros = (window.CONFIG && window.CONFIG.centros) || [];
    const all = NEW_NOTICIA.centros.includes('*');
    document.getElementById('ntModal').innerHTML = `
      <div class="nt-modal-box">
        <div class="nt-modal-head">
          <h3>Nueva noticia</h3>
          <button class="nt-modal-close" onclick="closeNoticiaModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="nt-field">
          <label class="nt-label">Título</label>
          <input class="nt-input" id="ntTitulo" type="text" placeholder="Ej. Nuevo protocolo de cerámico" value="${(NEW_NOTICIA.titulo||'').replace(/"/g,'&quot;')}">
        </div>

        <div class="nt-field">
          <label class="nt-label">Cuerpo del mensaje</label>
          <textarea class="nt-textarea" id="ntCuerpo" placeholder="Texto completo de la noticia. Podés saltar líneas con Enter.">${(NEW_NOTICIA.cuerpo||'').replace(/</g,'&lt;')}</textarea>
        </div>

        <div class="nt-field">
          <label class="nt-label">Imagen opcional (URL)</label>
          <input class="nt-input" id="ntImagen" type="url" placeholder="https://..." value="${(NEW_NOTICIA.imagenURL||'').replace(/"/g,'&quot;')}">
        </div>

        <div class="nt-field">
          <label class="nt-label">Prioridad</label>
          <select class="nt-select" id="ntPrioridad">
            <option value="normal" ${NEW_NOTICIA.prioridad==='normal'?'selected':''}>Normal</option>
            <option value="importante" ${NEW_NOTICIA.prioridad==='importante'?'selected':''}>Importante</option>
            <option value="urgente" ${NEW_NOTICIA.prioridad==='urgente'?'selected':''}>Urgente</option>
          </select>
        </div>

        <div class="nt-field">
          <label class="nt-label">Destino</label>
          <div class="nt-centros">
            <span class="nt-centro-chip nt-centro-all ${all?'active':''}" data-centro="*">Todos los centros</span>
            ${centros.map(c => `<span class="nt-centro-chip ${(!all && NEW_NOTICIA.centros.includes(c.id))?'active':''}" data-centro="${c.id}">${c.ciudad}</span>`).join('')}
          </div>
        </div>

        <div class="nt-toggles">
          <label class="nt-toggle ${NEW_NOTICIA.requiereConfirm?'on':''}" data-toggle="requiereConfirm">
            <div class="nt-toggle-info">
              <div class="nt-toggle-name">Requiere confirmación de lectura</div>
              <div class="nt-toggle-desc">Cada empleado debe pulsar "Confirmar" tras leer</div>
            </div>
            <div class="nt-switch"></div>
          </label>
          <label class="nt-toggle ${NEW_NOTICIA.enviarEmail?'on':''}" data-toggle="enviarEmail">
            <div class="nt-toggle-info">
              <div class="nt-toggle-name">Enviar por email también</div>
              <div class="nt-toggle-desc">A todos los empleados de los centros destino</div>
            </div>
            <div class="nt-switch"></div>
          </label>
        </div>

        <div class="nt-modal-cta">
          <button class="nt-modal-btn-ghost" onclick="closeNoticiaModal()">Cancelar</button>
          <button class="nt-modal-btn-primary" onclick="submitNoticia()">Publicar noticia</button>
        </div>
      </div>
    `;
    /* Wire eventos */
    const box = document.getElementById('ntModal');
    box.querySelectorAll('[data-centro]').forEach(el => el.addEventListener('click', () => {
      const c = el.dataset.centro;
      if (c === '*') NEW_NOTICIA.centros = ['*'];
      else {
        NEW_NOTICIA.centros = NEW_NOTICIA.centros.filter(x => x !== '*');
        const idx = NEW_NOTICIA.centros.indexOf(c);
        if (idx >= 0) NEW_NOTICIA.centros.splice(idx, 1);
        else NEW_NOTICIA.centros.push(c);
        if (!NEW_NOTICIA.centros.length) NEW_NOTICIA.centros = ['*'];
      }
      renderModal();
    }));
    box.querySelectorAll('[data-toggle]').forEach(el => el.addEventListener('click', () => {
      NEW_NOTICIA[el.dataset.toggle] = !NEW_NOTICIA[el.dataset.toggle];
      renderModal();
    }));
    /* Capturar texto en vivo */
    document.getElementById('ntTitulo')?.addEventListener('input', e => NEW_NOTICIA.titulo = e.target.value);
    document.getElementById('ntCuerpo')?.addEventListener('input', e => NEW_NOTICIA.cuerpo = e.target.value);
    document.getElementById('ntImagen')?.addEventListener('input', e => NEW_NOTICIA.imagenURL = e.target.value);
    document.getElementById('ntPrioridad')?.addEventListener('change', e => NEW_NOTICIA.prioridad = e.target.value);
  }

  window.closeNoticiaModal = closeModal;

  window.submitNoticia = async function(){
    if (!NEW_NOTICIA.titulo.trim() || !NEW_NOTICIA.cuerpo.trim()) {
      alert('Título y cuerpo son obligatorios.'); return;
    }
    const r = await bg('addNoticia', {
      titulo: NEW_NOTICIA.titulo,
      cuerpo: NEW_NOTICIA.cuerpo,
      imagenURL: NEW_NOTICIA.imagenURL,
      centros: NEW_NOTICIA.centros.join(','),
      prioridad: NEW_NOTICIA.prioridad,
      requiereConfirm: NEW_NOTICIA.requiereConfirm ? '1' : '',
      enviarEmail: NEW_NOTICIA.enviarEmail ? '1' : '',
      autor: userId()
    });
    if (r && r.ok) { closeModal(); loadAndRender(); }
    else alert('Error: ' + (r && r.error ? r.error : 'desconocido'));
  };

  /* ─── Render lista (vista superadmin) ─── */
  let NOTICIAS = [];
  async function loadAndRender(){
    const r = await bg('getNoticias', {});
    NOTICIAS = (r && r.items) || [];
    renderList();
  }
  function renderList(){
    const page = document.getElementById('page-noticias');
    if (!page) return;
    page.innerHTML = `
      <div class="nt-head-row">
        <div>
          <div class="nt-page-title">Noticias y comunicados</div>
          <div class="nt-head-sub">Envíá un mensaje en banner al dashboard de uno o varios centros</div>
        </div>
        <button class="nt-new-btn" onclick="openNoticiaModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Escribir noticia nueva
        </button>
      </div>
      ${NOTICIAS.length ? `
        <div class="nt-list">
          ${NOTICIAS.map(renderCard).join('')}
        </div>
      ` : `
        <div class="nt-empty" style="padding:50px 30px;background:#FFF;border:2px dashed rgba(220,38,38,.2);border-radius:14px;text-align:center">
          <div style="font-size:16px;font-weight:700;color:#1D1D1F;margin-bottom:6px">Todavía no publicaste ninguna noticia</div>
          <div style="font-size:13.5px;color:#86868B;line-height:1.5;margin-bottom:18px">Cuando publiques una noticia importante o urgente,<br>aparecerá como banner en el dashboard de los centros que elijas.</div>
          <button class="nt-new-btn" onclick="openNoticiaModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Crear tu primera noticia
          </button>
        </div>
      `}
    `;
    page.querySelectorAll('.nt-card-btn.delete').forEach(btn => btn.addEventListener('click', async e => {
      if (!confirm('¿Archivar esta noticia? Los empleados no la verán más.')) return;
      const id = e.currentTarget.dataset.id;
      const r = await bg('deleteNoticia', { id });
      if (r && r.ok) loadAndRender();
    }));
  }

  function renderCard(n){
    const date = n.Fecha ? new Date(n.Fecha).toLocaleString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '';
    const centros = String(n.Centros||'*');
    const dest = (centros === '*' || centros === 'all' || centros === 'todos') ? 'Todos los centros' : centros.split(',').map(s => s.trim()).join(' · ');
    const prio = n.Prioridad || 'normal';
    return `
      <div class="nt-card ${prio}">
        <div class="nt-card-head">
          <div>
            <div class="nt-card-title">${n.Titulo||''}</div>
            <div class="nt-card-meta">
              <span class="nt-card-prio ${prio}">${prio}</span>
              <span>${date}</span>
              <span>· ${dest}</span>
              ${n.RequiereConfirm ? '<span>· Requiere confirmación</span>' : ''}
            </div>
          </div>
        </div>
        <div class="nt-card-body">${(n.Cuerpo||'').replace(/</g,'&lt;')}</div>
        ${n.ImagenURL ? `<img class="nt-card-img" src="${n.ImagenURL}" alt="">` : ''}
        <div class="nt-card-foot">
          <div class="nt-card-stats">
            <span><strong>${n.LeidasCount||0}</strong> lecturas</span>
            ${n.EnviarEmail ? '<span>Email enviado</span>' : ''}
          </div>
          <div class="nt-card-actions">
            <button class="nt-card-btn delete" data-id="${n.ID}">Archivar</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ─── Banner para encargados/empleados ─── */
  let BANNER_NOTICIAS = [];
  async function loadBannerNoticias(){
    if (isSuper()) return; /* el dueño no ve banners, ve la lista */
    const r = await bg('getNoticias', { centro: userCentro() });
    BANNER_NOTICIAS = (r && r.items) || [];
    /* Filtrar las ya leídas (guardado local) */
    let leidas = []; try { leidas = JSON.parse(localStorage.getItem('alvato_noticias_leidas')||'[]'); } catch(e){}
    BANNER_NOTICIAS = BANNER_NOTICIAS.filter(n => !leidas.includes(n.ID));
    renderBanners();
  }
  function renderBanners(){
    let wrap = document.getElementById('ntBannerWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'ntBannerWrap';
      wrap.className = 'nt-banner-wrap';
      /* Insertar DENTRO del dashboard como banda ancha (preferido) o en body como fallback */
      const dashboard = document.getElementById('page-dashboard');
      if (dashboard) dashboard.insertBefore(wrap, dashboard.firstChild);
      else document.body.appendChild(wrap);
    }
    if (!BANNER_NOTICIAS.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = BANNER_NOTICIAS.slice(0, 3).map(n => `
      <div class="nt-banner ${n.Prioridad||'normal'}">
        <div class="nt-banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a9 9 0 0 1 9 9"/><path d="M3 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
        </div>
        <div class="nt-banner-content">
          <div class="nt-banner-head">
            <div class="nt-banner-title">${n.Titulo||''}</div>
            ${n.Prioridad && n.Prioridad !== 'normal' ? `<span class="nt-banner-prio ${n.Prioridad}">${n.Prioridad}</span>` : ''}
          </div>
          <div class="nt-banner-body">${(n.Cuerpo||'').replace(/</g,'&lt;')}</div>
        </div>
        <div class="nt-banner-cta">
          ${n.RequiereConfirm
            ? `<button class="confirm" data-action="confirm" data-id="${n.ID}">Confirmar lectura</button><button class="later" data-action="later" data-id="${n.ID}">Más tarde</button>`
            : `<button class="ok" data-action="ok" data-id="${n.ID}">Entendido</button>`
          }
          <button class="nt-banner-close" data-action="close" data-id="${n.ID}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `).join('');
    wrap.querySelectorAll('button[data-action]').forEach(b => b.addEventListener('click', async e => {
      const id = b.dataset.id; const action = b.dataset.action;
      if (action === 'later') {
        BANNER_NOTICIAS = BANNER_NOTICIAS.filter(n => n.ID !== id);
        renderBanners(); return;
      }
      /* Marcar local + remoto */
      let leidas = []; try { leidas = JSON.parse(localStorage.getItem('alvato_noticias_leidas')||'[]'); } catch(e){}
      if (!leidas.includes(id)) leidas.push(id);
      localStorage.setItem('alvato_noticias_leidas', JSON.stringify(leidas));
      BANNER_NOTICIAS = BANNER_NOTICIAS.filter(n => n.ID !== id);
      renderBanners();
      bg('markNoticiaLeida', { noticiaId:id, usuario:userId(), centro:userCentro(), confirmar: action==='confirm' ? '1' : '' });
    }));
  }

  /* ─── Inyección en sidebar + página ─── */
  function inject(){
    if (!window.CURRENT_USER) return false; // todavía no hay login → reintentar
    /* Lo colocamos arriba (después de Inicio) para que sea muy visible */
    const refBtn = document.querySelector('.sb-item[data-page="clients"]')
                || document.querySelector('.sb-item[data-page="leads"]')
                || document.querySelector('.sb-item[data-page="dashboard"]');
    if (!refBtn) return false;

    if (isSuper() && !document.querySelector('.sb-item[data-page="noticias"]')) {
      const item = document.createElement('button');
      item.className = 'sb-item';
      item.setAttribute('data-page', 'noticias');
      item.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a9 9 0 0 1 9 9"/><path d="M3 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
        Noticias
        <span class="sb-badge" style="background:#FF9F0A">Nuevo</span>
      `;
      refBtn.parentNode.insertBefore(item, refBtn.nextSibling);
      item.addEventListener('click', () => {
        if (typeof window.navTo === 'function') window.navTo('noticias');
        loadAndRender();
      });
    }

    if (isSuper() && !document.getElementById('page-noticias')) {
      const page = document.createElement('section');
      page.className = 'page';
      page.id = 'page-noticias';
      const refPage = document.querySelector('#page-reports') || document.querySelector('.page');
      if (refPage && refPage.parentNode) refPage.parentNode.insertBefore(page, refPage.nextSibling);
      else document.body.appendChild(page);
    }

    try { if (window.titles && !window.titles['noticias']) window.titles['noticias'] = 'Noticias'; } catch(e){}

    /* Modal */
    if (!document.getElementById('ntModal')) {
      const m = document.createElement('div');
      m.id = 'ntModal';
      m.className = 'nt-modal';
      document.body.appendChild(m);
    }

    /* Cargar */
    if (isSuper()) loadAndRender();
    else loadBannerNoticias();

    /* Polling cada 5 min para banners */
    if (!isSuper()) setInterval(loadBannerNoticias, 5 * 60 * 1000);

    return true;
  }
  function retry(){ if (inject()) return; setTimeout(retry, 500); }
  document.addEventListener('alvatoUserReady', () => { inject(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry);
  else retry();

  window.refreshNoticias = loadAndRender;
})();
