# 🦖 Guía Maestra: ARK Breeding Assistant

Bienvenido a la versión optimizada de **ARK Breeding Assistant**. El sistema ahora funciona como un ecosistema híbrido entre la Web y Discord, diseñado para ser preciso, seguro y altamente personalizable.

---

## 🚀 ¿Cómo funciona el Sistema ahora?

### 1. La Web (Calculadora + Dashboard)
*   **Calculadora Local:** El motor de cría es ahora **determinista**. No necesita que la pestaña esté abierta. Usa marcas de tiempo reales para que el progreso continúe con precisión matemática incluso si apagas tu PC.
*   **Dashboard Inteligente:** Un portal para gestionar tus dinos en todos tus servidores de Discord sin escribir ni un solo comando.

### 2. El Bot de Discord
*   Es tu **agente de ejecución**. Se encarga de guardar los datos en la base de datos central, enviar alertas visuales y gestionar los tiempos de "buffer" de comida.
*   **Alertas Inteligentes:** El bot te avisará cuando un dino necesite atención o esté al 100%, según tus preferencias personales.

### 3. El Puente Web-Discord (La Integración)
Detrás de escena, la web y el bot comparten una base de datos SQLite y una API segura:
*   **Sincronización:** Si inicias un rastreo en Discord con `/track`, aparece instantáneamente en tu Dashboard web. Si lo inicias en la Web, el bot envía un mensaje de confirmación al canal de Discord elegido.
*   **Identidad (OAuth2):** Usas tu cuenta de Discord para loguearte, lo que garantiza que solo tú veas tus dinos y tus servidores.
*   **Premium Sync:** Si tienes un rol especial en el Servidor de Soporte (vía Patreon), el sistema lo detecta al vuelo y expande tus límites.

---

## 👥 Roles y Capacidades

### 👑 Administrador de Servidor (`Manage Server`)
Un administrador tiene control total sobre la infraestructura del bot en su servidor:
*   **Configuración Global:** Ajustar tasas de maduración, consumo y versión del juego (`/settings` o Web).
*   **Seguridad (RBAC):** Definir mediante el Dashboard qué roles de Discord tienen permiso para usar los comandos del bot.
*   **Supervisión:** Puede ver y detener **todos** los rastreadores activos en el servidor (útil para limpieza de tribus inactivas).
*   **Canales:** Restringir el bot a canales específicos para evitar spam.

### ⚔️ Usuario/Miembro (Con rol apropiado)
Un usuario común que tenga el rol permitido por el Admin puede:
*   **Gestión Personal:** Ver y gestionar **únicamente sus propios dinos** en el Dashboard.
*   **Alertas Propias:** Configurar si quiere recibir avisos por **DM (Privado)** o en un **Canal** de Discord para cada dino.
*   **Control Remoto:** Lanzar rastreos desde la web hacia Discord sin necesidad de estar en el juego.
*   **Límites:** Supeditado a su Tier (2 slots para Free, 50+ para Pro/Tribe).

---

## 🎮 Comandos de Discord Actualizados

*   **`/track [creatura] [progreso] [nickname] [peso] [notify_mode] [channel]`**: Inicia el seguimiento de un bebé.
    *   *creature*: Especie (usa autocompletado).
    *   *progress*: % de maduración actual.
    *   *nickname*: Nombre para el bebé.
    *   *weight*: **Peso** actual (imprescindible para cálculos de comida).
    *   *notify_mode*: Elige DM o Canal.
    *   *channel*: Canal de destino para alertas (si aplica).
    *   El bot te avisará cuando necesite comida (basado en el peso proporcionado) y cuando sea adulto.
*   **`/status`**: Muestra tus bebés activos y tu capacidad restante.
*   **`/stop [id]`**: Detiene un rastreador. (Solo puedes detener los tuyos, a menos que seas Admin).

---
*El sistema está diseñado para que te preocupes por la crianza, no por los cálculos.* 🦕✨
