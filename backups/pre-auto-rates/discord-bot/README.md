# ARK Breeding Assistant - Discord Bot

> A Discord bot for tracking ARK: Survival Ascended/Evolved baby creatures.

## Setup

```bash
npm install
cp .env.example .env
# Fill in your credentials
npm start
```

## Structure

```
src/
├── domain/           # Pure business logic
├── application/      # Use cases
├── infrastructure/   # Discord, Database, API
└── shared/           # Utilities
```

## License

MIT
