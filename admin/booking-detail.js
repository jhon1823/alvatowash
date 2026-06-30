/* ════════════════════════════════════════════════════════════════════
   ALVATOWASH — MODAL DE DETALLE Y COMPLETADO DE RESERVA
   ──────────────────────────────────────────────────────────────────
   Módulo compartido admin + empleados.
   Al tocar una reserva se abre un modal con:
     - Datos del cliente y servicio reservado
     - Estado mutable: pendiente → en curso → completado
     - Posibilidad de añadir servicios extras (con precio)
     - Total recalculado en vivo
     - Notas internas guardadas en la ficha
     - Botón Factura (si la reserva está completada)

   Uso: window.openBookingDetail(booking, { onSave, allowInvoice })
   - booking: el objeto de la reserva (mutado in-place)
   - opts.onSave: callback al guardar
   - opts.allowInvoice: si true muestra botón "Emitir factura"
═════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const CFG = window.CONFIG || {};
const EXTRAS_CATALOG = (CFG.extras || []).concat([
  { key:'tapiceria', name:'Limpieza de tapicería',  price: 60 },
  { key:'ceramico',  name:'Tratamiento cerámico',   price: 120 },
  { key:'cuero',     name:'Protección de cuero',    price: 45 },
  { key:'faros',     name:'Pulido de faros',        price: 25 },
  { key:'motor',     name:'Limpieza de motor',      price: 40 },
  { key:'ozono',     name:'Desinfección con ozono', price: 30 }
]);
const EXTRAS_UNIQUE = [];
const seen = new Set();
EXTRAS_CATALOG.forEach(e => {
  if (!seen.has(e.key)) { seen.add(e.key); EXTRAS_UNIQUE.push(e); }
});

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

/* CSS inyectado una vez */
const CSS = `
.bd-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:600;display:none;align-items:flex-end;justify-content:center;padding:0}
@media(min-width:760px){.bd-overlay{align-items:center;padding:20px}}
.bd-overlay.show{display:flex;animation:bdFadeIn .2s ease}
@keyframes bdFadeIn{from{opacity:0}to{opacity:1}}
.bd-modal{background:#fff;border-radius:20px 20px 0 0;max-width:520px;width:100%;max-height:92dvh;overflow:hidden;display:flex;flex-direction:column;animation:bdUp .3s cubic-bezier(.22,1,.36,1);box-shadow:0 -8px 40px rgba(0,0,0,.25)}
@media(min-width:760px){.bd-modal{border-radius:20px}}
@keyframes bdUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
.bd-head{padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.07);background:#fff;flex-shrink:0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.bd-head-info{flex:1;min-width:0}
.bd-status-pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;letter-spacing:.3px;text-transform:uppercase;margin-bottom:6px}
.bd-status-pill::before{content:'';width:6px;height:6px;border-radius:50%;flex-shrink:0}
.bd-status-pill.pending{background:rgba(255,159,10,.12);color:#9C5F00}
.bd-status-pill.pending::before{background:#FF9F0A}
.bd-status-pill.in_progress{background:rgba(220,38,38,.12);color:#991B1B}
.bd-status-pill.in_progress::before{background:#DC2626;animation:bdPulse 1.5s ease-in-out infinite}
@keyframes bdPulse{0%,100%{opacity:1}50%{opacity:.4}}
.bd-status-pill.done{background:rgba(48,209,88,.12);color:#1F8E3F}
.bd-status-pill.done::before{background:#30D158}
.bd-client-name{font-size:18px;font-weight:700;letter-spacing:-.4px;color:#1D1D1F;line-height:1.2;margin-bottom:3px}
.bd-client-meta{font-size:12.5px;color:#86868B;font-variant-numeric:tabular-nums}
.bd-close{width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.05);color:#86868B;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;flex-shrink:0;transition:background .12s,color .12s}
.bd-close:hover{background:rgba(0,0,0,.1);color:#1D1D1F}
.bd-close svg{width:14px;height:14px;stroke-width:2.5}

.bd-body{flex:1;overflow-y:auto;padding:16px 20px 0;background:#FAFAFA}
.bd-section-h{font-size:11px;font-weight:700;color:#86868B;letter-spacing:.5px;text-transform:uppercase;margin:14px 0 8px}
.bd-section-h:first-child{margin-top:0}
.bd-card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:12px;padding:14px;margin-bottom:10px}
.bd-row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:6px 0;font-size:13.5px}
.bd-row span{color:#86868B;font-weight:500;font-size:12.5px}
.bd-row strong{color:#1D1D1F;font-weight:600;text-align:right;max-width:60%}
.bd-service-card{background:linear-gradient(135deg,#FFF,#FAFAFA);border:1px solid rgba(220,38,38,.18);border-radius:14px;padding:14px;margin-bottom:10px}
.bd-service-name{font-size:16px;font-weight:700;color:#1D1D1F;letter-spacing:-.3px;line-height:1.2;margin-bottom:4px}
.bd-service-price{display:flex;align-items:baseline;gap:6px;margin-top:6px}
.bd-service-price strong{font-size:24px;font-weight:700;color:#DC2626;letter-spacing:-.6px;font-variant-numeric:tabular-nums}
.bd-service-price small{font-size:12px;color:#86868B}

.bd-action-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 14px}
.bd-btn-action{padding:11px;border-radius:10px;background:#fff;border:1.5px solid rgba(0,0,0,.08);color:#1D1D1F;font-weight:600;font-size:13px;letter-spacing:-.1px;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:background .12s,border-color .12s,transform .1s;font-family:inherit}
.bd-btn-action:hover{background:#FAFAFA;border-color:#DC2626}
.bd-btn-action:active{transform:scale(.98)}
.bd-btn-action.go{background:#DC2626;color:#fff;border-color:#DC2626}
.bd-btn-action.go:hover{background:#991B1B;border-color:#991B1B}
.bd-btn-action.done{background:#30D158;color:#fff;border-color:#30D158}
.bd-btn-action.done:hover{background:#1F8E3F;border-color:#1F8E3F}
.bd-btn-action:disabled{opacity:.35;cursor:not-allowed}
.bd-btn-action svg{width:14px;height:14px;stroke-width:2.4}

/* Extras */
.bd-extras-list{display:flex;flex-direction:column;gap:6px;margin-bottom:8px}
.bd-extra{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1.5px solid rgba(0,0,0,.06);border-radius:10px;cursor:pointer;transition:border-color .12s,background .12s}
.bd-extra:hover{border-color:#DC2626;background:#FAFAFA}
.bd-extra.checked{border-color:#DC2626;background:rgba(220,38,38,.06)}
.bd-extra-box{width:22px;height:22px;border-radius:6px;border:2px solid rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .12s,border-color .12s}
.bd-extra.checked .bd-extra-box{background:#DC2626;border-color:#DC2626}
.bd-extra-box svg{width:13px;height:13px;color:#fff;opacity:0;transition:opacity .12s;stroke-width:3}
.bd-extra.checked .bd-extra-box svg{opacity:1}
.bd-extra-info{flex:1;min-width:0}
.bd-extra-name{font-size:13.5px;font-weight:600;color:#1D1D1F;letter-spacing:-.1px}
.bd-extra-price{font-size:11.5px;color:#86868B;margin-top:1px}
.bd-extra-amount{font-size:14px;font-weight:700;color:#DC2626;flex-shrink:0;font-variant-numeric:tabular-nums}

/* Notas */
.bd-textarea{width:100%;padding:11px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:10px;background:#fff;outline:none;font-size:13.5px;color:#1D1D1F;font-family:inherit;resize:vertical;min-height:70px;line-height:1.45}
.bd-textarea:focus{border-color:#DC2626;box-shadow:0 0 0 3px rgba(220,38,38,.1)}

/* Total */
.bd-total-card{background:#1D1D1F;color:#fff;padding:14px 16px;border-radius:14px;margin:10px 0 14px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.bd-total-info{flex:1;min-width:0}
.bd-total-label{font-size:11px;color:rgba(255,255,255,.7);letter-spacing:.5px;text-transform:uppercase;font-weight:700;margin-bottom:2px}
.bd-total-sub{font-size:12px;color:rgba(255,255,255,.55)}
.bd-total-amount{font-size:30px;font-weight:700;letter-spacing:-1px;color:#fff;font-variant-numeric:tabular-nums;line-height:1}

.bd-foot{padding:14px 20px calc(14px + env(safe-area-inset-bottom,0));background:#fff;border-top:1px solid rgba(0,0,0,.07);flex-shrink:0;display:flex;gap:8px}
.bd-btn-save{flex:1;padding:13px;background:#DC2626;color:#fff;font-weight:700;font-size:14px;border:none;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;transition:background .12s,transform .1s;font-family:inherit;letter-spacing:-.1px}
.bd-btn-save:hover{background:#991B1B}
.bd-btn-save:active{transform:scale(.98)}
.bd-btn-save svg{width:14px;height:14px;stroke-width:2.4}
.bd-btn-invoice{padding:13px 18px;background:#1D1D1F;color:#fff;font-weight:700;font-size:13.5px;border:none;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;font-family:inherit;transition:background .12s;letter-spacing:-.1px}
.bd-btn-invoice:hover{background:#000}
.bd-btn-invoice:disabled{opacity:.35;cursor:not-allowed}
.bd-btn-invoice svg{width:14px;height:14px;stroke-width:2.4}

/* ── Checkout overlay ── */
.bd-checkout-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:700;display:none;align-items:flex-end;justify-content:center}
@media(min-width:760px){.bd-checkout-overlay{align-items:center}}
.bd-checkout-overlay.show{display:flex;animation:bdFadeIn .2s ease}
.bd-checkout-modal{background:#fff;border-radius:20px 20px 0 0;max-width:520px;width:100%;max-height:94dvh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,.3)}
@media(min-width:760px){.bd-checkout-modal{border-radius:20px}}
.bd-checkout-head{padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.07);background:#1D1D1F;color:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:space-between}
.bd-checkout-head h3{font-size:16px;font-weight:700;letter-spacing:-.3px;margin:0}
.bd-checkout-body{flex:1;overflow-y:auto;padding:16px 20px}
.bd-checkout-field{margin-bottom:14px}
.bd-checkout-label{display:block;font-size:11.5px;font-weight:700;color:#86868B;letter-spacing:.4px;text-transform:uppercase;margin-bottom:6px}
.bd-checkout-input{width:100%;padding:11px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:10px;background:#fff;outline:none;font-size:13.5px;color:#1D1D1F;font-family:inherit;box-sizing:border-box}
.bd-checkout-input:focus{border-color:#DC2626;box-shadow:0 0 0 3px rgba(220,38,38,.1)}
.bd-checkout-canvas{border:1.5px solid rgba(0,0,0,.1);border-radius:10px;background:#FAFAFA;display:block;cursor:crosshair;touch-action:none}
.bd-checkout-recur{display:flex;gap:8px;margin-top:4px}
.bd-checkout-recur button{flex:1;padding:10px 8px;border:1.5px solid rgba(0,0,0,.1);border-radius:10px;background:#fff;font-size:12.5px;font-weight:700;cursor:pointer;color:#1D1D1F;font-family:inherit;transition:all .12s}
.bd-checkout-recur button:hover{border-color:#DC2626;color:#DC2626}
.bd-checkout-recur button.sel{background:#DC2626;border-color:#DC2626;color:#fff}
.bd-checkout-foot{padding:12px 20px calc(12px + env(safe-area-inset-bottom,0));background:#fff;border-top:1px solid rgba(0,0,0,.07);flex-shrink:0;display:flex;gap:8px}
.bd-checkout-confirm{flex:1;padding:13px;background:#DC2626;color:#fff;font-weight:700;font-size:14px;border:none;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;font-family:inherit}
.bd-checkout-confirm:hover{background:#991B1B}
.bd-co-vip{display:flex;align-items:center;gap:10px;padding:10px;background:rgba(255,159,10,.08);border:1px solid rgba(255,159,10,.25);border-radius:10px;margin-bottom:14px}
.bd-co-vip input[type=checkbox]{width:18px;height:18px;accent-color:#DC2626;cursor:pointer;flex-shrink:0}
.bd-co-vip label{font-size:13px;font-weight:600;color:#1D1D1F;cursor:pointer}
`;
(function injectCss(){
  if (document.getElementById('bd-styles')) return;
  const s = document.createElement('style');
  s.id = 'bd-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
})();

/* HTML del overlay (se inyecta una vez) */
function ensureOverlay(){
  let o = document.getElementById('bdOverlay');
  if (o) return o;
  o = document.createElement('div');
  o.className = 'bd-overlay';
  o.id = 'bdOverlay';
  o.innerHTML = `<div class="bd-modal" id="bdModal"></div>`;
  o.addEventListener('click', e => { if (e.target === o) closeDetail(); });
  document.body.appendChild(o);
  return o;
}

const I = {
  x:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
};

/* Estado del modal abierto */
let _booking = null;
let _opts = {};
let _selectedExtras = {};   // {key: true}
let _status = 'pendiente';
let _internalNote = '';
let _basePrice = 0;
let _customExtraName = '';
let _customExtraPrice = 0;

function calculatePrice(){
  let total = _basePrice;
  EXTRAS_UNIQUE.forEach(e => { if (_selectedExtras[e.key]) total += e.price; });
  return total;
}

/* Buscar cliente VIP por teléfono (comparación tolerante) */
function findVipUser(phone){
  if (!phone || !window.VIP_USERS) return null;
  const norm = String(phone).replace(/[^\d]/g,'');
  if (!norm) return null;
  return window.VIP_USERS.find(u => {
    const np = String(u.phone||'').replace(/[^\d]/g,'');
    if (!np) return false;
    return np === norm || norm.endsWith(np.slice(-9)) || np.endsWith(norm.slice(-9));
  });
}

function levelColor(lvl){
  return ({ 'Bronce':'#CD7F32', 'Plata':'#8E8E93', 'Oro':'#D4AF37', 'Diamante':'#5AC8FA' }[lvl]) || '#86868B';
}

function openBookingDetail(booking, opts){
  if (!booking) return;
  _booking = booking;
  _opts = opts || {};
  _basePrice = Number(booking['_BasePrice']) || Number(booking['Total']) || 0;
  if (!booking['_BasePrice']) booking['_BasePrice'] = _basePrice;

  /* Estado actual */
  _status = String(booking['Estado'] || 'pendiente').toLowerCase();
  if (!['pendiente','en_curso','en curso','completado','asignada'].includes(_status)) _status = 'pendiente';
  if (_status === 'asignada') _status = 'pendiente';
  if (_status === 'en curso') _status = 'en_curso';

  /* Extras ya guardados */
  _selectedExtras = {};
  if (booking['_Extras']) {
    try {
      const parsed = typeof booking['_Extras'] === 'string' ? JSON.parse(booking['_Extras']) : booking['_Extras'];
      if (parsed && typeof parsed === 'object') _selectedExtras = parsed;
    } catch {}
  }
  _internalNote = booking['_NotaInterna'] || '';

  const overlay = ensureOverlay();
  render();
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeDetail(){
  const o = document.getElementById('bdOverlay');
  if (o) o.classList.remove('show');
  document.body.style.overflow = '';
  _booking = null;
}
window.closeDetail = closeDetail;

function render(){
  const m = document.getElementById('bdModal');
  if (!m || !_booking) return;
  const b = _booking;
  const total = calculatePrice();
  const isDone = _status === 'completado';
  const isInProgress = _status === 'en_curso';
  const statusLabel = isDone ? 'Completado' : (isInProgress ? 'En curso' : 'Pendiente');
  const statusClass = isDone ? 'done' : (isInProgress ? 'in_progress' : 'pending');

  m.innerHTML = `
    <div class="bd-head">
      <div class="bd-head-info">
        <div class="bd-status-pill ${statusClass}">${statusLabel}</div>
        <div class="bd-client-name">${esc(b['Nombre'] || 'Sin nombre')}</div>
        <div class="bd-client-meta">${esc(b['Teléfono'] || b['Telefono'] || '')} · ${esc(b['Fecha'] || '')} ${esc(b['Hora'] || '')}</div>
      </div>
      <button class="bd-close" onclick="closeDetail()">${I.x}</button>
    </div>

    <div class="bd-body">

      <div class="bd-section-h">Servicio reservado</div>
      <div class="bd-service-card">
        <div class="bd-service-name">${esc(b['Servicio'] || 'Servicio')}</div>
        <div class="bd-service-price">
          <strong>€${_basePrice.toFixed(2)}</strong>
          <small>precio base</small>
        </div>
      </div>

      ${b['Empleado'] ? `<div class="bd-card"><div class="bd-row"><span>Asignado a</span><strong>${esc(b['Empleado'])}</strong></div></div>` : ''}

      ${b['Email'] ? `<div class="bd-card"><div class="bd-row"><span>Email</span><strong>${esc(b['Email'])}</strong></div>${b['Dirección']?`<div class="bd-row"><span>Dirección</span><strong>${esc(b['Dirección'])}</strong></div>`:''}</div>` : ''}

      ${b['Nota'] ? `<div class="bd-card"><div class="bd-row" style="display:block"><span style="display:block;margin-bottom:4px">Nota de la reserva</span><strong style="text-align:left;max-width:100%;font-weight:500;color:#424245;font-size:13px;line-height:1.5">${esc(b['Nota'])}</strong></div></div>` : ''}

      ${(() => {
        const vip = findVipUser(b['Teléfono'] || b['Telefono']);
        if (!vip) return `<div class="bd-card" style="border:1px dashed rgba(0,0,0,.12);background:transparent"><div style="display:flex;align-items:center;gap:10px"><div style="width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.04);display:flex;align-items:center;justify-content:center;color:#86868B"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div style="flex:1"><div style="font-size:12.5px;font-weight:600;color:#1D1D1F">Cliente no es VIP</div><div style="font-size:11.5px;color:#86868B">Invitalo al Club después del servicio</div></div></div></div>`;
        const lvlClr = levelColor(vip.level);
        const ptsToNext = vip.points_next ? Math.max(0, vip.points_next - vip.points) : 0;
        const pct = vip.points_next ? Math.min(100, Math.round((vip.points / vip.points_next) * 100)) : 100;
        const earnedHere = Math.floor(calculatePrice());
        return `
          <div class="bd-card" style="background:linear-gradient(135deg,#1D1D1F,#0F0F10);color:#fff;border:none;padding:16px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
              <div style="width:40px;height:40px;border-radius:50%;background:${lvlClr};color:#0B0B0B;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;letter-spacing:.5px;text-transform:uppercase;border:2px solid rgba(255,255,255,.15)">${vip.level.slice(0,3).toUpperCase()}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:11px;color:rgba(255,255,255,.55);font-weight:700;letter-spacing:.5px;text-transform:uppercase">Cliente VIP · Nivel ${esc(vip.level)}</div>
                <div style="font-size:14.5px;font-weight:700;color:#fff;letter-spacing:-.2px;margin-top:1px">${vip.points} puntos</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:9.5px;color:rgba(255,255,255,.55);font-weight:700;letter-spacing:.4px;text-transform:uppercase">${vip.visits} visita${vip.visits===1?'':'s'}</div>
                <div style="font-size:12px;color:rgba(255,255,255,.85);font-weight:600;margin-top:1px">€${Math.round(vip.spent)} gastado</div>
              </div>
            </div>
            ${vip.points_next ? `
              <div style="display:flex;justify-content:space-between;font-size:10.5px;color:rgba(255,255,255,.55);font-weight:600;letter-spacing:.3px;text-transform:uppercase;margin-bottom:5px">
                <span>${esc(vip.level)}</span><span>${vip.points_next} pts · siguiente nivel</span>
              </div>
              <div style="height:6px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden">
                <div style="height:100%;background:linear-gradient(90deg,${lvlClr},#FFD700);width:${pct}%"></div>
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:6px">A <strong style="color:#FFD700">${ptsToNext} puntos</strong> del siguiente nivel</div>
            ` : `<div style="font-size:11px;color:rgba(255,255,255,.7)">Es Diamante. Está en el nivel máximo.</div>`}
            ${!_booking._VipPointsAwarded ? `
              <div style="margin-top:12px;padding:10px 12px;background:rgba(255,215,0,.12);border:1px dashed rgba(255,215,0,.35);border-radius:8px;font-size:12px;color:#FFE682">
                <strong style="color:#FFD700">+${earnedHere} pts</strong> se sumarán al marcar este servicio como Completado
              </div>
            ` : `
              <div style="margin-top:12px;padding:10px 12px;background:rgba(48,209,88,.15);border:1px solid rgba(48,209,88,.35);border-radius:8px;font-size:12px;color:#9FE9B5">
                ✓ Puntos ya sumados a esta visita
              </div>
            `}
          </div>
        `;
      })()}

      <div class="bd-section-h">Estado del servicio</div>
      <div class="bd-action-row">
        ${!isInProgress && !isDone ? `<button class="bd-btn-action go" onclick="bdSetStatus('en_curso')">${I.play} Empezar servicio</button>` : ''}
        ${isInProgress ? `<button class="bd-btn-action done" onclick="bdOpenCheckout()">${I.check} Finalizar servicio</button>` : ''}
        ${isDone ? `<button class="bd-btn-action" onclick="bdSetStatus('en_curso')">↺ Reabrir</button>` : ''}
        ${isDone ? `<button class="bd-btn-action" style="background:rgba(10,132,255,.1);color:#0563CC;border-color:rgba(10,132,255,.25)" onclick="bdGenerarAlbaran()">📄 Albarán</button>` : ''}
        ${!isInProgress && !isDone ? `<button class="bd-btn-action" onclick="bdSetStatus('pendiente')" disabled>Pendiente</button>` : ''}
        ${isInProgress ? `<button class="bd-btn-action" onclick="bdSetStatus('pendiente')">↩ Pendiente</button>` : ''}
      </div>

      <div class="bd-section-h">Servicios extras realizados</div>
      <div class="bd-extras-list">
        ${EXTRAS_UNIQUE.map(e => `
          <label class="bd-extra ${_selectedExtras[e.key]?'checked':''}" onclick="bdToggleExtra('${e.key}')">
            <div class="bd-extra-box">${I.check}</div>
            <div class="bd-extra-info">
              <div class="bd-extra-name">${esc(e.name)}</div>
              <div class="bd-extra-price">+€${e.price.toFixed(2)}</div>
            </div>
            ${_selectedExtras[e.key] ? `<div class="bd-extra-amount">+€${e.price.toFixed(2)}</div>` : ''}
          </label>
        `).join('')}
      </div>

      <div class="bd-section-h">Nota interna (privada del equipo)</div>
      <textarea class="bd-textarea" id="bdNote" placeholder="Ej: cliente pidió aroma vainilla, se le aplicó cera doble por uso intensivo, etc.">${esc(_internalNote)}</textarea>

      <div class="bd-total-card">
        <div class="bd-total-info">
          <div class="bd-total-label">Total a cobrar</div>
          <div class="bd-total-sub">${EXTRAS_UNIQUE.filter(e=>_selectedExtras[e.key]).length} extra${EXTRAS_UNIQUE.filter(e=>_selectedExtras[e.key]).length===1?'':'s'} · base €${_basePrice.toFixed(2)}</div>
        </div>
        <div class="bd-total-amount">€${total.toFixed(2)}</div>
      </div>

    </div>

    <div class="bd-foot">
      ${_opts.allowOpenClient && b['Teléfono'] ? `<button class="bd-btn-invoice" style="background:#0A84FF" onclick="bdOpenClient()" title="Ver ficha completa del cliente">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"><circle cx="12" cy="8" r="4"/><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
        Ficha
      </button>` : ''}
      <button class="bd-btn-save" onclick="bdSaveAndClose()">${I.save} Guardar cambios</button>
      ${_opts.allowInvoice && isDone ? `<button class="bd-btn-invoice" onclick="bdEmitirFactura()">${I.file} Factura</button>` : ''}
    </div>
  `;
}

window.bdSetStatus = function(s){ _status = s; render(); };
window.bdToggleExtra = function(key){
  _selectedExtras[key] = !_selectedExtras[key];
  if (!_selectedExtras[key]) delete _selectedExtras[key];
  render();
};
/* Helper bgCall local (para llamar al backend desde este módulo) */
function bdBgCall(action, params={}){
  return new Promise((resolve, reject) => {
    const cfg = window.CONFIG || {};
    if (!cfg.script_url) { reject(new Error('no script_url')); return; }
    const cbName = '_bdcb_' + Date.now() + '_' + Math.floor(Math.random()*1000);
    window[cbName] = (data) => { delete window[cbName]; s.remove(); resolve(data); };
    const qs = new URLSearchParams({ action, token: cfg.script_token || '', callback: cbName, ...params });
    const s = document.createElement('script');
    s.src = cfg.script_url + '?' + qs.toString();
    s.onerror = () => { delete window[cbName]; s.remove(); reject(new Error('Network error')); };
    document.head.appendChild(s);
    setTimeout(() => { if (window[cbName]) { delete window[cbName]; s.remove(); reject(new Error('Timeout')); } }, 15000);
  });
}

window.bdSaveAndClose = async function(){
  if (!_booking) return;
  const note = document.getElementById('bdNote');
  if (note) _internalNote = note.value;
  _booking['Estado'] = _status;
  _booking['_Extras'] = _selectedExtras;
  _booking['_NotaInterna'] = _internalNote;
  _booking['Total'] = calculatePrice();

  const cfg = window.CONFIG || {};

  /* ─── MODO BACKEND ─── Persistir cambios de la reserva en Sheet */
  if (cfg.script_url && _opts.row) {
    try {
      await bdBgCall('updateBooking', {
        row: _opts.row,
        estado: _status,
        extras: JSON.stringify(_selectedExtras),
        notaInterna: _internalNote,
        total: calculatePrice()
      });
    } catch(e){ console.warn('No se pudo guardar la reserva en backend', e); }
  }

  /* ─── Suma de puntos VIP al pasar a "completado" ─── */
  if (_status === 'completado' && !_booking._VipPointsAwarded) {
    const phone = _booking['Teléfono'] || _booking['Telefono'];
    if (cfg.script_url && phone) {
      /* MODO BACKEND: vipAddPoints en la Sheet */
      try {
        const r = await bdBgCall('vipAddPoints', {
          phone: String(phone).replace(/[^\d]/g,''),
          points: Math.floor(_booking['Total']),
          total: _booking['Total'],
          service: _booking['Servicio'] || '',
          bookingId: _booking['ID'] || ''
        });
        if (r && r.user && !r.error) {
          _booking._VipPointsAwarded = true;
          /* Refrescar window.VIP_USERS si existe */
          if (window.VIP_USERS) {
            const idx = window.VIP_USERS.findIndex(u => String(u.phone).replace(/[^\d]/g,'') === String(r.user.phone).replace(/[^\d]/g,''));
            if (idx >= 0) {
              window.VIP_USERS[idx].points = r.user.points;
              window.VIP_USERS[idx].level = r.user.level;
              window.VIP_USERS[idx].visits = r.user.visits;
              window.VIP_USERS[idx].spent = r.user.spent;
            }
          }
          if (typeof window.toast === 'function') window.toast(`✓ +${Math.floor(_booking['Total'])} pts sumados a ${r.user.name} (${r.user.level})`);
        } else if (typeof window.toast === 'function') {
          window.toast('✓ Guardado · cliente no es VIP');
        }
      } catch(e){ if (typeof window.toast === 'function') window.toast('✓ Guardado · error sumando puntos VIP'); }
    } else if (typeof window.vipAddPoints === 'function') {
      /* MODO LOCAL: la función vipAddPoints de demo-data */
      const updated = window.vipAddPoints(phone, _booking['Total'], _booking['Servicio'], _booking['Fecha ISO'] || _booking['Fecha']);
      if (updated) {
        _booking._VipPointsAwarded = true;
        if (typeof window.toast === 'function') window.toast(`✓ +${Math.floor(_booking['Total'])} pts sumados a ${updated.name} (${updated.level})`);
      } else if (typeof window.toast === 'function') {
        window.toast('✓ Guardado · cliente no es VIP');
      }
    }
  } else if (typeof window.toast === 'function') {
    window.toast('✓ Guardado en la ficha del cliente');
  }

  if (typeof _opts.onSave === 'function') _opts.onSave(_booking);
  closeDetail();
};
window.bdEmitirFactura = function(){
  if (!_booking) return;
  // Persistir cambios antes de facturar
  const note = document.getElementById('bdNote');
  if (note) _internalNote = note.value;
  _booking['Estado'] = _status;
  _booking['_Extras'] = _selectedExtras;
  _booking['_NotaInterna'] = _internalNote;
  _booking['Total'] = calculatePrice();
  if (typeof window.abrirModalFactura === 'function') {
    window.abrirModalFactura(_booking, _booking['Nombre'], _booking['Teléfono'] || '');
  } else {
    alert('Módulo de factura no cargado.');
  }
};

window.bdOpenClient = function(){
  if (!_booking) return;
  const phone = _booking['Teléfono'] || _booking['Telefono'];
  if (!phone) return;
  closeDetail();
  setTimeout(() => {
    if (typeof window.openClientHistory === 'function') {
      const norm = String(phone).replace(/[^\d+]/g,'');
      window.openClientHistory(norm);
    }
  }, 250);
};

window.openBookingDetail = openBookingDetail;
window.closeBookingDetail = closeDetail;

/* ════════════════════════════════════════════════════════
   CHECKOUT UNIFICADO
════════════════════════════════════════════════════════ */

let _coRecurDays = 0;   // recurrencia seleccionada (0 = ninguna)
let _coCanvas = null;   // referencia al canvas de firma
let _coCtx   = null;
let _coDrawing = false;

function ensureCheckoutOverlay(){
  let o = document.getElementById('bdCheckoutOverlay');
  if (o) return o;
  o = document.createElement('div');
  o.className = 'bd-checkout-overlay';
  o.id = 'bdCheckoutOverlay';
  o.addEventListener('click', e => { if (e.target === o) closeCheckout(); });
  document.body.appendChild(o);
  return o;
}

function closeCheckout(){
  const o = document.getElementById('bdCheckoutOverlay');
  if (o) o.classList.remove('show');
}

window.bdOpenCheckout = function(){
  if (!_booking) return;
  _coRecurDays = 0;
  const vip = findVipUser(_booking['Teléfono'] || _booking['Telefono']);
  const overlay = ensureCheckoutOverlay();
  overlay.innerHTML = `
    <div class="bd-checkout-modal">
      <div class="bd-checkout-head">
        <h3>✓ Finalizar servicio</h3>
        <button onclick="closeCheckout()" style="background:rgba(255,255,255,.15);border:none;color:#fff;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:16px;line-height:1">×</button>
      </div>
      <div class="bd-checkout-body">

        <!-- VIP opt-in -->
        <div class="bd-co-vip">
          <input type="checkbox" id="coVip" ${vip ? 'checked disabled' : 'checked'}/>
          <label for="coVip">${vip ? '⭐ ' + esc(vip.name) + ' es VIP · ' + vip.level : 'Apuntar al Club VIP'}</label>
        </div>

        <!-- Matrícula / Vehículo -->
        <div class="bd-checkout-field">
          <label class="bd-checkout-label">Matrícula del vehículo</label>
          <input id="coMatricula" class="bd-checkout-input" type="text" placeholder="Ej: 1234 ABC" value="${esc(_booking['Vehículo']||_booking['Matricula']||'')}"/>
        </div>

        <!-- Método de pago -->
        <div class="bd-checkout-field">
          <label class="bd-checkout-label">Método de cobro</label>
          <select id="coPayMethod" class="bd-checkout-input">
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Bizum">Bizum</option>
            <option value="Transferencia">Transferencia</option>
            <option value="online_full">Pagado online</option>
          </select>
        </div>

        <!-- Nota interna -->
        <div class="bd-checkout-field">
          <label class="bd-checkout-label">Nota interna (opcional)</label>
          <textarea id="coNota" class="bd-checkout-input" rows="2" placeholder="Observaciones del servicio…">${esc(_internalNote)}</textarea>
        </div>

        <!-- Firma del cliente -->
        <div class="bd-checkout-field">
          <label class="bd-checkout-label">Firma del cliente</label>
          <canvas id="coCanvas" class="bd-checkout-canvas" width="460" height="120"></canvas>
          <button onclick="bdClearFirma()" style="margin-top:6px;padding:6px 12px;background:rgba(0,0,0,.05);border:none;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit">Borrar firma</button>
        </div>

        <!-- Reserva recurrente -->
        <div class="bd-checkout-field">
          <label class="bd-checkout-label">Crear próxima cita (recurrencia)</label>
          <div class="bd-checkout-recur" id="coRecurBtns">
            <button onclick="bdSelectRecur(15)">+15 días</button>
            <button onclick="bdSelectRecur(30)">+30 días</button>
            <button onclick="bdSelectRecur(45)">+45 días</button>
            <button onclick="bdSelectRecur(0)">Ninguna</button>
          </div>
        </div>

        <!-- Total -->
        <div style="background:#1D1D1F;color:#fff;padding:14px 16px;border-radius:14px;display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,.6);font-weight:700;letter-spacing:.5px;text-transform:uppercase">Total a cobrar</div>
          </div>
          <div style="font-size:28px;font-weight:700;letter-spacing:-1px">€${calculatePrice().toFixed(2)}</div>
        </div>

      </div>
      <div class="bd-checkout-foot">
        <button class="bd-btn-action" onclick="closeCheckout()" style="flex:none;padding:13px 16px">Cancelar</button>
        <button class="bd-checkout-confirm" onclick="bdConfirmCheckout()">
          ${I.check} Confirmar y cerrar
        </button>
      </div>
    </div>`;
  overlay.classList.add('show');

  /* Iniciar canvas de firma */
  setTimeout(() => {
    _coCanvas = document.getElementById('coCanvas');
    if (!_coCanvas) return;
    _coCanvas.width = _coCanvas.offsetWidth || 460;
    _coCtx = _coCanvas.getContext('2d');
    _coCtx.strokeStyle = '#1D1D1F';
    _coCtx.lineWidth = 2.5;
    _coCtx.lineCap = 'round';
    _coCtx.lineJoin = 'round';

    const getPos = ev => {
      const rect = _coCanvas.getBoundingClientRect();
      const src  = ev.touches ? ev.touches[0] : ev;
      return { x: (src.clientX - rect.left) * (_coCanvas.width / rect.width),
               y: (src.clientY - rect.top)  * (_coCanvas.height / rect.height) };
    };
    const start = ev => { ev.preventDefault(); _coDrawing=true; const p=getPos(ev); _coCtx.beginPath(); _coCtx.moveTo(p.x,p.y); };
    const draw  = ev => { ev.preventDefault(); if(!_coDrawing)return; const p=getPos(ev); _coCtx.lineTo(p.x,p.y); _coCtx.stroke(); };
    const stop  = () => { _coDrawing=false; };
    _coCanvas.addEventListener('mousedown', start);
    _coCanvas.addEventListener('mousemove', draw);
    _coCanvas.addEventListener('mouseup', stop);
    _coCanvas.addEventListener('touchstart', start, {passive:false});
    _coCanvas.addEventListener('touchmove', draw,  {passive:false});
    _coCanvas.addEventListener('touchend', stop);
  }, 80);
};

window.bdClearFirma = function(){
  if (_coCtx && _coCanvas) _coCtx.clearRect(0, 0, _coCanvas.width, _coCanvas.height);
};

window.bdSelectRecur = function(days){
  _coRecurDays = days;
  document.querySelectorAll('#coRecurBtns button').forEach((b, i) => {
    const vals = [15, 30, 45, 0];
    b.classList.toggle('sel', vals[i] === days);
  });
};

window.bdConfirmCheckout = async function(){
  if (!_booking) return;
  const matricula  = document.getElementById('coMatricula')?.value.trim() || '';
  const payMethod  = document.getElementById('coPayMethod')?.value || 'Efectivo';
  const nota       = document.getElementById('coNota')?.value.trim() || '';
  const vipOptIn   = document.getElementById('coVip')?.checked;

  /* Firma data-URL */
  let firma = '';
  if (_coCanvas) {
    const blank = document.createElement('canvas');
    blank.width = _coCanvas.width; blank.height = _coCanvas.height;
    firma = (_coCanvas.toDataURL() !== blank.toDataURL()) ? _coCanvas.toDataURL('image/png') : '';
  }

  const note = document.getElementById('bdNote');
  if (note) _internalNote = note.value;
  _booking['Estado'] = 'completado';
  _booking['_Extras'] = _selectedExtras;
  _booking['_NotaInterna'] = nota || _internalNote;
  _booking['Total'] = calculatePrice();

  const cfg = window.CONFIG || {};

  if (cfg.script_url && _opts.row) {
    try {
      const r = await bdBgCall('finalizarServicio', {
        row: _opts.row,
        estado: 'completado',
        extras: JSON.stringify(_selectedExtras),
        notaInterna: nota || _internalNote,
        total: calculatePrice(),
        matricula,
        paymentMethod: payMethod,
        firma: firma.slice(0, 5000) // limitar tamaño para URL
      });
      if (r && r.ok) {
        _booking._VipPointsAwarded = true;
        if (r.albaranId) _booking['AlbaranID'] = r.albaranId;
        let msg = '✓ Servicio finalizado';
        if (r.albaranId) msg += ' · Albarán ' + r.albaranId;
        if (r.vip && r.vip.user) msg += ' · VIP: +' + Math.floor(calculatePrice()) + ' pts';
        if (typeof window.toast === 'function') window.toast(msg);
      } else {
        if (typeof window.toast === 'function') window.toast('Error: ' + (r?.error || 'desconocido'));
      }
    } catch(e) {
      if (typeof window.toast === 'function') window.toast('✓ Guardado localmente (sin conexión)');
    }
  } else {
    /* Modo local (demo) */
    if (typeof window.vipAddPoints === 'function' && vipOptIn) {
      const phone = _booking['Teléfono'] || _booking['Telefono'];
      window.vipAddPoints(phone, _booking['Total'], _booking['Servicio'], _booking['Fecha ISO']||_booking['Fecha']);
    }
  }

  /* Reserva recurrente */
  if (_coRecurDays > 0 && cfg.script_url && _opts.row) {
    try {
      const rec = await bdBgCall('createRecurrentBooking', { row: _opts.row, days: _coRecurDays });
      if (rec && rec.ok && typeof window.toast === 'function') {
        window.toast('📅 Próxima cita creada para ' + rec.dateDisplay);
      }
    } catch(e) {}
  }

  if (typeof _opts.onSave === 'function') _opts.onSave(_booking);
  closeCheckout();
  closeDetail();
  if (typeof window.refreshAll === 'function') setTimeout(() => window.refreshAll(), 400);
};

/* Botón Generar Albarán (desde reserva ya completada) */
window.bdGenerarAlbaran = async function(){
  if (!_booking) return;
  const cfg = window.CONFIG || {};
  if (!cfg.script_url || !_opts.row) {
    if (typeof window.toast === 'function') window.toast('Requiere conexión al backend');
    return;
  }
  try {
    const r = await bdBgCall('generateAlbaran', { row: _opts.row });
    if (r && r.ok) {
      if (typeof window.toast === 'function') window.toast('📄 Albarán ' + r.id + ' generado y enviado al cliente');
      _booking['AlbaranID'] = r.id;
      render();
    } else {
      if (typeof window.toast === 'function') window.toast('Error: ' + (r?.error || 'desconocido'));
    }
  } catch(e) { if (typeof window.toast === 'function') window.toast('Error de conexión'); }
};

})();
