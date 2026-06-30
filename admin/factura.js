/* ════════════════════════════════════════════════════════════════════
   ALVATOWASH — MÓDULO DE FACTURACIÓN
   ──────────────────────────────────────────────────────────────────
   Suma al admin pro la generación de Facturas PDF con jsPDF.
   - Agrega botón "Facturar" en cada fila del historial del cliente
   - Modal con datos editables (cliente, NIF, importe, IVA)
   - Genera PDF profesional con datos del CONFIG.invoice
═════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const CFG = window.CONFIG || {};
const INV = CFG.invoice || {};

/* Numerador local persistente (último número usado) */
const NEXT_INVOICE_KEY = 'alvato-invoice-next';
function nextInvoiceNumber(){
  let n = 0;
  try { n = parseInt(localStorage.getItem(NEXT_INVOICE_KEY) || '0') } catch {}
  n++;
  try { localStorage.setItem(NEXT_INVOICE_KEY, String(n)) } catch {}
  const year = new Date().getFullYear();
  const padded = String(n).padStart(4,'0');
  return `${INV.prefix || 'ALV'}-${year}-${padded}`;
}

/* Carga jsPDF on-demand */
async function ensureJsPDF(){
  if (window.jspdf) return window.jspdf;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.jspdf;
}

/* ─────────── GENERAR FACTURA PDF ─────────── */
async function generarFacturaPDF(data){
  const { jsPDF } = await ensureJsPDF();
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const W = 210, M = 20;

  // ─── Banda superior negra con marca ───
  doc.setFillColor(10,10,10);
  doc.rect(0, 0, W, 35, 'F');
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 35, W, 2, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(24); doc.setFont('helvetica','bold');
  doc.text('ALVATOWASH', M, 19);
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(220,38,38);
  doc.text('LUXURY DETAILING', M, 25);
  doc.setTextColor(200,200,200); doc.setFontSize(9);
  doc.text(INV.web || 'lavadoybrillo.com', M, 30);

  // ─── Título "FACTURA" derecha ───
  doc.setTextColor(255,255,255); doc.setFontSize(22); doc.setFont('helvetica','bold');
  doc.text('FACTURA', W - M, 22, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(180,180,180);
  doc.text(data.numero, W - M, 28, { align: 'right' });
  doc.text(data.fecha, W - M, 33, { align: 'right' });

  // ─── Datos emisor / receptor ───
  let y = 50;
  doc.setTextColor(10,10,10); doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text('EMISOR', M, y);
  doc.text('FACTURAR A', W/2 + 5, y);
  y += 5;
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text(INV.razon_social || 'Alvatowash S.L.', M, y);
  doc.text(data.cliente || '—', W/2 + 5, y);
  y += 4.5;
  doc.setFontSize(9); doc.setTextColor(80,80,80);
  doc.text(`NIF: ${INV.nif || 'B00000000'}`, M, y);
  doc.text(`NIF: ${data.clienteNif || '—'}`, W/2 + 5, y);
  y += 4.5;
  doc.text(INV.address || 'Madrid, España', M, y);
  doc.text(data.clienteDir || data.cliente_telefono || '—', W/2 + 5, y);
  y += 4.5;
  if (INV.email) { doc.text(INV.email, M, y); y += 4.5; }
  if (INV.telefono) { doc.text(INV.telefono, M, y); y += 4.5; }

  // ─── Tabla de conceptos ───
  y = Math.max(y, 90) + 6;
  doc.setFillColor(245,245,247);
  doc.rect(M, y, W - 2*M, 9, 'F');
  doc.setTextColor(80,80,80); doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text('CONCEPTO', M + 3, y + 6);
  doc.text('CANT.', W - M - 55, y + 6, { align: 'right' });
  doc.text('PRECIO', W - M - 30, y + 6, { align: 'right' });
  doc.text('IMPORTE', W - M - 3, y + 6, { align: 'right' });
  y += 12;

  // Línea principal (servicio)
  doc.setTextColor(10,10,10); doc.setFontSize(10); doc.setFont('helvetica','bold');
  doc.text(data.servicio || 'Servicio Alvatowash', M + 3, y);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(120,120,120);
  if (data.fechaServicio) doc.text(`Fecha del servicio: ${data.fechaServicio}`, M + 3, y + 4);

  const subtotal = Number(data.subtotal) || 0;
  doc.setTextColor(10,10,10); doc.setFontSize(10);
  doc.text('1', W - M - 55, y, { align: 'right' });
  doc.text(`${subtotal.toFixed(2)}€`, W - M - 30, y, { align: 'right' });
  doc.text(`${subtotal.toFixed(2)}€`, W - M - 3, y, { align: 'right' });
  y += 9;

  doc.setDrawColor(230,230,230);
  doc.line(M, y, W - M, y);
  y += 5;

  // ─── Totales ───
  const iva = Number(data.iva) || INV.iva_default || 21;
  const ivaImporte = subtotal * (iva / 100);
  const total = subtotal + ivaImporte;

  doc.setTextColor(80,80,80); doc.setFontSize(10);
  doc.text('Subtotal', W - M - 30, y, { align: 'right' });
  doc.text(`${subtotal.toFixed(2)}€`, W - M - 3, y, { align: 'right' });
  y += 6;
  doc.text(`IVA (${iva}%)`, W - M - 30, y, { align: 'right' });
  doc.text(`${ivaImporte.toFixed(2)}€`, W - M - 3, y, { align: 'right' });
  y += 8;

  doc.setFillColor(220,38,38);
  doc.rect(W - M - 75, y - 4, 75, 11, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('TOTAL', W - M - 70, y + 3);
  doc.setFontSize(14);
  doc.text(`${total.toFixed(2)}€`, W - M - 3, y + 4, { align: 'right' });
  y += 18;

  // ─── Pie de factura ───
  doc.setTextColor(80,80,80); doc.setFontSize(8); doc.setFont('helvetica','normal');
  if (INV.iban) {
    doc.setFont('helvetica','bold');
    doc.text('Forma de pago:', M, y);
    doc.setFont('helvetica','normal');
    doc.text(`Transferencia · IBAN ${INV.iban}`, M + 30, y);
    y += 5;
  }
  if (INV.notas) { doc.text(INV.notas, M, y); y += 5; }

  // ─── Footer ───
  doc.setFontSize(7); doc.setTextColor(160,160,160);
  doc.line(M, 280, W - M, 280);
  doc.text(`${INV.razon_social || 'Alvatowash'} · ${INV.web || ''} · ${INV.email || ''}`, W/2, 285, { align: 'center' });
  doc.text(INV.footer_text || 'Gracias por confiar en Alvatowash', W/2, 290, { align: 'center' });

  doc.save(`Factura-${data.numero}.pdf`);
  return true;
}

/* ─────────── MODAL PARA EMITIR FACTURA ─────────── */
function abrirModalFactura(booking, clientName, phone){
  const modal = document.getElementById('modal');
  const modalBg = document.getElementById('modalBg');
  if (!modal || !modalBg) { alert('Error: modal no disponible'); return; }

  const subtotal = Number(booking['Total']) || 0;
  const ivaDef = (CFG.invoice && CFG.invoice.iva_default) || 21;
  const numero = nextInvoiceNumber();
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' });

  modal.innerHTML = `
    <div class="modal-head" style="border-bottom:1px solid var(--line-2);padding-bottom:14px">
      <div>
        <div class="modal-title" style="display:flex;align-items:center;gap:10px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Emitir factura
        </div>
        <div style="font-size:12.5px;color:var(--muted-2);margin-top:3px">
          ${numero} · ${fechaHoy}
        </div>
      </div>
    </div>
    <div class="modal-body" style="max-height:60vh;overflow-y:auto">
      <div class="form-group">
        <label class="form-label">Cliente</label>
        <input class="form-input" id="invCliente" value="${esc(clientName || '')}" placeholder="Nombre del cliente"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">NIF cliente</label>
          <input class="form-input" id="invNif" placeholder="NIF / DNI" value=""/>
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input class="form-input" id="invTel" value="${esc(phone || '')}" placeholder=""/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Dirección fiscal</label>
        <input class="form-input" id="invDir" placeholder="Calle, número, ciudad, CP" value=""/>
      </div>

      <div style="background:rgba(220,38,38,.04);border:1px solid rgba(220,38,38,.18);border-radius:10px;padding:14px;margin:14px 0">
        <div style="font-size:11.5px;font-weight:700;color:#991B1B;letter-spacing:.3px;text-transform:uppercase;margin-bottom:8px">Servicio facturado</div>
        <div style="font-size:14.5px;font-weight:600;color:var(--ink);margin-bottom:3px">${esc(booking['Servicio'] || 'Servicio Alvatowash')}</div>
        <div style="font-size:12.5px;color:var(--muted-2)">${esc(booking['Fecha'] || '')} · ${esc(booking['Hora'] || '')}</div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Importe sin IVA</label>
          <input class="form-input" id="invSubtotal" type="number" step="0.01" value="${(subtotal / (1 + ivaDef/100)).toFixed(2)}"/>
        </div>
        <div class="form-group">
          <label class="form-label">% IVA</label>
          <select class="form-input" id="invIva">
            <option value="21" ${ivaDef===21?'selected':''}>21%</option>
            <option value="10" ${ivaDef===10?'selected':''}>10%</option>
            <option value="4" ${ivaDef===4?'selected':''}>4%</option>
            <option value="0" ${ivaDef===0?'selected':''}>0% (exento)</option>
          </select>
        </div>
      </div>

      <div id="invPreview" style="background:var(--bg-card);border:1.5px solid var(--accent);border-radius:12px;padding:14px;margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted-2);margin-bottom:4px">
          <span>Subtotal</span><strong id="invSubPrev" style="color:var(--ink)">€0.00</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--muted-2);margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed var(--line-2)">
          <span id="invIvaLbl">IVA (21%)</span><strong id="invIvaPrev" style="color:var(--ink)">€0.00</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;color:var(--accent-dk);letter-spacing:-.4px">
          <span>TOTAL</span><span id="invTotalPrev">€0.00</span>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="invBtnGenerar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Generar PDF
      </button>
    </div>
  `;
  modalBg.classList.add('show');

  function recalcPreview(){
    const sub = parseFloat(document.getElementById('invSubtotal').value) || 0;
    const ivaPct = parseFloat(document.getElementById('invIva').value) || 0;
    const ivaImporte = sub * (ivaPct/100);
    const total = sub + ivaImporte;
    document.getElementById('invSubPrev').textContent = `€${sub.toFixed(2)}`;
    document.getElementById('invIvaLbl').textContent = `IVA (${ivaPct}%)`;
    document.getElementById('invIvaPrev').textContent = `€${ivaImporte.toFixed(2)}`;
    document.getElementById('invTotalPrev').textContent = `€${total.toFixed(2)}`;
  }
  document.getElementById('invSubtotal').addEventListener('input', recalcPreview);
  document.getElementById('invIva').addEventListener('change', recalcPreview);
  recalcPreview();

  document.getElementById('invBtnGenerar').addEventListener('click', async () => {
    const btn = document.getElementById('invBtnGenerar');
    btn.disabled = true;
    btn.innerHTML = '<span style="opacity:.7">Generando…</span>';
    try {
      await generarFacturaPDF({
        numero,
        fecha: fechaHoy,
        cliente: document.getElementById('invCliente').value.trim(),
        clienteNif: document.getElementById('invNif').value.trim(),
        cliente_telefono: document.getElementById('invTel').value.trim(),
        clienteDir: document.getElementById('invDir').value.trim(),
        servicio: booking['Servicio'] || 'Servicio Alvatowash',
        fechaServicio: booking['Fecha'] || '',
        subtotal: parseFloat(document.getElementById('invSubtotal').value) || 0,
        iva: parseFloat(document.getElementById('invIva').value) || 21
      });
      window.toast && window.toast(`✓ Factura ${numero} generada`);
      window.closeModal && window.closeModal();
    } catch(e){
      alert('Error generando la factura: ' + e.message);
      btn.disabled = false;
      btn.innerHTML = 'Generar PDF';
    }
  });
}

window.abrirModalFactura = abrirModalFactura;

/* helper esc local */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

})();
