/* ══════════════════════════════════════════════════════════════════
   CATÁLOGO DE PRODUCTOS · Pedidos internos Alvatowash
   ─────────────────────────────────────────────────────────────────
   Esta es la fuente única del catálogo de productos.
   Para cargar tus productos reales:
   1. Reemplazá esta lista con los productos del catálogo de Alvato
   2. Si tenés URLs de imagen, ponelas en `image`
   3. Si no, dejá `image: null` y el sistema usa SVG placeholder por categoría
   ══════════════════════════════════════════════════════════════════ */

window.PRODUCT_CATEGORIES = [
  { id:'lavado',      name:'Lavado',           order:1 },
  { id:'cera',        name:'Cera y Sellantes', order:2 },
  { id:'interior',    name:'Interior',         order:3 },
  { id:'ceramico',    name:'Cerámicos',        order:4 },
  { id:'pulido',      name:'Pulido',           order:5 },
  { id:'microfibras', name:'Microfibras',      order:6 },
  { id:'herramientas',name:'Herramientas',     order:7 },
  { id:'consumibles', name:'Consumibles',      order:8 }
];

/* Catálogo demo · ~40 productos representativos del sector detail.
   Reemplazá cuando tengas los datos reales del proveedor. */
window.PRODUCTS = [

  /* ─── Lavado ─── */
  { sku:'AF-001', cat:'lavado',  name:'Avalanche Snow Foam',          volume:'1 L',     price:18.90, stock:42, image:null, desc:'Espuma activa pH neutro · Pre-lavado seguro' },
  { sku:'AF-002', cat:'lavado',  name:'Lather Shampoo pH Neutro',     volume:'500 ml',  price:12.50, stock:88, image:null, desc:'Shampoo concentrado · 1:400 dilución' },
  { sku:'AF-003', cat:'lavado',  name:'Citrus Power Bug Remover',     volume:'500 ml',  price:14.90, stock:23, image:null, desc:'Eliminador de insectos y resinas' },
  { sku:'AF-004', cat:'lavado',  name:'Iron Out Limpiallantas',       volume:'500 ml',  price:16.90, stock:31, image:null, desc:'Descontaminante ferroso · cambio de color' },
  { sku:'AF-005', cat:'lavado',  name:'APC Limpiador Multiusos',      volume:'1 L',     price:11.90, stock:65, image:null, desc:'All Purpose Cleaner · interior y exterior' },

  /* ─── Cera y Sellantes ─── */
  { sku:'AF-101', cat:'cera',    name:'Tough Coat Sealant Líquido',   volume:'500 ml',  price:24.90, stock:18, image:null, desc:'Sellante sintético · 6 meses de protección' },
  { sku:'AF-102', cat:'cera',    name:'Glide Quick Detailer',         volume:'500 ml',  price:11.90, stock:54, image:null, desc:'Detallador rápido · brillo y deslizamiento' },
  { sku:'AF-103', cat:'cera',    name:'Spirit Cera Carnauba',         volume:'150 ml',  price:39.90, stock:9,  image:null, desc:'Cera 100% natural · acabado profundo' },
  { sku:'AF-104', cat:'cera',    name:'Power Seal Polímero',          volume:'250 ml',  price:28.90, stock:14, image:null, desc:'Sellante polimérico de larga duración' },
  { sku:'AF-105', cat:'cera',    name:'Tripple Polish & Wax',         volume:'500 ml',  price:21.90, stock:22, image:null, desc:'Pulido + cera en un solo paso' },

  /* ─── Interior ─── */
  { sku:'AF-201', cat:'interior',name:'Total Interior Cleaner',       volume:'500 ml',  price:13.90, stock:47, image:null, desc:'Limpiador universal tapicería y plásticos' },
  { sku:'AF-202', cat:'interior',name:'Spritz Ambientador',           volume:'100 ml',  price:8.50,  stock:120,image:null, desc:'Aromas: Vanilla · Cherry · Citrus' },
  { sku:'AF-203', cat:'interior',name:'Hide Limpiador de Cuero',      volume:'200 ml',  price:22.90, stock:16, image:null, desc:'Limpiador + nutriente para cuero' },
  { sku:'AF-204', cat:'interior',name:'Crystal Limpia Cristales',     volume:'500 ml',  price:9.90,  stock:73, image:null, desc:'Sin amoníaco · cero residuos' },
  { sku:'AF-205', cat:'interior',name:'Dressle Brillo Plásticos',     volume:'500 ml',  price:14.90, stock:28, image:null, desc:'Acabado mate · protección UV' },
  { sku:'AF-206', cat:'interior',name:'Mat Limpiador de Alfombras',   volume:'500 ml',  price:12.90, stock:34, image:null, desc:'Para inyección-extracción' },

  /* ─── Cerámicos ─── */
  { sku:'AF-301', cat:'ceramico',name:'Caramics Kit Self-Cleaning',   volume:'Kit',     price:89.00, stock:6,  image:null, desc:'Kit completo · aplicación + curado' },
  { sku:'AF-302', cat:'ceramico',name:'Nano Diamond Pro Coating',     volume:'50 ml',   price:145.00,stock:4,  image:null, desc:'Tratamiento cerámico · 3 años duración' },
  { sku:'AF-303', cat:'ceramico',name:'Caramics Maintenance Spray',   volume:'500 ml',  price:32.00, stock:12, image:null, desc:'Mantenimiento de capas cerámicas' },
  { sku:'AF-304', cat:'ceramico',name:'ProtectorPro Decontamination', volume:'250 ml',  price:32.00, stock:11, image:null, desc:'Pre-tratamiento antes del cerámico' },

  /* ─── Pulido ─── */
  { sku:'AF-401', cat:'pulido',  name:'Tripple Pulido Fino',          volume:'500 ml',  price:26.90, stock:13, image:null, desc:'Acabado · elimina holograms' },
  { sku:'AF-402', cat:'pulido',  name:'Revitalise No.1 Pulido Medio', volume:'500 ml',  price:28.90, stock:11, image:null, desc:'Compuesto medio · swirl marks' },
  { sku:'AF-403', cat:'pulido',  name:'Revitalise No.2 Pulido Grueso',volume:'500 ml',  price:28.90, stock:8,  image:null, desc:'Compuesto pesado · arañazos finos' },
  { sku:'AF-404', cat:'pulido',  name:'Pads Polish 6" (pack 3)',      volume:'3 uds',   price:18.50, stock:25, image:null, desc:'Foam pads · corte / acabado / lustre' },
  { sku:'AF-405', cat:'pulido',  name:'Clay Bar Suave',               volume:'200 g',   price:14.90, stock:30, image:null, desc:'Barra de arcilla descontaminante' },

  /* ─── Microfibras ─── */
  { sku:'AF-501', cat:'microfibras',name:'Workhorse Microfibra Premium', volume:'10 uds', price:24.00, stock:56, image:null, desc:'380 gsm · uso general' },
  { sku:'AF-502', cat:'microfibras',name:'Silk Drying Towel XL',         volume:'80×50',  price:32.90, stock:18, image:null, desc:'Toalla de secado sin marcas' },
  { sku:'AF-503', cat:'microfibras',name:'Glass Cloth Sin Pelusa',       volume:'5 uds',  price:14.50, stock:42, image:null, desc:'Específica para cristales' },
  { sku:'AF-504', cat:'microfibras',name:'Foam Applicators',             volume:'6 uds',  price:7.50,  stock:90, image:null, desc:'Aplicadores espuma para ceras' },
  { sku:'AF-505', cat:'microfibras',name:'Wash Mitt Lambswool',          volume:'1 ud',   price:19.90, stock:24, image:null, desc:'Manopla lana de cordero · 2 cubos' },

  /* ─── Herramientas ─── */
  { sku:'AF-601', cat:'herramientas',name:'Avalanche Snow Foam Lance',  volume:'1 ud',   price:65.00, stock:5,  image:null, desc:'Cañón espuma para Kärcher / lavadora' },
  { sku:'AF-602', cat:'herramientas',name:'Detailing Brushes Set',      volume:'5 uds',  price:24.00, stock:14, image:null, desc:'Cepillos detalle · varios tamaños' },
  { sku:'AF-603', cat:'herramientas',name:'Spray Bottle Vacío',         volume:'500 ml', price:4.50,  stock:80, image:null, desc:'Pulverizador profesional' },
  { sku:'AF-604', cat:'herramientas',name:'Bucket + Grit Guard',        volume:'18 L',   price:38.00, stock:9,  image:null, desc:'Cubo método 2 cubos · separa suciedad' },
  { sku:'AF-605', cat:'herramientas',name:'Hose Reel Carrete Manguera', volume:'30 m',   price:78.00, stock:3,  image:null, desc:'Carrete de pared retráctil' },

  /* ─── Consumibles ─── */
  { sku:'AF-701', cat:'consumibles',name:'Guantes Nitrilo (caja)',     volume:'100 uds',price:14.90, stock:35, image:null, desc:'Talla M / L disponibles' },
  { sku:'AF-702', cat:'consumibles',name:'Papel Limpieza Rollo',       volume:'400 m',  price:8.90,  stock:60, image:null, desc:'Papel industrial · alta absorción' },
  { sku:'AF-703', cat:'consumibles',name:'Tape Masking 25 m',          volume:'1 rollo',price:6.90,  stock:48, image:null, desc:'Cinta de pintor · sin residuos' },
  { sku:'AF-704', cat:'consumibles',name:'Bolsa Basura Industrial',    volume:'10 uds', price:7.50,  stock:72, image:null, desc:'120 L · alta densidad' }
];

/* SVG monocromos placeholder por categoría · estilo Apple SF Symbols */
window.PRODUCT_ICONS = {
  lavado:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6v3a3 3 0 0 1-1 2.2L13 9v3l4 2.5V21a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-6.5L11 12V9l-1-1.8A3 3 0 0 1 9 5V2z"/></svg>',
  cera:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7"/><path d="M9 4h6l-1 4h-4z"/><circle cx="12" cy="13" r="3"/></svg>',
  interior:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M7 9V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/><line x1="7" y1="13" x2="7" y2="13"/><line x1="17" y1="13" x2="17" y2="13"/></svg>',
  ceramico:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>',
  pulido:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  microfibras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="13" x2="21" y2="13"/><line x1="3" y1="17" x2="21" y2="17"/></svg>',
  herramientas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  consumibles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
};
