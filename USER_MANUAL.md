# 🦖 Arktic Assistant: Manual del Sobreviviente (v3.0)

**Arktic Assistant** es el ecosistema de crianza más avanzado para ARK: Survival Ascended (ASA) y ARK: Survival Evolved (ASE). Combina un potente Bot de Discord con un Dashboard Web sincronizado en tiempo real.

---

## 🚀 1. Instalación Rápida

Para añadir Arktic Assistant a tu servidor, no necesitas buscar enlaces externos:
1.  **Directo desde la Web:** Ve a [ark.tbelt.online/dashboard](https://ark.tbelt.online/dashboard) e inicia sesión con Discord.
2.  **Selección de Servidor:** Verás una lista de servidores donde tienes permisos de administración. Haz clic en el botón **"Invite Bot"** junto al servidor deseado.
3.  **Autorización:** El enlace de invitación ya viene pre-configurado con los permisos necesarios (Roles, Canales y Comandos Slash).

---

## ⚙️ 2. Administración y Ajustes Inteligentes

El bot es flexible y se adapta a cualquier tipo de servidor (Oficial o Privado).

### Panel de Ajustes (`/settings`)
Solo los administradores pueden modificar estos valores:
*   **🔌 Modo de Juego:** Cambia entre **ASA** y **ASE**. El bot ajustará automáticamente las curvas de consumo de comida y tiempos de maduración.
*   **📈 Tasas de Maduración:**
    *   **Official (Auto-Sync):** Se sincroniza en tiempo real con los eventos de Wildcard (2x, 3x, etc.).
    *   **Custom (Manual):** Introduce tu multiplicador personalizado (ej. `10.0` para servidores ultra-rápidos).
*   **🔔 Sistema de Notificaciones:**
    *   **Modo Canal:** Alertas públicas en un canal específico para todo el equipo.
    *   **Modo DM:** Alertas privadas directas a tu cuenta de Discord.
    *   **Umbrales:** Recibe avisos cuando al bebé le queden 5, 10 o 20 minutos de comida.

---

## 🐣 3. Guía de Crianza Paso a Paso

### El comando `/track` (El corazón del Bot)
Cuando nazca un bebé, ejecuta `/track` y rellena estos campos clave:
*   **Especie:** Usa el autocompletado (más de 145 criaturas disponibles).
*   **Comida (Food):** Selecciona el tipo de alimento que tendrá en su inventario. El bot calculará la duración basándose en los puntos nutricionales de ese ítem.
*   **Peso (Weight):** Indica el **Peso actual** del bebé. El bot usa este dato para saber cuántos stacks de comida caben realmente y calcular cuántas horas de "Buffer" tiene antes de morir.

### Herramientas de Gestión
*   **`/status`**: Muestra el "Gimnasio" de bebés activos con barras de progreso visuales y contadores de comida.
*   **`/buffer`**: Calcula cuánto tiempo exacto durará un inventario lleno antes de que el bebé se muera de hambre.
*   **`/stats`**: Detalles técnicos como el tiempo exacto para la siguiente impronta o el paso a etapa juvenil (10%).

---

## � 4. El Dashboard Online (Control Total)

El dashboard en [ark.tbelt.online/dashboard](https://ark.tbelt.online/dashboard) es donde Arktic Assistant brilla realmente. Ofrece funciones imposibles de realizar mediante texto en Discord:

### 🎮 Gestión de Servidores
*   **Dashboard Centralizado:** Visualiza todos tus bebés de múltiples servidores en una sola pantalla.
*   **Edición Visual de Tasas:** Cambia las tasas de maduración y juego con sliders y menús desplegables sin usar comandos.

### 🔒 Restricciones de Comandos (Solo Web)
Desde el Dashboard, puedes configurar **quién** y **dónde** se usan los comandos:
*   **Por Rol:** Permite que solo los "Breeders" puedan usar `/track`.
*   **Por Canal:** Restringe el spam del bot a canales específicos de crianza.

### �️ Monitoreo de Estado de Servidor (ASA/ASE)
Vincula tus bebés a un servidor de ARK real:
*   **Sincronización por Caída:** Si tu servidor de ARK se cae, el dashboard lo detecta y **pausa automáticamente tus timers** de crianza para que no pierdas a tus bebés por culpa de un crash del servidor o mantenimiento.

### ⚡ Ejecutor de Comandos Remoto
¿No estás en Discord? Puedes iniciar el rastreo de un bebé directamente desde la web rellenando el formulario y haciendo clic en **"Start Tracker"**. El bot enviará el mensaje a Discord automáticamente.

---

## 🛑 5. Comandos de Emergencia
*   **`/stop [ID]`**: Detener un rastreo.
*   **`/stopall`**: Limpiar todos tus rastreos (útil si acabas una camada masiva).
*   **`/support`**: Obtén un enlace a nuestro Discord de soporte técnico.

---

> [!IMPORTANT]
> **Privacidad:** El Dashboard solo solicita acceso a tus servidores para identificar dónde tienes permisos de administración. Tus datos nunca se comparten con terceros.

*¡Nacido para dominar el Arca!* 🦕✨
