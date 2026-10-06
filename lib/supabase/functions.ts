import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';

import { supabase } from './client';
import { FunctionCallError, functionErrorFromBody, OFFLINE_MESSAGE } from './functionErrors';

export { FunctionCallError, isFunctionCallError } from './functionErrors';

const TIMEOUT_MS = 20_000;

/**
 * Calls one of JustTrack's Edge Functions as the signed-in user (supabase-js
 * attaches their access token). Throws FunctionCallError with a message
 * that's safe to show.
 */
export async function invokeFunction<T>(name: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body, signal, timeout: TIMEOUT_MS });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const response = error.context as Response;
      const parsed: unknown = await response.json().catch(() => null);
      throw functionErrorFromBody(response.status, parsed);
    }
    if (error instanceof FunctionsFetchError) {
      throw new FunctionCallError(signal?.aborted ? 'aborted' : 'network', OFFLINE_MESSAGE, null);
    }
    if (error instanceof FunctionsRelayError) {
      throw new FunctionCallError('relay', 'Our server is having trouble right now. Please try again.', null);
    }
    throw error;
  }
  if (data === null || data === undefined) {
    throw new FunctionCallError('empty_response', 'Something went wrong on our end. Please try again.', null);
  }
  return data;
}
