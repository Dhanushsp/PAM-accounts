# Gemini Voice Chatbot Setup Guide

## 🎯 What's Been Implemented

✅ **Gemini AI Integration** - Powered by Google's Gemini API
✅ **Voice Input/Output** - Real-time speech recognition and text-to-speech
✅ **Tamil Language Support** - Full bilingual support (Tamil + English)
✅ **Business Intelligence** - Analyzes your app's data and provides insights
✅ **Smart Suggestions** - AI-powered business improvement recommendations

## 📋 Prerequisites

### 1. Gemini API Key
Get your Gemini API key from Google AI Studio:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key for backend configuration

### 2. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install @google/generative-ai expo-av expo-speech @react-native-voice/voice

# Backend dependencies (already added)
cd ../backend
npm install @google/generative-ai
```

## 🔧 Configuration

### 1. Backend Environment Variables
Add to your `.env` file in the backend:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Frontend Permissions
Add these permissions to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone for voice input."
        }
      ]
    ],
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app needs access to your microphone for voice input."
      }
    }
  }
}
```

## 🚀 Features

### Voice Capabilities
- **Speech-to-Text**: Real-time voice input in Tamil and English
- **Text-to-Speech**: AI responses spoken back in Tamil
- **Language Toggle**: Switch between Tamil and English
- **Voice Controls**: Tap microphone to speak, tap again to stop

### AI Analysis
- **Business Data Analysis**: Expenses, sales, categories
- **Financial Insights**: Profit margins, trends, comparisons
- **Smart Recommendations**: Actionable business suggestions
- **Bilingual Responses**: Both Tamil and English versions

### User Interface
- **Modern Chat Interface**: Clean, intuitive design
- **Quick Suggestions**: Pre-built Tamil queries
- **Real-time Feedback**: Loading states and voice indicators
- **Message History**: Complete conversation history

## 📱 Usage Examples

### Voice Commands in Tamil
```
"என் செலவு சுருக்கத்தை காட்டு"
"மேல் செலவு வகைகள் என்ன?"
"இந்த மாத விற்பனையை கடந்த மாதத்துடன் ஒப்பிடு"
"வணிக நுண்ணறிவுகளை கொடு"
"என் செலவுகளை எப்படி குறைக்க முடியும்?"
```

### Expected AI Responses
```
User: "என் செலவு சுருக்கத்தை காட்டு"
AI: "உங்கள் செலவு சுருக்கம்:
• மொத்த செலவுகள்: ₹25,000
• செலவு எண்ணிக்கை: 15
• சராசரி செலவு: ₹1,666.67
• மேல் செலவு வகை: உணவு (₹8,000)

💡 பரிந்துரைகள்:
• உணவு செலவுகளை குறைக்க வீட்டில் சமைக்கவும்
• மாதாந்திர பட்ஜெட் அமைக்கவும்
• தேவையற்ற செலவுகளை குறைக்கவும்"
```

## 🔍 Troubleshooting

### Voice Recognition Issues
1. **Check Permissions**: Ensure microphone permission is granted
2. **Test on Device**: Voice recognition works better on physical devices
3. **Clear Speech**: Speak clearly and at normal pace
4. **Network**: Ensure stable internet connection

### Gemini API Issues
1. **API Key**: Verify your Gemini API key is correct
2. **Quota**: Check your API usage limits
3. **Network**: Ensure backend can reach Google's servers
4. **Logs**: Check backend console for error messages

### Speech Output Issues
1. **Device Audio**: Check device volume and audio settings
2. **Language Support**: Tamil TTS may vary by device
3. **Permissions**: Ensure audio output permissions

## 🎨 Customization

### Add More Languages
```javascript
// In GeminiVoiceChatbot.tsx
const [language, setLanguage] = useState<'tamil' | 'english' | 'hindi'>('tamil');

// Add Hindi support
const quickSuggestions = {
  tamil: ["என் செலவு சுருக்கத்தை காட்டு", ...],
  english: ["Show my expense summary", ...],
  hindi: ["मेरा खर्च सारांश दिखाएं", ...]
};
```

### Custom Business Analysis
```javascript
// In backend/routes/ai.js
function createGeminiPrompt(message, insights, appData, language) {
  const customPrompt = `You are a specialized business analyst for ${appData.businessType || 'retail'} businesses.
  
  Additional context:
  - Business type: ${appData.businessType}
  - Location: ${appData.location}
  - Industry trends: ${appData.industryTrends}
  
  ${basePrompt}`;
  
  return customPrompt;
}
```

### Voice Commands
```javascript
// Add custom voice commands
const voiceCommands = {
  "செலவு அறிக்கை": () => sendMessage("என் செலவு சுருக்கத்தை காட்டு"),
  "விற்பனை பகுப்பாய்வு": () => sendMessage("விற்பனை பகுப்பாய்வு செய்"),
  "பட்ஜெட் அமைக்கவும்": () => sendMessage("பட்ஜெட் அமைப்பு பரிந்துரைகள்")
};
```

## 🔒 Security & Privacy

### Data Protection
- All voice data is processed locally when possible
- API calls are encrypted and authenticated
- User data is not stored permanently
- Gemini API has built-in content filtering

### Best Practices
- Use environment variables for API keys
- Implement rate limiting for API calls
- Add user consent for voice recording
- Regular security audits

## 📈 Performance Optimization

### Caching
```javascript
// Cache frequent responses
const responseCache = new Map();

const getCachedResponse = (query) => {
  const cacheKey = `${query}_${language}`;
  return responseCache.get(cacheKey);
};
```

### Lazy Loading
```javascript
// Load voice components only when needed
const VoiceRecognition = lazy(() => import('./VoiceRecognition'));
```

## 🚀 Deployment

### Production Checklist
- [ ] Set up Gemini API key in production environment
- [ ] Configure proper CORS settings
- [ ] Set up monitoring and logging
- [ ] Test voice features on target devices
- [ ] Optimize bundle size for voice libraries
- [ ] Set up error tracking and analytics

### Monitoring
```javascript
// Add analytics for voice usage
const trackVoiceUsage = (action, language) => {
  analytics.track('voice_interaction', {
    action,
    language,
    timestamp: new Date()
  });
};
```

## 🎯 Next Steps

1. **Install Dependencies**: Run the npm install commands
2. **Configure API Key**: Add your Gemini API key to backend
3. **Test Voice Features**: Test on physical device
4. **Customize Prompts**: Adjust AI prompts for your business
5. **Add Analytics**: Track usage and performance
6. **User Training**: Create user guides for voice commands

The Gemini Voice Chatbot is now ready to provide intelligent, voice-powered business insights in Tamil and English! 🎉 