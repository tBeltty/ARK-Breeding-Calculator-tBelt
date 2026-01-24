# 🦖 User Manual: ARK Breeding Assistant

Welcome! This guide will help you get the most out of the bot and web platform so your ARK breeding is perfect and stress-free.

---

## 🛰️ Server Monitoring (New in v3.0)

Connect your calculator directly with ARK Official Servers:
1.  **Live Status:** Check if your server is Online or Offline instantly.
2.  **Auto-Rates:** Automatically detects evolution events (2x, 3x) and adjusts your timers without manual input.
3.  **Downtime Compensation:** If the server goes down, the system "pauses" your breeding automatically to keep maturation % in sync.
4.  **Return Notification:** Get an alert when the server comes back online.

## 🥩 Food & Inventory Tracker
Forget mental math with the new inventory management system:
1.  **Track:** Activates a live countdown telling you *exactly* when the baby's inventory will be empty.
2.  **Refill:** A simple button to reset the timer when you top up the inventory.
3.  **Smart Buffer:** Calculates based on current weight and species consumption rate.

---

## 🎮 Discord Usage

The bot lives in your Discord server and is your breeding companion. Use slash commands (`/`) to interact.

### 🐣 Start Tracking
Use `/track` to start watching a baby.
*   **Key Fields:**
    *   `creature`: Species name (Rex, Argy, etc). Use autocomplete.
    *   `progress`: Current maturation % (default 0).
    *   `nickname`: Optional name for the baby.
    *   `weight`: **(Important)** Current **Weight** stat. This allows the bot to calculate "buffer".
    *   `notify_mode`: Choose **DM** (Private) or **Channel**.
    *   `channel`: If Channel mode, select where to alert.

### 📊 Check Status
Use `/status` to see a visual table with progress, time remaining, and food buffer status for all your dinos.

### 🛑 Stop Tracking
Use `/stop [ID]` when done or if you made a mistake. You can only stop your own trackers.

---

## 💻 The Web Dashboard

Access at [ark.tbelt.online/dashboard](https://ark.tbelt.online/dashboard) with your Discord account.

### What can you do on Web?
1.  **Personal View:** See all active dinos across all servers in one screen.
2.  **Alert Config:** Switch between DM/Channel alerts with one click.
3.  **Remote Tracking:** Start a Discord tracker comfortably from the web using the **Remote Command Runner**.
4.  **Precise Calc:** The web uses a real-time deterministic engine that never stops.

---

## 🔔 Custom Notifications

You decide how to receive alerts:
*   **Direct Message (DM):** The bot DMs you privately.
*   **Channel Mention:** The bot pings you in a specific channel.

> [!NOTE]
> You get an alert when "buffer" is low and another when maturation hits 100%.

---

## 🛡️ Tiers & Limits

System offers different capacities based on tier:
*   **Free Tier:** Up to **2 active dinos** simultaneously. Full access to features.
*   **Pro/Tribe Tier:** Unlocks higher limits (50+) for mass breeding.

---

## ❓ FAQ

*   **Do I need to keep the web open?** No. The system calculates deterministically based on real time.
*   **Why can't I use commands?** Ensure you have the Discord role designated by your admin.
*   **Bot doesn't DM me:** Check your Discord privacy settings to allow DMs from server members.

---
*Happy Breeding, Survivor!* 🦕✨
