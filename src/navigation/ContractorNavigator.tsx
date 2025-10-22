import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import OpenJobsScreen from '../screens/Contractor/OpenJobsScreen';
import OpenJobsMapScreen from '../screens/Contractor/OpenJobsMapScreen';
import BalanceScreen from '../screens/Contractor/BalanceScreen';
import { Button } from 'react-native-paper';
import JobDetailsScreen from '../screens/Contractor/JobDetailsScreen';

export type ContractorStackParamList = {
  Home: undefined;
  OpenJobs: undefined;
  OpenJobsMap: undefined;
  JobDetails: { id: string };
  Balance: undefined;
};

const Stack = createNativeStackNavigator<ContractorStackParamList>();

export default function ContractorNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Contractor',
          headerRight: () => (
            <>
              <Button onPress={() => navigation.navigate('OpenJobs')}>Open Jobs</Button>
              <Button onPress={() => navigation.navigate('OpenJobsMap')}>Map</Button>
            </>
          ),
        })}
      />
      <Stack.Screen name="OpenJobs" component={OpenJobsScreen} options={{ title: 'Open Jobs' }} />
      <Stack.Screen name="OpenJobsMap" component={OpenJobsMapScreen} options={{ title: 'Open Jobs Map' }} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="Balance" component={BalanceScreen} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}
