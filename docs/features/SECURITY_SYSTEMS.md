# Sistemas de Seguridad: 2FA y Validación de Email

Este documento detalla la implementación técnica del sistema de Autenticación de Dos Factores (2FA) y la validación de email preventiva (Pre-Submit Middleware) en Finances App.

## 1. Sistema de Autenticación de Dos Factores (2FA)

El sistema utiliza el estándar **TOTP (Time-based One-Time Password)** compatible con aplicaciones como Google Authenticator y Authy.

### Arquitectura
- **Librería Core:** `otplib` para generación/validación de tokens.
- **Visualización:** `qrcode` para generar el código QR escaneable.
- **Estándar:** HMAC-SHA1 (Default TOTP algo).
- **Ventana de Tiempo:** `window: 2`. Esto permite una tolerancia de **±60 segundos** (2 pasos de 30s) para mitigar problemas de sincronización de reloj entre servidor y cliente.

### Flujo de Datos

#### A. Habilitación (`authService.generate2FA`)
1.  Servidor genera un `secret` aleatorio usando `otplib.authenticator.generateSecret()`.
2.  El `secret` se guarda temporalmente en el modelo `User` (`twoFactorSecret`), pero `isTwoFactorEnabled` permanece en `false`.
3.  Se genera una URI `otpauth://` y se convierte a QR Base64.
4.  El cliente muestra el QR. El usuario lo escanea.

#### B. Verificación de Setup (`authService.verify2FASetup`)
1.  El usuario ingresa el código de 6 dígitos generado por su app.
2.  Servidor verifica el token contra el `secret` guardado.
3.  **Si es válido:** Se marca `user.isTwoFactorEnabled = true`.
4.  **Si es inválido:** Se rechaza y el usuario no queda bloqueado fuera de su cuenta (ya que `isTwoFactorEnabled` sigue false).

#### C. Login con 2FA (`authService.login`)
El login ocurre en dos fases si el usuario tiene 2FA activo:

1.  **Fase 1 (Credenciales):**
    *   Cliente envía usuario/password.
    *   Servidor valida credenciales. Vede que `user.isTwoFactorEnabled` es true.
    *   Servidor verifica si el request incluye `twoFactorToken`. Si **NO** lo incluye, detiene el login y retorna `{ require2FA: true }`.

2.  **Fase 2 (Validación TOTP):**
    *   Cliente detecta `require2FA: true` y muestra input de código.
    *   Cliente reenvía usuario/password + `twoFactorToken`.
    *   Servidor valida el token contra `user.twoFactorSecret` usando `otplib`.
    *   Si es correcto, emite el JWT.

---

## 2. Middleware de Validación de Email (Pre-Submit)

Este sistema previene el "ruido" en la base de datos y ataques de enumeración, validando la calidad del email **antes** de intentar crear el usuario.

### Arquitectura
- **Ubicación:** `server/utils/validators.js` (Lógica) y `server/controllers/authController.js` (Endpoint).
- **Endpoint:** `POST /api/auth/validate-email`.
- **Trigger Frontend:** Se ejecuta en el evento `onBlur` del campo email o pre-submit en el formulario de registro.

### Capas de Validación (Secuenciales)

1.  **Rate Limiting (Anti-Enumeración)**
    *   **Límite:** 20 validaciones por minuto por IP.
    *   Previene que atacantes usen este endpoint para descubrir qué emails están registrados masivamente.

2.  **Validación de Formato (Regex)**
    *   Verifica estructura estándar `user@domain.tld`.

3.  **Listas Negras (Blocklists)**
    *   **TLDs Prohibidos:** `.test`, `.example`, `.invalid`, `.local`, `.localhost`.
    *   **Dominios Desechables:** Se verifica contra una lista estática (ej. `mailinator.com`, `yopmail.com`) y `disposable_domains.json`.
    *   **Usuarios Sospechosos:** Bloquea partes locales como `admin`, `root`, `noreply`, `test`.

4.  **Verificación DNS (MX Records)**
    *   **Técnica:** Realiza una consulta DNS real (`dns.resolveMx`) al dominio.
    *   **Propósito:** Confirmar que el dominio **existe y tiene servidores de correo configurados**.
    *   **Timeout:** 3 segundos. Si el DNS tarda más, se asume válido (fail-open) para no bloquear usuarios con internet lento, pero se loguea la advertencia.

5.  **Unicidad en Base de Datos (Contextual)**
    *   Verifica si el email ya existe en la tabla `Users`.
    *   **Nota Importante:** La consulta respeta el "Soft Delete". Si un usuario eliminó su cuenta (Soft Delete), su email **se considera disponible**, permitiendo la re-registración inmediata.

### Respuesta del Endpoint
El endpoint retorna un objeto JSON simple:
```json
{
  "valid": true,
  "message": null // o mensaje de error si valid es false
}
```
Esto permite al frontend mostrar feedback en tiempo real (ej. "Este dominio no tiene correo") sin exponer detalles de infraestructura.
