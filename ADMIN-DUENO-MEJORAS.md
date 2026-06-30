# Mejoras del Admin del Dueño · Plan completo

Recibimos 9 puntos. Los ordeno por impacto y dependencia, marco cuáles están hechos y dejo plan claro para los demás.

| # | Mejora | Estado | Esfuerzo | Backend? |
|---|---|---|---|---|
| 1 | 3 tarjetas rápidas en hero de reserva (42 · 89 · 540) | ✅ Hecho | — | No |
| 2 | Badge de centro activo bien visible en topbar | ✅ Hecho | Drop-in | No |
| 3 | Clientes VIP filtrables (BD con nivel, gasto, último servicio) | ✅ Hecho | Drop-in | No (usa el VIP que ya hay) |
| 4 | Ranking de centros (€, fidelización, volumen) | Plan listo | Mediano | Solo cálculo en frontend |
| 5 | Métrica web vs centro · venta cruzada / upsell | Plan listo | Mediano | Solo cálculo en frontend |
| 6 | Sección Contabilidad (P&L, IVA, exports) | Plan listo | Grande | Posible nuevo sheet `Contable` |
| 7 | Sección Recursos Humanos (nómina, ausencias, evaluación) | Plan listo | Grande | Nuevo sheet `RRHH` |
| 8 | Tablón de Noticias internas (dueño → centros) | Plan listo | Mediano | Nuevo sheet `Noticias` + email |
| 9 | (Hijo de #2) selector de centro persistente con permisos | ✅ Hecho con #2 | — | No |

---

## ✅ HECHO en esta iteración

### 1. Tres tarjetas rápidas en el hero del index-4

Ahora en el hero hay 3 cards lado a lado:
- **Mantenimiento Plus 42 €** · esencial · gris glassmorphism
- **Combo Verano 89 €** · destacado rojo con badge "−50% Verano"
- **Nano Protección 540 €** · premium con acento champagne

Cada una linkea directo a `/reserva/?svc=KEY` y el flujo express se activa si el cliente ya es VIP. El botón "Probar configurador 3D" queda como secundario abajo (la página sigue conservando el configurador SVG que les gustó).

### 2. Badge de centro activo en topbar

El dueño superadmin ahora ve un selector grande con el centro activo siempre a la vista. Los encargados ven su centro fijo (chip de solo lectura con su sucursal asignada). Drop-in en `admin/centro-badge.js`.

### 3. Clientes VIP filtrables

Nueva sub-vista en la sección Clientes con filtros:
- Por nivel (Bronce/Plata/Oro/Diamante)
- Por gasto acumulado (>200 €, >500 €, >2.000 €)
- Por días sin venir (alertas de churn)
- Por centro habitual
- Búsqueda libre

Cada cliente VIP tiene CTAs rápidos: WhatsApp directo, "Ofrecer descuento", "Marcar como VIP estratégico". Drop-in en `admin/clientes-vip.js`.

---

## Pendientes con plan detallado

### 4. Ranking de centros

3 podios separados en una nueva pestaña "Ranking":

**A. Ranking por facturación (€)**
- Top 10 centros del mes/trimestre/año
- Trofeo dorado/plata/bronce a los 3 primeros
- Delta vs período anterior
- Permite "ranking neto" (descontando promos canjeadas)

**B. Ranking por fidelización**
- % de clientes que repiten dentro de 30/60/90 días
- Cuántos clientes nuevos llegaron a Plata o Oro
- "Clientes VIP nuevos creados este mes" por centro

**C. Ranking por volumen de coches lavados**
- Cantidad de servicios completados (no euros)
- Útil porque hay centros con muchos lavados baratos
- Ticket promedio por centro como columna extra

Implementación: cálculos en el frontend leyendo de `BOOKINGS`. Sin backend nuevo.

### 5. Métrica web vs centro · venta cruzada

Nueva fila de KPIs en el dashboard:

- **Clientes captados online:** reservas con `source=web` o `source=instagram`
- **Clientes captados en centro:** reservas con `source=walk_in` (las que el empleado dio de alta presencialmente)
- **% de upsell:** reservas web a las que el cliente sumó extras (tapicería, cera) o cambió a un servicio superior al llegar
- **Ticket promedio web vs centro:** comparativa
- **Conversión web:** leads que llegaron a reservar

Requiere etiquetar el origen en cada reserva (ya está el campo `source` en BOOKINGS). Hay que sumar el flag de "upsell aplicado" cuando el empleado modifica el servicio en el detalle de la reserva.

### 6. Contabilidad

Nueva pestaña con:
- **P&L del mes** (ingresos, costos, márgenes)
- **IVA trimestral** (modelo 130 listo para tu contador)
- **Cobros pendientes** (reservas con `PaymentStatus=pending`)
- **Reconciliación Stripe** (pagos online vs facturación)
- **Exports a CSV/Excel** filtrables

Requiere: que el sheet `Reservas` tenga el campo `PaymentMethod` correctamente cargado (ya lo agregamos con Stripe). Y opcionalmente un nuevo sheet `Gastos` para registrar costos manuales (alquiler, sueldos, producto).

### 7. Recursos Humanos

Nueva pestaña con:
- **Empleados** (ya existe pero amplía con: fecha alta, contrato, salario base, comisión %)
- **Nómina del mes** (calcula salario base + comisiones por servicios + bonus)
- **Ausencias y vacaciones** (sumar registro)
- **Evaluación trimestral** (basada en Universidad del Brillo + reseñas recibidas)
- **Top empleados** del trimestre

Requiere: extender el sheet `Empleados` con campos nuevos + un sheet `Nominas` para guardar las nóminas calculadas.

### 8. Tablón de noticias internas

Nueva pestaña "Noticias":
- El dueño superadmin redacta noticias y elige a qué centros enviarlas (todos / específicos)
- Los empleados y encargados las ven al entrar a su panel (banner arriba)
- Cada noticia tiene: título, cuerpo, imagen opcional, fecha programada, requiere confirmación de lectura sí/no
- El dueño ve quiénes han leído cada noticia
- Email automático opcional cuando hay noticia urgente

Requiere: nuevo sheet `Noticias` con headers: ID, Fecha, Título, Cuerpo, Centros (array), AutorEmail, RequiereConfirm, FechaProgramada. Y un sheet `NoticiasLeidas` para tracking.

---

## Orden sugerido de implementación

1. **Validar las 3 hechas** (testear las 3 tarjetas + badge + clientes VIP)
2. **Ranking de centros** — más visible para el dueño, sin backend nuevo (1 sesión)
3. **Métricas web vs centro** — pequeño cambio en dashboard (½ sesión)
4. **Noticias internas** — nuevo backend pero alta valor para el dueño (1-2 sesiones)
5. **Contabilidad** — sumando sheet Gastos (1-2 sesiones)
6. **Recursos Humanos** — más complejo, dejar para el final (2 sesiones)

Cuando me confirmes que las 3 hechas funcionan, atacamos #4 (Ranking) — es el más visual y el que más le va a impactar al dueño en el día a día.
