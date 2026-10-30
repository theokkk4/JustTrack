import { chipotle } from './chipotle';
import { jerseyMikes } from './jerseyMikes';
import { panda } from './panda';
import { subway } from './subway';
import type { BuilderConfig } from './types';

export * from './types';

/** The chains you build an order at, by the key used in the route. */
export function builderByKey(key: string | null | undefined): BuilderConfig | null {
  switch (key) {
    case 'chipotle':
      return chipotle;
    case 'subway':
      return subway;
    case 'panda':
      return panda;
    case 'jerseymikes':
      return jerseyMikes();
    default:
      return null;
  }
}

export function builderForChain(chain: string | null | undefined): BuilderConfig | null {
  if (!chain) return null;
  return [chipotle, subway, panda, jerseyMikes()].find((config) => config.chain === chain) ?? null;
}
