import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import apiClient from '../../lib/axios-config';

interface Message {
  id: string;
  text: string;
  tamilText: string;
  suggestions: string;
  isUser: boolean;
  timestamp: Date;
  type: 'text' | 'voice' | 'suggestion';
}

interface GeminiVoiceChatbotProps {
  token: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function GeminiVoiceChatbot({ token, isVisible, onClose }: GeminiVoiceChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [language, setLanguage] = useState<'tamil' | 'english'>('tamil');
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (isVisible && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        text: "Hello! I'm your Gemini-powered AI business assistant. I can analyze your business data and provide insights in Tamil and English. Tap the microphone to speak or type your questions!",
        tamilText: "வணக்கம்! நான் உங்கள் Gemini-ஆல் இயக்கப்படும் AI வணிக உதவியாளர். நான் உங்கள் வணிக தரவுகளை பகுப்பாய்வு செய்து தமிழ் மற்றும் ஆங்கிலத்தில் நுண்ணறிவுகளை வழங்க முடியும். பேச மைக்ரோஃபோனைத் தட்டவும் அல்லது உங்கள் கேள்விகளை தட்டச்சு செய்யவும்!",
        suggestions: "வணிக பகுப்பாய்வு, செலவு சுருக்கம், விற்பனை போக்குகள்",
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, [isVisible]);

  // Fetch app data for AI analysis
  const fetchAppData = async () => {
    try {
      const [expensesRes, salesRes, categoriesRes] = await Promise.all([
        apiClient.get('/api/expenses', {
          timeout: 15000
        }),
        apiClient.get('/api/sales', {
          timeout: 15000
        }),
        apiClient.get('/api/categories', {
          timeout: 15000
        })
      ]);

      setAppData({
        expenses: expensesRes.data,
        sales: salesRes.data.sales || salesRes.data,
        categories: categoriesRes.data
      });
    } catch (error) {
      console.error('Error fetching app data:', error);
      // Set empty data to prevent errors
      setAppData({
        expenses: [],
        sales: [],
        categories: []
      });
    }
  };

  // Send message to Gemini AI
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      tamilText: text.trim(),
      suggestions: '',
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Fetch latest app data
      await fetchAppData();

      // Send to Gemini AI backend
      const response = await apiClient.post('/api/ai/chat', {
        message: text.trim(),
        appData: appData,
        context: messages.slice(-5), // Last 5 messages for context
        language: language
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        tamilText: response.data.tamilResponse,
        suggestions: response.data.suggestions,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-speak the response in Tamil
      if (response.data.tamilResponse) {
        speakText(response.data.tamilResponse, 'ta-IN');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error.response?.data?.details 
          ? `AI Error: ${error.response.data.error}\n\n${error.response.data.details}`
          : "I'm sorry, I'm having trouble processing your request right now. Please check your Gemini API key and try again.",
        tamilText: error.response?.data?.details 
          ? `AI பிழை: ${error.response.data.error}\n\n${error.response.data.details}`
          : "மன்னிக்கவும், உங்கள் கோரிக்கையை செயலாக்குவதில் சிக்கல் உள்ளது. உங்கள் Gemini API key ஐ சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
        suggestions: "API key ஐ சரிபார்க்கவும் மற்றும் மீண்டும் முயற்சிக்கவும்.",
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recognition
  const startListening = async () => {
    try {
      setIsListening(true);
      Alert.alert(
        'Voice Recognition Setup',
        'Voice recognition requires additional setup:\n\n1. Install: npm install @react-native-voice/voice\n2. Configure microphone permissions\n3. Use physical device (not simulator)\n\nFor now, you can type your questions.',
        [
          { text: 'Cancel', onPress: () => setIsListening(false) },
          { text: 'Try Sample', onPress: () => {
            setIsListening(false);
            setInputText(language === 'tamil' ? 'என் செலவு சுருக்கத்தை காட்டு' : 'Show me my expense summary');
          }}
        ]
      );
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  // Text-to-speech
  const speakText = async (text: string, languageCode: string = 'ta-IN') => {
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
    }
  };

  // Quick suggestions in Tamil
  const quickSuggestions = [
    "என் செலவு சுருக்கத்தை காட்டு",
    "மேல் செலவு வகைகள் என்ன?",
    "இந்த மாத செலவுகளை கடந்த மாதத்துடன் ஒப்பிடு",
    "வணிக நுண்ணறிவுகளை கொடு",
    "என் செலவுகளை எப்படி குறைக்க முடியும்?",
    "விற்பனை போக்குகளை காட்டு"
  ];

  const addSuggestion = (suggestion: string) => {
    setInputText(suggestion);
  };

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'tamil' ? 'english' : 'tamil');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.aiIndicator}>
              <View style={styles.aiDot} />
              <Text style={styles.headerTitle}>Gemini AI Assistant</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
                <Text style={styles.languageText}>{language === 'tamil' ? 'தமிழ்' : 'EN'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage
              ]}
            >
              <View style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble
              ]}>
                {!message.isUser && (
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageLanguage}>
                      {language === 'tamil' ? 'தமிழ்' : 'English'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => speakText(
                        language === 'tamil' ? message.tamilText : message.text,
                        language === 'tamil' ? 'ta-IN' : 'en-US'
                      )}
                      style={styles.speakButton}
                    >
                      <FontAwesome5 name="volume-up" size={14} color="#2563eb" />
                    </TouchableOpacity>
                  </View>
                )}
                
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userText : styles.aiText
                ]}>
                  {message.isUser ? message.text : 
                    (language === 'tamil' ? message.tamilText : message.text)
                  }
                </Text>

                {!message.isUser && message.suggestions && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>💡 பரிந்துரைகள்:</Text>
                    <Text style={styles.suggestionsText}>{message.suggestions}</Text>
                  </View>
                )}

                <Text style={styles.timestamp}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}
          
          {isLoading && (
            <View style={styles.messageContainer}>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text style={styles.typingText}>
                    {language === 'tamil' ? 'Gemini AI சிந்திக்கிறது...' : 'Gemini AI is thinking...'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestions */}
        {messages.length <= 2 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>
              {language === 'tamil' ? 'விரைவு கேள்விகள்:' : 'Quick Questions:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => addSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={language === 'tamil' ? "உங்கள் வணிக கேள்விகளை கேள்வி..." : "Ask about your business data..."}
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
            />
            <View style={styles.inputButtons}>
              <TouchableOpacity
                style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                onPress={isListening ? stopListening : startListening}
              >
                <FontAwesome5 
                  name={isListening ? "microphone-slash" : "microphone"} 
                  size={16} 
                  color={isListening ? "#ef4444" : "#2563eb"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
              >
                <MaterialIcons 
                  name="send" 
                  size={20} 
                  color={inputText.trim() ? "#fff" : "#9ca3af"} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.speakingText}>
                {language === 'tamil' ? 'பேசுகிறது...' : 'Speaking...'}
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageLanguage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  speakButton: {
    padding: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#1e293b',
  },
  suggestionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  suggestionsText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    color: '#64748b',
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  inputButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#fef2f2',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f1f5f9',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  speakingText: {
    marginLeft: 8,
    color: '#64748b',
    fontSize: 14,
  },
}); 