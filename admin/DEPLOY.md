# Alvatowash — Despliegue del backend Google Apps Script

Guía paso a paso para conectar Alvatowash a Google Sheets y dejarlo funcionando con datos reales (en vez de demo).

## 1. Crear la hoja de cálculo

1. Andá a `sheets.google.com` con tu cuenta de Google
2. Click en **"+ En blanco"** para crear una hoja vacía
3. Renombrala (arriba a la izquierda): **`Alvatowash · Backend`**

## 2. Abrir el editor de Apps Script

Dentro de la hoja:
1. Menú **Extensiones → Apps Script**
2. Te abre el editor en una pestaña nueva
3. Vas a ver un archivo `Code.gs` con la función `myFunction` por defecto. Borrá TODO ese contenido

## 3. Pegar el Code.gs

1. Abrí el archivo `alvatowash/admin/Code.gs` que tenés en tu compu
2. Copiá TODO su contenido (Ctrl+A → Ctrl+C)
3. Pegalo en el editor de Apps Script (Ctrl+V)
4. Click en el icono de disco para **guardar** (o Ctrl+S). Te pedirá que le pongas nombre al proyecto: ponele **`Alvatowash Backend`**

## 4. Crear las hojas (ejecutar `initializeSheets`)

Antes de desplegar, hay que crear las hojas dentro del archivo de Google Sheets:

1. En el editor, arriba donde dice **"Función"** (al lado del botón "Ejecutar"), elegí del dropdown: **`initializeSheets`**
2. Click en **"Ejecutar"** (botón ▶)
3. Te pide permisos:
   - **"Authorization required"** → Click "Revisar permisos"
   - Elegí tu cuenta de Google
   - **"Google no ha verificado esta aplicación"** → click "Configuración avanzada" → "Ir a Alvatowash Backend (no seguro)"
   - Click **"Permitir"**
4. Esperá unos segundos. En la consola de abajo tiene que aparecer **"Ejecución completada"**
5. Volvé a la pestaña de tu hoja de cálculo → vas a ver que se crearon **12 hojas** nuevas:
   - Reservas, Leads, ClientesVIP, VipHistory, Empleados, Fichajes, Productos, Pedidos, Bloqueos, Cuentas, B2B, Facturas
6. La hoja **Empleados** ya viene sembrada con 4 empleados de prueba (jhonatan, maria, carlos, lucia · PIN `1234`)

## 5. Desplegar como Web App

Volvé al editor de Apps Script:

1. Arriba a la derecha: **"Implementar" → "Nueva implementación"**
2. Click en el engranaje al lado de "Seleccionar tipo" → **"Aplicación web"**
3. Configurá:
   - **Descripción:** `Alvatowash v1`
   - **Ejecutar como:** Yo (tu email)
   - **Quién tiene acceso:** **Cualquiera** ← importante
4. Click **"Implementar"**
5. Te pide permisos otra vez → "Permitir"
6. Te aparece una pantalla con dos URLs. **Copiá la URL que dice "URL de la aplicación web"** — termina en `/exec`

## 6. Pegar la URL en config.js

1. En tu compu, abrí `alvatowash/config.js`
2. Buscá la línea:
   ```js
   script_url: '',
   ```
3. Pegá la URL que copiaste:
   ```js
   script_url: 'https://script.google.com/macros/s/AKfycb.../exec',
   ```
4. Guardá
5. Subí el `config.js` modificado a Hostinger (carpeta `alvatowash/`)

## 7. Verificar que funciona

Abrí en el navegador:

```
https://script.google.com/macros/s/AKfycb.../exec?action=version&token=alvatowash2026_token_seguro
```

(Reemplazá la URL por la tuya y mantené el `?action=version&token=...`)

Tiene que responder algo como:
```
_({"version":"2026.06.18","ok":true})
```

Si te responde eso, el backend está vivo y autenticando bien.

## 8. (Opcional pero recomendado) Recordatorios automáticos

Para activar el envío automático de emails de recordatorio el día previo a cada reserva:

1. En el editor de Apps Script, dropdown "Función" → elegí **`installDailyReminderTrigger`**
2. Click "Ejecutar"
3. En consola: **"Trigger creado: sendReminders cada día a las 19:00"**

A partir del día siguiente, todos los días a las 19h se ejecuta `sendReminders` que recorre los bookings con fecha "mañana" y manda el email HTML a cada cliente que tenga email en su ficha.

Para cambiar el horario:
- Apps Script → menú reloj (Triggers) → editá el trigger de `sendReminders`

## 9. Cómo desactivar el modo demo

Mientras `script_url` esté vacío, el admin muestra datos demo (María García, Roberto Silva, etc.).

Apenas pegues la URL real en `script_url`, **el admin pasa a usar tu Google Sheet** y los demos desaparecen. Lo único que ves serán las reservas reales que te lleguen + los empleados sembrados.

## Modificaciones del Code.gs en el futuro

Si actualizás el `Code.gs` (sumás features, arreglás bugs):

1. Pegá el nuevo código en el editor de Apps Script
2. **"Implementar" → "Administrar implementaciones"**
3. Click en el icono lápiz al lado de "Alvatowash v1"
4. **"Versión nueva"** → "Implementar"
5. **No necesitás cambiar la URL** — sigue siendo la misma

## Endpoints disponibles

Todos requieren `?token=alvatowash2026_token_seguro`.

### GET (lectura)
- `getBookings`, `getLeads`, `getEmployees`, `getProducts`, `getOrders`, `getBlocks`
- `getAccountStatus`, `getVipUsers`, `getVipHistory&phone=...`
- `getB2bCars`, `getFacturas`, `getNextInvoice`

### GET (acción)
- `addBooking`, `updateBooking&row=N`, `assignWorker&row=N&worker=...`
- `addBlock`, `removeBlock&id=...`
- `markLeadContacted&leadId=...`, `deleteLead&leadId=...`
- `vipRegister`, `vipLogin`, `vipAddPoints`, `vipRedeemReward`, `vipAdjustPoints`
- `clockIn`, `clockOut`
- `addB2bCar`, `logInvoice`, `addOrder`, `setPlan`

### POST (sin token, lo manda el booking widget)
- Body con `op:'lead_save'` → guarda en hoja Leads
- Body sin `op` con datos de booking → crea reserva real en hoja Reservas

## Cambiar el token

Si querés más seguridad, en `Code.gs` arriba:
```js
const ADMIN_TOKEN = 'alvatowash2026_token_seguro';
```
Cambiá por algo más complejo. Después en `config.js` cambiá `script_token` por el mismo valor.

## Backup

Las hojas de Google Sheets se guardan automáticamente y tienen historial de versiones (Archivo → Historial de versiones). Si algo se pisa por error, podés restaurar.

Para backup adicional: descargá la hoja como Excel periódicamente (Archivo → Descargar → Microsoft Excel).
