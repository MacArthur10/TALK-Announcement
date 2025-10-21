import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from '../screens/LoginScreen';
import FeedScreen from '../screens/FeedScreen';
import DetailScreen from '../screens/DetailScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';
import { View } from 'react-native';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const MyTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    text: colors.text,
    card: colors.card,
    border: colors.border,
  },
};

function TabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }: any) => ({
        headerTitle: 'CAD3 Intranet',
        headerTitleAlign: 'center',
        headerLeft: () => (
          <View style={{ marginLeft: 12 }}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          </View>
        ),
        tabBarIcon: ({ color, size }: any) => {
          let icon: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Feed') icon = 'newspaper-outline';
          if (route.name === 'Categories') icon = 'grid-outline';
          if (route.name === 'Profile') icon = 'person-circle-outline';
          return <Ionicons name={icon} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
      })}
    >
      <Tabs.Screen name="Feed" component={FeedScreen} />
      <Tabs.Screen name="Categories" component={CategoriesScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigation() {
  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Announcement' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
