/* ════════════════════════════════════════════════════════════════════
   ALVATOWASH — TRACKER B2B SOCIOS ESTRATÉGICOS
   ──────────────────────────────────────────────────────────────────
   Tracker de coches que vienen de socios B2B (Ocasión Plus por ahora,
   expandible cuando lleguen más concesionarias).

   Persistencia: localStorage (key 'alvato-b2b-v1').
   Se renderiza dentro de #b2bRoot del admin pro de Alvatowash.
═════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const STORAGE_KEY = 'alvato-b2b-v1';
const PARTNERS_KEY = 'alvato-b2b-partners-v1';
const DEFAULT_PARTNERS = ['Ocasión Plus'];   // ← arrancamos solo con este, el admin puede sumar más con el botón "+ Añadir otro"
/* Socios B2B "reales" (concesionarias). Cuando se elige uno de estos, no se muestra
   el segmentado nuevo/taller — todos los coches del socio se registran como 'socio'.
   Si el operador quiere registrar un coche particular, debe elegir partner='Particular' u 'Otro'. */
const B2B_PARTNERS_NO_TYPE = ['Ocasión Plus','Skoda','Volkswagen','Audi','BMW','Mercedes','Toyota','Renault','Peugeot','Seat'];
const TODAY = () => new Date().toISOString().split('T')[0];
const TARGET_PER_DAY = 10;

let RECORDS = {};
let PARTNERS = [...DEFAULT_PARTNERS];
let SUBTAB = 'stats';
let DAY_DATE = TODAY();
let EXPANDED_ID = null;
let SEARCH_Q = '';

function loadRecords(){
  try { const raw = localStorage.getItem(STORAGE_KEY); RECORDS = raw ? JSON.parse(raw) : {}; } catch { RECORDS = {}; }
  try { const rawP = localStorage.getItem(PARTNERS_KEY); if (rawP) PARTNERS = JSON.parse(rawP); } catch {}
}
function saveRecords(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(RECORDS)); } catch {} }
function savePartners(){ try { localStorage.setItem(PARTNERS_KEY, JSON.stringify(PARTNERS)); } catch {} }

function $b(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function fmtLong(iso){ const [y,m,d]=iso.split('-'); return new Date(y,m-1,d).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }
function fmtShort(iso){ const [y,m,d]=iso.split('-'); return new Date(y,m-1,d).toLocaleDateString('es-ES',{day:'numeric',month:'short'}); }
function fmtDay(iso){ const [y,m,d]=iso.split('-'); return new Date(y,m-1,d).toLocaleDateString('es-ES',{weekday:'short'}); }

function addCar(car){
  if (!RECORDS[DAY_DATE]) RECORDS[DAY_DATE] = [];
  RECORDS[DAY_DATE].push(car);
  saveRecords(); render();
}
function deleteCar(date, id){
  if (!RECORDS[date]) return;
  RECORDS[date] = RECORDS[date].filter(c => c.id !== id);
  if (!RECORDS[date].length) delete RECORDS[date];
  saveRecords(); render();
}
function updatePhotos(date, id, before, after){
  if (!RECORDS[date]) return;
  RECORDS[date] = RECORDS[date].map(c => c.id===id ? {...c, beforePhotos:before, afterPhotos:after} : c);
  saveRecords(); render();
}

/* ──────── CSS inyectado (paleta roja para coherencia Alvatowash) ──────── */
const CSS = `
.b2b-root{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#1C1C1E}
.b2b-tabbar{display:flex;background:#F2F2F7;border-radius:10px;padding:3px;margin-bottom:20px;gap:3px}
.b2b-tab{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 12px;border-radius:8px;font-size:13px;font-weight:600;color:#636366;letter-spacing:-.1px;background:transparent;border:none;cursor:pointer;transition:background .12s,color .12s,box-shadow .12s}
.b2b-tab:hover{color:#1C1C1E}
.b2b-tab.active{background:#fff;color:#1C1C1E;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.b2b-tab svg{width:14px;height:14px}

.b2b-page-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:14px}
.b2b-eyebrow{font-size:11px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
.b2b-h{font-size:24px;font-weight:700;color:#1C1C1E;letter-spacing:-.4px;line-height:1.1}

.b2b-card{background:#fff;border:1px solid #E5E5EA;border-radius:14px;padding:16px 18px;margin-bottom:14px}
.b2b-card-title{font-size:13px;font-weight:700;color:#1C1C1E;letter-spacing:-.1px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}

.b2b-trend{display:flex;align-items:center;gap:10px;border-radius:12px;padding:12px 14px;margin-bottom:14px;border:1px solid #E5E5EA}
.b2b-trend svg{width:18px;height:18px;flex-shrink:0}

.b2b-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
@media(max-width:680px){.b2b-kpi-grid{grid-template-columns:repeat(2,1fr)}}
.b2b-kpi{background:#fff;border:1px solid #E5E5EA;border-top:2px solid #E5E5EA;border-radius:12px;padding:14px 14px 12px}
.b2b-kpi.accent{border-top-color:#DC2626}
.b2b-kpi-num{font-size:26px;font-weight:700;letter-spacing:-.5px;color:#1C1C1E;line-height:1}
.b2b-kpi.accent .b2b-kpi-num{color:#DC2626}
.b2b-kpi-lbl{font-size:12px;font-weight:600;color:#1C1C1E;margin-top:5px}
.b2b-kpi-sub{font-size:11px;color:#AEAEB2;margin-top:1px}

.b2b-chart{display:flex;gap:4px;align-items:flex-end;height:120px;margin-top:12px;margin-bottom:10px}
.b2b-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}
.b2b-bar-val{font-size:11px;font-weight:600;color:#3A3A3C;min-height:14px;line-height:1}
.b2b-bar-track{flex:1;width:100%;background:#F2F2F7;border-radius:5px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end}
.b2b-bar-fill{width:100%;overflow:hidden;border-radius:4px 4px 0 0;min-height:2px;display:flex;flex-direction:column}
.b2b-bar-lbl{font-size:10.5px;color:#8E8E93}
.b2b-legend{display:flex;align-items:center;font-size:11px;color:#636366;margin-top:6px;gap:14px}
.b2b-legend span.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}

.b2b-dist-bar{height:10px;border-radius:6px;display:flex;overflow:hidden;margin-bottom:0;margin-top:12px}
.b2b-dist-labels{display:flex;border:1px solid #E5E5EA;border-radius:10px;overflow:hidden;margin-top:12px}
.b2b-dist-item{flex:1;padding:12px 14px;text-align:center}
.b2b-dist-num{font-size:22px;font-weight:700;letter-spacing:-.4px;line-height:1}
.b2b-dist-lbl{font-size:11px;color:#8E8E93;margin-top:3px;text-transform:uppercase;letter-spacing:.3px}
.b2b-dist-pct{font-size:12px;font-weight:600;color:#3A3A3C;margin-top:2px}
.b2b-dist-div{width:1px;background:#E5E5EA}
.b2b-dominance{font-size:12px;color:#636366;margin-top:10px;line-height:1.5}

.b2b-progress-track{height:5px;background:#E5E5EA;border-radius:3px;overflow:hidden;flex:1}
.b2b-progress-fill{height:100%;background:#DC2626;border-radius:3px;transition:width .4s}

.b2b-today-box{flex:1;border-radius:10px;padding:12px 14px;text-align:center;border:1px solid}
.b2b-today-num{font-size:24px;font-weight:700;color:#1C1C1E;letter-spacing:-.3px}
.b2b-today-lbl{font-size:11px;color:#8E8E93;margin-top:3px;text-transform:uppercase;letter-spacing:.3px}

.b2b-hist-row{display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;transition:background .1s;border-top:1px solid #F2F2F7}
.b2b-hist-row:first-child{border-top:none}
.b2b-hist-row:hover{background:#FAFAFA}
.b2b-chip{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:5px;letter-spacing:0}
.b2b-chip.nuevo{background:rgba(220,38,38,.08);color:#DC2626}
.b2b-chip.taller{background:rgba(58,58,60,.08);color:#3A3A3C}

.b2b-metric-row{display:flex;background:#fff;border:1px solid #E5E5EA;border-radius:14px;padding:16px 0;margin-bottom:16px}
.b2b-metric{flex:1;text-align:center}
.b2b-metric-num{font-size:26px;font-weight:700;color:#1C1C1E;letter-spacing:-.5px;line-height:1}
.b2b-metric-lbl{font-size:11px;color:#8E8E93;margin-top:3px;text-transform:uppercase;letter-spacing:.4px}
.b2b-metric-div{width:1px;background:#E5E5EA;align-self:center;height:32px}

.b2b-car-card{background:#fff;border:1px solid #E5E5EA;border-radius:14px;overflow:hidden;margin-bottom:8px;border-left-width:3px;border-left-style:solid}
.b2b-car-head{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer}
.b2b-car-head:hover{background:#FAFAFA}
.b2b-car-num{width:24px;height:24px;border-radius:6px;background:#F2F2F7;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#8E8E93;flex-shrink:0}
.b2b-car-name{font-size:15px;font-weight:600;color:#1C1C1E;letter-spacing:-.2px}
.b2b-car-ref{font-size:11px;color:#8E8E93;margin-top:2px;font-family:ui-monospace,monospace;letter-spacing:.03em}
.b2b-ref-tag{font-size:8px;font-weight:700;background:#F2F2F7;color:#8E8E93;padding:1px 4px;border-radius:3px;margin-right:5px;letter-spacing:.4px}
.b2b-partner-tag{font-size:10px;font-weight:700;background:#FEE2E2;color:#991B1B;padding:2px 6px;border-radius:4px;margin-left:6px;letter-spacing:.2px}

.b2b-empty{text-align:center;padding:44px 20px;background:#fff;border:1px solid #E5E5EA;border-radius:14px}

.b2b-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:none;border-radius:10px;font-size:13px;font-weight:600;padding:9px 16px;cursor:pointer;font-family:inherit;transition:background .12s,opacity .12s}
.b2b-btn-primary{background:#DC2626;color:#fff}
.b2b-btn-primary:hover{background:#B91C1C}
.b2b-btn-primary:disabled{opacity:.35;cursor:not-allowed}
.b2b-btn-second{background:#F2F2F7;color:#1C1C1E}
.b2b-btn-second:hover{background:#E5E5EA}
.b2b-btn-outline{background:#fff;border:1px solid #D1D1D6;color:#1C1C1E}
.b2b-btn-outline:hover{background:#F2F2F7}
.b2b-btn-outline:disabled{opacity:.35;cursor:not-allowed}
.b2b-btn-danger{background:transparent;color:#FF3B30;font-size:12px;font-weight:500;padding:4px 0}
.b2b-btn svg{width:13px;height:13px}

.b2b-input{width:100%;padding:10px 12px;border:1.5px solid #D1D1D6;border-radius:9px;font-size:15px;color:#1C1C1E;background:#FAFAFA;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}
.b2b-input:focus{border-color:#DC2626;box-shadow:0 0 0 3px rgba(220,38,38,.12);background:#fff}
.b2b-field-lbl{font-size:11px;font-weight:600;color:#8E8E93;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block}

.b2b-seg{display:flex;gap:4px;background:#F2F2F7;padding:3px;border-radius:10px;margin-bottom:18px}
.b2b-seg-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 10px;border:none;border-radius:8px;background:transparent;color:#636366;font-size:13px;font-weight:400;cursor:pointer;font-family:inherit;transition:all .12s}
.b2b-seg-btn.active{background:#fff;color:#1C1C1E;font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.1)}
.b2b-seg-btn svg{width:14px;height:14px}

.b2b-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);z-index:500;display:flex;align-items:flex-end;justify-content:center;animation:b2bFade .25s ease}
@media(min-width:760px){.b2b-overlay{align-items:center}}
@keyframes b2bFade{from{opacity:0}to{opacity:1}}
.b2b-sheet{background:#fff;border-radius:20px 20px 0 0;padding:10px 22px 28px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;animation:b2bUp .3s cubic-bezier(.32,.72,0,1)}
@media(min-width:760px){.b2b-sheet{border-radius:20px}}
@keyframes b2bUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
.b2b-handle{width:38px;height:4px;border-radius:2px;background:#D1D1D6;margin:0 auto 18px}

.b2b-photo-col{}
.b2b-photo-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
.b2b-photo-item{position:relative;width:54px;height:54px;border-radius:8px;overflow:hidden;border:1px solid #E5E5EA;flex-shrink:0}
.b2b-photo-item img{width:100%;height:100%;object-fit:cover}
.b2b-photo-x{position:absolute;top:2px;right:2px;width:16px;height:16px;background:rgba(0,0,0,.6);border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;padding:0}
.b2b-photo-x svg{width:9px;height:9px;stroke-width:3}
.b2b-photo-add{width:54px;height:54px;border:1.5px dashed #C7C7CC;border-radius:8px;background:#F9F9FB;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#8E8E93;flex-shrink:0}
.b2b-photo-add:hover{background:#EFEFEF}
.b2b-photo-add svg{width:18px;height:18px}

.b2b-search-box{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #E5E5EA;border-radius:12px;padding:10px 14px;margin-bottom:18px;color:#8E8E93}
.b2b-search-box > svg{width:16px;height:16px;flex-shrink:0}
.b2b-search-box input{flex:1;border:none;background:none;font-size:15px;color:#1C1C1E;font-family:inherit;outline:none}
.b2b-search-box button svg{width:14px;height:14px}

.b2b-fab-row{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}

/* Selector de centro (filtra todo el panel por sucursal) */
.b2b-centro-filter{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #E5E5EA;border-radius:10px;padding:8px 12px;margin-bottom:16px}
.b2b-centro-filter label{font-size:11px;font-weight:700;color:#8E8E93;letter-spacing:.5px;text-transform:uppercase}
.b2b-centro-filter select{flex:1;border:none;background:none;font-size:14px;font-weight:600;color:#1C1C1E;font-family:inherit;outline:none;cursor:pointer}
`;
(function injectCss(){
  if (document.getElementById('b2b-styles')) return;
  const st = document.createElement('style'); st.id = 'b2b-styles'; st.textContent = CSS;
  document.head.appendChild(st);
})();

/* ──────── SVG ICONS ──────── */
const IC = {
  car:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-6l2-5h14l2 5v6h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="M5 17h7"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  chart:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  down:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  right:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  x:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>`,
  camera:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  dl:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  wrench:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  trend:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  trendD:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`
};

/* ──────── RENDER PRINCIPAL ──────── */
let CENTRO_FILTER = 'all';   // 'all' o id de centro
function getFilteredRecords(){
  if (CENTRO_FILTER === 'all') return RECORDS;
  const out = {};
  Object.entries(RECORDS).forEach(([date, cars]) => {
    const filtered = cars.filter(c => c.centro === CENTRO_FILTER);
    if (filtered.length) out[date] = filtered;
  });
  return out;
}

function render(){
  const root = $b('b2bRoot');
  if (!root) return;
  const centros = (window.CONFIG && window.CONFIG.centros) || [];
  root.innerHTML = `
    <div class="b2b-root">
      ${centros.length > 0 ? `
        <div class="b2b-centro-filter">
          <label>Centro</label>
          <select id="b2bCentroFilter">
            <option value="all">Todos los centros</option>
            ${centros.map(c => `<option value="${c.id}" ${CENTRO_FILTER===c.id?'selected':''}>${esc(c.ciudad)} · ${esc(c.nombre)}</option>`).join('')}
          </select>
        </div>
      ` : ''}
      <div class="b2b-tabbar">
        <button class="b2b-tab ${SUBTAB==='stats'?'active':''}" data-subtab="stats">${IC.chart}<span>Estadísticas</span></button>
        <button class="b2b-tab ${SUBTAB==='day'?'active':''}" data-subtab="day">${IC.car}<span>Jornada</span></button>
        <button class="b2b-tab ${SUBTAB==='search'?'active':''}" data-subtab="search">${IC.search}<span>Buscar</span></button>
      </div>
      <div id="b2bContent"></div>
    </div>
  `;
  root.querySelectorAll('[data-subtab]').forEach(b => b.addEventListener('click', () => {
    SUBTAB = b.dataset.subtab;
    if (SUBTAB === 'day') DAY_DATE = TODAY();
    render();
  }));
  const cf = $b('b2bCentroFilter');
  if (cf) cf.addEventListener('change', e => { CENTRO_FILTER = e.target.value; render(); });

  const content = $b('b2bContent');
  if (SUBTAB === 'stats') renderStats(content);
  else if (SUBTAB === 'day') renderDay(content);
  else if (SUBTAB === 'search') renderSearch(content);

  updateSidebarBadge();
}

function updateSidebarBadge(){
  const badge = document.getElementById('sbBadgeB2B');
  if (!badge) return;
  const todayCount = (getFilteredRecords()[TODAY()] || []).length;
  if (todayCount > 0) { badge.style.display = 'inline-block'; badge.textContent = todayCount; }
  else { badge.style.display = 'none'; }
}

function renderStats(container){
  const RECS = getFilteredRecords();
  const dates = Object.keys(RECS).sort((a,b) => b.localeCompare(a));
  const totalDays = dates.length;
  const allCars = Object.values(RECS).flat();
  const totalCars = allCars.length;
  const totalNuevos = allCars.filter(c => c.type === 'nuevo').length;
  const totalTaller = allCars.filter(c => c.type === 'taller').length;
  const avgPerDay = totalDays ? (totalCars/totalDays).toFixed(1) : '—';
  const today = TODAY();
  const todayCars = RECS[today] || [];

  const last14 = dates.slice(0,14);
  const last7 = last14.slice(0,7).reduce((s,d) => s + (RECS[d]||[]).length, 0);
  const prev7 = last14.slice(7,14).reduce((s,d) => s + (RECS[d]||[]).length, 0);
  const trendPct = prev7 === 0 ? null : Math.round(((last7-prev7)/prev7)*100);

  const chartDates = dates.slice(0,7).reverse();
  const chartMax = Math.max(...chartDates.map(d => (RECS[d]||[]).length), TARGET_PER_DAY);
  const pctNuevos = totalCars ? Math.round((totalNuevos/totalCars)*100) : 50;
  const pctTaller = 100 - pctNuevos;

  const partnerCount = {};
  allCars.forEach(c => { if (c.partner) partnerCount[c.partner] = (partnerCount[c.partner]||0) + 1; });
  const topPartners = Object.entries(partnerCount).sort((a,b) => b[1]-a[1]).slice(0,5);

  container.innerHTML = `
    <div class="b2b-page-head"><div><div class="b2b-eyebrow">Panel B2B · Socios</div><div class="b2b-h">Estadísticas</div></div></div>
    ${trendPct !== null ? `<div class="b2b-trend" style="background:${trendPct>=0?'#FEF2F2':'#FFF5F5'}">${trendPct>=0?`<span style="color:#DC2626">${IC.trend}</span>`:`<span style="color:#FF3B30">${IC.trendD}</span>`}<div style="flex:1"><div style="font-size:13px;font-weight:600;color:${trendPct>=0?'#DC2626':'#FF3B30'}">${trendPct>=0?'+':''}${trendPct}% vs. semana anterior</div><div style="font-size:11px;color:#8E8E93;margin-top:1px">${last7} coches esta semana · ${prev7} la anterior</div></div></div>` : ''}
    <div class="b2b-kpi-grid">
      <div class="b2b-kpi"><div class="b2b-kpi-num">${totalCars}</div><div class="b2b-kpi-lbl">Total coches</div><div class="b2b-kpi-sub">acumulado</div></div>
      <div class="b2b-kpi"><div class="b2b-kpi-num">${avgPerDay}</div><div class="b2b-kpi-lbl">Media diaria</div><div class="b2b-kpi-sub">coches/día</div></div>
      <div class="b2b-kpi accent"><div class="b2b-kpi-num">${todayCars.length}</div><div class="b2b-kpi-lbl">Hoy</div><div class="b2b-kpi-sub">coches</div></div>
      <div class="b2b-kpi"><div class="b2b-kpi-num">${totalDays}</div><div class="b2b-kpi-lbl">Jornadas</div><div class="b2b-kpi-sub">días trabajados</div></div>
    </div>
    ${chartDates.length > 0 ? `<div class="b2b-card"><div class="b2b-card-title">Últimos ${chartDates.length} días</div><div class="b2b-chart">${chartDates.map(date => { const cars=RECS[date]||[]; const n=cars.filter(c=>c.type==='nuevo').length; const total=cars.length; const h=chartMax>0?(total/chartMax)*100:0; const nh=total>0?(n/total)*100:0; const isToday=date===today; return `<div class="b2b-bar-col" data-open-day="${date}"><div class="b2b-bar-val">${total||''}</div><div class="b2b-bar-track"><div class="b2b-bar-fill" style="height:${h}%"><div style="height:${nh}%;background:#DC2626;border-radius:3px 3px 0 0"></div><div style="height:${100-nh}%;background:#636366"></div></div></div><div class="b2b-bar-lbl" style="color:${isToday?'#DC2626':'#8E8E93'};font-weight:${isToday?700:400}">${isToday?'hoy':fmtDay(date)}</div></div>`; }).join('')}</div><div class="b2b-legend"><span><span class="dot" style="background:#DC2626"></span>Nuevos</span><span><span class="dot" style="background:#636366"></span>Taller</span></div></div>` : ''}
    <div class="b2b-card">
      <div class="b2b-card-title">Distribución por tipo</div>
      <div class="b2b-dist-bar"><div style="width:${pctNuevos}%;background:#DC2626;${pctNuevos===100?'border-radius:6px':'border-radius:6px 0 0 6px'}"></div><div style="width:${pctTaller}%;background:#3A3A3C;${pctTaller===100?'border-radius:6px':'border-radius:0 6px 6px 0'}"></div></div>
      <div class="b2b-dist-labels"><div class="b2b-dist-item"><div class="b2b-dist-num" style="color:#DC2626">${totalNuevos}</div><div class="b2b-dist-lbl">Coches nuevos</div><div class="b2b-dist-pct">${pctNuevos}%</div></div><div class="b2b-dist-div"></div><div class="b2b-dist-item"><div class="b2b-dist-num" style="color:#3A3A3C">${totalTaller}</div><div class="b2b-dist-lbl">De taller</div><div class="b2b-dist-pct">${pctTaller}%</div></div></div>
    </div>
    ${topPartners.length > 0 ? `<div class="b2b-card"><div class="b2b-card-title">Top socios</div><div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">${topPartners.map(([name, count]) => { const pct = Math.round((count/totalCars)*100); return `<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span style="font-weight:600;color:#1C1C1E">${esc(name)}</span><span style="color:#8E8E93">${count} coches · ${pct}%</span></div><div class="b2b-progress-track"><div class="b2b-progress-fill" style="width:${pct}%"></div></div></div>`; }).join('')}</div></div>` : ''}
    ${todayCars.length > 0 ? `<div class="b2b-card"><div class="b2b-card-title">Hoy<button class="b2b-btn b2b-btn-outline" data-go-day style="font-size:12px;padding:6px 10px">Ver jornada ${IC.right}</button></div><div style="display:flex;gap:12px;margin-top:8px"><div class="b2b-today-box" style="background:rgba(220,38,38,.06);border-color:rgba(220,38,38,.25)"><div class="b2b-today-num">${todayCars.filter(c=>c.type==='nuevo').length}</div><div class="b2b-today-lbl">Nuevos</div></div><div class="b2b-today-box" style="background:rgba(58,58,60,.06);border-color:rgba(58,58,60,.25)"><div class="b2b-today-num">${todayCars.filter(c=>c.type==='taller').length}</div><div class="b2b-today-lbl">Taller</div></div></div><div style="display:flex;align-items:center;gap:10px;margin-top:12px"><span style="font-size:11px;color:#8E8E93">Objetivo</span><div class="b2b-progress-track"><div class="b2b-progress-fill" style="width:${Math.min((todayCars.length/TARGET_PER_DAY)*100,100)}%"></div></div><span style="font-size:11px;color:#8E8E93;flex-shrink:0">${todayCars.length}/${TARGET_PER_DAY}</span></div></div>` : ''}
    <div class="b2b-card" style="padding:0;overflow:hidden">
      <div style="padding:14px 16px 10px"><div class="b2b-card-title" style="margin-bottom:0">Historial</div></div>
      ${dates.length === 0 ? `<div style="padding:20px 16px 24px;text-align:center;color:#AEAEB2;font-size:13px">Sin jornadas registradas todavía</div>` : dates.slice(0,20).map(date => { const cars=RECS[date]; const n=cars.filter(c=>c.type==='nuevo').length; const t=cars.filter(c=>c.type==='taller').length; const isToday=date===today; return `<div class="b2b-hist-row" data-open-day="${date}"><div style="min-width:42px;text-align:center"><div style="font-size:10px;font-weight:700;color:${isToday?'#DC2626':'#8E8E93'};text-transform:uppercase;letter-spacing:.4px">${fmtDay(date)}</div><div style="font-size:16px;font-weight:700;color:#1C1C1E">${fmtShort(date).split(' ')[0]}</div><div style="font-size:10px;color:#AEAEB2">${fmtShort(date).split(' ')[1]}</div></div><div style="flex:1"><div style="font-size:14px;font-weight:600;color:#1C1C1E">${cars.length} coches</div><div style="display:flex;gap:6px;margin-top:4px">${n>0?`<span class="b2b-chip nuevo">${n} nuevo${n!==1?'s':''}</span>`:''}${t>0?`<span class="b2b-chip taller">${t} taller</span>`:''}</div></div><span style="color:#C7C7CC;display:inline-flex">${IC.right}</span></div>`; }).join('')}
    </div>
  `;
  container.querySelectorAll('[data-open-day]').forEach(el => el.addEventListener('click', () => { DAY_DATE = el.dataset.openDay; SUBTAB = 'day'; render(); }));
  const goDay = container.querySelector('[data-go-day]');
  if (goDay) goDay.addEventListener('click', () => { DAY_DATE = TODAY(); SUBTAB = 'day'; render(); });
}

function renderDay(container){
  const RECS = getFilteredRecords();
  const cars = RECS[DAY_DATE] || [];
  const nuevos = cars.filter(c=>c.type==='nuevo').length;
  const taller = cars.filter(c=>c.type==='taller').length;
  const isToday = DAY_DATE === TODAY();

  container.innerHTML = `
    <div class="b2b-page-head">
      <div><div class="b2b-eyebrow">${isToday?'Jornada actual':'Jornada'}</div><div class="b2b-h" style="text-transform:capitalize">${fmtLong(DAY_DATE)}</div></div>
      <div style="display:flex;gap:8px;align-items:center"><input type="date" id="b2bDayDate" value="${DAY_DATE}" class="b2b-input" style="width:auto;padding:7px 10px;font-size:13px"/><button class="b2b-btn b2b-btn-outline" id="b2bExportPdf" ${cars.length===0?'disabled':''}>${IC.dl} PDF</button></div>
    </div>
    <div class="b2b-fab-row"><div></div><button class="b2b-btn b2b-btn-primary" id="b2bAddCar">${IC.plus} Añadir coche</button></div>
    <div class="b2b-metric-row"><div class="b2b-metric"><div class="b2b-metric-num">${cars.length}</div><div class="b2b-metric-lbl">Total</div></div><div class="b2b-metric-div"></div><div class="b2b-metric"><div class="b2b-metric-num" style="color:#DC2626">${nuevos}</div><div class="b2b-metric-lbl">Nuevos</div></div><div class="b2b-metric-div"></div><div class="b2b-metric"><div class="b2b-metric-num" style="color:#3A3A3C">${taller}</div><div class="b2b-metric-lbl">Taller</div></div></div>
    <div style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;font-size:11px;color:#8E8E93;margin-bottom:6px"><span>Objetivo diario</span><span>${cars.length} / ${TARGET_PER_DAY}</span></div><div class="b2b-progress-track"><div class="b2b-progress-fill" style="width:${Math.min((cars.length/TARGET_PER_DAY)*100,100)}%"></div></div></div>
    ${cars.length === 0 ? `<div class="b2b-empty"><div style="font-size:13px;font-weight:600;color:#3C3C43;margin-bottom:6px">Sin coches registrados</div><div style="font-size:12px;color:#AEAEB2">Pulsa "Añadir coche" para empezar</div></div>` : `<div id="b2bCarsList" style="display:flex;flex-direction:column;gap:8px"></div>`}
  `;
  $b('b2bDayDate').addEventListener('change', e => { DAY_DATE = e.target.value; render(); });
  $b('b2bAddCar').addEventListener('click', () => openAddCarModal());
  $b('b2bExportPdf').addEventListener('click', () => exportPdfDay(DAY_DATE));
  if (cars.length > 0) {
    const list = $b('b2bCarsList');
    cars.forEach((car, i) => list.appendChild(buildCarCard(car, i+1)));
  }
}

function buildCarCard(car, idx){
  const isN = car.type === 'nuevo';
  const wrap = document.createElement('div');
  wrap.className = 'b2b-car-card';
  wrap.style.borderLeftColor = isN ? '#DC2626' : '#3A3A3C';
  const expanded = EXPANDED_ID === car.id;
  const centros = (window.CONFIG && window.CONFIG.centros) || [];
  const centroLbl = car.centro ? (centros.find(c => c.id === car.centro)?.ciudad || car.centro) : '';
  wrap.innerHTML = `
    <div class="b2b-car-head" data-toggle>
      <div class="b2b-car-num">${idx}</div>
      <div style="flex:1;min-width:0">
        <div class="b2b-car-name">${esc(car.brand)} ${esc(car.model)}${car.partner?`<span class="b2b-partner-tag">${esc(car.partner)}</span>`:''}${centroLbl?`<span class="b2b-partner-tag" style="background:#E5E5EA;color:#3A3A3C">${esc(centroLbl)}</span>`:''}</div>
        <div class="b2b-car-ref"><span class="b2b-ref-tag">${isN?'VIN':'MAT'}</span>${esc(car.identifier)}</div>
      </div>
      <span class="b2b-chip ${car.type}">${isN?'Nuevo':'Taller'}</span>
      <span style="color:#C7C7CC;display:inline-flex;margin-left:6px;transform:${expanded?'rotate(180deg)':'rotate(0)'};transition:transform .2s">${IC.down}</span>
    </div>
    <div data-body style="display:${expanded?'block':'none'};padding:12px 14px 14px;border-top:1px solid #F2F2F7">
      ${car.notes?`<div style="background:#F9F9FB;border:1px solid #EFEFEF;border-radius:8px;padding:9px 11px;margin-bottom:12px"><div class="b2b-field-lbl">Notas</div><div style="font-size:13px;color:#3C3C43;line-height:1.5">${esc(car.notes)}</div></div>`:''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="b2b-photo-col"><div class="b2b-field-lbl">Antes</div><div class="b2b-photo-row" data-photos="before">${renderPhotos(car.beforePhotos||[])}</div><input type="file" accept="image/*" data-photo-input="before" style="display:none"/></div>
        <div class="b2b-photo-col"><div class="b2b-field-lbl">Después</div><div class="b2b-photo-row" data-photos="after">${renderPhotos(car.afterPhotos||[])}</div><input type="file" accept="image/*" data-photo-input="after" style="display:none"/></div>
      </div>
      <button class="b2b-btn b2b-btn-danger" data-delete>${IC.trash} Eliminar registro</button>
    </div>
  `;
  wrap.querySelector('[data-toggle]').addEventListener('click', () => { EXPANDED_ID = expanded ? null : car.id; render(); });
  if (expanded) {
    wrap.querySelector('[data-delete]').addEventListener('click', () => { if (confirm('¿Eliminar este registro?')) deleteCar(DAY_DATE, car.id); });
    ['before','after'].forEach(which => {
      const input = wrap.querySelector(`[data-photo-input="${which}"]`);
      const addBtn = wrap.querySelector(`[data-photos="${which}"] .b2b-photo-add`);
      if (addBtn) addBtn.addEventListener('click', () => input.click());
      input.addEventListener('change', e => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          const before = car.beforePhotos || []; const after = car.afterPhotos || [];
          if (which === 'before') updatePhotos(DAY_DATE, car.id, [...before, ev.target.result], after);
          else updatePhotos(DAY_DATE, car.id, before, [...after, ev.target.result]);
        };
        reader.readAsDataURL(file);
      });
      wrap.querySelectorAll(`[data-photos="${which}"] [data-remove-photo]`).forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.removePhoto);
          const before = car.beforePhotos || []; const after = car.afterPhotos || [];
          if (which === 'before') updatePhotos(DAY_DATE, car.id, before.filter((_,j) => j!==i), after);
          else updatePhotos(DAY_DATE, car.id, before, after.filter((_,j) => j!==i));
        });
      });
    });
  }
  return wrap;
}

function renderPhotos(photos){
  return photos.map((src,i) => `<div class="b2b-photo-item"><img src="${esc(src)}" alt=""/><button class="b2b-photo-x" data-remove-photo="${i}">${IC.x}</button></div>`).join('') + `<div class="b2b-photo-add">${IC.camera}</div>`;
}

function renderSearch(container){
  const RECS = getFilteredRecords();
  const q = SEARCH_Q.trim().toLowerCase();
  let results = [];
  Object.entries(RECS).forEach(([date, cars]) => {
    cars.forEach(car => {
      const hay = (car.brand + ' ' + car.model + ' ' + car.identifier + ' ' + (car.partner||'') + ' ' + (car.notes||'')).toLowerCase();
      if (!q || hay.includes(q) || date.includes(q)) results.push({date, car});
    });
  });
  results.sort((a,b) => b.date.localeCompare(a.date));
  container.innerHTML = `
    <div class="b2b-page-head"><div><div class="b2b-eyebrow">Localiza un servicio</div><div class="b2b-h">Buscar</div></div></div>
    <div class="b2b-search-box">${IC.search}<input type="text" id="b2bSearchInput" placeholder="Marca, modelo, matrícula, VIN, socio..." value="${esc(SEARCH_Q)}"/>${SEARCH_Q?`<button style="background:none;border:none;color:#AEAEB2;cursor:pointer;display:flex;align-items:center" id="b2bSearchClear">${IC.x}</button>`:''}</div>
    ${results.length === 0 ? `<div style="text-align:center;color:#AEAEB2;font-size:13px;padding:32px 0">${SEARCH_Q?'Sin resultados':'Comienza a escribir para buscar'}</div>` : `<div style="display:flex;flex-direction:column;gap:8px">${results.map(({date, car}) => { const isN = car.type==='nuevo'; return `<div class="b2b-car-card" style="border-left-color:${isN?'#DC2626':'#3A3A3C'}"><div class="b2b-car-head" data-open-from-search="${date}"><div style="flex:1;min-width:0"><div class="b2b-car-name">${esc(car.brand)} ${esc(car.model)}${car.partner?`<span class="b2b-partner-tag">${esc(car.partner)}</span>`:''}</div><div class="b2b-car-ref"><span class="b2b-ref-tag">${isN?'VIN':'MAT'}</span>${esc(car.identifier)} · ${fmtShort(date)}</div></div><span class="b2b-chip ${car.type}">${isN?'Nuevo':'Taller'}</span><span style="color:#C7C7CC;display:inline-flex;margin-left:6px">${IC.right}</span></div></div>`; }).join('')}</div>`}
  `;
  $b('b2bSearchInput').addEventListener('input', e => { SEARCH_Q = e.target.value; render(); });
  const clear = $b('b2bSearchClear');
  if (clear) clear.addEventListener('click', () => { SEARCH_Q = ''; render(); });
  container.querySelectorAll('[data-open-from-search]').forEach(el => el.addEventListener('click', () => { DAY_DATE = el.dataset.openFromSearch; SUBTAB = 'day'; render(); }));
}

function openAddCarModal(){
  const centros = (window.CONFIG && window.CONFIG.centros) || [];
  const overlay = document.createElement('div');
  overlay.className = 'b2b-overlay';
  overlay.innerHTML = `
    <div class="b2b-sheet" onclick="event.stopPropagation()">
      <div class="b2b-handle"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-size:18px;font-weight:700;color:#1C1C1E;letter-spacing:-.3px">Nuevo registro</div>
        <button class="b2b-btn b2b-btn-second" style="padding:7px 12px" id="b2bCloseM">${IC.x}</button>
      </div>
      <div style="margin-bottom:14px">
        <label class="b2b-field-lbl">Socio / Cliente</label>
        <select class="b2b-input" id="b2bPartner">
          ${PARTNERS.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}
          <option value="__new__">+ Añadir otro socio...</option>
        </select>
      </div>
      <div id="b2bTypeBox" style="display:none">
        <div class="b2b-field-lbl">Tipo de servicio</div>
        <div class="b2b-seg">
          <button class="b2b-seg-btn active" data-type="nuevo">${IC.car} Coche nuevo (concesionaria)</button>
          <button class="b2b-seg-btn" data-type="taller">${IC.wrench} Taller / particular</button>
        </div>
      </div>
      <div id="b2bNewPartnerBox" style="display:none;margin-bottom:14px">
        <label class="b2b-field-lbl">Nombre del nuevo socio</label>
        <input class="b2b-input" id="b2bNewPartner" placeholder="Ej. Skoda Madrid Norte"/>
      </div>
      ${centros.length > 0 ? `
        <div style="margin-bottom:14px">
          <label class="b2b-field-lbl">Centro Alvatowash</label>
          <select class="b2b-input" id="b2bCarCentro">
            ${centros.map(c => `<option value="${c.id}">${esc(c.ciudad)} · ${esc(c.nombre)}</option>`).join('')}
          </select>
        </div>
      ` : ''}
      <div style="margin-bottom:14px"><label class="b2b-field-lbl">Marca</label><input class="b2b-input" id="b2bBrand" placeholder="Skoda, BMW, Toyota..." /></div>
      <div style="margin-bottom:14px"><label class="b2b-field-lbl">Modelo</label><input class="b2b-input" id="b2bModel" placeholder="Octavia, Serie 3, Corolla..." /></div>
      <div style="margin-bottom:14px"><label class="b2b-field-lbl" id="b2bIdLbl">Número de bastidor (VIN)</label><input class="b2b-input" id="b2bId" placeholder="WBA3A5G5X..." style="font-family:ui-monospace,monospace;letter-spacing:.04em" /></div>
      <div style="margin-bottom:14px"><label class="b2b-field-lbl">Notas (opcional)</label><textarea class="b2b-input" id="b2bNotes" placeholder="Observaciones, extras..." style="min-height:60px;resize:vertical"></textarea></div>
      <div style="display:flex;gap:10px;padding-top:14px;border-top:1px solid #F2F2F7">
        <button class="b2b-btn b2b-btn-second" id="b2bCancel" style="flex:1">Cancelar</button>
        <button class="b2b-btn b2b-btn-primary" id="b2bSave" style="flex:2" disabled>${IC.check} Guardar</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  function close(){ overlay.remove(); document.body.style.overflow = ''; }
  $b('b2bCloseM').addEventListener('click', close);
  $b('b2bCancel').addEventListener('click', close);
  let type = 'nuevo';
  const partnerSelect = $b('b2bPartner');
  const newPartnerBox = $b('b2bNewPartnerBox');
  const newPartnerInput = $b('b2bNewPartner');
  const typeBox = $b('b2bTypeBox');

  function setTypeSeg(t){
    type = t;
    overlay.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('active', b.dataset.type===t));
    $b('b2bIdLbl').textContent = t==='nuevo' ? 'Número de bastidor (VIN)' : 'Matrícula';
    $b('b2bId').placeholder = t==='nuevo' ? 'WBA3A5G5X...' : '1234 ABC';
  }
  overlay.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => setTypeSeg(b.dataset.type)));

  /* Mostrar/ocultar el segmentado nuevo/taller según el socio.
     Para socios B2B (Ocasión Plus, Skoda, etc.) se asume coche en stock para preparar venta = 'nuevo'.
     Para 'Particular' / 'Otro' se muestra el segmentado. */
  function updateTypeVisibility(){
    const partnerVal = partnerSelect.value;
    if (partnerVal === '__new__') {
      // Socio nuevo todavía sin definir, mostramos el segmentado por seguridad
      typeBox.style.display = '';
      $b('b2bIdLbl').textContent = 'Número de bastidor (VIN)';
    } else if (B2B_PARTNERS_NO_TYPE.includes(partnerVal)) {
      // Socio B2B → ocultar, forzar type 'nuevo' (stock para venta)
      typeBox.style.display = 'none';
      type = 'nuevo';
      $b('b2bIdLbl').textContent = 'Número de bastidor (VIN)';
      $b('b2bId').placeholder = 'WBA3A5G5X...';
    } else {
      // 'Particular', 'Otro' u otro → mostrar
      typeBox.style.display = '';
    }
  }
  partnerSelect.addEventListener('change', () => {
    newPartnerBox.style.display = partnerSelect.value === '__new__' ? 'block' : 'none';
    updateTypeVisibility();
    validate();
  });
  // Aplicar visibilidad inicial (por defecto el primer partner es Ocasión Plus)
  updateTypeVisibility();
  function validate(){
    const brand = $b('b2bBrand').value.trim(); const model = $b('b2bModel').value.trim(); const id = $b('b2bId').value.trim();
    let partnerOk = true;
    if (partnerSelect.value === '__new__') partnerOk = newPartnerInput.value.trim().length >= 2;
    $b('b2bSave').disabled = !(brand && model && id && partnerOk);
  }
  ['b2bBrand','b2bModel','b2bId','b2bNewPartner'].forEach(id => $b(id).addEventListener('input', validate));
  $b('b2bSave').addEventListener('click', () => {
    let partner = partnerSelect.value;
    if (partner === '__new__') {
      partner = newPartnerInput.value.trim();
      if (!PARTNERS.includes(partner)) { PARTNERS.unshift(partner); savePartners(); }
    }
    const centro = $b('b2bCarCentro')?.value || '';
    addCar({
      id: Date.now().toString(),
      type, partner, centro,
      brand: $b('b2bBrand').value.trim(),
      model: $b('b2bModel').value.trim(),
      identifier: $b('b2bId').value.trim().toUpperCase(),
      notes: $b('b2bNotes').value.trim(),
      date: DAY_DATE, beforePhotos: [], afterPhotos: [],
      createdAt: new Date().toISOString()
    });
    close();
  });
}

async function exportPdfDay(date){
  try {
    if (!window.jspdf) {
      await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'mm', format:'a4' });
    const cars = (getFilteredRecords()[date] || []);
    const nuevos = cars.filter(c => c.type==='nuevo').length;
    const taller = cars.filter(c => c.type==='taller').length;
    const W = 210, M = 18;
    doc.setFillColor(28,28,30); doc.rect(0,0,W,40,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold');
    doc.text('Alvatowash', M, 17);
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(220,38,38);
    doc.text('INFORME B2B · SOCIOS ESTRATÉGICOS', M, 24);
    doc.setTextColor(255,255,255); doc.setFontSize(10);
    doc.text(fmtLong(date).toUpperCase(), M, 33);
    doc.setFillColor(242,242,247); doc.rect(0,40,W,18,'F');
    [[cars.length,'TOTAL'],[nuevos,'NUEVOS'],[taller,'TALLER']].forEach(([v,l],i) => {
      const x = M + i*56;
      doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.setTextColor(28,28,30);
      doc.text(String(v), x, 51);
      doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(142,142,147);
      doc.text(l, x, 57);
    });
    let y = 68;
    cars.forEach((car, i) => {
      if (y > 260) { doc.addPage(); y = 18; }
      const isN = car.type === 'nuevo';
      doc.setFillColor(i%2===0?255:249, i%2===0?255:249, i%2===0?255:251); doc.rect(M, y-4, W-M*2, 24, 'F');
      doc.setFillColor(isN?220:60, isN?38:60, isN?38:60); doc.rect(M, y-4, 3, 24, 'F');
      doc.setTextColor(28,28,30); doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.text(`${i+1}. ${car.brand} ${car.model}`, M+7, y+4);
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(142,142,147);
      doc.text(isN ? `BASTIDOR: ${car.identifier}` : `MATRÍCULA: ${car.identifier}`, M+7, y+10);
      if (car.partner) { doc.setTextColor(220,38,38); doc.setFont('helvetica','bold'); doc.text(`SOCIO: ${car.partner}`, M+7, y+16); doc.setFont('helvetica','normal'); }
      if (car.notes) { doc.setTextColor(100,100,100); doc.setFontSize(7); doc.text(car.notes.substring(0,90), M+7, y+20); }
      y += 28;
    });
    if (!cars.length) { doc.setTextColor(174,174,178); doc.setFontSize(12); doc.text('Sin registros.', W/2, 120, { align:'center' }); }
    const pages = doc.getNumberOfPages();
    for (let i=1; i<=pages; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(174,174,178); doc.line(M, 287, W-M, 287); doc.text(`Alvatowash · ${fmtLong(date)} · ${i}/${pages}`, W/2, 292, { align:'center' }); }
    doc.save(`alvato-b2b-${date}.pdf`);
  } catch (e) { alert('Error al generar PDF.'); console.error(e); }
}

function init(){
  loadRecords();
  if (!$b('b2bRoot')) return;
  render();
  const sidebarBtn = document.querySelector('[data-page="b2b"]');
  if (sidebarBtn) sidebarBtn.addEventListener('click', () => setTimeout(render, 50));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
