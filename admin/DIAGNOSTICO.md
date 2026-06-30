# Diagnóstico rápido · Admin no carga datos

Si Equipo / Productos / Pedidos no muestran nada, casi seguro es del backend (Code.gs en Apps Script), no del frontend.

## 1. Verificá que el Apps Script no tenga errores

Abrí el editor de Apps Script donde pegaste el Code.gs:

1. ¿Aparece algún **subrayado rojo** o icono de error en la pestaña?
2. Mirá abajo a la izquierda: si dice **"Errores"** en rojo, hay sintaxis rota → no funciona ningún endpoint.
3. Probá pulsar el botón ▶ Run con la función `getBookings` seleccionada. Si da error, copialo y mandámelo.

## 2. Verificá que el deploy esté actualizado

Cada vez que cambiás el Code.gs **tenés que crear un deployment nuevo** (o actualizar el existente):

1. **Deploy → Manage deployments**
2. En el deployment activo, click en el ✏️ lápiz (Editar)
3. **Version: New version** (importante, sino sirve la vieja)
4. Click Deploy
5. La URL del Web App **no cambia**, pero ahora sirve el código nuevo

Si pegaste el Code.gs pero no creaste new version, **el frontend sigue llamando a la versión vieja** que NO tiene los endpoints nuevos (getNoticias, getContabilidad, etc.) PERO tampoco respondería los viejos si rompiste algo.

## 3. Test rápido desde consola del navegador

Abrí el admin pro en el navegador. F12 → consola. Pegá esto:

```js
fetch(window.CONFIG.script_url + '?action=version&callback=test')
  .then(r => r.text())
  .then(t => console.log('Respuesta del backend:', t))
  .catch(e => console.error('Error de red:', e));
```

Si la respuesta es algo como `test({"ok":true,"version":"…"})` → el backend está vivo.
Si da error o respuesta vacía → el deploy o el Code.gs están rotos.

## 4. Test específico del endpoint Empleados

Mismo F12 consola:

```js
const url = window.CONFIG.script_url +
  '?action=getEmployees&token=' + encodeURIComponent(window.CONFIG.script_token||'') + '&callback=t';
const s = document.createElement('script');
s.src = url;
window.t = (d) => console.log('Empleados recibidos:', d);
document.head.appendChild(s);
```

Si dice "Empleados recibidos: { items: [...] }" con datos → backend OK, el problema es del frontend.
Si dice undefined o nada → el backend NO está respondiendo el endpoint.

## 5. Lo más probable que pasó

Cuando me dijiste "ya cambié en gs", lo más común es:

| Problema | Síntoma | Fix |
|---|---|---|
| Pegaste el código nuevo pero no creaste new version del deploy | Nada cambia, ningún endpoint nuevo funciona | Deploy → Manage deployments → ✏️ → New version → Deploy |
| Pegaste el código en una pestaña distinta a la principal | Apps Script tiene 2 archivos con código contradictorio | Borrá el código duplicado, dejá solo uno |
| Pegaste parcialmente · cortaste a la mitad de una función | Error de sintaxis · todo deja de funcionar | Volvé a copiar el archivo completo desde `admin/Code.gs` y pegalo de cero |
| El editor de Apps Script auto-formateó comillas | Por ejemplo `'L'Illa'` con apóstrofe sin escapar | Usar siempre comillas dobles `"L'Illa"` |

## 6. Si lo anterior no resuelve

Mandame:
1. **Captura de la pestaña del Apps Script** mostrando si hay errores
2. **El resultado del test del paso 3** (respuesta del backend al hacer fetch a `?action=version`)
3. **El resultado del paso 4** (test de getEmployees)

Con esos 3 datos puedo decirte exactamente dónde está el problema.

## 7. Sobre los drop-ins (centro-badge, clientes-vip, ranking, etc.)

Esos son archivos del frontend nuevos. Si el backend NO está respondiendo (caso 1-3 de esta guía), **tampoco se van a ver los datos en los nuevos módulos**. Por eso no ves "Noticias", "Contabilidad", "Clientes VIP" ni "Ranking" — porque cuando hacen `getNoticias` o cualquier llamada al backend, no reciben respuesta y quedan en blanco.

**Pero los botones del sidebar SÍ deberían aparecer** (son HTML inyectado sin necesidad de backend). Si tampoco ves los botones nuevos del sidebar:

- Abrí F12 → consola → buscá errores en rojo
- Si ves "Uncaught SyntaxError" o algún error con alguno de los .js nuevos, decímelo y lo arreglo
- Refrescá con **Ctrl+Shift+R** (cache hard) por si quedó la versión vieja cacheada
