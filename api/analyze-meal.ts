import { ApiError, GoogleGenAI } from '@google/genai';
import { z } from 'zod';

/**
 * POST /api/analyze-meal — the only server-side code in JustTrack.
 *
 * Takes a photo, asks Gemini what food is on the plate and roughly how much,
 * and returns per-item nutrition estimates for the user to review. Runs as a
 * Vercel function so the API key never ships inside the app. The photo is
 * sent to the model with storage turned off and is not kept anywhere.
 */

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
/** Base64 is 4/3 of the bytes: this is about a 2 MB image. The app sends ~300 KB. */
const MAX_IMAGE_CHARS = 2_800_000;
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const EstimatedFoodSchema = z.object({
  name: z.string().describe('Short, specific name as a person would say it, e.g. "Grilled chicken breast".'),
  portionDescription: z.string().describe('Plain-language portion, e.g. "about 1 cup" or "one slice".'),
  estimatedGrams: z.number().describe('Estimated weight of this portion in grams.'),
  confidence: z.number().describe('0 to 1: how sure you are this food is what you think it is.'),
  chain: z.string().describe('The restaurant chain, exactly as listed in the instructions, when its branding, packaging, or a signature item is visible. Empty string otherwise.'),
  calories: z.number().describe('Calories in this portion.'),
  protein: z.number().describe('Grams of protein in this portion.'),
  carbs: z.number().describe('Grams of carbohydrate in this portion.'),
  fat: z.number().describe('Grams of fat in this portion.'),
});

const MealAnalysisSchema = z.object({
  foods: z.array(EstimatedFoodSchema).max(12).describe('Each distinct food visible, largest first. Empty if there is no food.'),
  note: z.string().describe('One short sentence the user should know, e.g. part of the plate is hidden. Empty string if nothing.'),
});

/** Gemini takes standard JSON Schema; the `$schema` marker is the one key it doesn't want. */
const { $schema: _ignored, ...RESPONSE_SCHEMA } = z.toJSONSchema(MealAnalysisSchema);

const SYSTEM_PROMPT = `You identify food in a photo for a calorie-tracking app used by college students.

List each distinct food you can actually see, largest portion first. For each, estimate the portion size as it appears (use plate, cutlery, and packaging for scale) and give nutrition for that portion using standard nutrition-database values for the most likely preparation. Combine components into the dish people would log ("Chicken burrito bowl") unless parts are clearly separate on the plate. Don't list foods that are hidden or merely plausible. If there's no food, return an empty list and say so in the note. Keep names short and specific.

Fast food: if a cup, wrapper, bag, box, or signature item shows which chain it's from, set "chain" to that chain and name the item the way its menu does (e.g. "Spicy Deluxe Sandwich", "Chicken Burrito Bowl", "Medium French Fries", "Grande Caramel Macchiato"), including size when visible. Chains to use exactly: McDonald's, Starbucks, Chick-fil-A, Taco Bell, Dunkin', Wendy's, Chipotle Mexican Grill, Burger King, Domino's, Subway, Panda Express, Panera Bread, Popeyes, Raising Cane's, Sonic Drive-In, Pizza Hut, Dairy Queen, Wingstop, KFC, Jersey Mike's. Don't guess a chain from the food alone.`;

/** Best-effort per-IP limiter; each serverless instance keeps its own counts. */
const recent = new Map<string, number[]>();
const LIMIT_PER_MINUTE = 8;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (recent.get(ip) ?? []).filter((time) => now - time < 60_000);
  timestamps.push(now);
  recent.set(ip, timestamps);
  if (recent.size > 5000) recent.clear();
  return timestamps.length > LIMIT_PER_MINUTE;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function failure(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status);
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return failure(503, 'not_configured', 'The photo scanner isn’t set up on this server yet.');
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return failure(429, 'rate_limited', 'That’s a lot of scans in a row — give it a minute and try again.');
  }

  let body: { image?: unknown; mediaType?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return failure(400, 'bad_request', 'Expected a JSON body.');
  }
  const image = typeof body.image === 'string' ? body.image : '';
  const mediaType = MEDIA_TYPES.find((type) => type === body.mediaType);
  if (!image || !mediaType || image.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return failure(400, 'bad_request', 'Send a JPEG, PNG, or WebP photo under 2 MB.');
  }

  const client = new GoogleGenAI({ apiKey });
  try {
    const interaction = await client.interactions.create({
      model: MODEL,
      system_instruction: SYSTEM_PROMPT,
      input: [
        { type: 'image', data: image, mime_type: mediaType },
        { type: 'text', text: 'What food is in this photo, and roughly how much of each?' },
      ],
      response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
      store: false,
    });

    const parsed = MealAnalysisSchema.safeParse(interaction.output_text ? JSON.parse(interaction.output_text) : null);
    if (!parsed.success) {
      console.error('analyze-meal: unparseable output', interaction.status, interaction.errors);
      return failure(502, 'bad_response', 'The photo scanner sent back something we couldn’t read. Please try again.');
    }
    return json({ foods: parsed.data.foods, note: parsed.data.note.trim() || null });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        return failure(503, 'not_configured', 'The server’s AI key was rejected. Check GEMINI_API_KEY.');
      }
      if (error.status === 429) {
        return failure(429, 'rate_limited', 'The photo scanner is busy right now. Try again in a minute.');
      }
      if (error.status === 400 && /safety|blocked|prohibited/i.test(error.message)) {
        return failure(422, 'declined', 'We couldn’t analyze that photo. Try a clearer shot of the food itself.');
      }
      console.error('analyze-meal: API error', error.status, error.message);
      return failure(502, 'upstream_error', 'The photo scanner had a problem. Please try again.');
    }
    if (error instanceof SyntaxError) {
      return failure(502, 'bad_response', 'The photo scanner sent back something we couldn’t read. Please try again.');
    }
    console.error('analyze-meal: unexpected error', error);
    return failure(500, 'internal', 'Something went wrong on our end. Please try again.');
  }
}
