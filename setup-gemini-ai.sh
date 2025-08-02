#!/bin/bash

echo "🤖 Gemini AI Assistant Setup Script"
echo "=================================="

# Check if backend .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found!"
    echo ""
    echo "📝 Please create backend/.env file with the following content:"
    echo ""
    echo "GEMINI_API_KEY=your-actual-gemini-api-key-here"
    echo "MONGO_URL=mongodb://localhost:27017/pam-accounts"
    echo "DEFAULT_ADMIN_MOBILE=admin"
    echo "DEFAULT_ADMIN_PASSWORD=admin123"
    echo "JWT_SECRET=your-jwt-secret-key"
    echo "PORT=5000"
    echo "NODE_ENV=development"
    echo ""
    echo "🔑 Get your Gemini API key from: https://makersuite.google.com/app/apikey"
    echo ""
else
    echo "✅ backend/.env file found"
fi

# Check if @react-native-voice/voice is installed in frontend
if [ ! -d "frontend/node_modules/@react-native-voice" ]; then
    echo "❌ @react-native-voice/voice not installed in frontend"
    echo ""
    echo "📦 Installing voice recognition dependencies..."
    cd frontend
    npm install @react-native-voice/voice expo-speech
    cd ..
    echo "✅ Voice dependencies installed"
else
    echo "✅ Voice recognition dependencies found"
fi

# Check if @google/generative-ai is installed in backend
if [ ! -d "backend/node_modules/@google/generative-ai" ]; then
    echo "❌ @google/generative-ai not installed in backend"
    echo ""
    echo "📦 Installing Gemini AI dependencies..."
    cd backend
    npm install @google/generative-ai
    cd ..
    echo "✅ Gemini AI dependencies installed"
else
    echo "✅ Gemini AI dependencies found"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Add your Gemini API key to backend/.env"
echo "2. Restart your backend server: cd backend && npm start"
echo "3. Test the AI assistant in your app"
echo ""
echo "🔧 If you encounter issues:"
echo "- Check backend console for error messages"
echo "- Verify API key is correct"
echo "- Ensure MongoDB is running"
echo "- Test on physical device for voice features" 