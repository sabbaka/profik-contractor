import { router } from 'expo-router';
import ContractorProfileButton from './ContractorProfileButton';

export default function ContractorProfileHeaderButton() {
  return (
    <ContractorProfileButton
      onPress={() => router.replace('/(contractor)/(tabs)/profile' as any)}
    />
  );
}
