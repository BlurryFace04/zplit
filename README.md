# Zplit

A Splitwise-style expense splitter built for Zcash (ZEC). Track shared expenses, calculate balances, and settle debts with friends — all denominated in ZEC.

**Live App:** [zplit-9b133.web.app](https://zplit-9b133.web.app)

## Features

- **Group expense tracking** — Create groups, add members via invite links, and track shared expenses
- **Smart balance calculation** — Automatically calculates who owes whom with debt simplification to minimize transactions
- **Real-time sync** — All group members see updates instantly via Firebase
- **ZEC payments** — Copy ZEC addresses, generate QR codes, and open your wallet to settle debts
- **PWA support** — Install on mobile for a native app experience
- **Dark mode** — ZEC gold-accented dark theme

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS 4
- **State:** Zustand with localStorage persistence
- **Backend:** Firebase (Firestore, Anonymous Auth, Hosting)
- **PWA:** Custom service worker and web manifest

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore and Anonymous Authentication enabled

### Installation

```bash
# Clone the repo
git clone https://github.com/BlurryFace04/zplit.git
cd zplit

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** (start in test mode or configure rules)
3. Enable **Authentication** → **Anonymous** sign-in
4. Register a web app and copy the config
5. Fill in your `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Development

```bash
npm run dev
```

### Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

## Firestore Rules

For production, configure Firestore security rules appropriately. A basic permissive setup for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## How It Works

1. **Set up your profile** — Add your name and optional ZEC address
2. **Create a group** — Pick an emoji and name, then share the invite link
3. **Friends join via link** — They enter their name and join with the invite code
4. **Add expenses** — Log who paid and how to split it
5. **Settle up** — See simplified debts and pay via ZEC wallet

## License

MIT
