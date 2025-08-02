# Gemini AI Assistant Setup Guide

## Issues Identified and Solutions

### 1. **Missing Gemini API Key** 🔑
**Problem**: The backend is using a fallback API key `'your-gemini-api-key'` instead of a real API key.

**Solution**: 
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Create a `.env` file in the `backend` directory with:
```env
GEMINI_API_KEY=your-actual-api-key-from-google-ai-studio
MONGO_URL=mongodb://localhost:27017/pam-accounts
DEFAULT_ADMIN_MOBILE=admin
DEFAULT_ADMIN_PASSWORD=admin123
JWT_SECRET=your-jwt-secret-key
PORT=5000
NODE_ENV=development
```

### 2. **Voice Recognition Dependencies** 🎤
**Problem**: Voice recognition libraries are missing or incorrectly imported.

**Solution**: Install the required packages in the frontend:
```bash
cd frontend
npm install @react-native-voice/voice expo-speech
```

### 3. **Import Issues Fixed** ✅
**Fixed**: Removed incorrect import `import * as Voice from 'expo-speech';` from `AIChatbot.tsx`

### 4. **Backend Dependencies** ✅
**Status**: `@google/generative-ai` package is already installed in backend.

## Step-by-Step Setup Instructions

### Step 1: Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Create Environment File
Create `backend/.env` file:
```env
GEMINI_API_KEY=AIzaSyC...your-actual-key-here
MONGO_URL=mongodb://localhost:27017/pam-accounts
DEFAULT_ADMIN_MOBILE=admin
DEFAULT_ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install @react-native-voice/voice expo-speech
```

### Step 4: Restart Backend Server
```bash
cd backend
npm start
```

### Step 5: Test AI Assistant
1. Open the app
2. Navigate to the AI Assistant
3. Try sending a message like "Show me my expense summary"
4. Test voice input (microphone button)

## Troubleshooting

### If AI Still Doesn't Respond:
1. Check backend console for errors
2. Verify API key is correct
3. Check if MongoDB is running
4. Ensure backend server is running on port 5000

### If Voice Recognition Doesn't Work:
1. Check if microphone permissions are granted
2. Verify `@react-native-voice/voice` is installed
3. Test on a physical device (voice recognition may not work in simulator)

### Common Error Messages:
- `"Failed to process AI request"` - Check API key and backend logs
- `"Could not recognize speech"` - Check microphone permissions
- `"Network error"` - Check if backend server is running

## Features Available

Once set up, the AI assistant can:
- ✅ Analyze expense data
- ✅ Provide sales insights
- ✅ Generate financial reports
- ✅ Answer business questions
- ✅ Provide Tamil translations
- ✅ Voice input and output
- ✅ Quick suggestion buttons

## API Endpoints

- `POST /api/ai/chat` - Main AI chat endpoint
- Requires authentication token
- Accepts: `message`, `appData`, `context`, `language`
- Returns: `response`, `tamilResponse`, `suggestions` 