# PAM Accounts Mobile App

A React Native mobile application built with Expo for managing PAM accounts.

## Features

- Product management (view, edit, delete)
- Customer management
- Sales tracking
- Authentication system

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on specific platform:
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Environment Variables

Create a `.env` file in the root directory and add:
```
API_BASE_URL=https://api.pamacc.dhanushdev.in
```

## Project Structure

```
app/
├── components/     # Reusable components
├── pages/         # Screen components
├── lib/           # Utility libraries
├── utils/         # Helper functions
├── _layout.tsx    # Root layout
└── index.tsx      # Entry point
```

## Technologies Used

- React Native
- Expo
- TypeScript
- NativeWind (Tailwind CSS)
- Axios
- Expo Router 