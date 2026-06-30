# Sistema VIP Alvatowash · Especificación canónica v2

Programa rediseñado bajo restricciones de negocio reales:
- **Facturación mínima por centro:** 715 €/día
- **Margen bruto promedio:** 45 % (después de empleado, producto, agua, luz)
- **Cashback objetivo del programa:** 2 % (estándar de industria — Apple Card 2 %, Starbucks 2 %, Amex 2-3 %)

> Si tu cashback supera el margen, perdés dinero por cada cliente fiel. La v1 estaba en **9-11 % cashback efectivo**, lo que significa regalar casi 1/4 del margen en cada visita. Esta v2 lo corrige.

---

## 0. Tabla de costos reales por servicio (estimación)

| Servicio | Precio | Coste variable | Margen bruto | Margen % |
|---|---|---|---|---|
| Aspirado individual | 10 € | 5 € | 5 € | 50 % |
| Mantenimiento | 35 € | 17 € | 18 € | 51 % |
| Mantenimiento Plus | 42 € | 20 € | 22 € | 52 % |
| Reacondicionado Ext/Int | 24,90 € | 12 € | 13 € | 52 % |
| Combo Verano | 89 € | 38 € | 51 € | 57 % |
| Nanodiamond | 540 € | 180 € | 360 € | 67 % |
| Pulido eliminar arañazos | ~150 € | 60 € | 90 € | 60 % |

Conclusión: regalar 1 servicio = regalar el margen de **2-4 servicios pagos**. Hay que ser muy selectivo.

---

## 1. Reglas base del sistema

- **Ratio fijo:** 1 € gastado = 1 punto
- **Valor de canje:** 1 punto = 0,02 € (2 % cashback base)
- **Servicios bonus** (Combo Verano, Nanodiamond, Pulido): suman puntos a ratio 1,05× — pequeño incentivo, no inflacionario
- **Los puntos NO caducan** mientras la cuenta esté activa
- **Inactividad 24 meses:** −50 % puntos (warning a 23)
- **Cancelación tardía:** los puntos solo se asignan al completar, así que no hay "pérdida"
- **Anti-fraude:** se revisa que cuentas referidas no sean duplicadas (mismo IP/teléfono/email)

## 2. Cómo se ganan puntos

### Por servicios contratados

Cuando el empleado marca la reserva como `completada` (no al reservar):

| Servicio | Puntos | Coste para Alvato si se canjea (2 %) |
|---|---|---|
| Aspirado | 10 pts | 0,20 € |
| Mantenimiento | 35 pts | 0,70 € |
| Mantenimiento Plus | 45 pts | 0,90 € |
| Reacondicionado Ext/Int | 25 pts | 0,50 € |
| Combo Verano (bonus 1,05×) | 95 pts | 1,90 € |
| Tapicería premium | 50 pts | 1,00 € |
| Tratamiento cuero | 40 pts | 0,80 € |
| Pulido eliminar arañazos | 155 pts | 3,10 € |
| Nanodiamond (bonus 1,05×) | 570 pts | 11,40 € |

### Por acciones de marca (engagement)

Calibrado bajo: lo que el cliente "regala" en redes vale como mucho 0,40 € en costo real para Alvato.

| Acción | Puntos | Costo | Frecuencia |
|---|---|---|---|
| Reseña 5★ verificada en Google | 30 pts | 0,60 € | 1 vez por reseña |
| Etiquetar @alvatowash en Instagram | 20 pts | 0,40 € | máx. 1 por semana |
| Story con #miLavadoAlvato | 15 pts | 0,30 € | máx. 2 por mes |
| Subir foto antes/después | 15 pts | 0,30 € | 1 por servicio |
| Completar perfil + vehículo | 15 pts | 0,30 € | una sola vez |
| Activar notificaciones push | 10 pts | 0,20 € | una sola vez |

### Programa de referidos (recalibrado)

**Principio:** solo pagás puntos cuando el amigo demuestra ser cliente real. No al darse de alta.

| Hito del amigo | Cliente referidor gana | Costo real Alvato |
|---|---|---|
| 1. Se da de alta usando tu link | 0 pts | 0 € (anti-fraude) |
| 2. Hace su **primer lavado pagado** | **100 pts** | 2 € |
| 3. Hace su **segundo lavado** (cliente real) | **150 pts** | 3 € |
| 4. Acumula 200+ € gastados | **250 pts bonus** | 5 € |
| 5. Llega a nivel Plata (500 pts gastados) | **500 pts bonus** | 10 € |
| **Total potencial por amigo convertido** | **1.000 pts** | **20 €** |

Para el amigo invitado:
- **−10 % en su primer lavado** (mínimo 3 €, máximo 10 €) — incentivo directo, no puntos.
- Después entra al programa normal como Bronce.

**Cálculo de CAC vs LTV:**
- CAC máximo por referido convertido: **20 €**
- LTV mínimo esperado de un cliente que llega a Plata: 500 € de gasto en 12 meses
- Margen sobre LTV: 500 × 45 % = **225 €**
- **CAC/LTV ratio: 20/225 = 8,9 %** ← saludable (industria 15-25 %)

### Eventos especiales

| Evento | Puntos | Costo |
|---|---|---|
| Cumpleaños (anual) | 25 pts | 0,50 € |
| Aniversario primer lavado | 25 pts | 0,50 € |
| Hito · Lavado #10 | 50 pts | 1 € |
| Hito · Lavado #25 | 100 pts | 2 € |
| Hito · Lavado #50 | 250 pts + Nanodiamond −25 % | 5 € + corte de margen acotado |

---

## 3. Niveles VIP (sin multiplicador que infle)

Los niveles ahora aportan **cashback escalonado** + perks no productivos:

| Nivel | Rango pts acumulados | Cashback efectivo | Perks adicionales |
|---|---|---|---|
| Bronce | 0 – 499 | 2,0 % | Acceso al programa |
| Plata | 500 – 1.999 | 2,5 % | Lista prioritaria · 5 € extra cumpleaños |
| Oro | 2.000 – 4.999 | 3,0 % | Entrega rápida · 10 € extra cumpleaños |
| Diamante | 5.000+ | 3,5 % | Nanodiamond −30 % anual · 20 € extra cumpleaños · asesoría dedicada |

Los rangos son acumulados de por vida (no se resetean) para que el cliente sienta progresión real.

---

## 4. Recompensas canjeables (en EUROS, no servicios gratis sueltos)

**El cambio clave:** las recompensas son **descuentos aplicables a próximas reservas**, no servicios completos gratis. Esto pone el control del margen siempre en manos de Alvato.

| Puntos | Recompensa | Valor | Coste real |
|---|---|---|---|
| 250 | 5 € de descuento en próxima reserva | 5 € | 2,75 € (al margen) |
| 500 | 10 € de descuento (o Aspirado gratis valorado 10 €) | 10 € | 5 € |
| 1.000 | 20 € de descuento | 20 € | 11 € |
| 2.500 | 50 € de descuento (paga 39 € un Combo Verano) | 50 € | 27 € |
| 5.000 | 100 € de descuento | 100 € | 55 € |
| 10.000 | Nanodiamond con **50 % off** (paga 270 € en lugar de 540 €) | 270 € | 180 € (sigue cubriendo coste) |

Reglas de canje:
- Solo 1 cupón por reserva
- No acumulable con otras promos (combo verano)
- Caduca a 6 meses desde el canje
- Los puntos canjeados se restan del saldo · los puntos del nivel **NO** se ven afectados

---

## 5. El Master del Brillo (recompensas ajustadas)

Las recompensas siguen siendo motivadoras, pero ya no regalan servicios premium completos. La narrativa de "transformación" se mantiene; el regalo material es proporcional.

| Nivel | Misión | Recompensa puntos | Recompensa extra |
|---|---|---|---|
| 1 · Aprendiz | Primer lavado completado | +50 pts (1 €) | Insignia digital |
| 2 · Iniciado | 3 mantenimientos en 90 días | +100 pts (2 €) | −10 % en su próximo Combo |
| 3 · Detallista | Contratar Combo Verano | +150 pts (3 €) | Acceso lista prioritaria |
| 4 · Restaurador | Reacondicionado int + ext | +200 pts (4 €) | Aspirado gratis trimestral |
| 5 · Protector | Aplicar cera premium | +300 pts (6 €) | −15 % en próximo pulido |
| 6 · Maestro | Aplicar Nanodiamond | +500 pts (10 €) | Acceso al Club Diamante |
| 7 · Leyenda | Mantener Nanodiamond 12 meses | +1.000 pts (20 €) | Sesión privada con jefe de detail (educativa, no servicio facturable) |

**Costo total si un cliente completa los 7 niveles:** 46 € en valor cashback + perks acotados. Pero un cliente que llega a Leyenda gastó **mínimo 2.000-3.000 €** en el camino. Ratio: ~2 %.

---

## 6. Simulación de un cliente VIP fiel · 12 meses

Para verificar que los números cierran:

**Cliente Plus (perfil promedio):** viene 1 vez al mes a hacer Mantenimiento Plus (42 €) y 2 veces al año hace Combo Verano (89 €).

- Gasto anual: 12 × 42 + 2 × 89 = **682 €**
- Margen para Alvato (45 %): **307 €**
- Puntos generados: 12 × 45 + 2 × 95 = **730 pts**
- Pasa a Plata · cashback efectivo 2,5 %
- Si canjea TODOS los puntos como descuento: 730 × 0,02 = **14,60 € en descuentos**
- Si suma engagement (reseña + 1 IG tag): +50 pts (1 €)
- Costo total programa para Alvato: **15,60 €**
- Margen neto Alvato: 307 − 15,60 = **291,40 €**
- **Cashback efectivo real: 2,3 %** ← exactamente el objetivo

**Cliente Premium (perfil alto):** Nanodiamond (540 €) + 8 Mantenimientos Plus al año.

- Gasto anual: 540 + 8 × 42 = **876 €**
- Margen Alvato: 876 × 0,55 (ponderado, Nano sube el promedio) = **482 €**
- Puntos: 570 + 8 × 45 = **930 pts**
- Pasa a Plata
- Cashback potencial: 18,60 €
- **Margen neto: ~463 €** · Cashback efectivo 2,1 %

**Cliente Leyenda (caso extremo):** ya gastó >2.000 €, está a Diamante.

- Cashback 3,5 %, perks Diamante
- Costo anual del programa para Alvato: ~70-90 € en valor de descuentos
- Margen anual generado: ~600-900 €
- **Ratio sostenible**

---

## 7. Topes y reglas de seguridad

Para que el programa nunca se descontrole:

1. **Máximo de puntos canjeables por reserva:** 50 % del valor de la reserva. Un Mantenimiento de 35 € no se puede pagar 100 % con puntos.
2. **Máximo descuento absoluto por reserva:** 100 €. Aún en Nanodiamond.
3. **Las recompensas tipo "−50 % Nanodiamond" tienen cupo:** máximo 50 canjes por trimestre en toda la red. El cliente Diamante tiene preferencia.
4. **Anti-fraude referidos:** máximo 10 referidos válidos por cliente y año. Cuentas con mismo teléfono/email/IP que el referidor se invalidan.
5. **Reseñas:** solo se acreditan puntos cuando Google confirma la review (vía la API de Google Business). Reseñas borradas → puntos revocados.
6. **Engagement IG:** verificación manual o por API. Bots → puntos revocados.

---

## 8. Comparativa antes / después

| Dimensión | v1 (peligrosa) | v2 (sostenible) |
|---|---|---|
| Cashback efectivo | 9-11 % | 2-3,5 % |
| Costo de 1 referido convertido | ~40 € | ~20 € |
| 100 pts canjeables | Aspirado gratis (10 €) | 2 € descuento |
| Recompensas | Servicios completos gratis | Descuentos en €uros + algunos servicios |
| Niveles | Multiplicador puntos (inflacionario) | Cashback escalonado + perks no productivos |
| Master Leyenda | Sesión privada (OK) | Sesión privada (mantiene) |

---

## 9. Lo que esto significa en términos del centro

Cada centro factura **715 €/día = 21.450 €/mes**. Con el programa nuevo:

- Si **30 %** de los clientes son VIP activos: ~6.435 €/mes de facturación VIP
- Costo del programa sobre esa porción: 2,3 % = **148 €/mes** por centro
- Multiplicado por los 19 centros: **2.812 €/mes total** del programa
- Margen recuperado sobre la fidelización: clientes VIP repiten 3-4× más que ocasionales → la facturación incremental cubre 5-10× el costo del programa

**El programa pasa de ser un agujero negro a ser una inversión rentable.**
