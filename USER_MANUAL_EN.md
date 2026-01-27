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
# Survivor's Handbook - Arktic Assistant

Everything you need to master breeding in ARK with the best technology.

---

## 💻 Web Calculator (ark.tbelt.online)

The web calculator is your main command center for individual creature tracking.

### 1. Basic Usage
- Click the **+** button at the top left.
- Select the **Species** and its current **Weight**.
- Use the **Play/Pause** buttons to sync real maturation time with the game.

![Add Dino Modal](public/assets/help/screenshots/01-add-dino-modal.png)
![Calculator Overview](public/assets/help/screenshots/02-calculator-view.png)

### 2. What is the Food Buffer?
The **Buffer** is the actual time your baby can survive with a full inventory.
- **Weight is Key**: The more weight the dino has, the more food stacks fit, and the more buffer time you'll have. A Giga with 40 weight has much less buffer than one with 200.

![Buffer Section](public/assets/help/screenshots/03-progress-buffer.png)

### 3. Hand Feed For
This value indicates the maturation % where the baby's inventory is large enough to last until the **Juvenile stage (10.0%)**.
- If "Hand Feed For" says 5%, it means that once you reach that %, you can fill the baby and leave; it won't die until it starts eating from the trough.

![Key Stats](public/assets/help/screenshots/04-stats-grid.png)

### 4. Trough Management
In the **Troughs** tab, you can simulate how long shared food will last.
- Supports **Normal, Tek, and Maewings**.
- Automatically calculates the **Spoilage** rate based on the container type.

---

## 🤖 Discord Bot

Take your tribe's control to the next level with automations and alerts.

### 1. Installation
Go to [ark.tbelt.online/dashboard](https://ark.tbelt.online/dashboard), select your server, and click **Invite Bot**.

### 2. Main Commands
- **/track**: Start a tracker in the channel. Don't forget the Weight!
- **/status**: Shows a quick summary of all active babies.
- **/stop**: Stops tracking a specific creature.
- **/stopall**: Stops all trackers for the server.

### 3. Pro Server Monitoring
Link your trackers to an official or private server. If the server goes down (Downtime), the bot will **automatically pause all tribe timers** to prevent deaths due to lack of food.

---

## 🆘 Support and Emergencies
If you need additional help or the bot gets "stuck":
- Use **/support** to get the link to the help server.
- Visit the [Online Dashboard](https://ark.tbelt.online/dashboard) to force pauses or restarts.

*Rule the Ark with intelligence! 🦕✨*
