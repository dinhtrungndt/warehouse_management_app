import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default function MainScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Màn hình Chính (Home/Nghiệp vụ)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: colors.success,
    fontWeight: 'bold',
  },
});
