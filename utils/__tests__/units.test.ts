import { cmToFeetInches, feetInchesToCm, formatHeight, formatWeight, kgToLb, lbToKg } from '../units';

describe('weight conversion', () => {
  it('round-trips lb ↔ kg', () => {
    expect(lbToKg(kgToLb(70))).toBeCloseTo(70, 10);
  });

  it('uses the exact international pound', () => {
    expect(lbToKg(1)).toBe(0.45359237);
  });
});

describe('height conversion', () => {
  it("converts 5'10\" to cm", () => {
    expect(feetInchesToCm(5, 10)).toBeCloseTo(177.8, 5);
  });

  it('carries 12 inches up to the next foot instead of showing 5′12″', () => {
    // 182.6cm is 71.9in, which rounds to 72in = exactly 6'0".
    expect(cmToFeetInches(182.6)).toEqual({ feet: 6, inches: 0 });
  });
});

describe('formatting', () => {
  it('formats weight in the chosen unit', () => {
    expect(formatWeight(70, 'kg')).toBe('70.0 kg');
    expect(formatWeight(70, 'lb')).toBe('154.3 lb');
  });

  it('formats height in the chosen unit', () => {
    expect(formatHeight(177.8, 'cm')).toBe('178 cm');
    expect(formatHeight(177.8, 'ft_in')).toBe('5′ 10″');
  });
});
