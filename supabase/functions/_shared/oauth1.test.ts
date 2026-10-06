import { assertEquals, assertMatch } from 'jsr:@std/assert@1';

import { encodeQuery, hmacSha1Signature, normalizeParameters, percentEncode, signatureBaseString, signRequest } from './oauth1.ts';

Deno.test('percentEncode follows RFC 3986, including the characters encodeURIComponent skips', () => {
  assertEquals(percentEncode('Ladies + Gentlemen'), 'Ladies%20%2B%20Gentlemen');
  assertEquals(percentEncode("a!b'c(d)e*f"), 'a%21b%27c%28d%29e%2Af');
  assertEquals(percentEncode('-._~'), '-._~');
  assertEquals(percentEncode('café'), 'caf%C3%A9');
});

Deno.test('normalizeParameters sorts by name, then by value', () => {
  assertEquals(normalizeParameters({ z: 'bar', a: 'foo', b: '2 3' }), 'a=foo&b=2%203&z=bar');
});

Deno.test('signatureBaseString matches FatSecret’s documented example', () => {
  assertEquals(
    signatureBaseString('POST', 'https://platform.fatsecret.com/rest/server.api', {
      a: 'foo',
      oauth_consumer_key: 'demo',
      oauth_nonce: 'abc',
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: '12345678',
      oauth_version: '1.0',
      z: 'bar',
    }),
    'POST&https%3A%2F%2Fplatform.fatsecret.com%2Frest%2Fserver.api&a%3Dfoo%26oauth_consumer_key%3Ddemo%26oauth_nonce%3Dabc%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D12345678%26oauth_version%3D1.0%26z%3Dbar'
  );
});

Deno.test('hmacSha1Signature reproduces the OAuth 1.0 spec’s example signature', async () => {
  const base = signatureBaseString('GET', 'http://photos.example.net/photos', {
    file: 'vacation.jpg',
    size: 'original',
    oauth_consumer_key: 'dpf43f3p2l4k3l03',
    oauth_token: 'nnch734d00sl2jdk',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: '1191242096',
    oauth_nonce: 'kllo9940pd9333jh',
    oauth_version: '1.0',
  });
  assertEquals(await hmacSha1Signature(base, 'kd94hf93k423kf44', 'pfkkdhi9sl3r4s00'), 'tR3+Ty81lMeYAr/Fid0kMTYa/WM=');
});

Deno.test('hmacSha1Signature handles reserved characters in parameter values', async () => {
  const base = signatureBaseString('POST', 'https://api.twitter.com/1.1/statuses/update.json', {
    include_entities: 'true',
    status: 'Hello Ladies + Gentlemen, a signed OAuth request!',
    oauth_consumer_key: 'xvz1evFS4wEEPTGEFPHBog',
    oauth_nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: '1318622958',
    oauth_token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
    oauth_version: '1.0',
  });
  assertEquals(
    await hmacSha1Signature(base, 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw', 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE'),
    'hCtSmYh+iHYCEqBWrE7C7hYmtUk='
  );
});

Deno.test('signRequest adds every OAuth parameter and signs two-legged with an empty token secret', async () => {
  const url = 'https://platform.fatsecret.com/rest/server.api';
  const params = { method: 'foods.search', search_expression: 'greek yogurt', format: 'json' };
  const signed = await signRequest({
    method: 'GET',
    url,
    params,
    consumerKey: 'key',
    consumerSecret: 'secret',
    nonce: 'n0nce',
    timestamp: 1700000000,
  });

  const { oauth_signature: signature, ...unsigned } = signed;
  assertEquals(unsigned, {
    ...params,
    oauth_consumer_key: 'key',
    oauth_nonce: 'n0nce',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: '1700000000',
    oauth_version: '1.0',
  });
  assertEquals(signature, await hmacSha1Signature(signatureBaseString('GET', url, unsigned), 'secret', ''));
});

Deno.test('signRequest generates a fresh nonce and current timestamp by default', async () => {
  const first = await signRequest({ method: 'GET', url: 'https://example.com', params: {}, consumerKey: 'k', consumerSecret: 's' });
  const second = await signRequest({ method: 'GET', url: 'https://example.com', params: {}, consumerKey: 'k', consumerSecret: 's' });
  assertMatch(first.oauth_nonce, /^[0-9a-f]{32}$/);
  assertEquals(first.oauth_nonce === second.oauth_nonce, false);
  assertEquals(Math.abs(Number(first.oauth_timestamp) - Date.now() / 1000) < 5, true);
});

Deno.test('encodeQuery encodes values exactly as they were signed', () => {
  assertEquals(encodeQuery({ search_expression: 'mac & cheese', oauth_signature: 'a+b/c=' }), 'search_expression=mac%20%26%20cheese&oauth_signature=a%2Bb%2Fc%3D');
});
