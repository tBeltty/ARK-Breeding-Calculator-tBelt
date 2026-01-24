# tBelt Finanzas v2.0 - Roadmap de Features

## 🎯 Visión General
Evolucionar de una app de control de gastos a una **plataforma integral de finanzas personales** con capacidades Web3.

---

## 💰 Módulo: Ingresos Múltiples

### Income Streams (Fuentes de Ingreso)
- **Ingreso Principal:** Salario fijo mensual (actual)
- **Ingresos Extra:**
  - Freelance / Proyectos
  - Ventas ocasionales
  - Dividendos
  - Rentas
  - Cashback / Rewards
- **Recurrencia:** Único, semanal, quincenal, mensual
- **Estado:** Pendiente, Recibido, Parcial

### Dashboard de Ingresos
- Gráfico de ingresos por fuente
- Comparativa mes a mes
- Predicción de ingresos basada en histórico

---

## 🤝 Módulo: Préstamos Personales

### Préstamos Otorgados (Yo presté a alguien)
```
Préstamo {
  deudor: string,          // A quién le presté
  monto: number,           // Cantidad prestada
  fecha: Date,             // Cuándo presté
  fechaLimite?: Date,      // Cuándo debe pagar
  interés?: number,        // % interés (opcional)
  pagos: Payment[],        // Historial de pagos parciales
  estado: 'activo' | 'pagado' | 'vencido'
}
```

### Features
- Lista de deudores con montos pendientes
- Recordatorios automáticos (push notifications)
- Historial de pagos parciales
- KPI: "Te deben: $X,XXX"
- Opción de "perdonar" deuda (writeoff)

### Préstamos Recibidos (Me prestaron)
- Tracking de cuánto debo y a quién
- Fechas de pago
- Sincronizado con gastos ("Pago a Juan" = gasto + reduce deuda)

---

## 💳 Módulo: Créditos Avanzados

### Estructura de Crédito
```
Credito {
  nombre: string,           // "Tarjeta Visa", "Crédito Auto"
  tipo: 'tarjeta' | 'vehiculo' | 'hipoteca' | 'personal' | 'otro',
  montoOriginal: number,    // Deuda inicial
  tasaInteres: number,      // Tasa de interés anual
  cuotaMensual: number,     // Pago mensual
  totalCuotas: number,      // Total de cuotas
  cuotasPagadas: number,    // Cuotas ya pagadas
  fechaInicio: Date,
  pagos: Payment[]
}
```

### Cálculos Automáticos
- **Saldo actual:** Cuánto queda por pagar
- **Intereses pagados:** Total intereses acumulados
- **Intereses restantes:** Proyección de intereses futuros
- **Fecha de finalización:** Cuándo termina el crédito
- **Ahorro si pago extra:** Simulador de pago adelantado

### Dashboard de Créditos
- Progress bar: X de Y cuotas pagadas
- Gráfico: Deuda vs Tiempo
- Alerta: Cuotas próximas a vencer
- Comparador: "Si pagas $X extra, ahorras $Y en intereses"

### Tarjetas de Crédito
- Tracking de gasto vs límite
- Fecha de corte vs fecha de pago
- Mínimo vs total
- Historial de estados de cuenta

---

## 🌐 Módulo: Web3 Features

### 1. Wallet Tracking
- Conectar wallets (MetaMask, WalletConnect)
- Ver balance en crypto (ETH, USDT, USDC, etc.)
- Conversión automática a moneda local
- Incluir en balance total

### 2. DeFi Dashboard
- Tracking de staking rewards
- LP token values
- Yield farming positions
- Auto-sync con protocolos populares (Aave, Compound, Uniswap)

### 3. NFT Portfolio
- Ver NFTs en wallet
- Floor price tracking
- Incluir valor estimado en net worth

### 4. Crypto Expenses
- Categorizar transacciones on-chain
- Gas fees como gasto
- Swaps y trades tracking
- Tax-ready exports

### 5. Multi-chain Support
- Ethereum, Polygon, BSC, Arbitrum, Base
- Agregador de balances cross-chain

### 6. Pagos P2P con Crypto
- Registrar préstamos en USDT/USDC
- Smart contract para préstamos (opcional)
- QR code para recibir pagos

---

## 📊 Módulo: Analytics Avanzados

### Nuevas Métricas
- **Net Worth:** Activos - Pasivos
- **Cash Flow:** Ingresos - Gastos - Pagos de deuda
- **Savings Rate:** % de ingreso ahorrado
- **Debt-to-Income:** Ratio deuda/ingreso
- **Emergency Fund Score:** Meses de gastos cubiertos

### Proyecciones
- ¿Cuándo seré libre de deudas?
- ¿Cuánto tendré ahorrado en X meses?
- Simulador de escenarios

---

## 📱 UX Improvements

### Quick Actions
- "Pagar cuota" con un tap
- "Registrar ingreso extra" rápido
- Widget para Android/iOS

### Notificaciones Inteligentes
- Recordatorios de pagos
- Alertas de vencimiento
- "Hoy vence tu cuota del auto"

### Gamification
- Streaks de ahorro
- Badges por metas cumplidas
- Leaderboard del household

---

## 🔐 Priorización Actualizada

### v1.4.2 (Completado - Dec 2025)
1. ✅ Ingresos múltiples (Backend & Modelos)
2. ✅ Préstamos personales básico
3. ✅ Refactorización de Arquitectura (Thin Controllers)
4. ✅ Créditos Bancarios Avanzados (Schema)

### v1.5.0 (Próximo Release - Enero 2026)
**Enfoque: Automatización y Reportes**
1. 🔲 **Debt Payoff Simulator:** "Bola de nieve" vs "Avalancha".
2. 🔲 **Reportes PDF:** Exportar estado de cuenta del household.
3. 🔲 **Smart Notifications:** Recordatorios de vencimiento por Email/Push.
4. 🔲 **Budget vs Actual:** Comparativa visual de presupuesto.

### v2.0.0 (Futuro - Q1 2026)
5. 🌐 Web3 wallet connection
6. 🌐 Crypto balance tracking
7. 🌐 DeFi integrations

---

## 💡 Notas de Brainstorming

### Preguntas para definir:
1. ¿Integrar con APIs bancarias (Plaid, Belvo)?
2. ¿Multi-moneda en tiempo real (forex)?

---

*Documento actualizado: 2025-12-16*
*Estado: v1.4.2 Released*
