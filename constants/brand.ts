export const APP_NAME = 'JustTrack';
export const TAGLINE = 'Track food. Track progress. Just Track.';
export const REPOSITORY_URL = 'https://github.com/theokkk4/JustTrack';

/** Where it's from, and the promise that makes it different. */
export const HOMETOWN = 'Philadelphia';
export const HOMETOWN_LINE = 'Made in Philly for college students. Free and open source, for everyone.';
export const PROMISES = ['Free and open source', 'No account, no ads', 'Your data stays on your phone'] as const;
export const PRIVACY_LINE = 'Your log, goals, and name live on this device. Nothing is uploaded.';

/**
 * The JT monogram, traced from the brand artwork onto a 713×500 grid.
 * assets/brand/jt-mark.svg is generated from these same paths.
 */
export const LOGO_VIEWBOX = { width: 713, height: 500 } as const;
export const LOGO_PATHS = {
  j: 'M303 0L303 374C303 443 241 500 165 500C97 500 22 437 0 355L104 355C112 387 137 414 160 414C181 414 198 393 198 367L198 83Z',
  t: 'M327 0L713 0L628 101L501 101L501 500L403 500L403 101L327 101Z',
} as const;
