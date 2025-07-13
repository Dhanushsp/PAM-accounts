# Setup Guide for PAM Accounts Mobile App

## Prerequisites

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/

2. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

3. **Expo Go App** (for testing on device)
   - Android: Google Play Store
   - iOS: App Store

## Installation Steps

1. **Navigate to the project directory**
   ```bash
   cd frontend-mob1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Scan the QR code with Expo Go app
   - Or press 'a' for Android emulator
   - Or press 'i' for iOS simulator

## Environment Setup

Create a `.env` file in the root directory:
```
API_BASE_URL=https://api.pamacc.dhanushdev.in
```

## Troubleshooting

### Common Issues:

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **Dependency issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors**
   ```bash
   npx tsc --noEmit
   ```

## Building for Production

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Build for Android**
   ```bash
   eas build --platform android
   ```

4. **Build for iOS**
   ```bash
   eas build --platform ios
   ```

## Project Structure

```
frontend-mob1/
├── app/                    # Main application code
│   ├── components/         # Reusable components
│   ├── pages/             # Screen components
│   ├── lib/               # Utility libraries
│   ├── utils/             # Helper functions
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── assets/                # Images and static files
├── package.json           # Dependencies
├── app.json              # Expo configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── babel.config.js       # Babel configuration
``` 