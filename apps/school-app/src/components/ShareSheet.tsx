import React from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, Mail, MessageCircle, MessageSquareMore, Phone, X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** The text to send. Never logged. */
  message: string;
  /** Subject line for the Email option. */
  subject?: string;
  /** Called with a short result line ("Copied to the clipboard.") or null. */
  onResult?: (text: string | null) => void;
  /** Called only after an option worked (the app opened, or the text was copied). */
  onShared?: () => void;
}

const WHATSAPP_BG = '#DDF8E6';
const WHATSAPP = '#1B8A4B';

/**
 * Bottom sheet "Share Result": send a text through WhatsApp, SMS, Email, or copy it. Each option
 * opens the matching app with the text filled in; nothing is sent by this app itself.
 */
export function ShareSheet({ visible, onClose, message, subject = '', onResult, onShared }: Props) {
  const text = encodeURIComponent(message);

  const open = async (url: string, failure: string) => {
    onClose();
    try {
      await Linking.openURL(url);
      onResult?.(null);
      onShared?.();
    } catch {
      onResult?.(failure);
    }
  };

  const options: {
    key: string;
    label: string;
    bg: string;
    icon: React.ReactNode;
    run: () => void;
  }[] = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      bg: WHATSAPP_BG,
      icon: (
        <View style={styles.whatsapp}>
          <MessageCircle size={26} color={WHATSAPP} fill={WHATSAPP} strokeWidth={1.5} />
          <View style={styles.whatsappPhone}>
            <Phone size={12} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.5} />
          </View>
        </View>
      ),
      run: () => void open(`https://wa.me/?text=${text}`, 'Could not open WhatsApp.'),
    },
    {
      key: 'sms',
      label: 'SMS',
      bg: '#E0F0FD',
      icon: <MessageSquareMore size={24} color="#0B5C8A" strokeWidth={1.8} />,
      run: () =>
        void open(
          Platform.OS === 'ios' ? `sms:&body=${text}` : `sms:?body=${text}`,
          'Could not open messages.',
        ),
    },
    {
      key: 'email',
      label: 'Email',
      bg: '#FFF1C9',
      icon: <Mail size={24} color="#A5460B" strokeWidth={1.8} />,
      run: () =>
        void open(
          `mailto:?subject=${encodeURIComponent(subject)}&body=${text}`,
          'Could not open email.',
        ),
    },
    {
      key: 'copy',
      label: 'Copy Link',
      bg: '#E7DBFB',
      icon: <Copy size={24} color="#4B18AA" strokeWidth={1.8} />,
      run: () => {
        onClose();
        Clipboard.setStringAsync(message).then(
          () => {
            onResult?.('Copied to the clipboard.');
            onShared?.();
          },
          () => onResult?.('Could not copy.'),
        );
      },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} accessibilityViewIsModal onPress={() => undefined}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text accessibilityRole="header" style={styles.title}>
              Share Result
            </Text>
            <Pressable
              testID="share-close"
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={onClose}
              style={styles.close}
            >
              <X size={20} color="#1A1A2E" strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.options}>
            {options.map((o) => (
              <Pressable
                key={o.key}
                testID={`share-${o.key}`}
                accessibilityRole="button"
                accessibilityLabel={o.label}
                onPress={o.run}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <View style={[styles.iconCircle, { backgroundColor: o.bg }]}>{o.icon}</View>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.optionLabel}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            testID="share-cancel"
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            style={styles.cancel}
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#E3E2F2',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 39,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD6EA',
  },
  titleRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#1A1A2E', fontSize: 22, lineHeight: 28, fontWeight: '600' },
  close: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#F2EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: { marginTop: 20, flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3DEF0',
    backgroundColor: '#F4F1FA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  optionPressed: { backgroundColor: '#EBE6F7' },
  iconCircle: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    color: '#222233',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  whatsapp: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  whatsappPhone: { position: 'absolute' },
  cancel: {
    marginTop: 16,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1E9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: { color: '#222233', fontSize: 16, fontWeight: '600' },
});
