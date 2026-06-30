/* ══════════════════════════════════════════════════════════════════
   ALVATOWASH — CONFIGURACIÓN CENTRAL
   ──────────────────────────────────────────────────────────────────
   Tomá esta configuración como fuente única de la verdad. Si querés
   cambiar precios, centros, WhatsApp o backend, edita SOLO este archivo.
   ══════════════════════════════════════════════════════════════════ */

window.CONFIG = {
  business_name: 'Alvatowash',
  business_tagline: 'Lavado premium en tus centros',
  domain: 'lavadoybrillo.com',

  // ⚠️ WhatsApp comercial — cambialo por el número real del cliente
  whatsapp: '34600000000',

  // ⚠️ URL del Apps Script desplegado
  script_url: 'https://script.google.com/macros/s/AKfycbzpvDJsuuTAahWnjGFGG0R4H2dH46N6a4nbfy3xjvHDECW4BcYWo_mBqPyuyIIV4s14IQ/exec',
  script_token: 'alvatowash2026_token_seguro',

  /* ──────────────── SAAS METADATA ────────────────
     Cada vertical expone esta metadata. El panel maestro (supersaas/master/)
     la lee para mostrar: trial restante, plan, ingresos, salud del tenant.
     Se mantiene también en Code.gs (TENANT_META) para que el endpoint
     tenantStatus pueda calcular métricas live. */
  saas_meta: {
    tenant_id: 'alvatowash',
    vertical: 'detailing',
    plan: 'trial',                // trial | starter | pro | enterprise
    trial_started_at: '2026-06-01',
    trial_ends_at: '2026-07-01',
    monthly_price_eur: 0,         // se cobra cuando trial vence
    owner_email: 'hhernandezseijas@gmail.com'
  },

  /* ──────────────── DATOS LEGALES ────────────────
     Usados por las páginas /aviso-legal, /privacidad, /cookies.
     Sustituí por los datos reales del cliente para producción. */
  legal: {
    company_name: 'Alvatowash, S.L.',
    cif: 'B00000000',
    domicilio_social: 'Av. Ejemplo 1, 28000 Madrid',
    email_contacto: 'info@lavadoybrillo.com',
    email_dpo: 'privacidad@lavadoybrillo.com',
    telefono: '+34 600 000 000',
    registro_mercantil: 'Registro Mercantil de Madrid, Tomo 0000, Folio 000, Hoja M-000000',
    last_updated: '2026-06-21'
  },

  // ⚠️ Datos para facturas
  invoice: {
    razon_social: 'Alvatowash S.L.',
    nif:          'B00000000',
    address:      'Av. Ejemplo 1, 28000 Madrid',
    iva_default:  21,
    prefix:       'ALV',
    footer_text:  'Gracias por confiar en Alvatowash',
    logo_url:     '../images/logo.png',
    email:        'info@lavadoybrillo.com',
    web:          'lavadoybrillo.com',
    telefono:     '+34 600 000 000',
    iban:         '',
    notas:        'Pago en centro · Válido en el centro de compra'
  },

  /* ──────────────── SERVICIOS ────────────────
     Precios reales de alvato.com. El "Combo Verano" (89€) es el que
     activa la promo de mantenimiento a 45€ en los próximos 30 días. */
  services: [
    {
      key: 'premium_integral',
      name: 'Limpieza Premium Integral',
      desc: 'Cambio de temporada. Tu coche de cero por dentro y por fuera.',
      price: 197,
      priceWas: 257,
      ctaHref: 'reserva/?svc=premium_integral',
      badge: 'featured',
      eyebrow: 'Más completo',
      showOnLanding: true,
      maintenancePromo: null,
      includes: [
        'Limpieza interior profunda',
        'Tapicerías hasta 5 asientos',
        'Lavado exterior completo',
        'Moquetas y alfombrillas',
        'Repaso de brillo GRATIS (30 días)',
        'Garantía de lluvia Alvato — 48h'
      ]
    },
    {
      key: 'combo_verano',
      name: 'Combo Verano',
      desc: 'El paquete más completo al mejor precio',
      price: 89,
      priceWas: 178,
      ctaHref: 'reserva/?svc=combo_verano',
      badge: 'fire',
      eyebrow: 'Promo Verano · −50%',
      showOnLanding: true,
      maintenancePromo: 45,
      includes: [
        'Lavado de carrocería',
        'Aplicación de doble cera',
        'Limpieza de cristales y espejos',
        'Limpieza salpicadero',
        'Aspirado interior y moquetas',
        'Lavado de llantas',
        'Desinfección de ozono',
        'Perfume de coche'
      ]
    },
    {
      key: 'mantenimiento',
      name: 'Mantenimiento',
      desc: 'Lavado rápido y eficaz para el día a día',
      price: 45,
      ctaHref: 'reserva/?svc=mantenimiento',
      badge: null,
      eyebrow: 'Recurrente',
      showOnLanding: true,
      maintenancePromo: null,
      includes: [
        'Lavado de carrocería',
        'Aplicación de cera',
        'Limpieza de cristales y espejos',
        'Limpieza salpicadero',
        'Aspirado interior',
        'Servicio de recepción'
      ]
    },
    {
      key: 'mantenimiento_plus',
      name: 'Lavado Mantenimiento Plus',
      desc: 'Con ozono y perfume — la experiencia completa',
      price: 42,
      ctaHref: 'reserva/?svc=mantenimiento_plus',
      badge: null,
      eyebrow: null,
      includes: [
        'Todo lo del Mantenimiento',
        'Desinfección de ozono',
        'Perfume de coche'
      ]
    },
    {
      key: 'nanodiamond',
      name: 'Nanodiamond',
      desc: 'Protección cerámica de última generación',
      price: 540,
      priceWas: null,
      priceCentro: 700,
      ctaHref: 'reserva/?svc=nanodiamond',
      badge: 'gold',
      eyebrow: 'Cerámico premium',
      showOnLanding: true,
      deposit: 20,
      maintenancePromo: null,
      includes: [
        'Repele líquidos',
        'Anti excremento',
        'Anti grafitis',
        'Anti contaminación'
      ]
    },
    {
      key: 'reac_exterior',
      name: 'Reacondicionado Exterior',
      desc: 'Brillo profesional de carrocería y llantas',
      price: 24.90,
      includes: [
        'Limpieza profunda de carrocería',
        'Lavado de llantas',
        'Limpieza de cristales',
        'Eliminación de suciedad y polvo'
      ]
    },
    {
      key: 'reac_interior',
      name: 'Reacondicionado Interior',
      desc: 'Higiene y desinfección total del habitáculo',
      price: 24.90,
      includes: [
        'Aspirado técnico de moquetas',
        'Detallado de salpicadero y consola',
        'Limpieza de paneles de puertas',
        'Desinfección libre de alérgenos'
      ]
    }
  ],

  /* ──────────────── EXTRAS ────────────────
     Si el cliente reserva el Combo Verano y vuelve en 30 días, estos
     extras llevan 20% de descuento. */
  extras: [
    { key:'tapiceria', name:'Limpieza de tapicería',     desc:'Asientos + suelo + interiores',  price: 60 },
    { key:'ceramico',  name:'Tratamiento cerámico',      desc:'Protección 6-12 meses',          price: 120 },
    { key:'cuero',     name:'Protección e hidratación de cuero', desc:'Asientos y volante',     price: 45 },
    { key:'faros',     name:'Pulido de faros',           desc:'Restaura amarillamiento',        price: 25 },
    { key:'motor',     name:'Limpieza de motor',         desc:'Vapor + degrasante seguro',      price: 40 }
  ],

  /* ──────────────── TIPOS DE VEHÍCULO (multiplicador de precio) ──────────────── */
  vehicles: [
    { key:'chico',  label:'Chico (Up, Polo, Fiesta)',           mult: 1.0 },
    { key:'sedan',  label:'Sedán medio (Golf, Civic, Corolla)', mult: 1.15 },
    { key:'suv',    label:'SUV / Crossover (Tiguan, Qashqai)',  mult: 1.35 },
    { key:'pickup', label:'Pickup / 4x4 / Van grande',          mult: 1.55 }
  ],

  /* ──────────────── CENTROS (19 ubicaciones) ────────────────
     ⚠️ Las direcciones son orientativas (sacadas de alvato.com).
     Pegá las direcciones exactas y los teléfonos reales cuando los tengas. */
  /* ⚠ Cada centro tiene su número de WhatsApp propio donde llegan los leads de esa ciudad.
     Si dejás el `whatsapp` vacío en algún centro, el sistema usa el `whatsapp` global de arriba.
     Cuando el cliente selecciona un centro en la reserva, su mensaje WhatsApp se envía a ESE número. */
  centros: [
    { id:'bcn',   ciudad:'Barcelona',  nombre:'Alvato Barcelona',                 whatsapp:'34600000001', email:'barcelona@alvato.com', direccion:'Centro Barcelona',                   horario:'L-S 9-20h' },
    { id:'mad',   ciudad:'Madrid',     nombre:'Alvato Madrid',                    whatsapp:'34600000002', email:'madrid@alvato.com',    direccion:'Centro Madrid',                      horario:'L-S 9-20h' },
    { id:'mal',   ciudad:'Mallorca',   nombre:'Alvato Mallorca',                  whatsapp:'34600000003', email:'mallorca@alvato.com',  direccion:'Palma de Mallorca',                  horario:'L-S 9-20h' },
    { id:'vig',   ciudad:'Vigo',       nombre:'Alvato Vigo · El Corte Inglés',    whatsapp:'34600000004', email:'vigo@alvato.com',      direccion:'C.C. El Corte Inglés, Vigo',         horario:'L-S 10-21h' },
    { id:'val',   ciudad:'Valencia',   nombre:'Alvato Valencia',                  whatsapp:'34600000005', email:'valencia@alvato.com',  direccion:'Centro Valencia',                    horario:'L-S 9-20h' },
    { id:'tnf',   ciudad:'Tenerife',   nombre:'Alvato Tenerife',                  whatsapp:'34600000006', email:'tenerife@alvato.com',  direccion:'Centro Tenerife',                    horario:'L-S 9-20h' },
    { id:'sev',   ciudad:'Sevilla',    nombre:'Alvato Sevilla',                   whatsapp:'34600000007', email:'sevilla@alvato.com',   direccion:'Centro Sevilla',                     horario:'L-S 9-20h' },
    { id:'lpa',   ciudad:'Las Palmas', nombre:'Alvato Las Palmas',                whatsapp:'34600000008', email:'laspalmas@alvato.com', direccion:'Las Palmas de Gran Canaria',         horario:'L-S 9-20h' },
    { id:'cas',   ciudad:'Castellón',  nombre:'Alvato Castellón · El Corte Inglés', whatsapp:'34600000009', email:'castellon@alvato.com', direccion:'C.C. El Corte Inglés, Castellón',  horario:'L-S 10-21h' },
    { id:'gra',   ciudad:'Granada',    nombre:'Alvato Granada · Violón',          whatsapp:'34600000010', email:'granada@alvato.com',   direccion:'Parking Violón, Granada',            horario:'L-S 9-20h' },
    { id:'reu',   ciudad:'Reus',       nombre:'Alvato Reus · La Fira',            whatsapp:'34600000011', email:'reus@alvato.com',      direccion:'La Fira Reus',                       horario:'L-S 9-20h' },
    { id:'and',   ciudad:'Andorra',    nombre:'Alvato Andorra La Vella',          whatsapp:'37600000012', email:'andorra@alvato.com',   direccion:'Andorra La Vella',                   horario:'L-S 9-19h' },
    { id:'pam',   ciudad:'Pamplona',   nombre:'Alvato Pamplona · Baluarte',       whatsapp:'34600000013', email:'pamplona@alvato.com',  direccion:'Baluarte, Pamplona',                 horario:'L-S 9-20h' },
    { id:'gij',   ciudad:'Gijón',      nombre:'Alvato Gijón · Parking El Arenal', whatsapp:'34600000014', email:'gijon@alvato.com',     direccion:'Parking El Arenal, Gijón',           horario:'L-S 9-20h' },
    { id:'cor',   ciudad:'A Coruña',   nombre:'Alvato Coruña · Marineda City',    whatsapp:'34600000015', email:'coruna@alvato.com',    direccion:'Marineda City, A Coruña',            horario:'L-S 10-22h' },
    { id:'zar',   ciudad:'Zaragoza',   nombre:'Alvato Zaragoza · Pk Ayuntamiento',whatsapp:'34600000016', email:'zaragoza@alvato.com',  direccion:'Parking Ayuntamiento, Zaragoza',     horario:'L-S 9-20h' },
    { id:'mlg',   ciudad:'Málaga',     nombre:'Alvato Málaga · Marbella Norte',   whatsapp:'34600000017', email:'malaga@alvato.com',    direccion:'Francisco Norte Marbella',           horario:'L-S 9-20h' },
    { id:'tar',   ciudad:'Tarragona',  nombre:'Alvato Tarragona · Rambla Nova',   whatsapp:'34600000018', email:'tarragona@alvato.com', direccion:'Rambla Nova, Tarragona',             horario:'L-S 9-20h' },
    { id:'gir',   ciudad:'Girona',     nombre:'Alvato Girona · Espai',            whatsapp:'34600000019', email:'girona@alvato.com',    direccion:'Espai, Girona',                      horario:'L-S 9-20h' }
  ],

  /* ──────────────── PROMOS ──────────────── */
  promos: {
    combo_verano_repeat: {
      window_days: 30,
      label: 'Mantenimiento promo',
      desc: 'Si vuelves en 30 días, el mismo lavado vale 45€'
    },
    extras_repeat: {
      window_days: 30,
      discount_pct: 20,
      applies_to: ['tapiceria','ceramico','cuero'],
      label: '20% off en tratamientos',
      desc: '20% en tapicería, cerámico o cuero si vuelves en 30 días'
    }
  },

  /* ════════════════════════════════════════════════════════════════════
     PROGRAMA DE PUNTOS · ESPECIFICACIÓN CANÓNICA v2 (calibrado financieramente)
     Cashback objetivo: 2% (estándar Apple Card / Starbucks)
     1 punto = 0,02 € de valor de canje
     Detalles + cálculos completos en PUNTOS-Y-MASTER.md
     ════════════════════════════════════════════════════════════════════ */
  loyalty: {
    enabled: true,
    cashback_pct: 2,           // valor de 1 pt = 0,02 €
    pt_value_eur: 0.02,

    /* Topes de seguridad para que el programa no se descontrole */
    max_pts_per_booking_pct: 50,   // un Mantenimiento de 35€ no se paga 100% con puntos
    max_discount_eur: 100,         // tope absoluto por reserva
    rare_reward_quarter_cap: 50,   // máx 50 canjes/trimestre de recompensas premium en la red

    /* ─────────── Niveles VIP (sin multiplicador inflacionario) ─────────── */
    /* Los niveles dan CASHBACK escalonado + perks no productivos */
    levels: [
      { name:'Bronce',  min_points:0,    color:'#B8860B', cashback_pct:2.0, perks:['Acceso al programa','Acumulás puntos en cada visita'] },
      { name:'Plata',   min_points:500,  color:'#C0C0C0', cashback_pct:2.5, perks:['Cashback 2,5%','Lista prioritaria','5€ extra en cumpleaños'] },
      { name:'Oro',     min_points:2000, color:'#D4AF37', cashback_pct:3.0, perks:['Cashback 3,0%','Entrega rápida','10€ extra en cumpleaños'] },
      { name:'Diamante',min_points:5000, color:'#B9F2FF', cashback_pct:3.5, perks:['Cashback 3,5%','Nanodiamond −30% anual','20€ extra cumpleaños','Asesoría dedicada'] }
    ],

    /* ─────────── Cómo se ganan puntos ─────────── */
    points_rules: {
      /* Servicios · ratio 1€=1pt · bonus 1,05× solo en premium */
      services: [
        { key:'aspirado',           name:'Aspirado individual',         points:10  },
        { key:'mantenimiento',      name:'Lavado Mantenimiento (35€)',  points:35  },
        { key:'mantenimiento_plus', name:'Mantenimiento Plus (42€)',    points:45  },
        { key:'reacondicionado',    name:'Reacondicionado Ext/Int (24,90€)', points:25  },
        { key:'combo_verano',       name:'Combo Verano (89€)',          points:95,  bonus:true },
        { key:'tapiceria',          name:'Tapicería premium',           points:50  },
        { key:'cuero',              name:'Tratamiento cuero',           points:40  },
        { key:'pulido',             name:'Pulido eliminar arañazos',    points:155, bonus:true },
        { key:'nanodiamond',        name:'Nanodiamond cerámico (540€)', points:570, bonus:true }
      ],

      /* Engagement · micro-incentivos (cada uno vale < 0,60€ en costo real) */
      engagement: [
        { key:'review_5',         name:'Reseña 5★ verificada en Google',   points:30, cap:'1 por reseña' },
        { key:'ig_tag',           name:'Etiquetar @alvatowash en Instagram', points:20, cap:'máx. 1 por semana' },
        { key:'ig_story',         name:'Story con #miLavadoAlvato',         points:15, cap:'máx. 2 por mes' },
        { key:'before_after',     name:'Subir foto antes/después',          points:15, cap:'1 por servicio' },
        { key:'profile_complete', name:'Completar perfil + vehículo',       points:15, cap:'una sola vez' },
        { key:'push_notif',       name:'Activar notificaciones',            points:10, cap:'una sola vez' }
      ],

      /* Referidos · escalonado · solo pagás cuando el amigo demuestra ser cliente real */
      /* CAC máximo por referido convertido: ~17€ (sobre LTV mín. 500€ → ratio 3,4%) */
      referrals: {
        on_signup:        { client_gets:0,   friend_gets:0,   desc:'Tu amigo se da de alta (anti-fraude · sin puntos)' },
        on_first_booking: { client_gets:100, friend_gets:50,  desc:'Tu amigo hace su primer lavado pagado' },
        on_friend_silver: { client_gets:500, friend_gets:0,   desc:'Tu amigo llega a Plata (500 pts gastados)' },
        friend_welcome_discount_pct: 10,  // -10% en su primer lavado · cubre el incentivo de signup
        friend_welcome_min_eur: 3,
        friend_welcome_max_eur: 10,
        anti_fraud_limit: 10,
        link_template: 'https://lavadoybrillo.com/?ref={REFCODE}'
      },

      /* Eventos automáticos · recalibrados a "simbólico" no "regalo" */
      events: [
        { key:'birthday',     name:'Cumpleaños',                points:25,  frequency:'anual' },
        { key:'anniversary',  name:'Aniversario primer lavado', points:25,  frequency:'anual' },
        { key:'milestone_10', name:'Lavado #10',                points:50,  frequency:'una vez' },
        { key:'milestone_25', name:'Lavado #25',                points:100, frequency:'una vez' },
        { key:'milestone_50', name:'Lavado #50',                points:250, frequency:'una vez', extra:'+ Nanodiamond −25% off' }
      ]
    },

    /* ─────────── Recompensas canjeables (en EUROS, no servicios completos) ─────────── */
    /* El cliente canjea descuentos aplicables. Margen siempre bajo control. */
    rewards: [
      { id:'r1',  cost:250,   name:'5 € de descuento',          desc:'En tu próxima reserva',           type:'discount_eur', value:5   },
      { id:'r2',  cost:500,   name:'10 € de descuento',         desc:'O aspirado gratis equivalente',   type:'discount_eur', value:10  },
      { id:'r3',  cost:1000,  name:'20 € de descuento',         desc:'Aplicable a cualquier servicio',  type:'discount_eur', value:20  },
      { id:'r4',  cost:2500,  name:'50 € de descuento',         desc:'Combo Verano por solo 39 €',      type:'discount_eur', value:50  },
      { id:'r5',  cost:5000,  name:'100 € de descuento',        desc:'Tope de descuento por reserva',   type:'discount_eur', value:100 },
      { id:'r6',  cost:10000, name:'Nanodiamond −50%',          desc:'540 € → 270 € · 50 canjes/trimestre', type:'service_discount', value:270, rare:true }
    ],

    /* Reglas de canje */
    redemption_rules: {
      max_one_coupon_per_booking: true,
      not_combinable_with_promos: true,
      coupon_expiry_months: 6,
      tier_points_keep_on_redeem: true
    },

    /* ─────────── El Master del Brillo (camino gamificado) ─────────── */
    master_brillo: {
      enabled: true,
      title: 'El Master del Brillo',
      tagline: 'Tu viaje del aprendiz al maestro del detail',
      levels: [
        {
          n:1, name:'Aprendiz',          emoji:'', color:'#86EFAC',
          mission:'Hacé tu primer lavado',
          requirement:{ type:'any_booking_completed', count:1 },
          reward_points:50, reward_extra:'Medalla Aprendiz',
          lesson_title:'Por qué un lavado profesional es distinto al de gasolinera',
          lesson_duration:'2:30'
        },
        {
          n:2, name:'Iniciado',          emoji:'', color:'#7DD3FC',
          mission:'3 mantenimientos en 90 días',
          requirement:{ type:'mantenimiento_count', count:3, days:90 },
          reward_points:100, reward_extra:'−10% próximo Combo',
          lesson_title:'Cómo el mantenimiento regular alarga la vida de tu pintura',
          lesson_duration:'2:50'
        },
        {
          n:3, name:'Detallista',        emoji:'', color:'#FBBF24',
          mission:'Contratá un Combo Verano',
          requirement:{ type:'service_done', service:'combo_verano' },
          reward_points:150, reward_extra:'Acceso a lista de espera prioritaria',
          lesson_title:'Reacondicionado integral: qué hacemos y por qué tarda 90 minutos',
          lesson_duration:'3:00'
        },
        {
          n:4, name:'Restaurador',       emoji:'', color:'#FB923C',
          mission:'Reacondicioná interior + exterior',
          requirement:{ type:'services_done', services:['reacondicionado_int','reacondicionado_ext'] },
          reward_points:200, reward_extra:'1 aspirado gratis trimestral',
          lesson_title:'Cuero, telas y plásticos: tratamiento profesional',
          lesson_duration:'3:15'
        },
        {
          n:5, name:'Protector',         emoji:'', color:'#A78BFA',
          mission:'Aplicá cera premium o cerámico básico',
          requirement:{ type:'service_done', service:'cera_premium' },
          reward_points:300, reward_extra:'−15% en pulidos',
          lesson_title:'Cera hidrofóbica: por qué el agua resbala sola',
          lesson_duration:'2:40'
        },
        {
          n:6, name:'Maestro',           emoji:'', color:'#67E8F9',
          mission:'Aplicá tratamiento Nanodiamond',
          requirement:{ type:'service_done', service:'nanodiamond' },
          reward_points:500, reward_extra:'Acceso al Club Diamante',
          lesson_title:'Nanodiamond cerámico: la capa que dura años',
          lesson_duration:'3:30'
        },
        {
          n:7, name:'Leyenda',           emoji:'👑', color:'#FDE047',
          mission:'Mantenimiento del cerámico durante 12 meses',
          requirement:{ type:'nanodiamond_maintained', months:12 },
          reward_points:1000, reward_extra:'Sesión privada con jefe de detail',
          lesson_title:'Mantenimiento del cerámico: rutina anual perfecta',
          lesson_duration:'3:00'
        }
      ]
    },

    /* ─────────── Reglas de negocio ─────────── */
    expiry_months: 24,
    inactive_penalty_pct: 50,
    cancellation_keeps_points: true,
    points_to_tier_keep_on_redeem: true
  }
};
