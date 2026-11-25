import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Asterisk, Phone } from 'lucide-react-native';
import { Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, Text, scaled } from '@school-erp/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileTopBar } from '@/features/profile/components/ProfileTopBar';
import { QUICK_DIAL, type QuickDialContact } from '@/mock/safety';
import { fonts } from '@/theme/fonts';
import { safetyImages } from '@/theme/images';

const RED = '#E11D48';
const RED_SOFT = '#FDECEF';

/** Safety, built to the approved design: a Quick Dial list that opens the phone dialler. */
export function SafetyScreen() {
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <ProfileTopBar title="Safety" onBack={back} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.heading}>
          Quick Dial
        </Text>
        {QUICK_DIAL.map((c) => (
          <ContactRow key={c.id} contact={c} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({ contact }: { contact: QuickDialContact }) {
  const call = () => void Linking.openURL(`tel:${contact.dial}`).catch(() => undefined);
  return (
    <View style={styles.card} testID={`quick-dial-${contact.id}`}>
      {contact.emergency ? (
        <View style={styles.emergency}>
          <Asterisk size={scaled(34)} color="#FFFFFF" strokeWidth={3} />
        </View>
      ) : (
        <Image
          source={safetyImages[contact.avatar ?? 'man']}
          style={styles.avatar}
          accessibilityIgnoresInvertColors
        />
      )}
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {contact.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {contact.subtitle}
        </Text>
      </View>
      <Pressable
        testID={`call-${contact.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Call ${contact.title}`}
        onPress={call}
        style={({ pressed }) => [styles.call, pressed && { opacity: 0.7 }]}
      >
        <Phone size={scaled(20)} color={RED} fill={RED} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18, paddingTop: 28, paddingBottom: 40 },
  heading: { color: '#111827', fontSize: 20, fontFamily: fonts.bold, marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F3',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  emergency: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  text: { flex: 1, marginLeft: 12, marginRight: 8 },
  title: { color: '#111827', fontSize: 15, fontFamily: fonts.bold },
  subtitle: { color: '#8B8B94', fontSize: 13, fontFamily: fonts.medium, marginTop: 3 },
  call: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: RED_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
