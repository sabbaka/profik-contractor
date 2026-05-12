import { colors } from '@/src/theme';
import React from 'react';
import { Text, View } from 'react-native';

export default function CatchAll() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
      <Text style={{ color: colors.textSecondary }}>Not Found</Text>
    </View>
  );
}
