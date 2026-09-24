import type { SFSymbol } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface IconSpec {
  sf: SFSymbol;
  ionicon: IoniconName;
}

/**
 * Every icon the app uses, keyed by semantic name. iOS renders the real SF
 * Symbol; other platforms fall back to Ionicons so the app doesn't break,
 * even though iOS is the only platform this project targets for release.
 */
export const AppIcons = {
  home: { sf: 'house', ionicon: 'home-outline' },
  homeFilled: { sf: 'house.fill', ionicon: 'home' },
  diary: { sf: 'book.closed', ionicon: 'book-outline' },
  diaryFilled: { sf: 'book.closed.fill', ionicon: 'book' },
  scan: { sf: 'viewfinder', ionicon: 'scan-outline' },
  progress: { sf: 'chart.line.uptrend.xyaxis', ionicon: 'stats-chart-outline' },
  progressFilled: { sf: 'chart.line.uptrend.xyaxis', ionicon: 'stats-chart' },
  profile: { sf: 'person', ionicon: 'person-outline' },
  profileFilled: { sf: 'person.fill', ionicon: 'person' },

  flame: { sf: 'flame.fill', ionicon: 'flame' },
  plus: { sf: 'plus', ionicon: 'add' },
  minus: { sf: 'minus', ionicon: 'remove' },
  plusCircle: { sf: 'plus.circle.fill', ionicon: 'add-circle' },
  chevronRight: { sf: 'chevron.right', ionicon: 'chevron-forward' },
  chevronLeft: { sf: 'chevron.left', ionicon: 'chevron-back' },
  chevronDown: { sf: 'chevron.down', ionicon: 'chevron-down' },
  close: { sf: 'xmark', ionicon: 'close' },
  closeCircle: { sf: 'xmark.circle.fill', ionicon: 'close-circle' },
  check: { sf: 'checkmark', ionicon: 'checkmark' },
  checkCircle: { sf: 'checkmark.circle.fill', ionicon: 'checkmark-circle' },
  pencil: { sf: 'pencil', ionicon: 'pencil-outline' },
  trash: { sf: 'trash', ionicon: 'trash-outline' },
  duplicate: { sf: 'square.on.square', ionicon: 'copy-outline' },
  ellipsis: { sf: 'ellipsis', ionicon: 'ellipsis-horizontal' },
  search: { sf: 'magnifyingglass', ionicon: 'search-outline' },
  barcode: { sf: 'barcode.viewfinder', ionicon: 'barcode-outline' },
  photo: { sf: 'photo.on.rectangle', ionicon: 'images-outline' },
  camera: { sf: 'camera.fill', ionicon: 'camera' },
  bolt: { sf: 'bolt.fill', ionicon: 'flash' },
  boltSlash: { sf: 'bolt.slash.fill', ionicon: 'flash-off' },

  breakfast: { sf: 'sunrise.fill', ionicon: 'partly-sunny-outline' },
  lunch: { sf: 'sun.max.fill', ionicon: 'sunny-outline' },
  dinner: { sf: 'moon.stars.fill', ionicon: 'moon-outline' },
  snacks: { sf: 'leaf.fill', ionicon: 'leaf-outline' },

  settings: { sf: 'gearshape.fill', ionicon: 'settings-outline' },
  target: { sf: 'target', ionicon: 'locate-outline' },
  ruler: { sf: 'ruler.fill', ionicon: 'resize-outline' },
  appearance: { sf: 'paintbrush.fill', ionicon: 'color-palette-outline' },
  notifications: { sf: 'bell.fill', ionicon: 'notifications-outline' },
  privacy: { sf: 'lock.fill', ionicon: 'lock-closed-outline' },
  export: { sf: 'square.and.arrow.up', ionicon: 'share-outline' },
  deleteAccount: { sf: 'person.crop.circle.badge.xmark', ionicon: 'person-remove-outline' },
  openSource: { sf: 'chevron.left.forwardslash.chevron.right', ionicon: 'code-slash-outline' },
  info: { sf: 'info.circle.fill', ionicon: 'information-circle-outline' },
  mail: { sf: 'envelope.fill', ionicon: 'mail-outline' },
  signOut: { sf: 'rectangle.portrait.and.arrow.right', ionicon: 'log-out-outline' },
  wifiOff: { sf: 'wifi.slash', ionicon: 'cloud-offline-outline' },
  scale: { sf: 'scalemass.fill', ionicon: 'speedometer-outline' },
  seal: { sf: 'checkmark.seal.fill', ionicon: 'shield-checkmark' },
} as const satisfies Record<string, IconSpec>;

export type AppIconName = keyof typeof AppIcons;
