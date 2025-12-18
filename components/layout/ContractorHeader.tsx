import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContractorProfileHeaderButton from '../profile/ContractorProfileHeaderButton';

export default function ContractorHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
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
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 25,
    paddingBottom: 5,
    borderBottomColor: '#eee',
  },
  title: {
    fontWeight: '500',
    fontSize: 18,
  },
});
