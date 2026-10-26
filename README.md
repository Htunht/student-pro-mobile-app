# student-pro-mobile-app

A mobile application built with React Native & Expo to help class leaders (ECs) manage student records, fees, and digital receipts offline.

## Features

- 👥 **Student Management**: Add, update, view, and search student details.
- 📚 **Subject Management**: Track subject fees and enrolled students.
- 🎉 **Event Management**: Organize class events, budgets, and participant fee collections.
- 💰 **Payment & Digital Receipts**: Record payments with auto-generated receipt IDs, preview receipts, and export/share receipt images.
- 💾 **Offline SQLite Storage**: Full offline functionality using `expo-sqlite`.
- 🎨 **Modern UI**: Styled with `react-native-paper` and Myanmar font support (`Noto Sans Myanmar`).

## Tech Stack

- **Framework**: [Expo](https://expo.dev) (React Native 0.88, React 19)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction)
- **Database**: `expo-sqlite`
- **UI Components**: `react-native-paper`, `@expo/vector-icons`
- **Receipt Capture & Sharing**: `react-native-view-shot`, `expo-sharing`, `expo-media-library`

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on device or emulator:
   - Press `a` for Android emulator or scan QR code with Expo Go.
   - Press `w` for Web.
