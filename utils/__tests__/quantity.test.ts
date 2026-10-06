import { formatQuantity, parseQuantity } from '../quantity';

describe('parseQuantity', () => {
  it('reads whole numbers and decimals, including a comma decimal separator', () => {
    expect(parseQuantity('2')).toBe(2);
    expect(parseQuantity('1.5')).toBe(1.5);
    expect(parseQuantity('1,5')).toBe(1.5);
    expect(parseQuantity('.5')).toBe(0.5);
    expect(parseQuantity(' 150 ')).toBe(150);
  });

  it('reads simple and mixed fractions', () => {
    expect(parseQuantity('1/2')).toBe(0.5);
    expect(parseQuantity('1 1/2')).toBe(1.5);
  });

  it('rejects empty, zero, negative, and non-numeric input', () => {
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity('0')).toBeNull();
    expect(parseQuantity('-1')).toBeNull();
    expect(parseQuantity('1/0')).toBeNull();
    expect(parseQuantity('two')).toBeNull();
    expect(parseQuantity('1.2.3')).toBeNull();
  });
});

describe('formatQuantity', () => {
  it('drops trailing zeros and rounds to the requested precision', () => {
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(1 / 3)).toBe('0.33');
    expect(formatQuantity(152.46, 1)).toBe('152.5');
  });
});
