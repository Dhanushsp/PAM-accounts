# Android Build Fix Guide

## Issue
The Android build is failing due to conflicts between old `com.android.support` libraries and new `androidx` libraries.

## Root Cause
The `@react-native-voice/voice` library (version 3.2.4) contains old support library dependencies that conflict with AndroidX.

## Solution Steps

### 1. Add Configuration to build.gradle
Add this to `frontend/android/app/build.gradle` at the end:

```gradle
configurations.all {
    resolutionStrategy {
        force 'androidx.core:core:1.13.1'
        force 'androidx.appcompat:appcompat:1.6.1'
        exclude group: 'com.android.support'
    }
}
```

### 2. Update Voice Library
```bash
cd frontend
npm uninstall @react-native-voice/voice
npm install @react-native-voice/voice@latest
```

### 3. Clean and Rebuild
```bash
cd frontend/android
./gradlew clean
cd ..
npx expo run:android --clear
```

### 4. If Issues Persist - Alternative Voice Solution
If the voice library continues to cause issues, you can:

1. **Temporarily disable voice features** by commenting out voice-related code
2. **Use Expo Speech instead** (already installed)
3. **Use a different voice library** like `react-native-tts`

### 5. Manual Fix for Voice Library
If you need to keep the voice library, add these exclusions:

```gradle
dependencies {
    implementation('@react-native-voice/voice') {
        exclude group: 'com.android.support'
        exclude module: 'support-v4'
        exclude module: 'support-annotations'
    }
}
```

## Expected Result
After applying these fixes, the Android build should complete successfully without manifest merger conflicts.

## Verification
1. Run `npx expo run:android`
2. Check that the build completes without errors
3. Verify that the app launches correctly
4. Test the Gemini AI Assistant functionality 