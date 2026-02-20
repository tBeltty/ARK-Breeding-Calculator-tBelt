# Walkthrough: Bot Reliability & Auto-Recovery

I have implemented a series of reliability fixes to ensure the Discord bot remains stable during VPS network issues and recovers automatically without manual intervention.

## 🛠️ Changes Made

### 1. "False Offline" Logic Fix
The bot now distinguishes between a server being **actually offline** and its **connectivity being broken**.
- **Before**: Any API failure (like DNS `EAI_AGAIN`) caused the bot to mark servers as "Offline" and then spam "Back Online" when connection returned.
- **After**: If an API call fails due to network, the bot maintains the **last known state** and increments a failure counter.

### 2. Auto-Recovery Watchdog
I implemented an internal health monitor that triggers a self-repair if connectivity is lost for a prolonged period.
- **Watchdog logic**: If >50% of sync attempts fail for 10 consecutive minutes, the bot logs a critical error and exits.
- **PM2 Integration**: PM2 on the VPS automatically restarts the process, which flushes the network stack and recovers connectivity.

### 3. Smart Alerting (Baseline Sync)
To prevent notification spam upon recovery:
- The bot performs a "silenced" sync cycle when it first regains connectivity.
- This "Baseline Sync" updates the status without triggering Discord alerts, ensuring the bot's state is accurate before resuming normal notifications.

### 4. Dashboard Scaling & Caching
To resolve the `429 Too Many Requests` errors on the dashboard:
- **Server-side Guild Cache**: Implemented a 10-minute in-memory cache for Discord guild lists and a 5-minute cache for user auth profiles.
- **Nginx Optimization**: I increased the Nginx `limit_req` rate to 50r/s (from 10r/s) and burst to 50 to accommodate the increased traffic from Cloudflare proxied users.
- **Fail-Safe Auth**: If Discord is rate-limited, the bot now serves slightly stale cached data instead of erroring, keeping the dashboard functional.

### 5. Infrastructure & Protocol Restoration
- **DNS Stability**: Switched VPS to stable DNS servers (Google/Cloudflare) to end the `EAI_AGAIN` resolution storm.
- **Official Pipeline**: Restored the mediator (GitHub Actions) as the sole source of truth. All manual workarounds were overwritten by the official `v3.4.21` build.

---

## 🧪 Verification Results

### Final Health Sync
Verified version `v3.4.21` is live and stable on the VPS.
```json
// GET /api/stats
{
  "version": "3.4.21",
  "sync_stable": true,
  "sync_failures": 0,
  "discord_ready": true
}
```

### DNS Resolution
Verified the VPS can resolve critical endpoints without delay.
- `discord.com` lookup: ~15ms (Stable)
- `github.com` lookup: ~10ms (Stable)

> [!IMPORTANT]
> The system is fully restored. The dashboard permissions issue was a symptom of Discord's auth servers being unreachable during the VPS DNS outage.
