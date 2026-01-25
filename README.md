# ARK Breeding Calculator (Unofficial) v3.0.0
![License](https://img.shields.io/badge/license-MIT-blue.svg)
A modernized, high-performance remake of the classic ARK Breeding Calculator, built for **ARK: Survival Ascended (ASA)** and **ARK: Survival Evolved (ASE)**.

Original concept by Crumplecorn, re-engineered for 2026. **Version 3.0.0** (Released Jan 2026).


## 🚀 Why this Remake?

The original tools were built on aging technologies (AngularJS 1.x) that are hard to maintain and lack support for modern web features. This project aims to:
- **Modernize the Stack**: Migrated to **React 19 + Vite** for blazing fast performance.
- **Improve UX**: Implemented the **Atmos UI** design system for a premium, responsive, and accessible experience.
- **Updated Content**: Includes the latest official creatures from recent DLCs (e.g., **Gloon**, **Ossidon**).
- **Maintainability**: Refactored the codebase to be robust, testable, and extensible.

## ✨ Experience the Difference

### 🚀 Seamless Onboarding
Get started in seconds with our new **Smart Setup Wizard**.
- **Personalized Setup**: Select your language, game version (ASE/ASA), and preferred theme instantly.
- **Interactive Guide**: The app helps you create your first creature session so you're never lost.
- **Smart Defaults**: We pre-configure settings based on your choices for immediate utility.

### 🦕 Professional Creature Management
Our **Signature Feature**. Why settle for tracking one baby when you can manage an army?
- **Multi-Dino Tracking**: Monitor an entire nursery from a unified, collapsible sidebar.
- **Real-Time Sync**: Every second counts. Maturation timers are synchronized instantly across the entire UI.
- **Smart Context**: Autosaves your progress locally—refresh without fear.

### 🧬 Precision Breeding Analytics
Stop guessing. Start calculating.
- **Calculations**: Maturation times, food consumption, and stat points based on official rates.
- **Survival Buffer**: The classic "Current Buffer" metric tells you how long you can step away.
- **Hand-Feed Thresholds**: Know the exact second your baby handles a trough.

### 🛰️ Real-Time Server Monitoring (v3.0)
Sync your breeder with your official server.
- **Live Status**: Check if your server is Online, Offline, or Syncing.
- **Auto-Rates**: Automatically detects official event rates (e.g. 2x Evolution) and applies them to your timers.
- **Downtime Compensation**: Automatically pauses tracking when the server goes offline to maintain accuracy.
- **Smart Alerts**: Get notified when the server comes back online.

### 🥩 Intelligent Trough & Food Tracker
Optimize your resources and sleep soundly.
- **Inventory Depletion Tracker**: Know exactly when your dino runs out of food with a live countdown.
- **Refill Logic**: One-click refill button resets the timer based on current capacity.
- **Multi-Trough Logic**: Simulates complex setups with Tek Troughs and Fridges.
- **Maewing Support** (Beta): Experimental support for nursing trough mechanics.
- **Spoilage Engine**: Accounts for variable spoilage rates and stack logic.

### 🎨 Premium "Atmos" Interface
A tool that looks as good as it performs.
- **6 Hand-Crafted Themes**: From the frozen peaks of *Arat Prime* to the corrupted innovation of *Tek Pulse*.
- **Glassmorphism Design**: Modern, translucent, and highly responsive interface.
- **Mobile First**: Fully optimized for phones and tablets without compromising power.

### 🌍 Internationalization
- **Multi-language Support**: Fully localized in **English** and **Spanish**.
- **Contextual Tooltips**: Every field has a helpful tooltip explaining the game mechanic (in your language!).

### 📱 PWA Support
- **Installable**: Add to Home Screen on iOS, Android, and Desktop.
- **Offline Capable**: Works without an internet connection once loaded.
- **Auto-Updates**: Automatically keeps you on the latest version.

## 🏗️ Infrastructure Map

A high-level view of the application's structure:

```text
src/
├── application/         # Use Cases & Ports (Clean Architecture)
├── components/          # React Components (Atmos UI)
│   ├── Onboarding/      # Wizard & Setup
│   ├── Session/         # Active Creature Detail
│   ├── Sidebar/         # Multi-Dino Management
│   └── TroughCalculator # Food & Spoilage Logic
├── data/                # Static Game Data (Creatures, Foods)
├── domain/              # Core Entities (Session, Breeding Logic)
├── infrastructure/      # Repositories & External Services
├── hooks/               # Custom React Hooks
├── locales/             # i18n Translation Files
├── styles/              # Global Tokens & ATMOS System
└── App.jsx              # Application Root
```

## 🗺️ Roadmap
- **Advanced Calculation Modes**: Experimental support for "Stasis" vs "Render" spoilage rates.
- **Cloud Sync**: Optional cloud backup for your breeding configs.
- **Discord Bot Integration (Enhanced)**: More slash commands for tribe management.

## 🛠️ Tech Stack

- **Core**: React 19, Vite
- **State**: React Hooks (useState, useMemo, useReducer)
- **Styling**: CSS Modules, CSS Variables (Tokens)
- **Testing**: Vitest
- **I18n**: i18next

## 📦 Installation

```bash
git clone https://github.com/tBeltty/ARK-Breeding-Calculator-tBelt.git
cd ARK-Breeding-Calculator-tBelt
npm install
npm run dev
```

## 🤝 Contributing

Currently, this repository does **not** accept Pull Requests.  
This decision is intentional and helps maintain strict security standards within our self-hosted deployment pipeline.  
Thank you for your understanding.

## ⚖️ Disclaimer

This project is an independent fork and is not affiliated with the original ARK Breeding Calculator or its maintainers.

Calculations are based on official rates and tested against in-game behavior, but minor discrepancies may occur depending on server settings and patches.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Made with ❤️ by tBelt</p>
