import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, StyleSheet, Keyboard, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAwarePopupProps {
  children: React.ReactNode;
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
  extraScrollHeight?: number;
}

export default function KeyboardAwarePopup({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  extraScrollHeight = 20
}: KeyboardAwarePopupProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const screenHeight = Dimensions.get('window').height;
  const availableHeight = screenHeight - keyboardHeight - insets.top - insets.bottom;

  return (
    <View style={[
      styles.container,
      isKeyboardVisible && {
        height: availableHeight,
        maxHeight: availableHeight,
      }
    ]}>
      <KeyboardAvoidingView
        style={[
          styles.keyboardAvoidingView,
          style,
          isKeyboardVisible && {
            height: availableHeight - 40,
            maxHeight: availableHeight - 40,
          }
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={[
            styles.scrollView,
            isKeyboardVisible && {
              maxHeight: availableHeight - 80, // More aggressive padding
            }
          ]}
          contentContainerStyle={[
            styles.contentContainer,
            { 
              paddingBottom: insets.bottom + extraScrollHeight,
              minHeight: isKeyboardVisible ? 'auto' : '100%'
            },
            contentContainerStyle
          ]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          automaticallyAdjustContentInsets={false}
          bounces={false}
          alwaysBounceVertical={false}
          nestedScrollEnabled={true}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
}); 