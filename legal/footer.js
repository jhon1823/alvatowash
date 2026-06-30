/* ══════════════════════════════════════════════════════════════════
   FOOTER + COOKIE BANNER · drop-in reutilizable
   ─────────────────────────────────────────────────────────────────
   Uso: <script src="legal/footer.js"></script>
        (Ajusta el path relativo según la profundidad de la página)
   Inserta automáticamente al final del <body>:
   - Un footer minimalista con enlaces legales
   - Un banner de cookies RGPD (granular: necesarias / analíticas / marketing)
   La decisión del usuario queda guardada en localStorage como `cookie_consent`.
   ══════════════════════════════════════════════════════════════════ */

(function() {
  if (window.__ALVATO_FOOTER_LOADED__) return;
  window.__ALVATO_FOOTER_LOADED__ = true;

  /* Detectar profundidad para construir paths */
  const rootPath = (() => {
    const sc = document.currentScript;
    if (!sc) return './';
    const src = sc.getAttribute('src') || '';
    return src.substring(0, src.indexOf('legal/'));
  })();

  const cfg = (window.CONFIG && window.CONFIG.legal) || {};
  const companyName = cfg.company_name || 'Alvatowash, S.L.';
  const year = new Date().getFullYear();

  /* ───── ESTILOS INLINE ───── */
  const style = document.createElement('style');
  style.textContent = `
    .alvato-footer{
      background:#0a0a0a;color:#a8a8a8;padding:48px 24px 32px;
      border-top:1px solid rgba(255,255,255,.08);
      font-family:'Inter',-apple-system,system-ui,sans-serif;font-size:13.5px;
      text-align:center;line-height:1.6;
    }
    .alvato-footer-brand{
      font-family:'Instrument Serif',Georgia,serif;font-style:italic;
      font-size:24px;color:#fafafa;margin-bottom:8px;
    }
    .alvato-footer-tagline{color:#6b6b6b;margin-bottom:24px;font-size:13px}
    .alvato-footer-links{display:flex;flex-wrap:wrap;justify-content:center;gap:24px;margin-bottom:20px}
    .alvato-footer-links a{color:#a8a8a8;text-decoration:none;transition:color .2s}
    .alvato-footer-links a:hover{color:#fafafa}
    .alvato-footer-copy{color:#6b6b6b;font-size:12.5px}
    .alvato-footer-copy a{color:#a8a8a8;text-decoration:none;margin:0 8px}
    .cookie-banner{
      position:fixed;bottom:16px;left:16px;right:16px;max-width:560px;
      margin:0 auto;background:#141414;border:1px solid rgba(255,255,255,.12);
      border-radius:18px;padding:20px 22px;z-index:9999;
      box-shadow:0 24px 60px rgba(0,0,0,.6);
      transform:translateY(120%);opacity:0;
      transition:transform .5s cubic-bezier(.32,.72,0,1), opacity .4s;
      font-family:'Inter',-apple-system,system-ui,sans-serif;color:#fafafa;font-size:14px;
    }
    .cookie-banner.show{transform:translateY(0);opacity:1}
    .cookie-banner-title{font-weight:600;font-size:15px;margin-bottom:6px}
    .cookie-banner-text{color:#a8a8a8;font-size:13px;line-height:1.5;margin-bottom:14px}
    .cookie-banner-text a{color:#d4af37;text-decoration:none}
    .cookie-banner-actions{display:flex;flex-wrap:wrap;gap:8px}
    .cookie-banner button{
      flex:1;min-width:auto;padding:10px 14px;border-radius:999px;border:none;
      cursor:pointer;font-weight:600;font-size:13px;font-family:inherit;transition:transform .15s;
    }
    .cookie-banner button:active{transform:scale(.97)}
    .cookie-btn-accept{background:#fafafa;color:#0a0a0a}
    .cookie-btn-config{background:transparent;color:#a8a8a8;border:1px solid rgba(255,255,255,.15)!important}
    .cookie-btn-reject{background:transparent;color:#a8a8a8;border:1px solid rgba(255,255,255,.15)!important}
    .cookie-config{
      position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:10000;
      display:none;align-items:center;justify-content:center;padding:16px;
      backdrop-filter:blur(8px);
    }
    .cookie-config.show{display:flex}
    .cookie-config-box{
      background:#141414;border-radius:24px;max-width:480px;width:100%;
      padding:28px;color:#fafafa;font-family:inherit;
      border:1px solid rgba(255,255,255,.08);
    }
    .cookie-config h2{font-size:22px;margin-bottom:8px;font-weight:600}
    .cookie-config p{color:#a8a8a8;font-size:13.5px;margin-bottom:20px;line-height:1.5}
    .cookie-toggle{
      display:flex;align-items:center;justify-content:space-between;
      padding:14px 0;border-top:1px solid rgba(255,255,255,.08);
    }
    .cookie-toggle:first-of-type{border-top:none}
    .cookie-toggle-info strong{display:block;font-weight:600;font-size:14px;margin-bottom:2px}
    .cookie-toggle-info span{color:#6b6b6b;font-size:12.5px}
    .switch{
      width:42px;height:24px;background:#333;border-radius:999px;
      position:relative;cursor:pointer;transition:background .2s;
    }
    .switch::after{
      content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;
      background:#fff;border-radius:50%;transition:left .2s;
    }
    .switch.on{background:#34c759}
    .switch.on::after{left:20px}
    .switch.locked{opacity:.4;cursor:not-allowed}
    .cookie-config-save{
      width:100%;padding:13px;background:#fafafa;color:#0a0a0a;
      border:none;border-radius:999px;font-weight:600;font-size:14px;
      cursor:pointer;margin-top:18px;font-family:inherit;transition:transform .15s;
    }
    .cookie-config-save:active{transform:scale(.97)}
  `;
  document.head.appendChild(style);

  /* ───── FOOTER ───── */
  const footer = document.createElement('footer');
  footer.className = 'alvato-footer';
  footer.innerHTML = `
    <div class="alvato-footer-brand">${(window.CONFIG && window.CONFIG.business_name) || 'Alvatowash'}</div>
    <div class="alvato-footer-tagline">Lavado premium. ${(window.CONFIG && window.CONFIG.centros?.length) || 19} centros en España y Andorra.</div>
    <div class="alvato-footer-links">
      <a href="${rootPath}">Inicio</a>
      <a href="${rootPath}reserva/">Reservar</a>
      <a href="${rootPath}area-cliente/">Área VIP</a>
      <a href="${rootPath}legal/aviso-legal/">Aviso Legal</a>
      <a href="${rootPath}legal/privacidad/">Privacidad</a>
      <a href="${rootPath}legal/cookies/">Cookies</a>
      <a href="#" onclick="window.__alvatoOpenCookieConfig();return false;">Configurar cookies</a>
    </div>
    <div class="alvato-footer-copy">
      © ${year} ${companyName} · Todos los derechos reservados
    </div>
  `;

  /* ───── BANNER COOKIES ───── */
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.id = 'cookieBanner';
  banner.innerHTML = `
    <div class="cookie-banner-title">Usamos cookies</div>
    <div class="cookie-banner-text">
      Usamos cookies imprescindibles para que el sitio funcione, y opcionales para entender cómo se usa.
      Puedes aceptar todas, rechazarlas (excepto las necesarias) o configurar tu elección.
      Más info en nuestra <a href="${rootPath}legal/cookies/">política de cookies</a>.
    </div>
    <div class="cookie-banner-actions">
      <button class="cookie-btn-reject" onclick="window.__alvatoCookieDecide('reject')">Solo necesarias</button>
      <button class="cookie-btn-config" onclick="window.__alvatoOpenCookieConfig()">Configurar</button>
      <button class="cookie-btn-accept" onclick="window.__alvatoCookieDecide('all')">Aceptar todas</button>
    </div>
  `;

  /* ───── MODAL CONFIG ───── */
  const modal = document.createElement('div');
  modal.className = 'cookie-config';
  modal.id = 'cookieConfig';
  modal.innerHTML = `
    <div class="cookie-config-box">
      <h2>Configurar cookies</h2>
      <p>Elige qué tipo de cookies aceptas. Puedes cambiar tu elección cuando quieras desde el pie de página.</p>
      <div class="cookie-toggle">
        <div class="cookie-toggle-info"><strong>Necesarias</strong><span>Imprescindibles para el sitio</span></div>
        <div class="switch on locked"></div>
      </div>
      <div class="cookie-toggle">
        <div class="cookie-toggle-info"><strong>Funcionales</strong><span>Recuerdan tus preferencias</span></div>
        <div class="switch" id="swFunc" onclick="this.classList.toggle('on')"></div>
      </div>
      <div class="cookie-toggle">
        <div class="cookie-toggle-info"><strong>Analíticas</strong><span>Google Analytics anónimo</span></div>
        <div class="switch" id="swAnal" onclick="this.classList.toggle('on')"></div>
      </div>
      <div class="cookie-toggle">
        <div class="cookie-toggle-info"><strong>Marketing</strong><span>Meta Pixel para campañas</span></div>
        <div class="switch" id="swMkt" onclick="this.classList.toggle('on')"></div>
      </div>
      <button class="cookie-config-save" onclick="window.__alvatoSaveCookieConfig()">Guardar elección</button>
    </div>
  `;

  /* Insertar después de que cargue el body */
  function insertAll(){
    document.body.appendChild(footer);
    document.body.appendChild(banner);
    document.body.appendChild(modal);

    /* Mostrar banner si no hay consentimiento previo */
    if (!localStorage.getItem('cookie_consent')) {
      setTimeout(() => banner.classList.add('show'), 1200);
    } else {
      /* Aplicar el consentimiento guardado */
      const c = JSON.parse(localStorage.getItem('cookie_consent') || '{}');
      applyConsent(c);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertAll);
  } else {
    insertAll();
  }

  /* ───── API GLOBAL ───── */
  window.__alvatoCookieDecide = function(decision) {
    const consent = decision === 'all'
      ? { necessary:true, functional:true, analytics:true, marketing:true, ts:Date.now() }
      : { necessary:true, functional:false, analytics:false, marketing:false, ts:Date.now() };
    localStorage.setItem('cookie_consent', JSON.stringify(consent));
    banner.classList.remove('show');
    applyConsent(consent);
  };

  window.__alvatoOpenCookieConfig = function() {
    const c = JSON.parse(localStorage.getItem('cookie_consent') || '{}');
    const sf = document.getElementById('swFunc');
    const sa = document.getElementById('swAnal');
    const sm = document.getElementById('swMkt');
    if (sf) sf.classList.toggle('on', !!c.functional);
    if (sa) sa.classList.toggle('on', !!c.analytics);
    if (sm) sm.classList.toggle('on', !!c.marketing);
    modal.classList.add('show');
  };

  window.__alvatoSaveCookieConfig = function() {
    const consent = {
      necessary: true,
      functional: document.getElementById('swFunc').classList.contains('on'),
      analytics: document.getElementById('swAnal').classList.contains('on'),
      marketing: document.getElementById('swMkt').classList.contains('on'),
      ts: Date.now()
    };
    localStorage.setItem('cookie_consent', JSON.stringify(consent));
    modal.classList.remove('show');
    banner.classList.remove('show');
    applyConsent(consent);
  };

  function applyConsent(c) {
    /* Aquí cargás los pixels solo si el usuario los aceptó.
       Ejemplo: si c.analytics, inyectar Google Analytics.
       Por ahora solo dispatcheamos un evento para que el resto del código reaccione. */
    window.dispatchEvent(new CustomEvent('cookieConsent', { detail: c }));
  }
})();
