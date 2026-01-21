# ARK Breeding Calculator (Modernized)

A modernized, high-performance remake of the classic ARK Breeding Calculator, built for **ARK: Survival Ascended (ASA)** and **ARK: Survival Evolved (ASE)**.

Original concept by Crumplecorn, re-engineered for 2026. **Version 2.5** (Released Jan 2026).


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
Manage your breeding lines with the precision of a master breeder.
- **Multi-Dino Tracking**: Monitor an entire nursery from a unified, collapsible sidebar.
- **Context Awareness**: Instantly switch between babies to manage individual feeding schedules.
- **Auto-Persistence**: Your data is saved automatically locally—never lose progress on a refresh.
- **Smart Sync**: Advanced state management ensures your maturation timers are always accurate across the UI.

### 🧬 Precision Breeding Analytics
Stop guessing. Start calculating.
- **Real-Time Maturation**: Watch growth in real-time with synchronized timers.
- **Survival Buffer**: Our signature **"Current Buffer"** metric tells you exactly how long you can step away safely.
- **Hand-Feed Mastery**: Know the exact second your baby handles a trough, ending the hand-feeding grind.

### 🥩 Intelligent Trough Simulation
Optimize your resources and sleep soundly.
- **Multi-Trough Logic**: Simulates complex setups with Tek Troughs, Fridges, and Maewings.
- **Spoilage Engine**: Accounts for variable spoilage rates across different container types and game states.
- **Nightmare Prevention**: Calculates precisely if your food stocks will survive the night for your specific army.

### 🎨 Premium "Atmos" Interface
A tool that looks as good as it performs.
- **6 Hand-Crafted Themes**: From the golden dunes of *Arat Prime* to the neon glow of *Tek Pulse*.
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
├── application/         # Application business logic (Use Cases)
├── components/          # React UI components
├── data/                # Static game data (Creatures, Foods)
├── domain/              # Core domain logic & entities
├── infrastructure/      # External services & repositories
├── locales/             # i18n translation files
├── styles/              # Global styles & Design Tokens
├── App.jsx              # Main application entry
└── main.jsx             # React DOM root
```

## 🗺️ Roadmap
- **Advanced Calculation Modes**: Experimental support for "Stasis" vs "Render" spoilage rates.
- **Notification System**: Push notifications and Email alerts when troughs are empty.
- **Cloud Sync**: Optional cloud backup for your breeding configs.

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
