/* ════════════════════════════════════════════════════════════════════
   ALVATOWASH — DEMO DATA precargado
   ──────────────────────────────────────────────────────────────────
   Datos precargados con las MISMAS claves que el admin pro espera
   (los headers reales de la Sheet original). Solo se activan si
   CONFIG.script_url está vacío.

   Cuando despliegues el Apps Script real, llená CONFIG.script_url
   en config.js y este archivo se ignora automáticamente.
═════════════════════════════════════════════════════════════════════ */
(function(){

/* Si ya hay backend conectado (script_url), no exponemos demos.
   Esto evita que panel/empleados/área-cliente sigan usando datos de demo. */
if (window.CONFIG && window.CONFIG.script_url) {
  console.log('%cAlvatowash · Backend conectado · demo-data desactivado', 'background:#10B981;color:#fff;padding:3px 8px;font-weight:700');
  return;
}

const TODAY = new Date();
const isoDate = d => d.toISOString().split('T')[0];
const todayIso = isoDate(TODAY);
const daysAgo  = n => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return isoDate(d); };
const daysAhead = n => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return isoDate(d); };
const fmtFecha = iso => {
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const fmtFechaLong = iso => {
  const [y,m,d] = iso.split('-');
  return new Date(+y, +m-1, +d).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' });
};

/* ─────────── RESERVAS / BOOKINGS ───────────
   Claves exactas que lee el admin: 'ID','Nombre','Teléfono','Email',
   'Servicio','Fecha','Fecha ISO','Hora','Total','Empleado','Dirección','Nota' */
const BOOKINGS = [
  // Cliente recurrente 1: María García (3 visitas en distintas fechas)
  { 'ID':'B-001', 'Nombre':'María García',   'Teléfono':'+34 612 345 678', 'Email':'maria.g@email.com', 'Servicio':'Combo Verano',           'Fecha': fmtFecha(daysAgo(85)), 'Fecha ISO': daysAgo(85), 'Hora':'10:30', 'Total':89,   'Empleado':'jhonatan', 'Dirección':'Madrid · Centro', 'Nota':'Cliente recurrente. Coche: VW Polo 1234ABC' },
  { 'ID':'B-002', 'Nombre':'María García',   'Teléfono':'+34 612 345 678', 'Email':'maria.g@email.com', 'Servicio':'Mantenimiento Plus',     'Fecha': fmtFecha(daysAgo(55)), 'Fecha ISO': daysAgo(55), 'Hora':'11:00', 'Total':45,   'Empleado':'jhonatan', 'Dirección':'Madrid · Centro', 'Nota':'Mantenimiento dentro de los 30 días - 50% off aplicado' },
  { 'ID':'B-003', 'Nombre':'María García',   'Teléfono':'+34 612 345 678', 'Email':'maria.g@email.com', 'Servicio':'Detailing Interior',     'Fecha': fmtFecha(daysAgo(20)), 'Fecha ISO': daysAgo(20), 'Hora':'09:30', 'Total':90,   'Empleado':'maria',    'Dirección':'Madrid · Centro', 'Nota':'Cliente VIP — Nivel Oro' },

  // Cliente recurrente 2: Roberto Silva (2 visitas)
  { 'ID':'B-004', 'Nombre':'Roberto Silva',  'Teléfono':'+34 678 901 234', 'Email':'rsilva@email.com',  'Servicio':'Combo Verano',           'Fecha': fmtFecha(daysAgo(60)), 'Fecha ISO': daysAgo(60), 'Hora':'12:00', 'Total':89,   'Empleado':'jhonatan', 'Dirección':'Madrid · Centro', 'Nota':'Audi A4 9012GHI' },
  { 'ID':'B-005', 'Nombre':'Roberto Silva',  'Teléfono':'+34 678 901 234', 'Email':'rsilva@email.com',  'Servicio':'Nanodiamond Cerámico',   'Fecha': fmtFecha(daysAgo(15)), 'Fecha ISO': daysAgo(15), 'Hora':'14:30', 'Total':540,  'Empleado':'jhonatan', 'Dirección':'Madrid · Centro', 'Nota':'Tratamiento cerámico premium. Reserva de 20€ pagada online' },

  // Cliente esporádico
  { 'ID':'B-006', 'Nombre':'Pilar González', 'Teléfono':'+34 654 321 987', 'Email':'pilar@email.com',   'Servicio':'Lavado Mantenimiento',   'Fecha': fmtFecha(daysAgo(40)), 'Fecha ISO': daysAgo(40), 'Hora':'15:00', 'Total':35,   'Empleado':'maria',    'Dirección':'Madrid · Centro', 'Nota':'Toyota Yaris 5678DEF' },

  // Reservas HOY (algunas sin empleado para ver el botón Asignar)
  { 'ID':'B-007', 'Nombre':'Juan Martín',    'Teléfono':'+34 611 222 333', 'Email':'juanm@email.com',   'Servicio':'Combo Verano',           'Fecha': fmtFecha(todayIso),    'Fecha ISO': todayIso,    'Hora':'09:30', 'Total':89,   'Empleado':'',         'Dirección':'Madrid · Centro', 'Nota':'VW Polo. Primera vez' },
  { 'ID':'B-008', 'Nombre':'Pilar González', 'Teléfono':'+34 654 321 987', 'Email':'pilar@email.com',   'Servicio':'Mantenimiento Plus',     'Fecha': fmtFecha(todayIso),    'Fecha ISO': todayIso,    'Hora':'10:45', 'Total':42,   'Empleado':'jhonatan', 'Dirección':'Madrid · Centro', 'Nota':'' },
  { 'ID':'B-009', 'Nombre':'Roberto Silva',  'Teléfono':'+34 678 901 234', 'Email':'rsilva@email.com',  'Servicio':'Detailing Interior',     'Fecha': fmtFecha(todayIso),    'Fecha ISO': todayIso,    'Hora':'12:00', 'Total':90,   'Empleado':'',         'Dirección':'Madrid · Centro', 'Nota':'Cliente recurrente' },
  { 'ID':'B-010', 'Nombre':'Marta López',    'Teléfono':'+34 633 444 555', 'Email':'marta@email.com',   'Servicio':'Reacondicionado Exterior','Fecha': fmtFecha(todayIso),   'Fecha ISO': todayIso,    'Hora':'13:30', 'Total':24.9, 'Empleado':'maria',    'Dirección':'Madrid · Centro', 'Nota':'' },
  { 'ID':'B-011', 'Nombre':'Daniel Ruiz',    'Teléfono':'+34 622 555 666', 'Email':'druiz@email.com',   'Servicio':'Tratamiento Cerámico',   'Fecha': fmtFecha(todayIso),    'Fecha ISO': todayIso,    'Hora':'15:00', 'Total':120,  'Empleado':'',         'Dirección':'Madrid · Centro', 'Nota':'BMW Serie 3' },

  // Reservas FUTURAS
  { 'ID':'B-012', 'Nombre':'María García',   'Teléfono':'+34 612 345 678', 'Email':'maria.g@email.com', 'Servicio':'Mantenimiento Plus (-50%)','Fecha': fmtFecha(daysAhead(2)),'Fecha ISO': daysAhead(2), 'Hora':'10:00', 'Total':22.5, 'Empleado':'',         'Dirección':'Madrid · Centro', 'Nota':'Promo mantenimiento 30 días aplicada' },
  { 'ID':'B-013', 'Nombre':'Carlos Méndez',  'Teléfono':'+34 644 777 888', 'Email':'cmendez@email.com', 'Servicio':'Combo Verano',           'Fecha': fmtFecha(daysAhead(5)),'Fecha ISO': daysAhead(5), 'Hora':'11:30', 'Total':89,   'Empleado':'jhonatan', 'Dirección':'Madrid · Centro', 'Nota':'Seat León 2345PQR' },
  { 'ID':'B-014', 'Nombre':'Elena Vega',     'Teléfono':'+34 699 888 777', 'Email':'evega@email.com',   'Servicio':'Nanodiamond Cerámico',   'Fecha': fmtFecha(daysAhead(7)),'Fecha ISO': daysAhead(7), 'Hora':'09:30', 'Total':540,  'Empleado':'',         'Dirección':'Madrid · Centro', 'Nota':'Mercedes GLE. Reserva online 20€' }
];

/* ─────────── LEADS / CARRITO OLVIDADO ───────────
   Claves exactas: 'Lead ID','Nombre','WhatsApp','Servicio','Estado',
   'Contactado','Precio desde','Fecha cita','Hora cita','Dirección',
   'Última actualización','Última actualización_iso','Abandonó en paso','Nota recuperación' */
const LEADS = [
  {
    'Lead ID':'L-2026-001',
    'Nombre':'Sergio Romero',
    'WhatsApp':'+34 666 111 222',
    'Servicio':'Combo Verano',
    'Estado':'lead_completo',
    'Contactado': false,
    'Precio desde': 89,
    'Fecha cita': fmtFecha(daysAhead(3)),
    'Hora cita':'10:00',
    'Dirección':'Madrid · Centro',
    'Última actualización':'hace 23 min',
    'Última actualización_iso': todayIso,
    'Abandonó en paso': 6,
    'Nota recuperación':'Vio precio + completó datos hasta el último paso. Cerró antes de confirmar.'
  },
  {
    'Lead ID':'L-2026-002',
    'Nombre':'Ana Martínez',
    'WhatsApp':'+34 677 222 333',
    'Servicio':'Mantenimiento Plus',
    'Estado':'lead_capturado',
    'Contactado': false,
    'Precio desde': 42,
    'Fecha cita':'',
    'Hora cita':'',
    'Dirección':'',
    'Última actualización':'hace 4 horas',
    'Última actualización_iso': todayIso,
    'Abandonó en paso': 2,
    'Nota recuperación':'Sólo dio nombre y phone. Posible cliente nuevo.'
  },
  {
    'Lead ID':'L-2026-003',
    'Nombre':'Pedro Sánchez',
    'WhatsApp':'+34 688 333 444',
    'Servicio':'Nanodiamond Cerámico',
    'Estado':'lead_completo',
    'Contactado': false,
    'Precio desde': 540,
    'Fecha cita': fmtFecha(daysAhead(10)),
    'Hora cita':'09:00',
    'Dirección':'Barcelona',
    'Última actualización':'ayer 19:45',
    'Última actualización_iso': daysAgo(1),
    'Abandonó en paso': 6,
    'Nota recuperación':'🔥 LEAD CALIENTE — vio precio Nanodiamond. Llamar AHORA.'
  },
  {
    'Lead ID':'L-2026-004',
    'Nombre':'Lucía Pérez',
    'WhatsApp':'+34 699 444 555',
    'Servicio':'Combo Verano',
    'Estado':'lead_completo',
    'Contactado': true,
    'Precio desde': 89,
    'Fecha cita': fmtFecha(daysAhead(6)),
    'Hora cita':'14:00',
    'Dirección':'Madrid',
    'Última actualización': fmtFechaLong(daysAgo(2)),
    'Última actualización_iso': daysAgo(2),
    'Abandonó en paso': 6,
    'Nota recuperación':'✓ Contactado por WhatsApp. Dijo que reservaba este fin de semana.'
  },
  {
    'Lead ID':'L-2026-005',
    'Nombre':'Diego Herrera',
    'WhatsApp':'+34 633 555 666',
    'Servicio':'Detailing Interior',
    'Estado':'lead_abandonado',
    'Contactado': false,
    'Precio desde': 90,
    'Fecha cita':'',
    'Hora cita':'',
    'Dirección':'',
    'Última actualización': fmtFechaLong(daysAgo(3)),
    'Última actualización_iso': daysAgo(3),
    'Abandonó en paso': 4,
    'Nota recuperación':'Abandonó en paso 4 (extras). Sin urgencia.'
  },
  {
    'Lead ID':'L-2026-006',
    'Nombre':'Beatriz Soto',
    'WhatsApp':'+34 622 666 777',
    'Servicio':'Lavado Mantenimiento',
    'Estado':'confirmado',
    'Contactado': true,
    'Precio desde': 35,
    'Fecha cita': fmtFecha(daysAgo(40)),
    'Hora cita':'15:00',
    'Dirección':'Madrid · Centro',
    'Última actualización': fmtFechaLong(daysAgo(40)),
    'Última actualización_iso': daysAgo(40),
    'Abandonó en paso': 7,
    'Nota recuperación':'✓ Convertido a reserva. Aparece como B-006 en confirmadas.'
  }
];

/* ─────────── EMPLEADOS (claves del admin + datos enriquecidos) ─────────── */
const EMPLOYEES = [
  { 'ID':'E-001', 'Nombre':'Jhonatan H.', 'Usuario':'jhonatan', 'Rol':'Encargado', 'Centro':'Madrid · Centro', 'Estado':'online',  'Teléfono':'+34 612 001 001', 'Horario':'L-V 9:00-18:00 · S 9:00-14:00', 'Antigüedad':'1 año 4 meses', 'JornadaHoy':'En jornada desde 09:12' },
  { 'ID':'E-002', 'Nombre':'María G.',    'Usuario':'maria',    'Rol':'Operaria',  'Centro':'Madrid · Centro', 'Estado':'online',  'Teléfono':'+34 612 002 002', 'Horario':'L-V 9:00-18:00',              'Antigüedad':'1 año 1 mes',  'JornadaHoy':'En jornada desde 09:00' },
  { 'ID':'E-003', 'Nombre':'Carlos R.',   'Usuario':'carlos',   'Rol':'Operario',  'Centro':'Barcelona',       'Estado':'offline', 'Teléfono':'+34 612 003 003', 'Horario':'L-V 10:00-19:00',             'Antigüedad':'5 meses',      'JornadaHoy':'Día libre' },
  { 'ID':'E-004', 'Nombre':'Lucía P.',    'Usuario':'lucia',    'Rol':'Encargada', 'Centro':'Valencia',        'Estado':'online',  'Teléfono':'+34 612 004 004', 'Horario':'L-V 9:30-18:30 · S 10:00-14:00','Antigüedad':'10 meses',     'JornadaHoy':'En jornada desde 09:35' }
];

/* ─────────── PRODUCTOS ─────────── */
const PRODUCTS = [
  { 'ID':'P-01', 'Nombre':'Cera carnauba premium 500ml', 'Categoría':'Cera',          'Precio':24.90, 'Stock':18 },
  { 'ID':'P-02', 'Nombre':'Shampoo neutro 5L',           'Categoría':'Lavado',        'Precio':32.00, 'Stock':7  },
  { 'ID':'P-03', 'Nombre':'Microfibra 600 GSM (pack 5)', 'Categoría':'Accesorios',    'Precio':18.50, 'Stock':34 },
  { 'ID':'P-04', 'Nombre':'Limpia-llantas pH neutro 1L', 'Categoría':'Llantas',       'Precio':14.20, 'Stock':22 },
  { 'ID':'P-05', 'Nombre':'APC desengrasante 1L',        'Categoría':'Interior',      'Precio':11.80, 'Stock':15 },
  { 'ID':'P-06', 'Nombre':'Hidratante de cuero 250ml',   'Categoría':'Cuero',         'Precio':19.50, 'Stock':9  }
];

/* ─────────── PEDIDOS DEL EQUIPO ───────────
   Claves que lee el admin: 'Empleado','Nota','Total','Fecha','Estado' */
const ORDERS = [
  { 'ID':'O-2026-018', 'Fecha': fmtFecha(daysAgo(2)), 'Empleado':'jhonatan', 'Nota':'2x Cera carnauba premium + 1x Microfibra 600 GSM (pack 5)', 'Total':68.30, 'Estado':'pendiente' },
  { 'ID':'O-2026-017', 'Fecha': fmtFecha(daysAgo(4)), 'Empleado':'maria',    'Nota':'1x Shampoo neutro 5L + 1x APC desengrasante 1L',          'Total':43.80, 'Estado':'confirmado' },
  { 'ID':'O-2026-016', 'Fecha': fmtFecha(daysAgo(7)), 'Empleado':'lucia',    'Nota':'3x Microfibra pack',                                       'Total':55.50, 'Estado':'confirmado' }
];

/* ─────────── BLOQUEOS ─────────── */
const BLOCKS = [
  { 'ID':'BL-001', 'Fecha': fmtFecha(daysAhead(3)), 'Fecha ISO': daysAhead(3), 'Hora':'13:00', 'Duración':60,  'Empleado':'', 'Nota':'Pausa del equipo (13-14h)' },
  { 'ID':'BL-002', 'Fecha': fmtFecha(daysAhead(4)), 'Fecha ISO': daysAhead(4), 'Hora':'09:00', 'Duración':120, 'Empleado':'', 'Nota':'Reparación compresor — sin reservas' }
];

/* ─────────── CLIENTES VIP (Club de fidelidad) ───────────
   Vincular cliente por número de teléfono normalizado (sin espacios ni +).
   Los puntos se suman cuando el admin/empleado marca un servicio como Completado. */
const VIP_USERS = [
  {
    phone: '34612345678',
    name: 'María García',
    email: 'maria.g@email.com',
    level: 'Oro',
    points: 720,
    points_next: 1500,                  // Diamante
    visits: 3,
    spent: 224,
    redeemed: 1,
    referred: 2,
    referral_code: 'MARIAVIP',
    joined: daysAgo(85),
    last_visit: daysAgo(20),
    rewards_log: [
      { id:'r1', name:'Aroma premium gratis', cost:100, date: daysAgo(25) }
    ]
  },
  {
    phone: '34678901234',
    name: 'Roberto Silva',
    email: 'rsilva@email.com',
    level: 'Plata',
    points: 380,
    points_next: 500,                   // Oro
    visits: 2,
    spent: 629,
    redeemed: 0,
    referred: 0,
    referral_code: 'ROBVIP',
    joined: daysAgo(60),
    last_visit: daysAgo(15),
    rewards_log: []
  },
  {
    phone: '34611222333',
    name: 'Juan Martín',
    email: 'juanm@email.com',
    level: 'Bronce',
    points: 89,
    points_next: 200,                   // Plata
    visits: 1,
    spent: 89,
    redeemed: 0,
    referred: 0,
    referral_code: 'JUANVIP',
    joined: daysAgo(7),
    last_visit: daysAgo(7),
    rewards_log: []
  }
];
window.VIP_USERS = VIP_USERS;   // Accesible desde booking-detail.js y desde la UI del admin

/* Función helper que el módulo de booking-detail llama al marcar "completado" */
window.vipAddPoints = function(phone, points, serviceName, serviceDate){
  if (!phone || !points) return null;
  const norm = String(phone).replace(/[^\d]/g,'');
  const user = VIP_USERS.find(u => u.phone === norm || norm.endsWith(u.phone.slice(-9)));
  if (!user) return null;
  user.points = (user.points || 0) + Math.floor(points);
  user.visits = (user.visits || 0) + 1;
  user.spent = (user.spent || 0) + points;
  user.last_visit = new Date().toISOString().slice(0,10);
  // Recalcular nivel
  const levels = [
    { name:'Bronce',  min:0 },
    { name:'Plata',   min:200 },
    { name:'Oro',     min:500 },
    { name:'Diamante',min:1500 }
  ];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (user.points >= levels[i].min) {
      user.level = levels[i].name;
      user.points_next = levels[i+1] ? levels[i+1].min : null;
      break;
    }
  }
  return user;
};

/* ─────────── ACCOUNT / TRIAL ─────────── */
const ACCOUNT_STATUS = {
  plan:      'profesional',
  estado:    'activo',
  days_left: 23,
  expired:   false
};

/* ──────────────────────────────────────────────────────────────────
   DISTRIBUCIÓN POR CENTRO — para que el dueño cambie de centro y
   vea KPIs distintos. Las primeras reservas/leads (las originales,
   con Jhonatan/María/Roberto/Gabriela) son del centro de Castellón;
   las nuevas que añadamos se reparten al resto.
   ────────────────────────────────────────────────────────────────── */
(function distribuirPorCentro(){
  const centros = (window.CONFIG && window.CONFIG.centros) || [];
  if (!centros.length) return;
  /* Centro "home" donde caen las reservas/leads/empleados originales */
  const HOME = centros.find(c => c.id === 'cas') || centros[0];

  /* Distribución ponderada para datos NUEVOS (no los originales home) */
  const pesos = centros.map((c) => {
    if (c.ciudad === 'Madrid')    return 30;
    if (c.ciudad === 'Barcelona') return 20;
    if (c.ciudad === 'Valencia')  return 10;
    if (c.ciudad === 'Sevilla')   return 8;
    if (c.id === 'cas')           return 0;  /* el home no se repite en el reparto random */
    return 4;
  });
  const acumulado = []; let s = 0;
  pesos.forEach(p => { s += p; acumulado.push(s); });
  function pickCentro(id){
    let h = 0; const str = String(id || Math.random());
    for (let i = 0; i < str.length; i++) h = ((h<<5) - h) + str.charCodeAt(i);
    const r = Math.abs(h) % s;
    for (let i = 0; i < acumulado.length; i++) if (r < acumulado[i]) return centros[i];
    return centros[0];
  }
  /* Las reservas/leads/pedidos con dirección "Madrid · Centro" son las
     originales del set demo: van todas a Castellón. El resto al random. */
  function asignar(arr, idKey){
    if (!Array.isArray(arr)) return;
    arr.forEach(row => {
      const dirOriginal = !row['Dirección'] || row['Dirección'] === 'Madrid · Centro';
      const c = dirOriginal ? HOME : pickCentro(row[idKey] || row.ID || row.id);
      row['Centro']   = c.id;
      row['CentroID'] = c.id;
      row['Ciudad']   = c.ciudad;
      if (dirOriginal) {
        row['Dirección'] = `${c.ciudad} · ${c.nombre.replace('Alvato ','')}`;
      }
    });
  }
  asignar(BOOKINGS, 'ID');
  asignar(LEADS,    'id');
  asignar(ORDERS,   'ID');
  /* Empleados: los del set original (Jhonatan, Gabriela, María, etc.)
     son del centro Castellón porque allí trabajan. Si alguno tiene
     campo Centro fijado por nosotros, respetarlo. */
  if (Array.isArray(EMPLOYEES)) {
    EMPLOYEES.forEach((emp) => {
      if (emp.Centro && emp.Centro !== '*' && emp.Centro !== '') return;
      emp.Centro   = HOME.id;
      emp.CentroID = HOME.id;
    });
  }
})();

/* ──────────────────────────────────────────────────────────────────
   window.DEMO_DATA — el bgCall del admin lee aquí en modo demo.
   IMPORTANTE: cada action devuelve EXACTAMENTE lo que espera el admin:
   - getBookings/getEmployees/getProducts/getOrders/getBlocks → ARRAY directo
   - getLeads → objeto { leads: [...] }
   - getAccountStatus → objeto plano con plan, estado, etc.
   ────────────────────────────────────────────────────────────────── */
window.DEMO_DATA = {
  getBookings:      BOOKINGS,
  getEmployees:     EMPLOYEES,
  getProducts:      PRODUCTS,
  getOrders:        ORDERS,
  getBlocks:        BLOCKS,
  getLeads:         { leads: LEADS },
  getAccountStatus: ACCOUNT_STATUS,

  // Stubs OK para mutaciones (no se persiste, pero no tira errores)
  addBooking:        { ok:true, row: 99 },
  updateBooking:     { ok:true },
  assignWorker:      { ok:true },
  addBlock:          { ok:true, id: 'BL-99' },
  removeBlock:       { ok:true },
  markLeadContacted: { ok:true },
  deleteLead:        { ok:true },
  setPlan:           { ok:true }
};

if (!window.CONFIG || !window.CONFIG.script_url) {
  console.log('%c⚠ ALVATOWASH ADMIN EN MODO DEMO', 'background:#DC2626;color:#fff;padding:4px 8px;font-weight:700;font-size:13px');
  console.log('14 reservas, 6 leads, 4 empleados, 6 productos, 3 pedidos precargados.');
  console.log('Para activar datos reales: rellena CONFIG.script_url en config.js');
}

})();
