import { analyzeMealPhoto, ScanError } from '@/services/mealScanService';

const image = { base64: 'AAAA', mediaType: 'image/jpeg' };
const food = { name: 'Waffle', portionDescription: 'one', estimatedGrams: 80, confidence: 0.9, chain: '', calories: 220, protein: 5, carbs: 30, fat: 9 };

function reply(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

describe('analyzeMealPhoto', () => {
  const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();
  const originalKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  });
  afterAll(() => {
    if (originalKey === undefined) delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    else process.env.EXPO_PUBLIC_GEMINI_API_KEY = originalKey;
  });

  it('calls the app’s own server function when the build has no key', async () => {
    fetchMock.mockResolvedValue(reply(200, { foods: [food], note: null }));
    const analysis = await analyzeMealPhoto(image);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/analyze-meal$/);
    expect(analysis.foods[0].name).toBe('Waffle');
    expect(analysis.note).toBeNull();
  });

  it('passes the server’s error code through', async () => {
    fetchMock.mockResolvedValue(reply(503, { error: { code: 'not_configured', message: 'No key.' } }));
    const error = await analyzeMealPhoto(image).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ScanError);
    expect(error).toMatchObject({ code: 'not_configured', message: 'No key.' });
  });

  it('asks Gemini directly when the build carries a key', async () => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'built-in';
    fetchMock.mockResolvedValue(reply(200, { steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify({ foods: [food], note: 'Part of the plate is cut off.' }) }] }] }));
    const analysis = await analyzeMealPhoto(image);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('generativelanguage.googleapis.com');
    expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe('built-in');
    expect(analysis.foods).toHaveLength(1);
    expect(analysis.note).toBe('Part of the plate is cut off.');
  });
});
