/* ════════════════════════════════════════════════════════════════════
   ALVATOWASH — BACKEND GOOGLE APPS SCRIPT
   ──────────────────────────────────────────────────────────────────
   Backend completo: Reservas, Leads, Clientes VIP, Empleados,
   Fichajes, Productos, Pedidos, Bloqueos, Cuentas, B2B, Facturas.

   DEPLOY (lee DEPLOY.md para más detalle):
   1. Apps Script → Pegar este código en Code.gs
   2. Implementar → Implementación nueva → Web App
      · Ejecutar como: yo (tu cuenta)
      · Quién tiene acceso: cualquiera
   3. Copiar la URL que devuelve y pegarla en alvatowash/config.js
      en el campo script_url
   4. Ejecutar 1 vez la función `initializeSheets()` desde el editor
   5. (Opcional) Crear trigger diario para `sendReminders()` a las 19h
═════════════════════════════════════════════════════════════════════ */

/* ════════════════ CONFIGURACIÓN ════════════════ */
const ADMIN_TOKEN = 'alvatowash2026_token_seguro'; // Debe coincidir con CONFIG.script_token

/* ════════════════ STRIPE CONFIG ════════════════
   La SECRET KEY se guarda en Script Properties para no exponerla.
   Para activar Stripe:
   1. Crear cuenta en stripe.com
   2. Dashboard → Developers → API keys → copiar Secret key (sk_test_... o sk_live_...)
   3. Apps Script → Project Settings → Script Properties → Add row:
        Key: STRIPE_SECRET_KEY    Value: sk_test_TU_KEY_AQUI
   4. Listo. El frontend ya manda la opción "Pagar online ahora" si esta key existe.
   Para desactivar Stripe: borrar esa Script Property o vaciarla. */
function getStripeKey(){
  try { return PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY') || ''; }
  catch(e) { return ''; }
}
function isStripeActive(){ return getStripeKey().length > 10; }
const PUBLIC_DOMAIN = 'https://lavadoybrillo.com'; // ← cambia esto si tu dominio es otro

/* ════════════════ TENANT METADATA (para SuperSaaS Master Admin) ════════════════
   Cada vertical (alvatowash, brillogarage, prontas, barbershop, misuñas)
   expone esta metadata vía el endpoint `tenantStatus`. El panel maestro la consume
   para mostrar: trial restante, plan, ingresos, reservas mes, último uso.
   Para cambiar el plan o extender el trial: editar acá y redeployear. */
const TENANT_META_DEFAULT = {
  tenant_id: 'alvatowash',
  tenant_name: 'Alvatowash',
  vertical: 'detailing',
  plan: 'trial',                   // ← fallback si Properties no setteado
  trial_started_at: '2026-06-01',
  trial_ends_at: '2026-07-01',
  monthly_price_eur: 0,
  owner_email: 'hhernandezseijas@gmail.com',
  owner_phone: '+34600000000',
  company_name: 'Alvatowash, S.L.',
  centros_count: 19,
  notify_emails_on_booking: true,
  notify_reminder_to_client: true
};
const SUPERSAAS_PRICE = { starter: 29, pro: 79, enterprise: 199 };

/* TENANT_META ahora es DINÁMICO: lee del Script Properties el plan y la fecha
   de validez (que el master los actualiza tras un upgrade Stripe).
   Si no hay Properties seteadas, usa los defaults. */
function getTENANT_META(){
  const props = PropertiesService.getScriptProperties();
  const plan = props.getProperty('TENANT_PLAN') || TENANT_META_DEFAULT.plan;
  const trialEnd = props.getProperty('TENANT_TRIAL_END') || TENANT_META_DEFAULT.trial_ends_at;
  const paidUntil = props.getProperty('TENANT_PAID_UNTIL') || '';
  return Object.assign({}, TENANT_META_DEFAULT, {
    plan: plan,
    trial_ends_at: trialEnd,
    paid_until: paidUntil,
    monthly_price_eur: SUPERSAAS_PRICE[plan] || 0
  });
}
/* Mantenemos el nombre TENANT_META para retro-compat — ahora es un getter */
const TENANT_META = new Proxy({}, { get: function(_, k){ return getTENANT_META()[k]; } });

/* Master token compartido para que el master-api pueda llamar setPlan en este tenant */
function getMasterToken(){
  return PropertiesService.getScriptProperties().getProperty('MASTER_TOKEN') || '';
}

function setPlan(p){
  /* Actualiza el plan y la fecha de validez. Solo callable con master_token correcto. */
  if (!p.master_token || p.master_token !== getMasterToken()) return { error:'unauthorized' };
  if (!p.plan) return { error:'plan requerido' };
  const props = PropertiesService.getScriptProperties();
  props.setProperty('TENANT_PLAN', String(p.plan));
  if (p.validUntil) {
    if (p.plan === 'trial') props.setProperty('TENANT_TRIAL_END', String(p.validUntil));
    else props.setProperty('TENANT_PAID_UNTIL', String(p.validUntil));
  }
  return { ok:true, plan: p.plan, validUntil: p.validUntil || '' };
}
const SHEET_NAMES = {
  RESERVAS:   'Reservas',
  LEADS:      'Leads',
  CLIENTES_VIP:'ClientesVIP',
  VIP_HISTORY:'VipHistory',
  EMPLEADOS:  'Empleados',
  FICHAJES:   'Fichajes',
  PRODUCTOS:  'Productos',
  PEDIDOS:    'Pedidos',
  BLOQUEOS:   'Bloqueos',
  CUENTAS:    'Cuentas',
  B2B:        'B2B',
  FACTURAS:   'Facturas',
  RESENAS:    'Resenas',
  ADMIN_USERS:'AdminUsers',
  NOTICIAS:   'Noticias',
  NOTICIAS_LEIDAS: 'NoticiasLeidas',
  GASTOS:     'Gastos',
  ALBARANES:  'Albaranes'
};
const GOOGLE_REVIEW_URL = "https://www.google.com/maps/place/Alvato+Car+Wash+L'Illa/@41.3891542,2.1312481,17z/data=!3m2!4b1!5s0x12a498652d562a99:0xe20dec708ddb4d70!4m6!3m5!1s0x12a4997e82186b87:0x52b8371eebe32557!8m2!3d41.3891502!4d2.133823!16s%2Fg%2F11tjk6dc4t?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D"; // ⚠ URL Google Business de L'Illa Diagonal (Barcelona) · cambiala si querés otra ubicación

const HEADERS = {
  Reservas:    ['ID','Fecha','Fecha ISO','Hora','Nombre','Teléfono','Email','Servicio','Total','Empleado','Dirección','Nota','Estado','Vehículo','Centro','Extras','NotaInterna','VipPointsAwarded','ReviewSent','CompletedAt','PaymentMethod','PaymentStatus','PaymentAmount','StripeSessionId','Source','UpsellApplied','UpsellNote','Matricula','FirmaData','AlbaranID'],
  Leads:       ['Lead ID','Fecha','Hora','Nombre','WhatsApp','Servicio','Precio desde','Estado','Contactado','Fecha cita','Hora cita','Dirección','Última actualización','Última actualización_iso','Abandonó en paso','Nota recuperación'],
  ClientesVIP: ['Phone','Name','Email','Password','Level','Points','Visits','Spent','Redeemed','Referred','ReferralCode','Joined','LastVisit','LastLogin'],
  VipHistory:  ['Timestamp','Phone','Type','Delta','NewTotal','Reason','BookingID'],
  Empleados:   ['ID','Nombre','Usuario','PIN','Rol','Centro','Estado','Teléfono','Horario','Antigüedad','Email'],
  Fichajes:    ['ID','Usuario','StartISO','EndISO','DurationMin','GPSOk','Latitude','Longitude','Centro'],
  Productos:   ['ID','Nombre','Categoría','Precio','Stock','ImagenURL'],
  Pedidos:     ['ID','Fecha','Empleado','Nota','Total','Estado','Centro','Items','Subtotal','IVA','Solicitante'],
  Bloqueos:    ['ID','Fecha','Fecha ISO','Hora','Duración','Empleado','Nota','Motivo'],
  Cuentas:     ['Plan','Estado','DaysLeft','TrialEndISO','LastPayment'],
  B2B:         ['ID','Fecha','Partner','Brand','Model','Identifier','Type','Notes','BeforePhotos','AfterPhotos','CreatedAt','Centro'],
  Facturas:    ['Numero','Fecha','Cliente','NIF','Servicio','Importe','IVA','Total','URL_PDF','BookingID','Estado'],
  Resenas:     ['ID','Fecha','BookingID','Cliente','Teléfono','Rating','Comentario','RedirigidoAGoogle','Centro','Empleado','Estado'],
  AdminUsers:  ['Usuario','Password','Nombre','Rol','Centro','CreatedAt','LastLogin'],
  Noticias:    ['ID','Fecha','Autor','Titulo','Cuerpo','ImagenURL','Centros','Prioridad','RequiereConfirm','EnviarEmail','Estado','LeidasCount'],
  NoticiasLeidas:['NoticiaID','Usuario','Centro','LeidaAt','ConfirmadaAt'],
  Gastos:      ['ID','Fecha','Concepto','Categoria','Importe','IVA','Total','Centro','Proveedor','MetodoPago','Notas','CreadoPor'],
  Albaranes:   ['ID','Fecha','ReservaID','Nombre','Teléfono','Email','Servicio','Total','Empleado','Centro','Extras','Matricula','Estado','Enviado','FirmaData','CreadoAt']
};

/* ════════════════ HELPERS GENERALES ════════════════ */
function ss(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet(name){
  let s = ss().getSheetByName(name);
  if (s) return s;
  /* AUTO-CREATE: si la hoja no existe pero conocemos sus headers,
     la creamos al vuelo. Esto evita "Ejecuta initializeSheets()"
     cuando agregamos nuevas tablas (Noticias, Gastos, etc.). */
  if (HEADERS && HEADERS[name]) {
    s = ss().insertSheet(name);
    s.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, HEADERS[name].length).setFontWeight('bold').setBackground('#1D1D1F').setFontColor('#FFFFFF');
    s.autoResizeColumns(1, HEADERS[name].length);
    return s;
  }
  throw new Error('Hoja no existe: ' + name + '. Ejecuta initializeSheets() primero.');
}
function jsonp(callback, data){
  const cb = callback || '_';
  const body = cb + '(' + JSON.stringify(data) + ')';
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function json(data){
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function checkToken(token){
  return String(token) === ADMIN_TOKEN;
}
function sheetToObjects(s){
  const data = s.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = data.slice(1);
  const tz = Session.getScriptTimeZone() || 'Europe/Madrid';
  return rows.map(r => {
    const o = {};
    headers.forEach((h, i) => {
      let v = r[i];
      /* Normalizar fechas en zona horaria LOCAL para evitar el bug del día -1 por UTC */
      if (v instanceof Date) {
        const headerStr = String(h);
        if (/^Hora$|^Hora\s*cita$|^Hora\s*Inicio$|^Hora\s*Fin$|HoraInicio|HoraFin/i.test(headerStr)) {
          /* Sheet detecta "15:30" como hora y la guarda como Date object con base 1899-12-30.
             Devolverla como string "HH:mm" para que el frontend la pueda ubicar en el calendario. */
          v = Utilities.formatDate(v, tz, 'HH:mm');
        } else if (/Fecha\s*ISO|fechaISO|TrialEndISO/i.test(headerStr)) {
          v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
        } else if (/StartISO|EndISO|Timestamp|CreatedAt|Joined|LastVisit|LastLogin/i.test(headerStr)) {
          v = Utilities.formatDate(v, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
        } else if (/^Fecha$|^Última actualización$/i.test(headerStr)) {
          v = Utilities.formatDate(v, tz, 'dd/MM/yyyy');
        } else {
          v = Utilities.formatDate(v, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
        }
      }
      o[h] = v;
    });
    return o;
  });
}
function getNextId(prefix){
  const props = PropertiesService.getScriptProperties();
  const key = 'next_' + prefix;
  let n = parseInt(props.getProperty(key) || '0', 10) + 1;
  props.setProperty(key, String(n));
  return prefix + '-' + String(n).padStart(4, '0');
}
function normPhone(p){
  return String(p || '').replace(/[^\d]/g, '');
}
function fmtFecha(iso){
  const [y,m,d] = String(iso).split('-');
  return `${d}/${m}/${y}`;
}

/* ════════════════ INIT (ejecutar 1 vez) ════════════════ */
function initializeSheets(){
  const spreadsheet = ss();
  Object.entries(HEADERS).forEach(([name, headers]) => {
    let s = spreadsheet.getSheetByName(name);
    if (!s) s = spreadsheet.insertSheet(name);
    if (s.getLastRow() === 0) {
      s.getRange(1, 1, 1, headers.length).setValues([headers]);
      s.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1D1D1F').setFontColor('#FFFFFF');
      s.setFrozenRows(1);
    }
  });
  // Sembrar empleados demo si la hoja está vacía
  // IMPORTANTE: el campo Centro es el ID del centro (cas, mad, bcn, ...)
  // tal como aparece en config.js de la landing. Así el filtro de
  // reservas por centro funciona automáticamente.
  const eS = spreadsheet.getSheetByName(SHEET_NAMES.EMPLEADOS);
  if (eS.getLastRow() === 1) {
    const seed = [
      ['E-001','Jhonatan Humberto Hernandez','jhonatan','1234','Encargado','cas','online','+34 612 001 001','L-S 9:00-20:00','1 año 4 meses','jhonatan@alvato.com'],
      ['E-002','Gabriela Pérez','gabriela','1234','Personal Washer','cas','online','+34 612 002 002','L-V 9:00-18:00','1 año 1 mes','gabriela@alvato.com'],
      ['E-003','María García','maria','1234','Personal Washer','cas','online','+34 612 003 003','L-V 10:00-19:00','5 meses','maria@alvato.com'],
      ['E-004','Antonio Ruiz','antonio','1234','Personal Washer','mad','online','+34 612 004 004','L-S 9:00-20:00','10 meses','antonio@alvato.com']
    ];
    eS.getRange(2, 1, seed.length, seed[0].length).setValues(seed);
  }
  // Cuenta inicial
  const cS = spreadsheet.getSheetByName(SHEET_NAMES.CUENTAS);
  if (cS.getLastRow() === 1) {
    cS.getRange(2, 1, 1, 5).setValues([['trial','activo',14,'','']]);
  }
  // AdminUsers iniciales: 1 super admin (todos los centros) + 4 encargados por centro
  const aS = spreadsheet.getSheetByName(SHEET_NAMES.ADMIN_USERS);
  if (aS.getLastRow() === 1) {
    const now = new Date().toISOString();
    aS.getRange(2, 1, 5, 7).setValues([
      ['admin',     'alvato2026',     'Dueño Alvatowash', 'superadmin', '*',   now, ''],
      ['mad',       'mad2026',        'Encargado Madrid', 'encargado',  'mad', now, ''],
      ['bcn',       'bcn2026',        'Encargado Barcelona','encargado','bcn', now, ''],
      ['val',       'val2026',        'Encargada Valencia','encargado', 'val', now, ''],
      ['sev',       'sev2026',        'Encargado Sevilla','encargado',  'sev', now, '']
    ]);
  }
  return 'OK';
}

/* ════════════════════════════════════════════════════════════════════
   SEED de TODOS los encargados (19 centros)
   ──────────────────────────────────────────────────────────────────
   Ejecutar UNA VEZ desde el editor de Apps Script:
   Run → seedTodosLosEncargados
   Crea los 14 encargados que faltan SIN duplicar los ya existentes.
   Patrón de credenciales:
     usuario  = id del centro (ej. 'mad', 'bcn', 'cas')
     password = id del centro + '2026' (ej. 'mad2026', 'cas2026')
   ════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════
   LOGIN del PANEL DE EMPLEADOS
   ──────────────────────────────────────────────────────────────────
   Se llama desde empleados/index.html cuando alguien escribe usuario+PIN.
   Devuelve el objeto del empleado con su centro asignado, o un error.
   ════════════════════════════════════════════════════════════════════ */
function loginEmpleado(p){
  const usuario = String(p.usuario || '').toLowerCase().trim();
  const pin     = String(p.pin || '');
  if (!usuario || !pin) return { ok:false, error:'Faltan usuario y PIN' };
  const data = sheet(SHEET_NAMES.EMPLEADOS).getDataRange().getValues();
  if (data.length < 2) return { ok:false, error:'No hay empleados sembrados. Ejecutá seedEmpleadosAlvato.' };
  const headers = data[0];
  const idxU  = headers.indexOf('Usuario');
  const idxP  = headers.indexOf('PIN');
  const idxC  = headers.indexOf('Centro');
  const idxN  = headers.indexOf('Nombre');
  const idxR  = headers.indexOf('Rol');
  const idxE  = headers.indexOf('Estado');
  for (let i = 1; i < data.length; i++) {
    const u = String(data[i][idxU]||'').toLowerCase().trim();
    const k = String(data[i][idxP]||'').trim();
    if (u === usuario && k === pin) {
      const estado = String(data[i][idxE]||'online').toLowerCase();
      if (estado === 'baja' || estado === 'inactivo') return { ok:false, error:'Cuenta dada de baja. Contactá con la dueña.' };
      return {
        ok: true,
        user: usuario,
        name: data[i][idxN],
        rol:  data[i][idxR],
        centro: String(data[i][idxC]||'').trim(),
        estado: estado,
        id: data[i][0]
      };
    }
  }
  return { ok:false, error:'Usuario o PIN incorrecto' };
}

/* getBookings con filtro por centro (lo usa el panel de empleados) */
function getBookingsByCentro(p){
  const centro = String(p.centro || '').toLowerCase().trim();
  const all = sheetToObjects(sheet(SHEET_NAMES.RESERVAS));
  if (!centro || centro === '*') return all;
  return all.filter(b => {
    const c = String(b.Centro || b.CentroID || '').toLowerCase().trim();
    return c === centro;
  });
}

/* ════════════════════════════════════════════════════════════════════
   SEED de TODOS los empleados (1 encargado + 2 washers por centro)
   ──────────────────────────────────────────────────────────────────
   Ejecutar UNA VEZ desde el editor: Run → seedEmpleadosAlvato
   No duplica los empleados que ya existan (por usuario).
   ════════════════════════════════════════════════════════════════════ */
function seedEmpleadosAlvato(){
  const centros = [
    { id:'bcn', ciudad:'Barcelona' },{ id:'mad', ciudad:'Madrid' },{ id:'mal', ciudad:'Mallorca' },
    { id:'vig', ciudad:'Vigo' },    { id:'val', ciudad:'Valencia' },{ id:'tnf', ciudad:'Tenerife' },
    { id:'sev', ciudad:'Sevilla' }, { id:'lpa', ciudad:'Las Palmas' },{ id:'cas', ciudad:'Castellón' },
    { id:'gra', ciudad:'Granada' }, { id:'reu', ciudad:'Reus' },    { id:'and', ciudad:'Andorra' },
    { id:'pam', ciudad:'Pamplona' },{ id:'gij', ciudad:'Gijón' },   { id:'cor', ciudad:'A Coruña' },
    { id:'zar', ciudad:'Zaragoza' },{ id:'mlg', ciudad:'Málaga' },  { id:'tar', ciudad:'Tarragona' },
    { id:'gir', ciudad:'Girona' }
  ];
  const s = sheet(SHEET_NAMES.EMPLEADOS);
  const data = s.getDataRange().getValues();
  const headers = data[0];
  const idxU = headers.indexOf('Usuario');
  const existentes = {};
  for (let i = 1; i < data.length; i++) existentes[String(data[i][idxU]||'').toLowerCase().trim()] = true;

  let nuevos = 0;
  centros.forEach(c => {
    /* Encargado del centro */
    const userEnc = 'enc_' + c.id;
    if (!existentes[userEnc]) {
      s.appendRow([
        'E-ENC-' + c.id.toUpperCase(),  /* ID */
        'Encargado/a ' + c.ciudad,      /* Nombre */
        userEnc,                         /* Usuario */
        c.id + '99',                     /* PIN */
        'Encargado',                     /* Rol */
        c.id,                            /* Centro (ID) */
        'online',                        /* Estado */
        '+34 600 000 000',               /* Teléfono */
        'L-S 9:00-20:00',                /* Horario */
        'Nuevo',                         /* Antigüedad */
        c.id + '@alvato.com'             /* Email */
      ]);
      nuevos++;
    }
    /* 2 Personal Washers */
    [1,2].forEach(n => {
      const user = c.id + '_w' + n;
      if (!existentes[user]) {
        s.appendRow([
          'E-WSH-' + c.id.toUpperCase() + '-' + n,
          'Washer ' + n + ' · ' + c.ciudad,
          user,
          '1234',
          'Personal Washer',
          c.id,
          'online',
          '+34 600 000 0' + n + n,
          'L-V 9:00-18:00',
          'Nuevo',
          user + '@alvato.com'
        ]);
        nuevos++;
      }
    });
  });
  return 'Empleados nuevos sembrados: ' + nuevos;
}

function seedTodosLosEncargados(){
  /* Lista canónica de los 19 centros con su ciudad/nombre del config.js */
  const centros = [
    { id:'bcn', ciudad:'Barcelona' },
    { id:'mad', ciudad:'Madrid' },
    { id:'mal', ciudad:'Mallorca' },
    { id:'vig', ciudad:'Vigo' },
    { id:'val', ciudad:'Valencia' },
    { id:'tnf', ciudad:'Tenerife' },
    { id:'sev', ciudad:'Sevilla' },
    { id:'lpa', ciudad:'Las Palmas' },
    { id:'cas', ciudad:'Castellón' },
    { id:'gra', ciudad:'Granada' },
    { id:'reu', ciudad:'Reus' },
    { id:'and', ciudad:'Andorra' },
    { id:'pam', ciudad:'Pamplona' },
    { id:'gij', ciudad:'Gijón' },
    { id:'cor', ciudad:'A Coruña' },
    { id:'zar', ciudad:'Zaragoza' },
    { id:'mlg', ciudad:'Málaga' },
    { id:'tar', ciudad:'Tarragona' },
    { id:'gir', ciudad:'Girona' }
  ];
  const s = sheet(SHEET_NAMES.ADMIN_USERS);
  const data = s.getDataRange().getValues();
  const existentes = {};
  for (let i = 1; i < data.length; i++) existentes[String(data[i][0]).toLowerCase().trim()] = true;
  const now = new Date().toISOString();
  let nuevos = 0;
  centros.forEach(c => {
    if (existentes[c.id]) return;            /* ya estaba: no duplicar */
    s.appendRow([
      c.id,                                  /* usuario */
      c.id + '2026',                         /* contraseña */
      'Encargado ' + c.ciudad,               /* nombre */
      'encargado',                           /* rol */
      c.id,                                  /* centro (solo ve este) */
      now,                                   /* createdAt */
      ''                                     /* lastLogin */
    ]);
    nuevos++;
  });
  return 'Encargados nuevos: ' + nuevos + ' · Total filas: ' + (data.length - 1 + nuevos);
}

/* ════════════════ HANDLERS ════════════════ */
function doGet(e){
  const params = e.parameter || {};
  const cb = params.callback;
  const action = params.action || '';
  /* Actions PÚBLICAS (no requieren token): login de empleados y healthcheck */
  const ACCIONES_PUBLICAS = ['loginEmpleado','version','lastPost'];
  if (ACCIONES_PUBLICAS.indexOf(action) < 0 && !checkToken(params.token)){
    return jsonp(cb, { error: 'Token inválido' });
  }
  try {
    switch (action) {
      case 'getBookings':       return jsonp(cb, getBookings());
      case 'getBookingsByCentro':return jsonp(cb, getBookingsByCentro(params));
      case 'loginEmpleado':     return jsonp(cb, loginEmpleado(params));
      case 'getLeads':          return jsonp(cb, { leads: getLeads() });
      case 'getEmployees':      return jsonp(cb, getEmployees());
      case 'getProducts':       return jsonp(cb, getProducts());
      case 'getOrders':         return jsonp(cb, getOrders());
      case 'getBlocks':         return jsonp(cb, getBlocks());
      case 'getAccountStatus':  return jsonp(cb, getAccountStatus());
      case 'getVipUsers':       return jsonp(cb, { vip: getVipUsers() });
      case 'getVipHistory':     return jsonp(cb, { history: getVipHistory(params.phone) });
      case 'getB2bCars':        return jsonp(cb, { cars: getB2bCars() });
      case 'getFacturas':       return jsonp(cb, { facturas: getFacturas() });
      case 'getNextInvoice':    return jsonp(cb, { numero: peekNextInvoice() });
      case 'getResenas':        return jsonp(cb, { resenas: getResenas() });
      case 'getBookingForReview':return jsonp(cb, getBookingForReview(params.id));
      case 'submitReview':      return jsonp(cb, submitReview(params));
      case 'sendReviewRequests':return jsonp(cb, sendReviewRequests());
      case 'adminLogin':        return jsonp(cb, adminLogin(params));
      case 'getAdminUsers':     return jsonp(cb, { users: getAdminUsers() });
      case 'addAdminUser':      return jsonp(cb, addAdminUser(params));
      case 'deleteAdminUser':   return jsonp(cb, deleteAdminUser(params));
      case 'createStripeSession':return jsonp(cb, createStripeSession(params));
      case 'confirmStripePayment':return jsonp(cb, confirmStripePayment(params));
      case 'stripeStatus':      return jsonp(cb, { active: isStripeActive() });
      case 'createBookingPublic':return jsonp(cb, createBookingPublic(params));
      case 'tenantStatus':      return jsonp(cb, tenantStatus());
      case 'setPlan':           return jsonp(cb, setPlan(params));
      case 'addBooking':        return jsonp(cb, addBooking(params));
      case 'updateBooking':     return jsonp(cb, updateBooking(params));
      case 'assignWorker':      return jsonp(cb, assignWorker(params));
      case 'addBlock':          return jsonp(cb, addBlock(params));
      case 'removeBlock':       return jsonp(cb, removeBlock(params));
      case 'markLeadContacted': return jsonp(cb, markLeadContacted(params));
      case 'deleteLead':        return jsonp(cb, deleteLead(params));
      case 'vipRegister':       return jsonp(cb, vipRegister(params));
      case 'vipLogin':          return jsonp(cb, vipLogin(params));
      case 'vipAddPoints':      return jsonp(cb, vipAddPoints(params));
      case 'vipRedeemReward':   return jsonp(cb, vipRedeemReward(params));
      case 'vipAdjustPoints':   return jsonp(cb, vipAdjustPoints(params));
      case 'clockIn':           return jsonp(cb, clockIn(params));
      case 'clockOut':          return jsonp(cb, clockOut(params));
      case 'addB2bCar':         return jsonp(cb, addB2bCar(params));
      case 'logInvoice':        return jsonp(cb, logInvoice(params));
      case 'addOrder':          return jsonp(cb, addOrder(params));
      case 'updateOrderStatus': return jsonp(cb, updateOrderStatus(params));
      case 'getNoticias':       return jsonp(cb, { items: getNoticias(params) });
      case 'addNoticia':        return jsonp(cb, addNoticia(params));
      case 'markNoticiaLeida':  return jsonp(cb, markNoticiaLeida(params));
      case 'deleteNoticia':     return jsonp(cb, deleteNoticia(params));
      case 'getNoticiasLeidas': return jsonp(cb, { items: getNoticiasLeidas(params) });
      case 'updateBookingUpsell':return jsonp(cb, updateBookingUpsell(params));
      case 'getGastos':         return jsonp(cb, { items: getGastos(params) });
      case 'addGasto':          return jsonp(cb, addGasto(params));
      case 'deleteGasto':       return jsonp(cb, deleteGasto(params));
      case 'getContabilidad':   return jsonp(cb, getContabilidad(params));
      case 'finalizarServicio': return jsonp(cb, finalizarServicio(params));
      case 'generateAlbaran':   return jsonp(cb, generateAlbaran(params));
      case 'getAlbaran':        return jsonp(cb, getAlbaran(params));
      case 'createRecurrentBooking': return jsonp(cb, createRecurrentBooking(params));
      case 'scheduleLead':      return jsonp(cb, scheduleLead(params));
      case 'version':           return jsonp(cb, { version: '2026.06.28', ok: true });
      default:                  return jsonp(cb, { error: 'Acción desconocida: ' + action });
    }
  } catch (err) {
    return jsonp(cb, { error: String(err), stack: err.stack });
  }
}

function doPost(e){
  const params = e.parameter || {};
  const op = params.op || '';
  let body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch {}
  /* Lead save desde booking widget */
  if (op === 'lead_save' || body.op === 'lead_save') {
    return json(saveLead(body));
  }
  /* Reserva real (sin op): el booking widget hace POST sin op cuando confirma */
  if (body && body.name && body.service && (body.dateDisplay || body.dateISO)) {
    return json(createBookingFromWidget(body));
  }
  return json({ error: 'Operación POST desconocida' });
}

/* ════════════════ RESERVAS ════════════════ */
function getBookings(){
  return sheetToObjects(sheet(SHEET_NAMES.RESERVAS));
}
function addBooking(p){
  const s = sheet(SHEET_NAMES.RESERVAS);
  const id = getNextId('B');
  const dateISO = p.dateISO || '';
  const row = [id, p.dateDisplay || fmtFecha(dateISO), dateISO, p.time || '', p.name || '', p.phone || '', p.email || '', p.service || '', Number(p.total) || 0, p.worker || '', p.address || '', p.note || '', p.status || 'pendiente', p.vehicle || '', p.centro || '', '', '', false];
  s.appendRow(row);
  return { ok: true, id: id, row: s.getLastRow() };
}
function updateBooking(p){
  const s = sheet(SHEET_NAMES.RESERVAS);
  const row = parseInt(p.row, 10);
  if (!row || row < 2) return { error: 'Fila inválida' };
  if (p.dateDisplay) s.getRange(row, 2).setValue(p.dateDisplay);
  if (p.dateISO) s.getRange(row, 3).setValue(p.dateISO);
  if (p.time) s.getRange(row, 4).setValue(p.time);
  if (p.nota !== undefined) s.getRange(row, 12).setValue(p.nota);
  if (p.estado) {
    s.getRange(row, 13).setValue(p.estado);
    /* Si pasa a "completado" y CompletedAt está vacío, lo seteamos para que el trigger
       de reseñas sepa cuándo fue completado y mande email 1h+ después. */
    if (String(p.estado).toLowerCase() === 'completado') {
      const headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
      const idxCompletedAt = headers.indexOf('CompletedAt');
      if (idxCompletedAt >= 0) {
        const cur = s.getRange(row, idxCompletedAt+1).getValue();
        if (!cur) s.getRange(row, idxCompletedAt+1).setValue(new Date().toISOString());
      }
    }
  }
  if (p.extras !== undefined) s.getRange(row, 16).setValue(typeof p.extras === 'string' ? p.extras : JSON.stringify(p.extras));
  if (p.notaInterna !== undefined) s.getRange(row, 17).setValue(p.notaInterna);
  if (p.total !== undefined) s.getRange(row, 9).setValue(Number(p.total));
  return { ok: true };
}
function assignWorker(p){
  const s = sheet(SHEET_NAMES.RESERVAS);
  const row = parseInt(p.row, 10);
  if (!row || row < 2) return { error: 'Fila inválida' };
  s.getRange(row, 10).setValue(p.worker || '');
  return { ok: true };
}
function createBookingFromWidget(b){
  /* Crea la reserva desde el booking widget público (sin token) */
  const id = getNextId('B');
  const s = sheet(SHEET_NAMES.RESERVAS);
  const dateISO = b.dateISO || '';
  const extrasStr = b.extras || '';
  s.appendRow([id, b.dateDisplay || fmtFecha(dateISO), dateISO, b.time || '', b.name || '', b.phone || '', b.email || '', b.service || '', Number(b.total) || 0, '', b.address || '', b.payment || '', 'pendiente', b.vehicle || '', b.centro_id || '', extrasStr, '', false]);
  /* Si el cliente tiene phone y existe en VIP, actualizamos last_visit en BG (no puntos hasta que el admin marque completado) */
  return { ok: true, id: id };
}

/* ════════════════ FINALIZAR SERVICIO (checkout unificado) ════════════════ */
function finalizarServicio(p){
  /* Marca la reserva como completada, guarda matrícula/firma/pago, genera albarán y suma puntos VIP. */
  const row = parseInt(p.row, 10);
  if (!row || row < 2) return { error: 'Fila inválida' };
  const rs = sheet(SHEET_NAMES.RESERVAS);
  const headers = rs.getRange(1, 1, 1, rs.getLastColumn()).getValues()[0];
  const rowData  = rs.getRange(row, 1, 1, rs.getLastColumn()).getValues()[0];
  function col(name){ return headers.indexOf(name); }

  /* Estado → completado */
  rs.getRange(row, col('Estado')+1).setValue('completado');
  rs.getRange(row, col('CompletedAt')+1).setValue(new Date().toISOString());

  /* Pago */
  rs.getRange(row, col('PaymentStatus')+1).setValue('paid');
  if (p.paymentMethod) rs.getRange(row, col('PaymentMethod')+1).setValue(p.paymentMethod);

  /* Matrícula */
  if (p.matricula) rs.getRange(row, col('Matricula')+1).setValue(p.matricula);

  /* Extras */
  if (p.extras) rs.getRange(row, col('Extras')+1).setValue(typeof p.extras==='string'?p.extras:JSON.stringify(p.extras));
  if (p.total) rs.getRange(row, col('Total')+1).setValue(Number(p.total));
  if (p.notaInterna) rs.getRange(row, col('NotaInterna')+1).setValue(p.notaInterna);

  /* Firma (data-URL) */
  if (p.firma) rs.getRange(row, col('FirmaData')+1).setValue(p.firma);

  /* Construir objeto reserva actualizado para pasar a generateAlbaran */
  const updatedRow = rs.getRange(row, 1, 1, rs.getLastColumn()).getValues()[0];
  const bookingObj = {};
  headers.forEach((h, i) => { bookingObj[h] = updatedRow[i]; });

  /* Generar albarán */
  let albaranId = '';
  try {
    const alb = _createAlbaran(bookingObj, p.firma || '');
    albaranId = alb.id;
    if (col('AlbaranID') >= 0) rs.getRange(row, col('AlbaranID')+1).setValue(albaranId);
  } catch(e) { Logger.log('Error generando albarán: ' + e); }

  /* Puntos VIP (crear cliente si no existe) */
  let vipResult = null;
  const phone = bookingObj['Teléfono'] || '';
  if (phone) {
    vipResult = vipAddPoints({
      phone: String(phone).replace(/[^\d]/g,''),
      points: Math.floor(Number(bookingObj['Total'])||0),
      total: Number(bookingObj['Total'])||0,
      service: bookingObj['Servicio']||'',
      bookingId: bookingObj['ID']||'',
      name: bookingObj['Nombre']||'',
      email: bookingObj['Email']||''
    });
  }

  /* Email albarán al cliente */
  if (albaranId && bookingObj['Email']) {
    try { sendAlbaranEmail(albaranId, bookingObj); } catch(e) { Logger.log('Error email albarán: '+e); }
  }

  return { ok: true, albaranId: albaranId, vip: vipResult };
}

/* ════════════════ ALBARANES ════════════════ */
function _createAlbaran(booking, firma){
  const s = sheet(SHEET_NAMES.ALBARANES);
  const id = getNextId('ALB');
  const now = new Date().toISOString();
  const extras = typeof booking['Extras']==='string' ? booking['Extras'] : JSON.stringify(booking['Extras']||'');
  s.appendRow([
    id,
    fmtFecha(now.split('T')[0]),
    booking['ID']||'',
    booking['Nombre']||'',
    booking['Teléfono']||'',
    booking['Email']||'',
    booking['Servicio']||'',
    Number(booking['Total'])||0,
    booking['Empleado']||'',
    booking['Centro']||'',
    extras,
    booking['Matricula']||'',
    'emitido',
    false,
    firma||'',
    now
  ]);
  return { ok: true, id: id };
}
function generateAlbaran(p){
  const row = parseInt(p.row, 10);
  if (!row || row < 2) return { error: 'Fila inválida' };
  const rs = sheet(SHEET_NAMES.RESERVAS);
  const headers = rs.getRange(1,1,1,rs.getLastColumn()).getValues()[0];
  const rowData  = rs.getRange(row,1,1,rs.getLastColumn()).getValues()[0];
  const booking = {};
  headers.forEach((h,i) => { booking[h] = rowData[i]; });
  const estado = String(booking['Estado']||'').toLowerCase();
  if (estado !== 'completado') return { error: 'La reserva debe estar completada para generar albarán' };
  const result = _createAlbaran(booking, '');
  if (result.ok) {
    const hIdx = headers.indexOf('AlbaranID');
    if (hIdx >= 0) rs.getRange(row, hIdx+1).setValue(result.id);
    if (booking['Email']) try { sendAlbaranEmail(result.id, booking); } catch(e){}
  }
  return result;
}
function getAlbaran(p){
  const albaranId = p.albaranId || '';
  if (!albaranId) return { error: 'albaranId requerido' };
  const rows = sheetToObjects(sheet(SHEET_NAMES.ALBARANES));
  const alb = rows.find(r => r['ID'] === albaranId);
  if (!alb) return { error: 'Albarán no encontrado' };
  return { ok: true, albaran: alb };
}
function sendAlbaranEmail(albaranId, booking){
  if (!booking || !booking['Email']) return;
  const body =
    '<p>Hola <strong>' + (booking['Nombre']||'') + '</strong>,</p>' +
    '<p>Adjuntamos el albarán de servicio de tu vehículo. ¡Gracias por confiar en Alvatowash!</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #d2d2d7;border-radius:12px;padding:12px 18px;">' +
    _detailRow('Albarán', albaranId) +
    _detailRow('Servicio', booking['Servicio']||'') +
    _detailRow('Vehículo', booking['Vehículo']||booking['Matricula']||'—') +
    _detailRow('Fecha servicio', booking['Fecha']||'') +
    _detailRow('Total', (Number(booking['Total'])||0).toFixed(2) + ' €') +
    _detailRow('Empleado', booking['Empleado']||'') +
    '</table>' +
    '<div style="margin:24px 0;text-align:center;">' +
    '<a href="' + PUBLIC_DOMAIN + '/albaran-vista.html?id=' + albaranId + '" style="display:inline-block;background:#DC2626;color:#fff;text-decoration:none;padding:13px 28px;border-radius:999px;font-weight:600;font-size:14px;">Ver albarán online</a>' +
    '</div>' +
    '<p style="color:#6e6e73;font-size:13px;">Puedes descargar tu albarán en PDF desde el enlace de arriba.</p>';
  MailApp.sendEmail({
    to: booking['Email'],
    subject: 'Albarán ' + albaranId + ' · Alvatowash',
    htmlBody: _emailWrap('Albarán de servicio', body),
    replyTo: TENANT_META.owner_email,
    name: 'Alvatowash'
  });
}

/* ════════════════ RESERVA RECURRENTE ════════════════ */
function createRecurrentBooking(p){
  /* Crea una nueva reserva X días después de la original */
  const originalRow = parseInt(p.row, 10);
  const days = parseInt(p.days, 10);
  if (!originalRow || originalRow < 2 || !days) return { error: 'Faltan row y days' };
  const rs = sheet(SHEET_NAMES.RESERVAS);
  const headers = rs.getRange(1,1,1,rs.getLastColumn()).getValues()[0];
  const rowData  = rs.getRange(originalRow,1,1,rs.getLastColumn()).getValues()[0];
  const orig = {};
  headers.forEach((h,i) => { orig[h] = rowData[i]; });

  /* Calcular nueva fecha */
  const origISO = orig['Fecha ISO'] || '';
  const d = new Date((origISO || new Date().toISOString().split('T')[0]) + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const newISO = d.toISOString().split('T')[0];
  const DAY = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MON = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const newDisplay = DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()];

  const newId = getNextId('B');
  rs.appendRow([
    newId, newDisplay, newISO, orig['Hora']||'', orig['Nombre']||'', orig['Teléfono']||'',
    orig['Email']||'', orig['Servicio']||'', Number(orig['Total'])||0, orig['Empleado']||'',
    orig['Dirección']||'', 'Recurrente (cada '+days+'d)', 'pendiente', orig['Vehículo']||orig['Matricula']||'',
    orig['Centro']||'', '', '', false
  ]);
  return { ok: true, id: newId, dateISO: newISO, dateDisplay: newDisplay };
}

/* ════════════════ LEADS / CARRITO OLVIDADO ════════════════ */
function getLeads(){
  return sheetToObjects(sheet(SHEET_NAMES.LEADS));
}
function saveLead(b){
  /* Si ya existe el lead con ese leadId, actualizamos el row. Si no, append. */
  const s = sheet(SHEET_NAMES.LEADS);
  const data = s.getDataRange().getValues();
  const leadId = b.leadId || '';
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === leadId) { foundRow = i + 1; break; }
  }
  const now = new Date();
  const nowIso = now.toISOString();
  const nowStr = now.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' ' + now.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
  const row = [
    leadId,
    fmtFecha(nowIso.split('T')[0]),
    now.toTimeString().slice(0, 5),
    b.name || '',
    b.phone || '',
    b.service || '',
    Number(b.serviceFrom) || Number(b.total) || 0,
    b.status || 'lead_capturado',
    false, // contactado
    b.dateDisplay || '',
    b.time || '',
    b.address || '',
    nowStr,
    nowIso,
    b.abandoned_at_step || '',
    ''
  ];
  if (foundRow > 0) {
    s.getRange(foundRow, 1, 1, row.length).setValues([row]);
  } else {
    s.appendRow(row);
  }
  return { ok: true, leadId: leadId };
}
function markLeadContacted(p){
  const s = sheet(SHEET_NAMES.LEADS);
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.leadId) {
      s.getRange(i + 1, 9).setValue(true);
      if (p.nota) s.getRange(i + 1, 16).setValue(p.nota);
      return { ok: true };
    }
  }
  return { error: 'Lead no encontrado' };
}
function deleteLead(p){
  const s = sheet(SHEET_NAMES.LEADS);
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.leadId) {
      s.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { error: 'Lead no encontrado' };
}

/* ────── CONVERTIR LEAD EN RESERVA (scheduleLead) ────── */
function scheduleLead(p){
  /* Crea una reserva a partir de un lead y lo marca como confirmado */
  const leadId   = p.leadId || '';
  const dateISO  = p.dateISO || '';
  const time     = p.time || '';
  const nota     = p.nota || '';
  const empleado = p.empleado || '';
  if (!leadId || !dateISO || !time) return { error: 'Faltan leadId, dateISO o time' };

  /* 1. Leer el lead */
  const ls = sheet(SHEET_NAMES.LEADS);
  const ldata = ls.getDataRange().getValues();
  let leadRow = -1, lead = {};
  const lh = ldata[0];
  for (let i = 1; i < ldata.length; i++) {
    if (ldata[i][0] === leadId) {
      leadRow = i + 1;
      lh.forEach((h, j) => lead[h] = ldata[i][j]);
      break;
    }
  }
  if (leadRow < 0) return { error: 'Lead no encontrado' };

  /* 2. Crear reserva */
  const rs = sheet(SHEET_NAMES.RESERVAS);
  const id = getNextId('B');
  const d = new Date(dateISO + 'T00:00:00');
  const DAY = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MON = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const dateDisplay = DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()];
  const row = [id, dateDisplay, dateISO, time, lead['Nombre']||'', lead['WhatsApp']||'', '', lead['Servicio']||'', Number(lead['Precio desde'])||0, empleado, lead['Dirección']||'', nota, 'confirmada', '', lead['Centro']||'', '', '', false];
  rs.appendRow(row);

  /* 3. Marcar lead como contactado + confirmado */
  ls.getRange(leadRow, 9).setValue(true);   // Contactado
  ls.getRange(leadRow, 16).setValue('Convertido en reserva ' + id); // Nota recuperación

  return { ok: true, bookingId: id };
}

/* ════════════════ CLIENTES VIP ════════════════ */
function getVipUsers(){
  return sheetToObjects(sheet(SHEET_NAMES.CLIENTES_VIP));
}
function vipRegister(p){
  const s = sheet(SHEET_NAMES.CLIENTES_VIP);
  const phone = normPhone(p.phone);
  if (!phone) return { error: 'Teléfono requerido' };
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normPhone(data[i][0]) === phone) {
      return { error: 'Ya existe un cliente con este teléfono', user: rowToVip(data[i]) };
    }
  }
  const referral = (p.name || 'VIP').substring(0, 4).toUpperCase() + Math.floor(Math.random() * 10000);
  const row = [phone, p.name || '', p.email || '', p.password || '', 'Bronce', 0, 0, 0, 0, 0, referral, new Date().toISOString().slice(0, 10), '', new Date().toISOString()];
  s.appendRow(row);
  return { ok: true, user: rowToVip(row) };
}
function vipLogin(p){
  const s = sheet(SHEET_NAMES.CLIENTES_VIP);
  const data = s.getDataRange().getValues();
  const identifier = p.email || normPhone(p.phone);
  for (let i = 1; i < data.length; i++) {
    const matchesEmail = p.email && String(data[i][2]).toLowerCase() === String(p.email).toLowerCase();
    const matchesPhone = p.phone && normPhone(data[i][0]) === normPhone(p.phone);
    if (matchesEmail || matchesPhone) {
      if (p.password && String(data[i][3]) !== String(p.password)) {
        return { error: 'Contraseña incorrecta' };
      }
      s.getRange(i + 1, 14).setValue(new Date().toISOString()); // last_login
      return { ok: true, user: rowToVip(data[i]) };
    }
  }
  return { error: 'Cliente no encontrado' };
}
function vipAddPoints(p){
  /* Llamado cuando se marca booking como completado.
     Suma puntos = floor(total), suma visit, suma spent, recalcula nivel. */
  const s = sheet(SHEET_NAMES.CLIENTES_VIP);
  const data = s.getDataRange().getValues();
  const phone = normPhone(p.phone);
  const points = Math.floor(Number(p.points) || 0);
  const total = Number(p.total) || points;
  for (let i = 1; i < data.length; i++) {
    if (normPhone(data[i][0]) === phone) {
      const newPoints = (Number(data[i][5]) || 0) + points;
      const newVisits = (Number(data[i][6]) || 0) + 1;
      const newSpent = (Number(data[i][7]) || 0) + total;
      const newLevel = calculateLevel(newPoints);
      s.getRange(i + 1, 5).setValue(newLevel);
      s.getRange(i + 1, 6).setValue(newPoints);
      s.getRange(i + 1, 7).setValue(newVisits);
      s.getRange(i + 1, 8).setValue(newSpent);
      s.getRange(i + 1, 13).setValue(new Date().toISOString().slice(0, 10)); // last_visit
      logVipHistory(phone, 'earn', points, newPoints, p.service || 'Servicio completado', p.bookingId || '');
      return { ok: true, user: rowToVip(s.getRange(i + 1, 1, 1, HEADERS.ClientesVIP.length).getValues()[0]) };
    }
  }
  /* Cliente no encontrado: crearlo automáticamente si tiene nombre */
  const referral = (p.name || 'VIP').substring(0, 4).toUpperCase() + Math.floor(Math.random() * 10000);
  const newPoints = points;
  const newLevel  = calculateLevel(newPoints);
  const newRow = [phone, p.name || '', p.email || '', '', newLevel, newPoints, 1, total, 0, 0, referral, new Date().toISOString().slice(0,10), new Date().toISOString().slice(0,10), new Date().toISOString()];
  s.appendRow(newRow);
  logVipHistory(phone, 'earn', newPoints, newPoints, p.service || 'Servicio completado (alta automática)', p.bookingId || '');
  return { ok: true, created: true, user: rowToVip(newRow) };
}
function vipAdjustPoints(p){
  /* Ajuste manual del admin (+/- N puntos) */
  const s = sheet(SHEET_NAMES.CLIENTES_VIP);
  const data = s.getDataRange().getValues();
  const phone = normPhone(p.phone);
  const delta = parseInt(p.delta, 10) || 0;
  for (let i = 1; i < data.length; i++) {
    if (normPhone(data[i][0]) === phone) {
      const newPoints = Math.max(0, (Number(data[i][5]) || 0) + delta);
      const newLevel = calculateLevel(newPoints);
      s.getRange(i + 1, 5).setValue(newLevel);
      s.getRange(i + 1, 6).setValue(newPoints);
      logVipHistory(phone, delta > 0 ? 'manual' : 'spend', delta, newPoints, p.reason || 'Ajuste manual', '');
      return { ok: true };
    }
  }
  return { error: 'Cliente VIP no encontrado' };
}
function vipRedeemReward(p){
  const s = sheet(SHEET_NAMES.CLIENTES_VIP);
  const data = s.getDataRange().getValues();
  const phone = normPhone(p.phone);
  const cost = parseInt(p.cost, 10) || 0;
  for (let i = 1; i < data.length; i++) {
    if (normPhone(data[i][0]) === phone) {
      if ((Number(data[i][5]) || 0) < cost) return { error: 'Puntos insuficientes' };
      const newPoints = (Number(data[i][5]) || 0) - cost;
      const newRedeemed = (Number(data[i][8]) || 0) + 1;
      s.getRange(i + 1, 6).setValue(newPoints);
      s.getRange(i + 1, 9).setValue(newRedeemed);
      logVipHistory(phone, 'spend', -cost, newPoints, p.rewardName || 'Recompensa canjeada', '');
      return { ok: true, newPoints: newPoints };
    }
  }
  return { error: 'Cliente VIP no encontrado' };
}
function rowToVip(r){
  return {
    phone: r[0], name: r[1], email: r[2],
    level: r[4], points: Number(r[5]) || 0,
    visits: Number(r[6]) || 0, spent: Number(r[7]) || 0,
    redeemed: Number(r[8]) || 0, referred: Number(r[9]) || 0,
    referral_code: r[10], joined: r[11], last_visit: r[12]
  };
}
function calculateLevel(points){
  if (points >= 1500) return 'Diamante';
  if (points >= 500) return 'Oro';
  if (points >= 200) return 'Plata';
  return 'Bronce';
}
function logVipHistory(phone, type, delta, newTotal, reason, bookingId){
  sheet(SHEET_NAMES.VIP_HISTORY).appendRow([
    new Date().toISOString(), phone, type, delta, newTotal, reason, bookingId
  ]);
}
function getVipHistory(phone){
  if (!phone) return [];
  const norm = normPhone(phone);
  return sheetToObjects(sheet(SHEET_NAMES.VIP_HISTORY)).filter(r => normPhone(r.Phone) === norm);
}

/* ════════════════ EMPLEADOS / FICHAJES ════════════════ */
function getEmployees(){
  return sheetToObjects(sheet(SHEET_NAMES.EMPLEADOS));
}
function clockIn(p){
  const s = sheet(SHEET_NAMES.FICHAJES);
  const id = 'F-' + Date.now();
  s.appendRow([id, p.usuario || '', new Date().toISOString(), '', '', p.gpsOk === 'true' || p.gpsOk === true, p.lat || '', p.lng || '', p.centro || '']);
  return { ok: true, id: id };
}
function clockOut(p){
  const s = sheet(SHEET_NAMES.FICHAJES);
  const data = s.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === p.usuario && !data[i][3]) {
      const endIso = new Date().toISOString();
      const startMs = new Date(data[i][2]).getTime();
      const endMs = new Date(endIso).getTime();
      const durationMin = Math.round((endMs - startMs) / 60000);
      s.getRange(i + 1, 4).setValue(endIso);
      s.getRange(i + 1, 5).setValue(durationMin);
      return { ok: true, durationMin: durationMin };
    }
  }
  return { error: 'No hay jornada activa para ' + p.usuario };
}

/* ════════════════ PRODUCTOS / PEDIDOS ════════════════ */
function getProducts(){ return sheetToObjects(sheet(SHEET_NAMES.PRODUCTOS)); }
function getOrders(){ return sheetToObjects(sheet(SHEET_NAMES.PEDIDOS)); }
function addOrder(p){
  /* Acepta dos formatos:
     A) Pedido simple (legacy): empleado/nota/total
     B) Pedido nuevo del módulo: items[] (array de productos), subtotal, iva, total, centro, solicitante */
  const id = p.id || getNextId('O');
  const itemsJson = p.items ? JSON.stringify(p.items) : '';
  const subtotal = Number(p.subtotal) || 0;
  const iva = Number(p.iva) || 0;
  const total = Number(p.total) || (subtotal + iva);
  const solicitante = p.solicitante || p.empleado || '';
  sheet(SHEET_NAMES.PEDIDOS).appendRow([
    id, fmtFecha(new Date().toISOString().slice(0, 10)),
    p.empleado || solicitante, p.nota || '',
    total, p.estado || 'pendiente', p.centro || '',
    itemsJson, subtotal, iva, solicitante
  ]);
  /* Enviar email de aviso al proveedor (configurable) */
  try {
    const ownerEmail = (typeof TENANT_META_DEFAULT !== 'undefined' && TENANT_META_DEFAULT.owner_email) || '';
    if (ownerEmail && itemsJson) {
      const items = JSON.parse(itemsJson);
      const html = '<h3>Nuevo pedido ' + id + '</h3>' +
        '<p>Centro: <strong>' + (p.centro||'') + '</strong></p>' +
        '<p>Solicitante: ' + solicitante + '</p>' +
        '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">' +
        '<tr style="background:#eee"><th>SKU</th><th>Producto</th><th>Cant</th><th>Precio</th><th>Subtotal</th></tr>' +
        items.map(function(it){
          return '<tr><td>' + (it.sku||'') + '</td><td>' + (it.name||'') + '</td><td>' + (it.qty||0) + '</td><td>' + (it.price||0).toFixed(2) + ' €</td><td>' + ((it.qty||0)*(it.price||0)).toFixed(2) + ' €</td></tr>';
        }).join('') +
        '</table>' +
        '<p><strong>Total: ' + total.toFixed(2) + ' €</strong> (IVA inc.)</p>';
      MailApp.sendEmail({ to: ownerEmail, subject: 'Pedido ' + id + ' · centro ' + (p.centro||''), htmlBody: html });
    }
  } catch(e) { Logger.log('Order email error: ' + e); }
  return { ok: true, id: id };
}

/* ════════════════ NOTICIAS INTERNAS (dueño → centros) ════════════════
   El dueño superadmin redacta noticias, elige a qué centros mandarlas
   y opcionalmente requiere confirmación de lectura. Los empleados/encargados
   las ven en un banner arriba del admin/empleados. */

function getNoticias(p){
  /* Si centro=ID, solo devuelve noticias dirigidas a ese centro o a todos.
     Si no, devuelve todas (vista del dueño). */
  const items = sheetToObjects(sheet(SHEET_NAMES.NOTICIAS)) || [];
  if (!p || !p.centro || p.centro === '*') return items.filter(n => n.Estado !== 'archivada');
  return items.filter(n => {
    if (n.Estado === 'archivada') return false;
    const dest = String(n.Centros || '').toLowerCase();
    if (!dest || dest === '*' || dest === 'all' || dest === 'todos') return true;
    return dest.split(',').map(s => s.trim()).indexOf(p.centro) >= 0;
  });
}

function addNoticia(p){
  if (!p.titulo) return { error:'Título requerido' };
  if (!p.cuerpo) return { error:'Cuerpo requerido' };
  const id = 'NOT-' + Date.now();
  const fecha = new Date().toISOString();
  const centros = p.centros || '*';   /* '*' = todos · 'mad,bcn' = solo esos */
  sheet(SHEET_NAMES.NOTICIAS).appendRow([
    id, fecha, p.autor || 'Dueño', p.titulo, p.cuerpo,
    p.imagenURL || '', centros, p.prioridad || 'normal',
    !!p.requiereConfirm, !!p.enviarEmail, 'activa', 0
  ]);

  /* Enviar email si está marcado */
  if (p.enviarEmail) {
    try {
      const recipients = _getRecipientsForNoticia(centros);
      if (recipients.length) {
        const subject = (p.prioridad === 'urgente' ? '[URGENTE] ' : '') + p.titulo;
        const html = '<div style="font-family:sans-serif;max-width:560px;margin:0 auto">' +
          '<h2 style="font-size:20px">' + p.titulo + '</h2>' +
          '<div style="font-size:14.5px;line-height:1.6;color:#333">' + (p.cuerpo||'').replace(/\n/g,'<br>') + '</div>' +
          (p.imagenURL ? '<img src="' + p.imagenURL + '" style="max-width:100%;border-radius:8px;margin-top:14px">' : '') +
          '<hr style="border:none;border-top:1px solid #eee;margin:24px 0">' +
          '<p style="font-size:12px;color:#666">Recibís este email como miembro del equipo Alvatowash.</p>' +
          '</div>';
        MailApp.sendEmail({ to: recipients.join(','), subject, htmlBody: html });
      }
    } catch(e) { Logger.log('Email noticia error: ' + e); }
  }
  return { ok:true, id, sentEmails: !!p.enviarEmail };
}

function _getRecipientsForNoticia(centros){
  const empleados = sheetToObjects(sheet(SHEET_NAMES.EMPLEADOS)) || [];
  const cents = (centros && centros !== '*' && centros !== 'all' && centros !== 'todos')
    ? String(centros).split(',').map(s => s.trim()) : null;
  return empleados.filter(e => {
    if (!e.Email || !String(e.Email).includes('@')) return false;
    if (!cents) return true;
    return cents.indexOf(e.Centro) >= 0;
  }).map(e => e.Email);
}

function markNoticiaLeida(p){
  if (!p.noticiaId || !p.usuario) return { error:'noticiaId y usuario requeridos' };
  const s = sheet(SHEET_NAMES.NOTICIAS_LEIDAS);
  /* Evitar duplicados (mismo usuario + noticia) */
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.noticiaId && data[i][1] === p.usuario) {
      /* Si pide confirmar, actualizamos ConfirmadaAt */
      if (p.confirmar && !data[i][4]) s.getRange(i+1, 5).setValue(new Date().toISOString());
      return { ok:true, alreadyRead:true };
    }
  }
  s.appendRow([
    p.noticiaId, p.usuario, p.centro || '',
    new Date().toISOString(),
    p.confirmar ? new Date().toISOString() : ''
  ]);
  /* Actualizar contador LeidasCount */
  try {
    const nsht = sheet(SHEET_NAMES.NOTICIAS);
    const nd = nsht.getDataRange().getValues();
    const nh = nd[0]; const idxId = nh.indexOf('ID'); const idxCount = nh.indexOf('LeidasCount');
    for (let i = 1; i < nd.length; i++) {
      if (nd[i][idxId] === p.noticiaId) {
        nsht.getRange(i+1, idxCount+1).setValue((nd[i][idxCount]||0) + 1);
        break;
      }
    }
  } catch(e){}
  return { ok:true };
}

function deleteNoticia(p){
  if (!p.id) return { error:'id requerido' };
  const s = sheet(SHEET_NAMES.NOTICIAS);
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.id) {
      s.getRange(i+1, 11).setValue('archivada'); /* Estado en col 11 */
      return { ok:true };
    }
  }
  return { error:'No encontrada' };
}

function getNoticiasLeidas(p){
  /* Devuelve quién leyó qué · útil para el dueño */
  const items = sheetToObjects(sheet(SHEET_NAMES.NOTICIAS_LEIDAS)) || [];
  if (p && p.noticiaId) return items.filter(x => x.NoticiaID === p.noticiaId);
  return items;
}

/* ════════════════ UPSELL EN RESERVA ════════════════
   El empleado marca cuando un cliente subió de servicio al llegar al centro.
   La nota es opcional (ej. "Cambió de Mantenimiento a Plus + tapicería"). */
function updateBookingUpsell(p){
  if (!p.bookingId) return { error:'bookingId requerido' };
  const s = sheet(SHEET_NAMES.RESERVAS);
  const data = s.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf('ID');
  const idxApplied = headers.indexOf('UpsellApplied');
  const idxNote = headers.indexOf('UpsellNote');
  const idxTotal = headers.indexOf('Total');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === p.bookingId) {
      if (idxApplied >= 0) s.getRange(i+1, idxApplied+1).setValue(!!p.applied);
      if (idxNote >= 0 && p.note !== undefined) s.getRange(i+1, idxNote+1).setValue(p.note || '');
      if (idxTotal >= 0 && p.newTotal && !isNaN(Number(p.newTotal))) s.getRange(i+1, idxTotal+1).setValue(Number(p.newTotal));
      return { ok:true };
    }
  }
  return { error:'Reserva no encontrada' };
}

/* ════════════════ CONTABILIDAD · gastos + P&L + IVA ════════════════ */

function getGastos(p){
  const items = sheetToObjects(sheet(SHEET_NAMES.GASTOS)) || [];
  if (!p) return items;
  return items.filter(g => {
    if (p.centro && p.centro !== '*' && g.Centro && g.Centro !== p.centro) return false;
    if (p.categoria && p.categoria !== 'all' && g.Categoria !== p.categoria) return false;
    if (p.start && String(g['Fecha']||'').slice(0,10) < p.start) return false;
    if (p.end && String(g['Fecha']||'').slice(0,10) > p.end) return false;
    return true;
  });
}

function addGasto(p){
  if (!p.concepto) return { error:'Concepto requerido' };
  if (!p.importe || isNaN(Number(p.importe))) return { error:'Importe inválido' };
  const id = 'GAS-' + Date.now();
  const fecha = p.fecha || new Date().toISOString().slice(0,10);
  const importe = Number(p.importe);
  const ivaPct = Number(p.ivaPct || 21);
  const iva = Math.round(importe * (ivaPct/100) * 100) / 100;
  const total = Math.round((importe + iva) * 100) / 100;
  sheet(SHEET_NAMES.GASTOS).appendRow([
    id, fecha, p.concepto, p.categoria || 'otros',
    importe, iva, total,
    p.centro || '*', p.proveedor || '',
    p.metodoPago || 'transferencia', p.notas || '',
    p.creadoPor || 'Dueño'
  ]);
  return { ok:true, id };
}

function deleteGasto(p){
  if (!p.id) return { error:'id requerido' };
  const s = sheet(SHEET_NAMES.GASTOS);
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.id) { s.deleteRow(i+1); return { ok:true }; }
  }
  return { error:'No encontrado' };
}

function getContabilidad(p){
  /* Calcula P&L del período · ingresos de bookings completados - gastos */
  const start = p.start || '2000-01-01';
  const end = p.end || '2099-12-31';
  const centro = p.centro && p.centro !== '*' ? p.centro : null;

  /* ─── Ingresos ─── */
  const bookings = sheetToObjects(sheet(SHEET_NAMES.RESERVAS)) || [];
  const pagados = bookings.filter(b => {
    const iso = String(b['Fecha ISO']||'').slice(0,10);
    if (!iso || iso < start || iso > end) return false;
    if (centro && b.Centro && b.Centro !== centro) return false;
    /* Solo contar reservas completadas o pagadas online */
    return b.Estado === 'completado' || b.PaymentStatus === 'paid';
  });
  const ingresoBruto = pagados.reduce((s,b) => s + (Number(b.Total)||0), 0);
  /* IVA recaudado: asumimos 21% incluido en el total */
  const ivaRecaudado = Math.round((ingresoBruto - (ingresoBruto / 1.21)) * 100) / 100;
  const ingresoNeto = Math.round((ingresoBruto - ivaRecaudado) * 100) / 100;

  /* ─── Gastos ─── */
  const gastos = sheetToObjects(sheet(SHEET_NAMES.GASTOS)) || [];
  const gastosPeriodo = gastos.filter(g => {
    const f = String(g.Fecha||'').slice(0,10);
    if (!f || f < start || f > end) return false;
    if (centro && g.Centro && g.Centro !== '*' && g.Centro !== centro) return false;
    return true;
  });
  const gastoTotal = gastosPeriodo.reduce((s,g) => s + (Number(g.Total)||0), 0);
  const ivaSoportado = gastosPeriodo.reduce((s,g) => s + (Number(g.IVA)||0), 0);
  const gastoNeto = Math.round((gastoTotal - ivaSoportado) * 100) / 100;

  /* Por categoría */
  const byCategory = {};
  gastosPeriodo.forEach(g => {
    const c = g.Categoria || 'otros';
    byCategory[c] = (byCategory[c]||0) + (Number(g.Total)||0);
  });

  /* ─── Cobros pendientes ─── */
  const pendientes = bookings.filter(b => {
    const iso = String(b['Fecha ISO']||'').slice(0,10);
    if (!iso || iso < start || iso > end) return false;
    if (centro && b.Centro && b.Centro !== centro) return false;
    return b.PaymentStatus === 'pending' || (b.Estado === 'pendiente' && !b.PaymentStatus);
  });
  const pendienteTotal = pendientes.reduce((s,b) => s + (Number(b.Total)||0), 0);

  /* ─── IVA neto (liquidación trimestral) ─── */
  const ivaNeto = Math.round((ivaRecaudado - ivaSoportado) * 100) / 100;

  /* Margen */
  const margen = Math.round((ingresoNeto - gastoNeto) * 100) / 100;
  const margenPct = ingresoNeto ? Math.round((margen / ingresoNeto) * 100) : 0;

  return {
    ok: true,
    period: { start, end, centro: centro || '*' },
    ingresos: {
      bruto: ingresoBruto, neto: ingresoNeto, iva: ivaRecaudado, count: pagados.length
    },
    gastos: {
      bruto: gastoTotal, neto: gastoNeto, iva: ivaSoportado, count: gastosPeriodo.length,
      byCategory
    },
    pendientes: { total: pendienteTotal, count: pendientes.length, items: pendientes.slice(0, 50) },
    iva: { recaudado: ivaRecaudado, soportado: ivaSoportado, neto: ivaNeto },
    margen: { eur: margen, pct: margenPct }
  };
}

function updateOrderStatus(p){
  /* Cambia el estado de un pedido (pendiente / enviado / recibido / cancelado) */
  if (!p.id || !p.status) return { error:'id y status requeridos' };
  const s = sheet(SHEET_NAMES.PEDIDOS);
  const data = s.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf('ID');
  const idxStatus = headers.indexOf('Estado');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === p.id) {
      s.getRange(i+1, idxStatus+1).setValue(p.status);
      return { ok:true };
    }
  }
  return { error:'Pedido no encontrado' };
}

/* ════════════════ BLOQUEOS ════════════════ */
function getBlocks(){ return sheetToObjects(sheet(SHEET_NAMES.BLOQUEOS)); }
function addBlock(p){
  const id = 'BL-' + Date.now();
  sheet(SHEET_NAMES.BLOQUEOS).appendRow([
    id, fmtFecha(p.fechaISO || ''), p.fechaISO || '',
    p.hora || '', Number(p.duracion) || 30,
    p.empleado || '', p.nota || '', p.motivo || ''
  ]);
  return { ok: true, id: id };
}
function removeBlock(p){
  const s = sheet(SHEET_NAMES.BLOQUEOS);
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.id) {
      s.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { error: 'Bloqueo no encontrado' };
}

/* ════════════════ CUENTA / PAYWALL ════════════════ */
function getAccountStatus(){
  const data = sheet(SHEET_NAMES.CUENTAS).getDataRange().getValues();
  if (data.length < 2) return { plan: 'trial', estado: 'activo', days_left: 14, expired: false };
  const r = data[1];
  const plan = r[0] || 'trial';
  const estado = r[1] || 'activo';
  let daysLeft = Number(r[2]) || 0;
  let expired = false;
  if (plan === 'trial' && r[3]) {
    const ms = new Date(r[3]).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
    expired = daysLeft <= 0;
  }
  return { plan: plan, estado: estado, days_left: daysLeft, expired: expired };
}
function setPlan(p){
  const s = sheet(SHEET_NAMES.CUENTAS);
  const data = s.getDataRange().getValues();
  if (data.length < 2) s.appendRow(['trial','activo',14,'','']);
  s.getRange(2, 1).setValue(p.plan || 'profesional');
  s.getRange(2, 2).setValue(p.estado || 'activo');
  s.getRange(2, 3).setValue(p.days || 30);
  if (p.trialEnd) s.getRange(2, 4).setValue(p.trialEnd);
  return { ok: true };
}

/* ════════════════ B2B SOCIOS ESTRATÉGICOS ════════════════ */
function getB2bCars(){ return sheetToObjects(sheet(SHEET_NAMES.B2B)); }
function addB2bCar(p){
  const id = 'B2B-' + Date.now();
  sheet(SHEET_NAMES.B2B).appendRow([
    id, fmtFecha(p.date || new Date().toISOString().slice(0, 10)),
    p.partner || '', p.brand || '', p.model || '',
    p.identifier || '', p.type || 'nuevo', p.notes || '',
    JSON.stringify(p.beforePhotos || []), JSON.stringify(p.afterPhotos || []),
    new Date().toISOString(), p.centro || ''
  ]);
  return { ok: true, id: id };
}

/* ════════════════ FACTURAS ════════════════ */
function peekNextInvoice(){
  const props = PropertiesService.getScriptProperties();
  const n = parseInt(props.getProperty('next_invoice') || '0', 10) + 1;
  const year = new Date().getFullYear();
  return 'ALV-' + year + '-' + String(n).padStart(4, '0');
}
function logInvoice(p){
  const props = PropertiesService.getScriptProperties();
  const n = parseInt(props.getProperty('next_invoice') || '0', 10) + 1;
  props.setProperty('next_invoice', String(n));
  const year = new Date().getFullYear();
  const numero = 'ALV-' + year + '-' + String(n).padStart(4, '0');
  sheet(SHEET_NAMES.FACTURAS).appendRow([
    numero, new Date().toISOString().slice(0, 10),
    p.cliente || '', p.nif || '', p.servicio || '',
    Number(p.importe) || 0, Number(p.iva) || 21, Number(p.total) || 0,
    p.url_pdf || '', p.bookingId || '', 'emitida'
  ]);
  return { ok: true, numero: numero };
}
function getFacturas(){ return sheetToObjects(sheet(SHEET_NAMES.FACTURAS)); }

/* ════════════════ STRIPE PAYMENTS ════════════════
   Flujo:
   1. Cliente confirma reserva con "Pagar online ahora"
   2. Frontend llama createStripeSession con bookingId, amount, etc.
   3. Backend crea sesión en Stripe API y devuelve la URL
   4. Frontend redirige al cliente a esa URL (checkout hosteado por Stripe)
   5. Tras pagar, Stripe redirige a success_url con ?session_id=...
   6. La página de éxito llama confirmStripePayment para marcar la reserva como paid */

function createStripeSession(p){
  const key = getStripeKey();
  if (!key) return { error: 'Stripe no está activo. Configurá STRIPE_SECRET_KEY en Script Properties.' };
  if (!p.bookingId) return { error: 'bookingId requerido' };
  if (!p.amount) return { error: 'amount requerido (en céntimos)' };

  /* Verificar que la reserva existe */
  const s = sheet(SHEET_NAMES.RESERVAS);
  const data = s.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf('ID');
  let row = -1, booking = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === p.bookingId) { row = i + 1; booking = data[i]; break; }
  }
  if (row < 0) return { error: 'Reserva no encontrada' };

  const amount = parseInt(p.amount, 10);
  const isDeposit = String(p.mode || '').toLowerCase() === 'deposit';
  const successUrl = PUBLIC_DOMAIN + '/reserva/exito/?id=' + encodeURIComponent(p.bookingId) + '&session_id={CHECKOUT_SESSION_ID}';
  const cancelUrl = PUBLIC_DOMAIN + '/reserva/cancelado/?id=' + encodeURIComponent(p.bookingId);
  const description = (p.serviceName || 'Servicio Alvatowash') + (isDeposit ? ' · Reserva' : '');

  /* Stripe API expects form-urlencoded with bracket notation for arrays */
  const payload = {
    'mode': 'payment',
    'success_url': successUrl,
    'cancel_url': cancelUrl,
    'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][unit_amount]': String(amount),
    'line_items[0][price_data][product_data][name]': description,
    'line_items[0][quantity]': '1',
    'metadata[booking_id]': p.bookingId,
    'metadata[mode]': isDeposit ? 'deposit' : 'full',
    'payment_method_types[0]': 'card'
  };
  if (p.email) payload['customer_email'] = p.email;

  /* Form-encode the payload */
  const body = Object.keys(payload).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(payload[k])).join('&');

  try {
    const res = UrlFetchApp.fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      headers: { 'Authorization': 'Bearer ' + key },
      payload: body,
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    const json = JSON.parse(res.getContentText());
    if (code >= 400) return { error: (json.error && json.error.message) || 'Stripe error ' + code };

    /* Guardar session_id, método y monto en la reserva */
    const idxPm = headers.indexOf('PaymentMethod');
    const idxPs = headers.indexOf('PaymentStatus');
    const idxPa = headers.indexOf('PaymentAmount');
    const idxSi = headers.indexOf('StripeSessionId');
    if (idxPm >= 0) s.getRange(row, idxPm+1).setValue(isDeposit ? 'online_deposit' : 'online_full');
    if (idxPs >= 0) s.getRange(row, idxPs+1).setValue('pending');
    if (idxPa >= 0) s.getRange(row, idxPa+1).setValue(amount / 100);
    if (idxSi >= 0) s.getRange(row, idxSi+1).setValue(json.id);

    return { ok: true, url: json.url, sessionId: json.id };
  } catch (e) {
    return { error: 'Network/Stripe error: ' + e };
  }
}

/* ════════════════ TENANT STATUS (para SuperSaaS Master Admin) ════════════════ */
function tenantStatus(){
  /* Devuelve metadata + métricas live para el panel maestro */
  try {
    const now = new Date();
    const trialEnd = new Date(TENANT_META.trial_ends_at + 'T23:59:59');
    const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / 86400000));

    /* Métricas básicas (mes en curso) */
    const tz = Session.getScriptTimeZone() || 'Europe/Madrid';
    const monthStart = Utilities.formatDate(new Date(now.getFullYear(), now.getMonth(), 1), tz, 'yyyy-MM-dd');
    const bookings = sheetToObjects(SHEET_NAMES.RESERVAS);
    const monthBookings = bookings.filter(b => (b['Fecha ISO'] || '') >= monthStart);
    const monthRevenue = monthBookings.reduce((s, b) => s + (Number(b['Total']) || 0), 0);
    const paidBookings = bookings.filter(b => b.PaymentStatus === 'paid');
    const onlineRevenue = paidBookings.reduce((s, b) => s + (Number(b.PaymentAmount) || 0), 0);

    return {
      ok: true,
      meta: TENANT_META,
      trial_days_left: daysLeft,
      trial_expired: daysLeft <= 0 && TENANT_META.plan === 'trial',
      stripe_active: isStripeActive(),
      metrics: {
        total_bookings: bookings.length,
        month_bookings: monthBookings.length,
        month_revenue_eur: Math.round(monthRevenue * 100) / 100,
        online_paid_count: paidBookings.length,
        online_paid_revenue_eur: Math.round(onlineRevenue * 100) / 100,
        last_booking_at: bookings.length ? (bookings[bookings.length-1]['Fecha ISO'] || '') : null
      },
      version: '2026.06.21'
    };
  } catch(e) {
    return { ok: false, error: String(e) };
  }
}

/* ════════════════ EMAILS AL CLIENTE ════════════════
   Tres templates HTML reutilizables:
   - sendBookingConfirmation: tras crear reserva → cliente recibe confirmación + .ics
   - sendBookingReminder: trigger diario 19h → recordatorio para reservas de mañana
   - sendPaymentReceipt: tras pago Stripe confirmado → recibo branded */

function _emailWrap(title, bodyHtml){
  /* Wrapper HTML sobrio estilo Apple/Stripe email */
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title></head>' +
    '<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">' +
    '<tr><td align="center">' +
    '<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;max-width:100%;">' +
    '<tr><td style="background:#0a0a0a;padding:28px 32px;color:#fff;">' +
    '<div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#d4af37;font-weight:600;margin-bottom:6px;">' + TENANT_META.tenant_name + '</div>' +
    '<div style="font-size:24px;font-weight:700;line-height:1.2;">' + title + '</div>' +
    '</td></tr>' +
    '<tr><td style="padding:32px;color:#1d1d1f;font-size:15px;line-height:1.55;">' + bodyHtml + '</td></tr>' +
    '<tr><td style="background:#f5f5f7;padding:20px 32px;color:#6e6e73;font-size:12px;line-height:1.5;border-top:1px solid #d2d2d7;">' +
    TENANT_META.company_name + ' · ' + PUBLIC_DOMAIN.replace('https://','') + '<br>' +
    'Si tienes dudas escribe a <a href="mailto:' + TENANT_META.owner_email + '" style="color:#0071e3;text-decoration:none;">' + TENANT_META.owner_email + '</a>' +
    '</td></tr></table></td></tr></table></body></html>';
}

function _detailRow(label, value){
  return '<tr><td style="padding:8px 0;color:#86868b;font-size:13px;width:130px;">' + label + '</td>' +
    '<td style="padding:8px 0;color:#1d1d1f;font-weight:600;text-align:right;">' + value + '</td></tr>';
}

function sendBookingConfirmation(b){
  /* b = objeto reserva (mismos campos que la hoja) */
  if (!TENANT_META.notify_emails_on_booking) return;
  if (!b || !b.Email) return; // sin email no podemos enviar

  const dateLbl = b['Fecha'] || b['Fecha ISO'] || '';
  const time = b['Hora'] || '';
  const service = b['Servicio'] || '';
  const total = (Number(b['Total']) || 0).toFixed(2);
  const centro = b['Centro'] || b['Dirección'] || '';
  const paymentMethod = b['PaymentMethod'] === 'online_full' ? 'Pagado online' :
                        b['PaymentMethod'] === 'online_deposit' ? 'Depósito pagado · resto en centro' :
                        'Pagar en centro';

  const body =
    '<p>Hola <strong>' + (b['Nombre']||'') + '</strong>,</p>' +
    '<p>Tu reserva está confirmada. Aquí los datos:</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #d2d2d7;border-radius:12px;padding:12px 18px;">' +
    _detailRow('Servicio', service) +
    _detailRow('Fecha', dateLbl) +
    _detailRow('Hora', time) +
    _detailRow('Centro', centro) +
    _detailRow('Vehículo', b['Vehículo'] || '—') +
    _detailRow('Importe', total + ' €') +
    _detailRow('Pago', paymentMethod) +
    _detailRow('ID Reserva', b['ID'] || '') +
    '</table>' +
    '<div style="margin:24px 0;text-align:center;">' +
    '<a href="' + PUBLIC_DOMAIN + '/area-cliente/" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:13px 28px;border-radius:999px;font-weight:600;font-size:14px;">Abrir mi área VIP</a>' +
    '</div>' +
    '<p style="color:#6e6e73;font-size:13px;">Si necesitas cambiar o cancelar la cita, contesta a este email o escríbenos por WhatsApp.</p>';

  try {
    MailApp.sendEmail({
      to: b['Email'],
      subject: 'Reserva confirmada · ' + service + ' · ' + dateLbl,
      htmlBody: _emailWrap('Reserva confirmada', body),
      replyTo: TENANT_META.owner_email,
      name: TENANT_META.tenant_name
    });
  } catch(e) { Logger.log('Email confirmation error: ' + e); }
}

function sendPaymentReceipt(bookingId, amount, mode){
  /* Llamado desde confirmStripePayment cuando se verifica el pago */
  const bookings = sheetToObjects(SHEET_NAMES.RESERVAS);
  const b = bookings.find(x => x['ID'] === bookingId);
  if (!b || !b['Email']) return;

  const isDeposit = mode === 'online_deposit';
  const body =
    '<p>Hola <strong>' + (b['Nombre']||'') + '</strong>,</p>' +
    '<p>Hemos recibido tu pago. ¡Gracias!</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #d2d2d7;border-radius:12px;padding:12px 18px;">' +
    _detailRow('Concepto', b['Servicio'] || '') +
    _detailRow('Fecha cita', b['Fecha'] || '') +
    _detailRow('Importe pagado', amount.toFixed(2) + ' €') +
    (isDeposit ? _detailRow('Pendiente en centro', ((Number(b['Total'])||0) - amount).toFixed(2) + ' €') : '') +
    _detailRow('ID Reserva', bookingId) +
    '</table>' +
    '<p style="color:#6e6e73;font-size:13px;">Recibirás también un recibo oficial de Stripe.</p>';

  try {
    MailApp.sendEmail({
      to: b['Email'],
      subject: 'Pago confirmado · ' + amount.toFixed(2) + '€ · ' + TENANT_META.tenant_name,
      htmlBody: _emailWrap('Pago confirmado', body),
      replyTo: TENANT_META.owner_email,
      name: TENANT_META.tenant_name
    });
  } catch(e) { Logger.log('Email receipt error: ' + e); }
}

function sendClientReminder(b){
  /* Recordatorio 24h antes — llamado desde sendReminders */
  if (!TENANT_META.notify_reminder_to_client) return;
  if (!b || !b['Email']) return;

  const body =
    '<p>Hola <strong>' + (b['Nombre']||'') + '</strong>,</p>' +
    '<p>Te recordamos tu cita de mañana:</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #d2d2d7;border-radius:12px;padding:12px 18px;">' +
    _detailRow('Servicio', b['Servicio'] || '') +
    _detailRow('Fecha', b['Fecha'] || '') +
    _detailRow('Hora', b['Hora'] || '') +
    _detailRow('Centro', b['Centro'] || b['Dirección'] || '') +
    '</table>' +
    '<p>Si no puedes venir, contéstanos este email cuanto antes para liberar el hueco.</p>';

  try {
    MailApp.sendEmail({
      to: b['Email'],
      subject: 'Recordatorio · Tu cita mañana en ' + TENANT_META.tenant_name,
      htmlBody: _emailWrap('Tu cita es mañana', body),
      replyTo: TENANT_META.owner_email,
      name: TENANT_META.tenant_name
    });
  } catch(e) { Logger.log('Reminder client email error: ' + e); }
}

function createBookingPublic(p){
  /* Crear reserva desde el widget público (requiere token) + opcionalmente sesión Stripe.
     Si p.pay === 'stripe', se crea la sesión y se devuelve la URL para redirigir.
     Si p.pay === 'deposit' y el servicio tiene deposit, se cobra solo el depósito.
     Si p.pay === 'center', solo crea la reserva sin pago. */
  if (!p.name || !p.service || !p.phone) return { error: 'Faltan datos básicos de la reserva' };

  const id = getNextId('B');
  const s = sheet(SHEET_NAMES.RESERVAS);
  const dateISO = p.dateISO || '';
  s.appendRow([
    id, p.dateDisplay || fmtFecha(dateISO), dateISO, p.time || '',
    p.name, p.phone, p.email || '', p.service || '',
    Number(p.total) || 0, '', p.address || '', p.payment || '',
    'pendiente', p.vehicle || '', p.centro_id || '', p.extras || '',
    '', false, '', '',
    p.pay === 'stripe' ? 'online_full' : (p.pay === 'deposit' ? 'online_deposit' : 'pay_at_center'),
    p.pay === 'center' ? 'na' : 'pending',
    0, ''
  ]);

  /* Si pidió pago online → crear sesión Stripe */
  if ((p.pay === 'stripe' || p.pay === 'deposit') && isStripeActive()) {
    const total = Number(p.total) || 0;
    const depositAmount = Number(p.depositAmount) || 20;
    const amountCents = p.pay === 'deposit' ? Math.round(depositAmount * 100) : Math.round(total * 100);
    const session = createStripeSession({
      bookingId: id,
      amount: amountCents,
      mode: p.pay === 'deposit' ? 'deposit' : 'full',
      email: p.email,
      serviceName: (p.service || 'Servicio Alvatowash') + (p.pay === 'deposit' ? ' · Reserva (depósito)' : '')
    });
    if (session.error) return { ok: true, bookingId: id, paymentError: session.error };
    /* Mandar confirmación al cliente AHORA mismo (no esperamos al pago Stripe) */
    try { sendBookingConfirmation({
      'ID': id, 'Nombre': p.name, 'Email': p.email, 'Teléfono': p.phone,
      'Fecha': p.dateDisplay, 'Fecha ISO': dateISO, 'Hora': p.time,
      'Servicio': p.service, 'Total': p.total, 'Centro': p.centro_id,
      'Dirección': p.address, 'Vehículo': p.vehicle,
      'PaymentMethod': p.pay === 'deposit' ? 'online_deposit' : 'online_full'
    }); } catch(e){}
    return { ok: true, bookingId: id, stripeUrl: session.url, sessionId: session.sessionId };
  }

  /* Pagar en centro → confirmación inmediata */
  try { sendBookingConfirmation({
    'ID': id, 'Nombre': p.name, 'Email': p.email, 'Teléfono': p.phone,
    'Fecha': p.dateDisplay, 'Fecha ISO': dateISO, 'Hora': p.time,
    'Servicio': p.service, 'Total': p.total, 'Centro': p.centro_id,
    'Dirección': p.address, 'Vehículo': p.vehicle,
    'PaymentMethod': 'pay_at_center'
  }); } catch(e){}

  return { ok: true, bookingId: id };
}

function confirmStripePayment(p){
  const key = getStripeKey();
  if (!key) return { error: 'Stripe no está activo' };
  if (!p.sessionId) return { error: 'sessionId requerido' };
  if (!p.bookingId) return { error: 'bookingId requerido' };

  /* Verificar con la API de Stripe que el pago se completó */
  try {
    const res = UrlFetchApp.fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(p.sessionId), {
      method: 'get',
      headers: { 'Authorization': 'Bearer ' + key },
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    const session = JSON.parse(res.getContentText());
    if (code >= 400) return { error: (session.error && session.error.message) || 'Stripe verification error' };

    const paymentStatus = session.payment_status;
    const amountTotal = session.amount_total;

    /* Actualizar la reserva */
    const s = sheet(SHEET_NAMES.RESERVAS);
    const data = s.getDataRange().getValues();
    const headers = data[0];
    const idxId = headers.indexOf('ID');
    const idxPs = headers.indexOf('PaymentStatus');
    const idxPa = headers.indexOf('PaymentAmount');
    const idxSi = headers.indexOf('StripeSessionId');
    for (let i = 1; i < data.length; i++) {
      if (data[i][idxId] === p.bookingId) {
        if (idxPs >= 0) s.getRange(i+1, idxPs+1).setValue(paymentStatus === 'paid' ? 'paid' : paymentStatus);
        if (paymentStatus === 'paid' && idxPa >= 0 && amountTotal) s.getRange(i+1, idxPa+1).setValue(amountTotal / 100);
        if (idxSi >= 0) s.getRange(i+1, idxSi+1).setValue(p.sessionId);
        /* Si está pagado, mandar recibo al cliente */
        if (paymentStatus === 'paid' && amountTotal) {
          const mode = data[i][headers.indexOf('PaymentMethod')] || 'online_full';
          try { sendPaymentReceipt(p.bookingId, amountTotal / 100, mode); } catch(e){}
        }
        return {
          ok: true,
          paymentStatus: paymentStatus,
          amount: amountTotal ? amountTotal / 100 : 0
        };
      }
    }
    return { error: 'Reserva no encontrada para confirmar pago' };
  } catch (e) {
    return { error: 'Error verificando pago: ' + e };
  }
}

/* ════════════════ ADMIN USERS / MULTI-CENTRO ════════════════
   Roles:
   - 'superadmin' (centro:'*') → ve todo, todos los centros, puede crear usuarios
   - 'encargado'  (centro:'XX') → solo ve datos de su centro
   Cuando el admin del frontend hace bgCall, pasa centro=... como filtro */

function adminLogin(p){
  const usuario = String(p.usuario || '').toLowerCase().trim();
  const password = String(p.password || '');
  if (!usuario || !password) return { error: 'Usuario y contraseña requeridos' };
  const s = sheet(SHEET_NAMES.ADMIN_USERS);
  const data = s.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === usuario && String(data[i][1]) === password) {
      s.getRange(i + 1, 7).setValue(new Date().toISOString()); // LastLogin
      return {
        ok: true,
        user: {
          usuario: data[i][0],
          nombre: data[i][2] || data[i][0],
          rol: data[i][3] || 'encargado',
          centro: data[i][4] || '*'
        }
      };
    }
  }
  return { error: 'Usuario o contraseña incorrectos' };
}

function getAdminUsers(){
  return sheetToObjects(sheet(SHEET_NAMES.ADMIN_USERS)).map(u => ({
    usuario: u.Usuario, nombre: u.Nombre, rol: u.Rol, centro: u.Centro,
    created: u.CreatedAt, last_login: u.LastLogin
    // NO devolvemos Password por seguridad
  }));
}

function addAdminUser(p){
  if (!p.usuario || !p.password) return { error: 'Usuario y contraseña requeridos' };
  const s = sheet(SHEET_NAMES.ADMIN_USERS);
  const data = s.getDataRange().getValues();
  const usuario = String(p.usuario).toLowerCase().trim();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === usuario) return { error: 'Usuario ya existe' };
  }
  s.appendRow([
    usuario, String(p.password),
    p.nombre || usuario, p.rol || 'encargado',
    p.centro || '*', new Date().toISOString(), ''
  ]);
  return { ok: true };
}

function deleteAdminUser(p){
  const s = sheet(SHEET_NAMES.ADMIN_USERS);
  const data = s.getDataRange().getValues();
  const usuario = String(p.usuario || '').toLowerCase().trim();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === usuario) {
      s.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { error: 'Usuario no encontrado' };
}

/* ════════════════ RESEÑAS ════════════════
   Flujo:
   1. Admin/empleado marca booking como "completado"
   2. updateBooking pone CompletedAt = ahora
   3. Trigger horario sendReviewRequests recorre completados sin ReviewSent
      y manda email con link a /resena/?id=BOOKING_ID
   4. Cliente entra al landing, da 1-5 estrellas
   5. Si 5★ → redirect a Google Reviews
   6. Si <5★ → form interno, queda guardado para que el admin responda */

function getResenas(){ return sheetToObjects(sheet(SHEET_NAMES.RESENAS)); }

function getBookingForReview(bookingId){
  /* Endpoint público: el landing de reseña obtiene los datos del booking por su ID */
  if (!bookingId) return { error: 'ID requerido' };
  const bookings = getBookings();
  const b = bookings.find(x => x.ID === bookingId);
  if (!b) return { error: 'Reserva no encontrada' };
  return {
    ok: true,
    booking: {
      id: b.ID, name: b.Nombre, service: b.Servicio,
      date: b.Fecha, employee: b.Empleado || '',
      centro: b.Centro || ''
    },
    googleReviewUrl: GOOGLE_REVIEW_URL
  };
}

function submitReview(p){
  /* Guarda la reseña. Si rating >= 4, devuelve URL de Google para redirigir. */
  const rating = parseInt(p.rating, 10) || 0;
  if (rating < 1 || rating > 5) return { error: 'Rating inválido (1-5)' };
  if (!p.bookingId) return { error: 'BookingID requerido' };

  const bookings = getBookings();
  const b = bookings.find(x => x.ID === p.bookingId);
  if (!b) return { error: 'Reserva no encontrada' };

  const id = 'R-' + Date.now();
  const redirigido = rating >= 5;
  sheet(SHEET_NAMES.RESENAS).appendRow([
    id, new Date().toISOString().slice(0,10), p.bookingId,
    b.Nombre, b.Teléfono || b.Telefono || '',
    rating, p.comment || '',
    redirigido, b.Centro || '', b.Empleado || '',
    rating >= 4 ? 'positiva' : 'alerta'
  ]);

  /* Si la reseña es negativa, notificar al admin por email */
  if (rating < 4) {
    try {
      const ownerEmail = Session.getActiveUser().getEmail();
      if (ownerEmail) {
        MailApp.sendEmail({
          to: ownerEmail,
          subject: '⚠ Reseña negativa de ' + b.Nombre + ' (' + rating + '★)',
          htmlBody: `
            <div style="font-family:Arial,sans-serif;max-width:560px">
              <h2 style="color:#DC2626">Reseña negativa recibida</h2>
              <p><strong>${b.Nombre}</strong> dejó <strong>${rating}★</strong> en el servicio <strong>${b.Servicio}</strong> del ${b.Fecha}.</p>
              ${b.Empleado ? `<p>Atendido por: <strong>${b.Empleado}</strong></p>` : ''}
              ${p.comment ? `<div style="background:#FAFAFA;padding:14px;border-left:3px solid #DC2626;margin:14px 0"><strong>Comentario:</strong><br/>${p.comment}</div>` : ''}
              <p>Llama al cliente cuanto antes para resolver: <a href="tel:${b.Teléfono}">${b.Teléfono}</a></p>
            </div>
          `,
          name: 'Alvatowash · Alertas'
        });
      }
    } catch(e){ Logger.log('No se pudo enviar alerta: ' + e); }
  }

  return {
    ok: true,
    rating: rating,
    redirectToGoogle: redirigido,
    googleReviewUrl: redirigido ? GOOGLE_REVIEW_URL : ''
  };
}

function sendReviewRequests(){
  /* Trigger horario. Recorre bookings completados que no tengan ReviewSent
     y manda email con link a la reseña. */
  const s = sheet(SHEET_NAMES.RESERVAS);
  const data = s.getDataRange().getValues();
  if (data.length < 2) return { ok: true, sent: 0 };
  const headers = data[0];
  const idxEstado = headers.indexOf('Estado');
  const idxReviewSent = headers.indexOf('ReviewSent');
  const idxCompletedAt = headers.indexOf('CompletedAt');
  const idxEmail = headers.indexOf('Email');
  const idxId = headers.indexOf('ID');
  const idxNombre = headers.indexOf('Nombre');
  const idxServicio = headers.indexOf('Servicio');
  const idxEmpleado = headers.indexOf('Empleado');

  if (idxEstado < 0 || idxReviewSent < 0) return { error: 'Hoja Reservas sin columnas ReviewSent/Estado. Re-ejecutá initializeSheets()' };

  let sent = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const estado = String(row[idxEstado] || '').toLowerCase();
    const alreadySent = row[idxReviewSent];
    const email = row[idxEmail];
    if (estado !== 'completado') continue;
    if (alreadySent) continue;
    if (!email || !String(email).includes('@')) {
      // Marcar como enviado para no reintentar
      s.getRange(i+1, idxReviewSent+1).setValue('no-email');
      continue;
    }
    const bookingId = row[idxId];
    const reviewUrl = ScriptApp.getService().getUrl().replace('/exec','') + '/exec?action=__review&id=' + encodeURIComponent(bookingId);
    /* URL del landing público en Hostinger (lo configurás vos arriba si lo cambiás) */
    const publicReviewUrl = 'https://lavadoybrillo.com/resena/?id=' + encodeURIComponent(bookingId);
    try {
      MailApp.sendEmail({
        to: email,
        subject: '¿Cómo te fue en Alvatowash? · Tu opinión cuenta',
        htmlBody: buildReviewEmail({
          name: row[idxNombre],
          service: row[idxServicio],
          employee: row[idxEmpleado] || '',
          url: publicReviewUrl
        }),
        name: 'Alvatowash'
      });
      s.getRange(i+1, idxReviewSent+1).setValue(new Date().toISOString());
      sent++;
    } catch (e) {
      Logger.log('Error reseña a ' + email + ': ' + e);
    }
  }
  return { ok: true, sent: sent };
}

function buildReviewEmail(d){
  return `
    <div style="font-family:-apple-system,Arial,sans-serif;max-width:560px;margin:0 auto;background:#FAFAFA;padding:30px 20px">
      <div style="background:#1D1D1F;color:#fff;padding:24px;border-radius:12px;border-top:3px solid #DC2626;text-align:center">
        <div style="font-size:24px;font-weight:800;letter-spacing:3px">ALVATOWASH</div>
        <div style="font-size:10px;color:#DC2626;letter-spacing:2px;text-transform:uppercase;margin-top:3px">Luxury detailing</div>
      </div>
      <div style="background:#fff;padding:30px 24px;border-radius:12px;margin-top:14px;text-align:center">
        <h2 style="margin:0 0 14px;color:#1D1D1F;font-size:22px">¿Cómo te fue, ${d.name}?</h2>
        <p style="color:#424245;line-height:1.6;margin-bottom:20px">Acabamos de terminar tu <strong>${d.service}</strong>${d.employee ? ' con ' + d.employee : ''}. Tu opinión nos ayuda a mejorar.</p>
        <div style="background:#FAFAFA;border-radius:10px;padding:24px 18px;margin:18px 0">
          <div style="font-size:32px;letter-spacing:8px;margin-bottom:14px;color:#FFD700">★ ★ ★ ★ ★</div>
          <a href="${d.url}" style="display:inline-block;background:#DC2626;color:#fff;padding:14px 32px;border-radius:99px;font-weight:700;text-decoration:none;font-size:15px">Dejar mi reseña</a>
          <div style="font-size:12px;color:#86868B;margin-top:14px">2 minutos. Te lo agradecemos.</div>
        </div>
      </div>
      <div style="text-align:center;color:#86868B;font-size:12px;margin-top:20px">Equipo Alvatowash · <a href="https://lavadoybrillo.com" style="color:#DC2626">lavadoybrillo.com</a></div>
    </div>
  `;
}

function installHourlyReviewTrigger(){
  /* Crear trigger horario. Borra triggers anteriores de sendReviewRequests. */
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendReviewRequests') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendReviewRequests').timeBased().everyHours(1).create();
  return 'Trigger creado: sendReviewRequests cada 1 hora';
}

/* ════════════════ RECORDATORIOS AUTOMÁTICOS ════════════════
   Ejecutar con trigger diario (ej. 19h):
   1. Reloj (Triggers) → Añadir trigger
   2. Función: sendReminders
   3. Tipo: Activado por tiempo · Día · 19:00
   ────────────────────────────────────────────────────────────── */
function sendReminders(){
  /* Enviar email recordatorio a los clientes con reserva mañana */
  const bookings = getBookings();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);
  let sent = 0;
  bookings.forEach(b => {
    const iso = String(b['Fecha ISO'] || '').slice(0, 10);
    if (iso !== tomorrowIso) return;
    if (!b['Email'] || !b['Email'].includes('@')) return;
    if (b['Estado'] === 'cancelado' || b['Estado'] === 'completado') return;
    try {
      MailApp.sendEmail({
        to: b['Email'],
        subject: 'Te esperamos mañana en Alvatowash 🚗',
        htmlBody: buildReminderEmail(b),
        name: 'Alvatowash'
      });
      sent++;
    } catch (e) {
      Logger.log('Error enviando reminder a ' + b['Email'] + ': ' + e);
    }
  });
  return { ok: true, sent: sent };
}
function buildReminderEmail(b){
  return `
    <div style="font-family:-apple-system,Arial,sans-serif;max-width:560px;margin:0 auto;background:#FAFAFA;padding:30px 20px">
      <div style="background:#1D1D1F;color:#fff;padding:24px;border-radius:12px;border-top:3px solid #DC2626">
        <div style="font-size:22px;font-weight:800;letter-spacing:2px">ALVATOWASH</div>
        <div style="font-size:10px;color:#DC2626;letter-spacing:2px;text-transform:uppercase;margin-top:2px">Luxury detailing</div>
      </div>
      <div style="background:#fff;padding:24px;border-radius:12px;margin-top:14px">
        <h2 style="margin:0 0 10px;color:#1D1D1F">Hola ${b['Nombre']},</h2>
        <p style="color:#424245;line-height:1.55">Te recordamos que mañana tenés tu cita en Alvatowash. Acá los detalles:</p>
        <div style="background:#FAFAFA;border-left:3px solid #DC2626;padding:14px 18px;border-radius:6px;margin:18px 0">
          <div style="font-weight:700;color:#1D1D1F;font-size:16px">${b['Servicio']}</div>
          <div style="color:#86868B;font-size:14px;margin-top:4px">📅 ${b['Fecha']} a las ${b['Hora']}</div>
          ${b['Empleado'] ? `<div style="color:#86868B;font-size:14px;margin-top:2px">👤 Te atenderá ${b['Empleado']}</div>` : ''}
        </div>
        <p style="color:#424245;line-height:1.55;font-size:13.5px">Si necesitás reagendar, contestá este email o escribinos por WhatsApp.</p>
        <p style="margin-top:24px;color:#86868B;font-size:12px">Equipo Alvatowash</p>
      </div>
    </div>
  `;
}

/* ════════════════ TRIGGERS DE INSTALACIÓN ════════════════ */
function installDailyReminderTrigger(){
  /* Crear trigger diario a las 19h. Borra triggers anteriores de sendReminders. */
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendReminders') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(19).create();
  return 'Trigger creado: sendReminders cada día a las 19:00';
}

/* ════════════════ TEST ════════════════ */
function testGetAccount(){
  Logger.log(JSON.stringify(getAccountStatus()));
}
function testInitAndSeed(){
  Logger.log(initializeSheets());
  Logger.log('Empleados sembrados: ' + getEmployees().length);
}
