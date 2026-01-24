# 🚑 VPS Runner Troubleshooting Guide

Este documento detalla cómo diagnosticar y solucionar problemas comunes con el **GitHub Actions Self-Hosted Runner** en el VPS, especialmente cuando aparece el error `Resource temporarily unavailable` o el runner aparece "Offline" en GitHub.

## 🚨 Síntomas Comunes

1.  **GitHub Actions:** El job se queda esperando infinitamente ("Waiting for a runner...").
2.  **Logs del Runner (`journalctl`):** Muestran `Runner connect error: Resource temporarily unavailable` o `Could not resolve host`.
3.  **Terminal VPS:** No puedes descargar archivos (`curl` falla) o hacer ping a google.com.

---

## 🛠️ Paso 1: Diagnóstico de Conectividad (DNS)

El 90% de las veces, el runner muere porque **el servidor pierde acceso a internet (DNS)**.

Ejecuta esto en el VPS:
```bash
ping -c 3 github.com
```

-   **Si responde (bytes from...):** Tu internet está bien. Pasa al [Paso 3](#-paso-3-reinstalación-nuclear-del-runner).
-   **Si falla (Name or service not known):** Tu DNS está roto. **Arréglalo primero (Paso 2).**

---

## 🌐 Paso 2: Reparar DNS (Recuperar Internet)

Si no tienes internet, el runner jamás conectará.

1.  **Edita las DNS temporales:**
    ```bash
    nano /etc/resolv.conf
    ```
2.  **Añade Google DNS al principio:**
    ```text
    nameserver 8.8.8.8
    nameserver 8.8.4.4
    ```
3.  **Guarda y Sal** (`Ctrl+O`, `Enter`, `Ctrl+X`).
4.  **Verifica:** `ping github.com` debería funcionar ahora.

> **Nota:** Para hacer este cambio permanente y evitar que se borre al reiniciar, configura Netplan o bloquea el archivo con `chattr +i /etc/resolv.conf`.

---

## ☢️ Paso 3: Reinstalación "Nuclear" del Runner

Si el runner sigue fallando o dice que "ya está configurado" pero no conecta, lo más rápido es borrarlo y empezar de cero.

### 1. Limpiar (Como tu usuario, NO root)
```bash
# Entra a la carpeta padre
cd ~

# Detener servicio (si existe)
cd actions-runner
sudo ./svc.sh stop
sudo ./svc.sh uninstall
cd ..

# BORRAR TODO (Cuidado con este comando)
rm -rf actions-runner
```

### 2. Re-instalar
1.  Ve a **GitHub -> Settings -> Actions -> Runners**.
2.  Borra el runner antiguo "Offline".
3.  Crea uno nuevo (**New self-hosted runner**) y copia los comandos de Download/Configure.

```bash
# Ejemplo de flujo típico:
mkdir actions-runner && cd actions-runner

# Descargar (Usa el link que te de GitHub)
curl -o actions-runner-linux-x64-x.x.x.tar.gz -L ...
tar xzf ./actions-runner-linux-x64-x.x.x.tar.gz

# Configurar (Permitir root si es necesario)
export RUNNER_ALLOW_RUNASROOT=1
./config.sh --url https://github.com/tBeltty/finances_app --token [TOKEN_DE_GITHUB]

# Instalar y Arrancar Servicio
sudo ./svc.sh install
sudo ./svc.sh start
```

---

## 🛡️ Mantenimiento Preventivo (Auto-Healing)

Para evitar que el runner se quede "zombie" (activo pero desconectado), configura un reinicio diario.

1.  Edita el cron de root: `sudo crontab -e`
2.  Agrega esta línea al final:
    ```bash
    # Reiniciar runner cada día a las 04:00 AM para refrescar conexión
    0 4 * * * cd /home/jhonatan/actions-runner && ./svc.sh stop && sleep 5 && ./svc.sh start
    ```
