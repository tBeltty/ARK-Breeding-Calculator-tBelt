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
# Manual del Sobreviviente - Arktic Assistant

Todo lo que necesitas para dominar la crianza en ARK con la mejor tecnología.

---

## 💻 Calculadora Web (ark.tbelt.online)

La calculadora web es tu centro de mando principal para el seguimiento individual de criaturas.

### 1. Uso Básico
- Haz clic en el botón **+** arriba a la izquierda.
- Selecciona la **Especie** y su **Peso (Weight)** actual.
- Usa los botones de **Play/Pause** para sincronizar el tiempo real de maduración con el del juego.

![Modal de Selección](public/assets/help/screenshots/01-add-dino-modal.png)
![Vista General](public/assets/help/screenshots/02-calculator-view.png)

### 2. ¿Qué es el Buffer de Comida?
El **Buffer** es el tiempo real que tu bebé puede sobrevivir con el inventario lleno.
- **Peso es Vital**: Cuanto más peso tenga el dino, más comida cabe y más tiempo de buffer tendrás. Un Gigano con 40 de peso tiene mucho menos buffer que uno con 200.

![Sección de Buffer](public/assets/help/screenshots/03-progress-buffer.png)

### 3. Hand Feed For (Alimentar a mano)
Este valor indica el % de maduración en el que el inventario del bebé es lo suficientemente grande como para durar hasta la etapa **Juvenil (10.0%)**.
- Si el "Hand Feed For" dice 5%, significa que al llegar a ese %, puedes llenar al bebé e irte; no morirá hasta empezar a comer del comedero.

![Estadísticas Clave](public/assets/help/screenshots/04-stats-grid.png)

### 4. Gestión de Comederos
En la pestaña de **Comederos**, puedes simular la duración de la comida compartida.
- Soporta **Comederos Normales, Tek y Maewings**.
- Calcula automáticamente la tasa de descomposición (**Spoilage**) según el tipo de recipiente.

---

## 🤖 Bot de Discord

Lleva el control de tu tribu al siguiente nivel con automatizaciones y alertas.

### 1. Instalación
Ve a [ark.tbelt.online/dashboard](https://ark.tbelt.online/dashboard), selecciona tu servidor y haz clic en **Invite Bot**.

### 2. Comandos Principales
- **/track**: Inicia un rastreador en el canal. ¡No olvides poner el Peso!
- **/status**: Muestra un resumen rápido de todos los bebés activos.
- **/stop**: Detiene el rastreo de una criatura específica.
- **/stopall**: Detiene todos los rastreos del servidor.

### 3. Monitoreo Pro de Servidores
Vincula tus trackers a un servidor oficial o privado. Si el servidor cae (Downtime), el bot **pausará automáticamente todos los timers** de la tribu para evitar muertes por falta de comida.

---

## 🆘 Soporte y Emergencias
Si necesitas ayuda adicional o el bot se queda "atascado":
- Usa **/support** para obtener el enlace al servidor de ayuda.
- Visita el [Dashboard Online](https://ark.tbelt.online/dashboard) para forzar pausas o reinicios.

*¡Domina el Arca con inteligencia! 🦕✨*
