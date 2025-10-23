import React from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../src/store/authSlice';

function HeaderActions() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const go = (href: string) => () => {
    if (pathname !== href) router.push(href as any);
  };
  const onLogout = () => {
    // @ts-ignore
    dispatch(logout());
    router.replace('/');
  };
  return (
    <View style={styles.row}>
      <Pressable onPress={go('/(contractor)/open')} style={[styles.btn, pathname === '/(contractor)/open' && styles.activeBtn]}>
        <Text style={[styles.txt, pathname === '/(contractor)/open' && styles.activeTxt]}>List</Text>
      </Pressable>
      <Pressable onPress={go('/(contractor)/open/map')} style={[styles.btn, pathname === '/(contractor)/open/map' && styles.activeBtn]}>
        <Text style={[styles.txt, pathname === '/(contractor)/open/map' && styles.activeTxt]}>Map</Text>
      </Pressable>
      <Pressable onPress={go('/(contractor)/balance')} style={[styles.btn, pathname === '/(contractor)/balance' && styles.activeBtn]}>
        <Text style={[styles.txt, pathname === '/(contractor)/balance' && styles.activeTxt]}>Balance</Text>
      </Pressable>
      <Pressable onPress={onLogout} style={[styles.btn, styles.logoutBtn]}>
        <Text style={[styles.txt, styles.logoutTxt]}>Logout</Text>
      </Pressable>
    </View>
  );
}

export default function ContractorLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="open/index"
        options={{ title: 'Contractor', headerRight: () => <HeaderActions /> }}
      />
      <Stack.Screen
        name="open/map"
        options={{ title: 'Open Jobs Map', headerRight: () => <HeaderActions /> }}
      />
      <Stack.Screen
        name="jobs/[id]"
        options={{ title: 'Job Details', headerRight: () => <HeaderActions /> }}
      />
      <Stack.Screen
        name="balance"
        options={{ title: 'Balance', headerRight: () => <HeaderActions /> }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  txt: { color: '#2563eb', fontWeight: '600' },
  activeBtn: { borderBottomColor: '#2563eb' },
  activeTxt: { color: '#1e40af' },
  logoutBtn: { marginLeft: 8, borderBottomWidth: 0 },
  logoutTxt: { color: '#dc2626' },
});
