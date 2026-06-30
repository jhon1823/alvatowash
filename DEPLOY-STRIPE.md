# Activar pagos online con Stripe

Esta guía te explica cómo activar los pagos online en Alvatowash. Sin esta configuración el sistema funciona igual, solo que el cliente paga en el centro (modo por defecto).

## Qué obtiene el cliente al activar Stripe

Al confirmar una reserva el cliente verá un selector con estas opciones:

- **Pagar al recoger** (por defecto, ya funciona)
- **Pagar online ahora** (Stripe Checkout: tarjeta + Apple Pay + Google Pay)
- **Reservar con depósito** (cobra solo el adelanto definido en `config.js`, ej. 20€ para Nanodiamond; el resto en centro)

Tras pagar, Stripe lo redirige a `/reserva/exito/` y el backend marca la reserva como pagada automáticamente.

## Pasos

### 1. Crear cuenta Stripe

1. Entra en https://dashboard.stripe.com/register
2. Completa los datos de tu negocio (Alvatowash, NIF, IBAN para los pagos)
3. Mientras se activa la cuenta podés usar el **modo test** sin problema

### 2. Conseguir la Secret Key

1. En el dashboard de Stripe → **Developers → API keys**
2. Copia la **Secret key** (empieza por `sk_test_...` para pruebas, `sk_live_...` para producción)

⚠️ Esta key es secreta. No la pongas en el código del frontend ni la subas a GitHub.

### 3. Guardarla en Apps Script

1. Abre el editor de Apps Script donde está pegado el `Code.gs`
2. Arriba a la izquierda haz clic en el icono de tuerca → **Project Settings**
3. Baja hasta **Script properties** y haz clic en **Add script property**
4. Pon:
   - **Property:** `STRIPE_SECRET_KEY`
   - **Value:** `sk_test_TU_KEY_AQUÍ` (o `sk_live_...` cuando pases a producción)
5. Guarda

### 4. Configurar el dominio de redirect

En `Code.gs`, busca la constante `PUBLIC_DOMAIN` y asegúrate de que apunte a tu dominio real:

```js
const PUBLIC_DOMAIN = 'https://lavadoybrillo.com';
```

Este dominio se usa para construir las URLs `success_url` y `cancel_url` que Stripe usa para volver al cliente.

### 5. Volver a desplegar el Apps Script

1. Editor de Apps Script → **Deploy → Manage deployments**
2. En el deployment activo, lápiz (editar) → **Version: New version** → **Deploy**
3. La URL no cambia, solo se actualiza el código

### 6. Probar

Entra en `https://lavadoybrillo.com/reserva/` y haz una reserva. En el paso de Resumen ahora deberías ver el bloque "Método de pago" con las opciones online.

En modo test, usa estos números de tarjeta de Stripe:

- **Tarjeta OK:** `4242 4242 4242 4242` · cualquier fecha futura · CVC `123`
- **Requiere autenticación 3D Secure:** `4000 0025 0000 3155`
- **Rechazada:** `4000 0000 0000 0002`

Si todo va bien volverás a `/reserva/exito/` con el badge "Pago confirmado".

## En el admin

Cada reserva ahora tiene 4 columnas nuevas en la pestaña `Reservas` de la hoja:

- `PaymentMethod`: `pay_at_center` · `online_full` · `online_deposit`
- `PaymentStatus`: `na` (paga en centro) · `pending` · `paid`
- `PaymentAmount`: importe cobrado (€)
- `StripeSessionId`: ID de la sesión Stripe (para auditoría)

Las reservas pagadas ya cuentan como ingresos antes de que el cliente venga, lo que mejora el cashflow.

## Comisiones Stripe (España, junio 2026)

- **EEE estándar:** 1,5 % + 0,25 € por transacción
- **No-EEE:** 3,25 % + 0,25 €
- **Apple/Google Pay:** mismo precio que tarjeta

Sin mensualidad. Los pagos llegan a tu IBAN en 2-7 días.

## Alternativas

Si prefieres otra pasarela el código está estructurado para ser fácilmente reemplazable. El backend usa `UrlFetchApp` para hablar con la API. Avísanos qué pasarela y la integramos:

- **SumUp:** API parecida a Stripe pero pensada para España; menos features online pero comisión similar (1,4%) y datafono físico opcional.
- **Redsys:** el agregador bancario español (BBVA, Santander, etc). Comisiones más bajas (~0,5% + fija) pero la integración es más compleja porque usa HMAC y formularios.
- **Bizum:** vía API de algún banco; muy popular en España para clientes pero requiere integración bancaria.

## Desactivar Stripe temporalmente

Si querés desactivar el pago online (por ejemplo durante una migración), basta con borrar la script property `STRIPE_SECRET_KEY`. El frontend detecta automáticamente que Stripe está apagado y oculta las opciones online.
