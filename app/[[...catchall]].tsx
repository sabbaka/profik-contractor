import React from 'react';
import { Text, View } from 'react-native';

export default function CatchAll() {
  // Render the same entry (React Navigation stack) for any unmatched route so web refresh works
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Not Found</Text>
    </View>
  );
}
