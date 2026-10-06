import * as Haptics from 'expo-haptics';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

interface OptionSheetConfig<T extends string> {
  title: string;
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

/** Native iOS action sheet for picking one value; plain Alert elsewhere. */
export function showOptionSheet<T extends string>({ title, options, selected, onSelect }: OptionSheetConfig<T>) {
  const currentLabel = options.find((option) => option.value === selected)?.label;
  const choose = (value: T) => {
    Haptics.selectionAsync();
    onSelect(value);
  };

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message: currentLabel ? `Currently: ${currentLabel}` : undefined,
        options: [...options.map((option) => option.label), 'Cancel'],
        cancelButtonIndex: options.length,
      },
      (index) => {
        const option = options[index];
        if (option) choose(option.value);
      }
    );
    return;
  }

  Alert.alert(title, currentLabel ? `Currently: ${currentLabel}` : undefined, [
    ...options.map((option) => ({ text: option.label, onPress: () => choose(option.value) })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

export interface MenuAction {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

/** A native iOS action sheet of commands (e.g. a long-press menu). Elsewhere, an Alert. */
export function showActionMenu({ title, actions }: { title?: string; actions: readonly MenuAction[] }) {
  if (Platform.OS === 'ios') {
    const destructiveIndex = actions.findIndex((action) => action.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...actions.map((action) => action.label), 'Cancel'],
        cancelButtonIndex: actions.length,
        destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
      },
      (index) => actions[index]?.onPress()
    );
    return;
  }
  Alert.alert(title ?? '', undefined, [
    ...actions.map((action) => ({ text: action.label, style: action.destructive ? ('destructive' as const) : undefined, onPress: action.onPress })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

/**
 * Asks before doing something that can't be undone. Resolves true to go ahead.
 * React Native Web's Alert does nothing, so the browser's confirm() stands in there.
 */
export function confirmAsync({ title, message, confirmLabel }: { title: string; message?: string; confirmLabel: string }): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(message ? `${title}\n\n${message}` : title) ?? false);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
