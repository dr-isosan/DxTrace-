import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from './src/theme/tokens';
import DashboardScreen from './src/screens/DashboardScreen';
import ToolsScreen from './src/screens/ToolsScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }) {
  const icons = { 'Dashboard': '🏥', 'Araçlar': '🔧' };
  return (
    <View style={styles.tabIconWrap}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{icons[label]}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function App() {
  return (
    <>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={colors.surface1} />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.surface1,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 64,
              paddingBottom: 8,
            },
            tabBarShowLabel: false,
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} /> }}
          />
          <Tab.Screen
            name="Araçlar"
            component={ToolsScreen}
            options={{ tabBarIcon: ({ focused }) => <TabIcon label="Araçlar" focused={focused} /> }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: { alignItems: 'center', gap: 2, paddingTop: 4 },
  tabEmoji: { fontSize: 20, opacity: 0.5 },
  tabEmojiActive: { opacity: 1 },
  tabLabel: { fontSize: 10.5, color: colors.textMuted },
  tabLabelActive: { color: colors.info, fontWeight: '700' },
});
