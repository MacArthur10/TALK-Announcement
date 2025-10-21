import { Stack } from  'expo-router';
import { ToastProvider } from 'react-native-toast-notifications';
import AuthProvider from '../providers/auth-provider';

export default function RootLayout() {
    return (
    <AuthProvider>
      <ToastProvider>
        <Stack>
      <Stack.Screen
      name= '(shop)'
      options={{ headerShown: false, title:'shop'}}
      />
       <Stack.Screen
      name= 'categories'
      options={{ headerShown: true, title:'categories'}}
      />
       <Stack.Screen
      name= 'product'
      options={{ headerShown: false, title:'product'}}
      /> 
       <Stack.Screen
      name= 'cart'
      options={{ presentation: 'modal', title:'shopping cart'}}
      />
       <Stack.Screen  name= 'auth'  options={{ headerShown: true}} />
      </Stack>
 
    </ToastProvider>  
    </AuthProvider>
    );
}