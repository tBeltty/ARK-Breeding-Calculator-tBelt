# ARK Breeding Calculator (Modernized)

A modernized, high-performance remake of the classic ARK Breeding Calculator, built for **ARK: Survival Ascended (ASA)** and **ARK: Survival Evolved (ASE)**.

Original concept by Crumplecorn, re-engineered for 2026. **Version 2.5** (Released Jan 2026).

![Compliance: 100%](https://img.shields.io/badge/Compliance-100%25-brightgreen) ![Tests: Passing](https://img.shields.io/badge/Tests-69%2F69-brightgreen)



## 🚀 Why this Remake?

The original tools were built on aging technologies (AngularJS 1.x) that are hard to maintain and lack support for modern web features. This project aims to:
- **Modernize the Stack**: Migrated to **React 19 + Vite** for blazing fast performance.
- **Improve UX**: Implemented the **Atmos UI** design system for a premium, responsive, and accessible experience.
- **Updated Content**: Includes the latest official creatures from recent DLCs (e.g., **Gloon**, **Ossidon**).
- **Maintainability**: Refactored the codebase to be robust, testable, and extensible.

## ✨ Key Features

### 🧬 Advanced Breeding Stats
- **Precise Calculations**: Determine maturation times, food consumption, and stat points.
- **Hand Feed Thresholds**: Knows exactly when you can stop hand-feeding babies.
- **Buffer Calculation**: innovative "Current Buffer" metric shows how long a baby can survive offline.

### 🥩 Trough Calculator
- **Simulation Engine**: Simulates multiple creatures eating from a shared trough.
- **Spoilage Logic**: Accounts for food spoilage rates in different containers (Tek Trough, Refrigerator, etc.).
- **Multi-Creature Management**: Add your entire baby army to see if your troughs will last the night.

### 🎨 Atmos UI & Customization
- **6 Premium Themes**: Arat Prime, Crystal Horizon, Aberrant Depths, Frozen Peaks, Tek Pulse, and Primal Dawn.
- **Glassmorphism**: Modern, sleek aesthetics.
- **Responsive**: Fully functional on mobile and desktop.

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
