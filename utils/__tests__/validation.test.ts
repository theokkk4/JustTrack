import { isValidEmail, passwordError } from '../validation';

describe('isValidEmail', () => {
  it.each(['student@university.edu', ' name.surname+tag@gmail.com ', 'a@b.io'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(['', 'plainaddress', 'missing@tld', 'two@@signs.com', 'spaces in@mail.com', 'x@y.c'])('rejects "%s"', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe('passwordError', () => {
  it('requires at least 8 characters', () => {
    expect(passwordError('short')).toBeDefined();
    expect(passwordError('longenough')).toBeUndefined();
  });
});
