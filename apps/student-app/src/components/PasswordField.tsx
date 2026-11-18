import { Feather } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, iconSize, touch } from '@/theme';
import type { TextFieldProps, TextInputRef } from './TextField';
import { TextField } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'secureTextEntry' | 'trailing'>;

/** TextField with a lock icon and a show/hide toggle. */
export const PasswordField = forwardRef<TextInputRef, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <TextField
        ref={ref}
        icon="lock"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        {...props}
        secureTextEntry={!visible}
        trailing={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((v) => !v)}
            style={styles.toggle}
            hitSlop={8}
          >
            <Feather
              name={visible ? 'eye' : 'eye-off'}
              size={iconSize.md}
              color={colors.textMuted}
            />
          </Pressable>
        }
      />
    );
  },
);

const styles = StyleSheet.create({
  toggle: {
    minWidth: touch.minTarget,
    minHeight: touch.minTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
