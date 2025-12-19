import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContractorProfileHeaderButton from '../profile/ContractorProfileHeaderButton';
import { useTheme } from 'tamagui';

export default function ContractorHeader() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          backgroundColor: theme?.background?.val ?? '#ffffff',
          borderBottomColor: theme?.gray4?.val ?? '#eeeeee',
        },
      ]}
    >
      <ContractorProfileHeaderButton />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 'auto',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 25,
    paddingBottom: 5,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '500',
    fontSize: 18,
  },
});
