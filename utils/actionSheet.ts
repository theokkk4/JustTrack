import * as Haptics from 'expo-haptics';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

/**
 * Pickers and menus. iOS gets its native action sheet; everywhere else the
 * ActionSheetHost (mounted at the root) draws a bottom sheet from `sheetStore`.
 */

export interface SheetOption {
  label: string;
  destructive?: boolean;
  selected?: boolean;
  onPress: () => void;
}

export interface SheetState {
  title?: string;
  message?: string;
  options: SheetOption[];
}

let current: SheetState | null = null;
const listeners = new Set<() => void>();

function present(sheet: SheetState | null) {
  current = sheet;
  listeners.forEach((listener) => listener());
}

export const sheetStore = {
  getSnapshot: () => current,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function dismissSheet(): void {
  present(null);
}

interface OptionSheetConfig<T extends string> {
  title: string;
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

/** Pick one value from a short list. */
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

  present({ title, options: options.map((option) => ({ label: option.label, selected: option.value === selected, onPress: () => choose(option.value) })) });
}

export interface MenuAction {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

/** A menu of commands (e.g. a long-press menu). */
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
  present({ title, options: actions.map((action) => ({ label: action.label, destructive: action.destructive, onPress: action.onPress })) });
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
