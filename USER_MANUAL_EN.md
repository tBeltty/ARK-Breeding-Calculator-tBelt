# 🦖 Arktic Assistant: Survivor's Handbook (v3.0)

**Arktic Assistant** is the most advanced breeding ecosystem for ARK: Survival Ascended (ASA) and ARK: Survival Evolved (ASE). It combines a powerful Discord Bot with a real-time synchronized Web Dashboard.

---

## 🚀 1. Quick Installation

To add Arktic Assistant to your server, you don't need to look for external links:
1.  **Directly from the Web:** Go to [ark.tbelt.online/dashboard](https://ark.tbelt.online/dashboard) and login with Discord.
2.  **Server Selection:** You will see a list of servers where you have administrative permissions. Click the **"Invite Bot"** button next to the desired server.
3.  **Authorization:** The invite link is already pre-configured with the required permissions (Roles, Channels, and Slash Commands).

---

## ⚙️ 2. Smart Administration & Settings

The bot is flexible and adapts to any type of server (Official or Private).

### Settings Panel (`/settings`)
Only administrators can modify these values:
*   **🔌 Game Version:** Switch between **ASA** and **ASE**. The bot will automatically adjust food consumption curves and maturation times.
*   **📈 Maturation Rates:**
    *   **Official (Auto-Sync):** Real-time synchronization with Wildcard official events (2x, 3x, etc.).
    *   **Custom (Manual):** Enter your custom multiplier (e.g., `10.0` for ultra-fast servers).
*   **🔔 Notification System:**
    *   **Channel Mode:** Public alerts in a specific channel for the entire team.
    *   **DM Mode:** Private alerts sent directly to your Discord account.
    *   **Thresholds:** Get warnings when the baby has 5, 10, or 20 minutes of food left.

---

## 🐣 3. Step-by-Step Breeding Guide

### The `/track` command (The Heart of the Bot)
When a baby is born, run `/track` and fill in these key fields:
*   **Species:** Use autocomplete (over 145 creatures available).
*   **Food:** Select the type of food in its inventory. The bot will calculate duration based on the nutritional points of that item.
*   **Weight:** Indicate the **current Weight** of the baby. The bot uses this data to know how many stacks of food actually fit and calculate how many hours of "Buffer" it has before starving.

### Management Tools
*   **`/status`**: Shows the "Gym" of active babies with visual progress bars and food counters.
*   **`/buffer`**: Calculates exactly how long a full inventory will last before the baby starves.
*   **`/stats`**: Technical details like exact time for the next imprint or reaching the Juvenile stage (10%).

---

## 💻 4. The Online Dashboard (Total Control)

The dashboard at [ark.tbelt.online/dashboard](https://ark.tbelt.online/dashboard) is where Arktic Assistant truly shines. It offers features impossible to perform via text in Discord:

### 🎮 Server Management
*   **Centralized Dashboard:** View all your babies from multiple servers on a single screen.
*   **Visual Rate Editing:** Change maturation and game rates with sliders and dropdowns without using commands.

### 🔒 Command Restrictions (Web Only)
From the Dashboard, you can configure **who** and **where** commands are used:
*   **By Role:** Allow only "Breeders" to use `/track`.
*   **By Channel:** Restrict bot spam to specific breeding channels.

### 🛰️ Server Status Monitoring (ASA/ASE)
Link your babies to a real ARK server:
*   **Downtime Sync:** If your ARK server goes down, the dashboard detects it and **automatically pauses your breeding timers** so you don't lose babies due to server crashes or maintenance.

### ⚡ Remote Command Runner
Not on Discord? You can start a baby tracker directly from the web by filling out the form and clicking **"Start Tracker"**. The bot will automatically send the message to Discord.

---

## 🛑 5. Emergency Commands
*   **`/stop [ID]`**: Stop a tracker.
*   **`/stopall`**: Clear all your active trackers (useful after a massive hatch).
*   **`/support`**: Get a link to our technical support Discord.

---

> [!IMPORTANT]
> **Privacy:** The Dashboard only requests access to your servers to identify where you have administrative permissions. Your data is never shared with third parties.

*Born to rule the Ark!* 🦕✨
