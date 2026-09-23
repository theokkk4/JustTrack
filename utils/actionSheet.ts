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
