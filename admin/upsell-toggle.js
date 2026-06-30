/* ══════════════════════════════════════════════════════════════════
   UPSELL TOGGLE · sumar al modal de detalle de reserva
   ─────────────────────────────────────────────────────────────────
   Cuando el cliente reserva online y al llegar al centro:
   - Cambia a un servicio superior (mantenimiento → plus → combo)
   - Suma extras (tapicería, cera, ozono)
   - Acepta upgrades sugeridos por el empleado

   El empleado marca "Upsell aplicado" desde el detalle de la reserva.
   Esto alimenta la métrica del dashboard "Upsell en centro: X%".

   Detecta cuando se abre el modal de detalle de reserva e inyecta
   el bloque de upsell al final del contenido.
   ══════════════════════════════════════════════════════════════════ */

(function(){
  if (window.__ALVATO_UPSELL_TOGGLE__) return;
  window.__ALVATO_UPSELL_TOGGLE__ = true;

  const STYLE = `
    .us-block{
      background:linear-gradient(135deg,#FFFFFF,#FAFAFA);
      border:1px solid rgba(48,209,88,.25);
      border-radius:14px;padding:16px 18px;margin-top:14px;
      font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter',sans-serif;
    }
    .us-block.applied{background:linear-gradient(135deg,rgba(48,209,88,.06),rgba(48,209,88,.02));border-color:rgba(48,209,88,.5)}
    .us-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
    .us-title{font-size:13.5px;font-weight:700;color:#1D1D1F;letter-spacing:-.25px;display:inline-flex;align-items:center;gap:7px}
    .us-title svg{width:14px;height:14px;color:#30D158;stroke-width:2}
    .us-switch{
      width:38px;height:23px;background:#D1D1D6;border-radius:99px;position:relative;cursor:pointer;
      transition:background .2s;flex-shrink:0;
    }
    .us-switch.on{background:#30D158}
    .us-switch::after{
      content:'';position:absolute;top:2px;left:2px;width:19px;height:19px;
      background:#fff;border-radius:50%;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);
    }
    .us-switch.on::after{left:17px}
    .us-desc{font-size:12px;color:#86868B;line-height:1.45;margin-bottom:10px}
    .us-fields{display:none;flex-direction:column;gap:10px;margin-top:12px}
    .us-block.applied .us-fields{display:flex}
    .us-field-row{display:flex;gap:10px}
    .us-input{
      flex:1;padding:9px 12px;background:#fff;border:1px solid rgba(0,0,0,.1);
      border-radius:8px;font-size:13px;font-family:inherit;color:#1D1D1F;outline:none;
      transition:border-color .15s;
    }
    .us-input:focus{border-color:#30D158}
    .us-input-label{font-size:11px;font-weight:600;color:#424245;margin-bottom:4px;display:block}
    .us-textarea{min-height:60px;resize:vertical;line-height:1.45}
    .us-save-btn{
      align-self:flex-start;padding:7px 14px;background:#1D1D1F;color:#fff;
      border-radius:99px;font-size:12px;font-weight:600;
      transition:background .15s;
    }
    .us-save-btn:hover{background:#000}
    .us-saved-badge{
      display:inline-flex;align-items:center;gap:5px;
      font-size:11px;color:#1F7F3A;font-weight:600;margin-left:8px;opacity:0;transition:opacity .25s;
    }
    .us-saved-badge.show{opacity:1}
    .us-saved-badge svg{width:11px;height:11px;stroke-width:3}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  function bg(action, params){
    return new Promise((resolve) => {
      const CFG = window.CONFIG || {};
      if (!CFG.script_url) return resolve({ ok:false });
      const cb = '_usb_' + Date.now() + Math.floor(Math.random()*1000);
      window[cb] = (d) => { delete window[cb]; s.remove(); resolve(d); };
      const qs = new URLSearchParams({ action, token: CFG.script_token||'', callback: cb, ...(params||{}) });
      const s = document.createElement('script');
      s.src = CFG.script_url + '?' + qs.toString();
      s.onerror = () => { delete window[cb]; s.remove(); resolve({ ok:false }); };
      document.head.appendChild(s);
      setTimeout(() => { if (window[cb]) { delete window[cb]; s.remove(); resolve({ ok:false }); } }, 12000);
    });
  }

  function buildBlock(booking){
    const applied = !!(booking.UpsellApplied === true || booking.UpsellApplied === 'true' || booking.UpsellApplied === 1);
    const note = booking.UpsellNote || '';
    const total = booking.Total || 0;
    return `
      <div class="us-block ${applied?'applied':''}" id="usBlock" data-booking="${booking.ID}">
        <div class="us-head">
          <div class="us-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            Upsell aplicado en centro
            <span class="us-saved-badge" id="usSavedBadge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Guardado</span>
          </div>
          <div class="us-switch ${applied?'on':''}" id="usSwitch"></div>
        </div>
        <div class="us-desc">Marcá si el cliente subió de servicio o sumó extras al llegar (cambió a Plus / añadió tapicería / aceptó cera premium).</div>
        <div class="us-fields">
          <div>
            <label class="us-input-label">Nota interna (qué se le agregó)</label>
            <textarea class="us-input us-textarea" id="usNote" placeholder="Ej. Cambió de Mantenimiento a Plus + tapicería">${note.replace(/</g,'&lt;')}</textarea>
          </div>
          <div class="us-field-row">
            <div style="flex:1">
              <label class="us-input-label">Total nuevo (€) — opcional</label>
              <input class="us-input" id="usTotal" type="number" step="0.01" placeholder="${total}" value="">
            </div>
            <div style="display:flex;align-items:flex-end">
              <button class="us-save-btn" id="usSaveBtn">Guardar cambios</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function attachLogic(booking){
    const block = document.getElementById('usBlock'); if (!block) return;
    const sw = document.getElementById('usSwitch');
    const note = document.getElementById('usNote');
    const totalIn = document.getElementById('usTotal');
    const saveBtn = document.getElementById('usSaveBtn');
    const badge = document.getElementById('usSavedBadge');

    let state = {
      applied: block.classList.contains('applied'),
      note: note?.value || '',
      total: ''
    };

    async function save(){
      const params = {
        bookingId: booking.ID || booking.id,
        applied: state.applied ? '1' : '',
        note: state.note || ''
      };
      if (state.total) params.newTotal = state.total;
      const r = await bg('updateBookingUpsell', params);
      if (r && r.ok) {
        badge.classList.add('show');
        setTimeout(() => badge.classList.remove('show'), 1800);
        /* Actualizar el objeto booking en memoria si BOOKINGS está expuesto */
        try {
          if (Array.isArray(window.BOOKINGS)) {
            const b = window.BOOKINGS.find(x => (x.ID||x.id) === (booking.ID||booking.id));
            if (b) {
              b.UpsellApplied = state.applied;
              b.UpsellNote = state.note;
              if (state.total) b.Total = Number(state.total);
            }
          }
          window.dispatchEvent(new CustomEvent('bookingsUpdated'));
        } catch(e){}
      }
    }

    sw?.addEventListener('click', () => {
      state.applied = !state.applied;
      sw.classList.toggle('on', state.applied);
      block.classList.toggle('applied', state.applied);
      /* Auto-save al togglear */
      save();
    });
    note?.addEventListener('input', e => { state.note = e.target.value; });
    totalIn?.addEventListener('input', e => { state.total = e.target.value; });
    saveBtn?.addEventListener('click', save);
  }

  /* ─── Inyectar el bloque al modal cuando se abre ─── */
  function tryInject(){
    /* Buscar modal de booking-detail · puede tener distintos ids según el cliente */
    const candidates = ['#bookingDetailModal','#bdModal','.booking-detail','.bd-modal','[data-modal="booking-detail"]'];
    let modal = null;
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) { modal = el; break; }
    }
    if (!modal) return;
    if (modal.querySelector('#usBlock')) return; /* ya inyectado */

    /* Obtener el booking actual · varias estrategias */
    let booking = window.CURRENT_BOOKING || window.currentBooking || null;
    if (!booking) {
      /* Buscar por data-id en el modal */
      const id = modal.dataset.bookingId || modal.querySelector('[data-booking-id]')?.dataset.bookingId;
      if (id && Array.isArray(window.BOOKINGS)) {
        booking = window.BOOKINGS.find(b => (b.ID||b.id) === id);
      }
    }
    if (!booking) return;

    /* Buscar el contenedor del cuerpo del modal */
    const body = modal.querySelector('.bd-body, .modal-body, .booking-detail-body, .bd-content') || modal;
    body.insertAdjacentHTML('beforeend', buildBlock(booking));
    attachLogic(booking);
  }

  /* MutationObserver: cada vez que el DOM cambia, miramos si abrieron el modal */
  const observer = new MutationObserver(() => { tryInject(); });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter:['class','style'] });
  else document.addEventListener('DOMContentLoaded', () => observer.observe(document.body, { childList: true, subtree: true }));

  /* También exponer un hook explícito si el booking-detail lo quiere disparar */
  window.injectUpsellBlock = tryInject;
})();
