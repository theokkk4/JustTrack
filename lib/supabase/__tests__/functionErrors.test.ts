import { FunctionCallError, functionErrorFromBody, isFunctionCallError } from '../functionErrors';

describe('functionErrorFromBody', () => {
  it('uses the function’s own code and user-facing message', () => {
    const error = functionErrorFromBody(503, {
      error: { code: 'not_configured', message: 'Food search isn’t set up yet — the server is missing its FatSecret credentials.' },
    });
    expect(error).toBeInstanceOf(FunctionCallError);
    expect([error.code, error.status]).toEqual(['not_configured', 503]);
    expect(error.message).toMatch(/isn’t set up yet/);
  });

  it('falls back to a status-based message when the body isn’t ours', () => {
    expect(functionErrorFromBody(401, null).code).toBe('unauthorized');
    expect(functionErrorFromBody(404, '<html>').code).toBe('function_missing');
    expect(functionErrorFromBody(500, { error: 'boom' }).code).toBe('http_error');
    expect(functionErrorFromBody(500, { error: { code: 'x', message: '' } }).code).toBe('http_error');
  });
});

describe('isFunctionCallError', () => {
  it('narrows by class and optionally by code', () => {
    const error = new FunctionCallError('not_found', 'We couldn’t find that food.', 404);
    expect(isFunctionCallError(error)).toBe(true);
    expect(isFunctionCallError(error, 'not_found')).toBe(true);
    expect(isFunctionCallError(error, 'rate_limited')).toBe(false);
    expect(isFunctionCallError(new Error('nope'))).toBe(false);
  });
});
