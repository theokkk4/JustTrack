import { assertEquals } from 'jsr:@std/assert@1';

import { fatSecretError } from './fatsecret.ts';

Deno.test('fatSecretError maps FatSecret codes to app-facing statuses', () => {
  const cases: [number, number, string][] = [
    [5, 503, 'not_configured'],
    [8, 503, 'not_configured'],
    [11, 429, 'rate_limited'],
    [12, 429, 'rate_limited'],
    [14, 403, 'missing_scope'],
    [20, 503, 'upstream_unavailable'],
    [21, 502, 'ip_not_allowed'],
    [101, 400, 'bad_request'],
    [106, 404, 'not_found'],
    [211, 404, 'not_found'],
    [999, 502, 'upstream_error'],
  ];
  for (const [code, status, appCode] of cases) {
    const error = fatSecretError(code);
    assertEquals([error.status, error.code], [status, appCode], `FatSecret code ${code}`);
  }
});
