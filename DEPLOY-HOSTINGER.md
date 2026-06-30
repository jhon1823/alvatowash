# Despliegue de Alvatowash en Hostinger

Esta guía cubre el deploy completo de `alvatowash/` al dominio `lavadoybrillo.com` en Hostinger, paso a paso.

## 1. Estructura que vas a subir

Todo lo que está dentro de `supersaas/alvatowash/` debe ir a la raíz del hosting (`public_html/`). Estructura final tras el upload:

```
public_html/
├── index.html                ← landing principal
├── config.js                 ← configuración (NO COMPARTIR el token)
├── icon.svg
├── manifest.json
├── robots.txt
├── sitemap.xml
├── og-cover.jpg              ← imagen 1200x630 para compartir en redes (créala con Canva)
├── reserva/
│   ├── index.html
│   ├── exito/index.html
│   └── cancelado/index.html
├── area-cliente/index.html
├── resena/index.html
├── admin/                    ← protégelo con .htaccess (ver paso 5)
│   ├── index-pro.html
│   └── ...
├── empleados/index.html
└── legal/
    ├── style.css
    ├── footer.js
    ├── aviso-legal/index.html
    ├── privacidad/index.html
    └── cookies/index.html
```

## 2. Crear el dominio en Hostinger

1. Entra a hPanel → **Dominios → Mi dominio** → comprobar que `lavadoybrillo.com` está conectado.
2. Si todavía no está, en hPanel → **Hosting → Administrar → Dominios → Añadir un nuevo dominio** y conéctalo.
3. Espera la propagación DNS (5–60 min).

## 3. Subir los archivos

**Opción A — File Manager** (más fácil para una primera vez):
1. hPanel → **Archivos → Administrador de archivos**.
2. Entra a `public_html/` y borra el `default.html` o lo que venga preinstalado.
3. Arriba a la derecha → **Subir archivos** → seleccioná TODO el contenido de `supersaas/alvatowash/`.

**Opción B — FTP** (recomendado para futuras actualizaciones):
1. hPanel → **Archivos → Cuentas FTP** → copia el host, usuario y contraseña.
2. Abrí FileZilla (gratis), conectá, y arrastrá toda la carpeta `alvatowash/` al `public_html/`.

## 4. Configurar HTTPS

1. hPanel → **Seguridad → SSL** → instalá el certificado **Let's Encrypt** gratuito.
2. Activá **Forzar HTTPS** (redirige todo el tráfico http→https automáticamente).

## 5. Proteger /admin/ con contraseña básica (recomendado)

Aunque el admin ya tiene login propio, una segunda barrera evita que aparezca en buscadores y bloquea bots:

Crear `public_html/admin/.htaccess`:
```
AuthType Basic
AuthName "Restringido"
AuthUserFile /home/USUARIO/public_html/admin/.htpasswd
Require valid-user
```

Crear `.htpasswd` desde https://www.htaccesstools.com/htpasswd-generator/ con usuario y contraseña, y subirlo a `/admin/`. Sustituí `USUARIO` por el nombre de tu cuenta Hostinger (lo ves en File Manager arriba).

## 6. Configurar el dominio en Stripe + Apps Script

En `admin/Code.gs` confirmar que `PUBLIC_DOMAIN` está como:
```js
const PUBLIC_DOMAIN = 'https://lavadoybrillo.com';
```
Y redesplegar el Apps Script (ver `DEPLOY-STRIPE.md`).

En el dashboard de Stripe → **Settings → Public details** → añadí `lavadoybrillo.com` como dominio del negocio.

## 7. Crear la imagen og-cover.jpg

Esta es la imagen que se ve cuando alguien comparte el enlace por WhatsApp, Instagram, etc.

1. Dimensiones: **1200 × 630 px**, formato JPG, menos de 200 KB.
2. Diseño recomendado: fondo negro, logo "Alvatowash" en blanco, debajo "Combo Verano · 89€" en dorado o rojo, esquina con "lavadoybrillo.com".
3. Subila como `public_html/og-cover.jpg`.

## 8. Verificar el deploy

Después de subir todo:
1. Abrí `https://lavadoybrillo.com/` → debería cargar la landing.
2. Abrí `https://lavadoybrillo.com/reserva/` → flujo de 7 pasos.
3. Abrí `https://lavadoybrillo.com/area-cliente/` → debería pedirte email/WhatsApp.
4. Pegá el dominio en https://www.opengraph.xyz/ para ver cómo se previsualiza en WhatsApp.
5. Pegá el dominio en https://pagespeed.web.dev/ para confirmar que carga rápido en móvil.

## 9. Conectar Google Search Console (opcional, recomendado)

1. Entrá a https://search.google.com/search-console
2. Añadí la propiedad `lavadoybrillo.com` (verificación por DNS más fácil — Hostinger lo hace automático).
3. Subí el sitemap: `https://lavadoybrillo.com/sitemap.xml`.

En 24-72h Google indexa el sitio y empezás a ver impresiones en buscador.

## 10. Subir cambios futuros

Cualquier cambio en los archivos solo requiere re-subir el archivo modificado al File Manager o por FTP. **Limpiar caché del navegador** (`Ctrl+F5`) para ver los cambios.

⚠️ **Si modificás `admin/Code.gs`** no se sube por FTP — el Apps Script es un servicio aparte. Ver `DEPLOY-STRIPE.md` para el flujo de redeploy del backend.
