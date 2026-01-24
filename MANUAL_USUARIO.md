# 🦖 Manual de Usuario: ARK Breeding Assistant

¡Bienvenido! Esta guía te ayudará a sacar el máximo provecho del bot y la plataforma web para que tus crianzas en ARK sean perfectas y sin estrés.

---

## 🎮 Uso en Discord

El bot vive en tu servidor de Discord y es tu compañero de crianza. Usa comandos de barra (`/`) para interactuar con él.

### 🐣 Iniciar un Rastreo
Usa `/track` para que el bot empiece a vigilar a tu bebé.
*   **Campos clave:**
    *   `creature`: El nombre del animal (Rex, Argy, etc.). Usa el autocompletado para mayor precisión.
    *   `progress`: El % actual de maduración (por defecto 0).
    *   `nickname`: Un nombre opcional para identificar a tu bebé.
    *   `weight`: **(Importante)** El estadístico de **Peso** actual del animal. Esto permite al bot calcular cuánta comida puede cargar y cuánto durará el "buffer".
    *   `notify_mode`: Elige si quieres que el bot te hable por **DM (Privado)** o en un **Canal**.
    *   `channel`: Si elegiste modo "Canal", selecciona aquí en qué canal quieres recibir las alertas.

### 📊 Consultar Estado
Usa `/status` para ver una tabla visual con el progreso de todos tus dinos, cuánto tiempo les falta y su estado de "buffer" de comida.

### 🛑 Detener un Rastreo
Usa `/stop [ID]` cuando termines una crianza o si te has equivocado al iniciarla. Solo puedes detener tus propios rastreadores.

---

## 💻 El Panel Web (Dashboard)

Accede a [ark.tbelt.online/dashboard](https://ark.tbelt.online/dashboard) con tu cuenta de Discord.

### ¿Qué puedes hacer en la Web?
1.  **Vista Personal:** Verás todos tus dinos activos de todos los servidores en una sola pantalla.
2.  **Configuración de Alertas:** ¿Prefieres que el bot te avise por privado esta vez? Cámbialo con un click.
3.  **Rastreo Remoto:** Inicia una crianza en Discord cómodamente desde la web usando el **Remote Command Runner**.
4.  **Cálculos Precisos:** La web usa un motor de tiempo real que nunca se detiene, incluso si cierras el navegador.

---

## 🛰️ Monitoreo de Servidores (Nuevo en v3.0)

Conecta tu calculadora directamente con los servidores oficiales de ARK:
1.  **Estado en Vivo:** Verifica si tu servidor está Online u Offline al instante.
2.  **Auto-Rates:** Detecta automáticamente eventos de evolución (x2, x3) y ajusta tus temporizadores sin que tengas que tocar nada.
3.  **Compensación de Downtime:** Si el servidor se cae, el sistema "pausa" tu crianza automáticamente para que los % de maduración no se desincronicen.
4.  **Notificación de Retorno:** Recibe una alerta cuando el servidor vuelva a estar en línea.

## 🥩 Rastreador de Comida e Inventario
Olvídate de las matemáticas mentales con el nuevo sistema de gestión de inventario:
1.  **Rastrear (Track):** Activa una cuenta regresiva en vivo que te dice *exactamente* cuándo se vaciará el inventario del bebé.
2.  **Rellenar (Refill):** Un botón simple para reiniciar el temporizador cuando llenas el inventario al máximo.
3.  **Buffer Inteligente:** Calcula basado en el peso actual y la tasa de consumo de la especie.

## 🔔 Notificaciones Personalizadas

Tú decides cómo recibir los avisos:
*   **Mensaje Directo (DM):** El bot te escribirá al privado para que nadie más vea tus alertas.
*   **Mención en Canal:** El bot te mencionará en el canal que elijas para que tus compañeros de tribu también estén al tanto.

> [!NOTE]
> Recibirás un aviso cuando a tu dino le quede poco tiempo de "buffer" (comida) y otro cuando llegue al 100% de maduración.

---

## 🛡️ Niveles y Límites (Tiers)

El sistema ofrece diferentes capacidades según tu nivel:
*   **Tier Free:** Puedes tener hasta **2 dinos activos** al mismo tiempo. Tienes acceso a todas las funciones (Web, DMs, Canales).
*   **Tier Pro/Tribe:** Desbloquea límites mucho mayores (50 o más dinos) para crianzas masivas de tribus grandes.

---

## ❓ Preguntas Frecuentes

*   **¿Tengo que dejar la web abierta?** No. El sistema calcula el tiempo de forma determinista basándose en la hora real.
*   **¿Por qué no puedo usar los comandos?** Asegúrate de tener el rol de Discord que tu administrador haya designado para usar el bot.
*   **El bot no me envía DMs:** Asegúrate de tener habilitados los mensajes directos de miembros del servidor en tu configuración de Discord.

---
*¡Feliz crianza, superviviente!* 🦕✨
