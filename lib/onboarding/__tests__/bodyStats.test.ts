import { convertHeightInputs, convertWeightInput, heightInputsFor, parseBodyStats, weightInputFor } from '../bodyStats';

const imperial = { weightUnit: 'lb' as const, heightUnit: 'ft_in' as const };
const metric = { weightUnit: 'kg' as const, heightUnit: 'cm' as const };
const blank = { age: '', feet: '', inches: '', cm: '', weight: '' };

describe('parseBodyStats', () => {
  it('converts imperial input to metric', () => {
    const result = parseBodyStats({ ...blank, age: '20', feet: '5', inches: '10', weight: '165' }, imperial);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ageYears).toBe(20);
    expect(result.value.heightCm).toBeCloseTo(177.8, 5);
    expect(result.value.weightKg).toBeCloseTo(74.84, 2);
  });

  it('accepts metric input as-is', () => {
    const result = parseBodyStats({ ...blank, age: '19', cm: '165', weight: '60' }, metric);
    expect(result).toEqual({ ok: true, value: { ageYears: 19, heightCm: 165, weightKg: 60 } });
  });

  it('treats blank inches as zero', () => {
    const result = parseBodyStats({ ...blank, age: '20', feet: '6', weight: '180' }, imperial);
    expect(result.ok && result.value.heightCm).toBeCloseTo(182.88, 2);
  });

  it('accepts a comma as the decimal separator', () => {
    const result = parseBodyStats({ ...blank, age: '25', cm: '170', weight: '65,5' }, metric);
    expect(result.ok && result.value.weightKg).toBe(65.5);
  });

  it('reports every invalid field at once', () => {
    const result = parseBodyStats({ ...blank, age: '9', feet: '12', weight: '20' }, imperial);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(['age', 'height', 'weight']);
  });

  it('rejects non-integer ages and out-of-range inches', () => {
    const result = parseBodyStats({ ...blank, age: '20.5', feet: '5', inches: '12', weight: '150' }, imperial);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.age).toBeDefined();
    expect(result.errors.height).toBeDefined();
  });
});

describe('prefill helpers', () => {
  it('formats stored kg in the chosen unit', () => {
    expect(weightInputFor(70, 'kg')).toBe('70');
    expect(weightInputFor(70, 'lb')).toBe('154.3');
  });

  it('splits stored cm into feet/inches and cm', () => {
    expect(heightInputsFor(177.8)).toEqual({ feet: '5', inches: '10', cm: '178' });
  });
});

describe('unit switching', () => {
  it('converts typed height between ft/in and cm', () => {
    expect(convertHeightInputs({ feet: '5', inches: '10', cm: '' }, 'cm').cm).toBe('178');
    expect(convertHeightInputs({ feet: '', inches: '', cm: '178' }, 'ft_in')).toEqual({ feet: '5', inches: '10', cm: '178' });
  });

  it('leaves height fields alone when nothing valid was typed', () => {
    const empty = { feet: '', inches: '', cm: '' };
    expect(convertHeightInputs(empty, 'cm')).toBe(empty);
  });

  it('converts typed weight between lb and kg', () => {
    expect(convertWeightInput('165', 'lb', 'kg')).toBe('74.8');
    expect(convertWeightInput('74.8', 'kg', 'lb')).toBe('164.9');
    expect(convertWeightInput('', 'lb', 'kg')).toBe('');
  });
});
