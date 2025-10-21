import 'react-native-gesture-handler';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import React from 'react';
import RootNavigation from './src/navigation';
import { StatusBar } from 'expo-status-bar';
import NetworkDebug from './src/components/NetworkDebug';

// Configure dayjs
dayjs.extend(relativeTime);
dayjs.locale('fr');

export default function App() {
  // Show network debug only in development
  const showNetworkDebug = process.env.NODE_ENV !== 'production';

  return (
    <>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <RootNavigation />
      {showNetworkDebug && <NetworkDebug />}
    </>
  );
}
