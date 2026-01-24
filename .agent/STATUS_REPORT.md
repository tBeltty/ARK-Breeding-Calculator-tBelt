# Reporte de Estado: Debugging de Búsqueda de Servidores

**Fecha:** 24 de Enero, 2026
**Objetivo Principal:** Asegurar que la búsqueda de servidores encuentre cualquier servidor válido (ej. "6309"), manejando correctamente la API de ArkStatus y el caché local.

## 1. Lo que se ha hecho (Progress)

### Backend (ServerService.js & API)
- **Rate Limiting:** Se implementó un retraso de 600ms entre peticiones de paginación en `fetchOfficialBulk` para evitar errores 429 (Too Many Requests).
- **Lógica de Búsqueda Híbrida:** Se modificó `findServer` para no depender solo del caché local. Ahora, si la búsqueda es específica (más de 2 caracteres), se consulta forzosamente a la API de ArkStatus y se combinan ("merge") los resultados con el caché local.
- **Soporte Unofficial:** Se añadió funcionalidad para rastrear servidores no oficiales mediante UDP (GameDig) y un endpoint para registrarlos.
- **Correcciones de Código:**
  - Se arregló un `TypeError` al manipular IDs numéricos como strings.
  - Se corrigió la cabecera de autenticación (`X-API-Key`).

### Frontend (ServerTrackingPage.jsx & UI)
- **Navegación:** Se arregló el `useNavigate` en el Sidebar para permitir cambiar entre el calculador y el monitoreo sin recargar.
- **UI de Búsqueda:** Se creó un panel de "Search & Connect" que distingue entre direcciones IP (para unofficial) y texto (para official).
- **Feedback Visual:** Se añadieron estados de carga y manejo de errores básicos.

## 2. Estado Actual (Current Status)
El usuario reporta que **"No funciona"**.
Posibles causas que debemos investigar mañana:
- **Fallo en el Merge:** Es posible que la API esté devolviendo el servidor "6309", pero la lógica de combinación en `findServer` lo esté descartando o duplicando incorrectamente.
- **Formato de ID:** Si el servidor "6309" viene en un formato distinto en la búsqueda directa vs la lista global, podría estar fallando la comparación.
- **Renderizado UI:** El frontend podría no estar actualizando la lista de resultados incluso si el backend devuelve los datos correctos (problemas de reactividad o claves duplicadas).
- **Rate Limits Persistentes:** Aunque pusimos 600ms, si hacemos varias búsquedas seguidas rápido, podríamos seguir siendo bloqueados.

## 3. Lo que está pendiente (Pending Actions)

### Debugging Inmediato
1. **Verificar Respuesta API Manual:** Usar `curl` o script aislado para ver exactamente qué devuelve `https://arkstatus.com/api/v1/servers?search=6309`.
2. **Logs en `findServer`:** Añadir logs detallados (console.log) antes y después de llamar a la API externa dentro de la función de búsqueda para confirmar si se llama y qué devuelve.
3. **Revisar Frontend:** Verificar si el array de `results` llega al componente React y si hay errores en la consola del navegador al renderizar.

### Mejoras a Largo Plazo
- **Caché Persistente Mejorado:** Guardar la lista oficial en disco (JSON) para no tener que bajar 50 páginas cada vez que se reinicia el bot.
- **Cola de Peticiones:** Implementar una cola real para las peticiones a la API externa en lugar de solo `setTimeout`, para garantizar que nunca excedamos el límite.

## 4. Objetivo Final (Goal)
Lograr que al escribir "6309" (o cualquier ID/Nombre válido) en el buscador:
1. Aparezca el servidor en la lista inmediatamente.
2. Se pueda hacer clic en "Connect".
3. El servidor quede registrado y persistente en la sesión del usuario.
