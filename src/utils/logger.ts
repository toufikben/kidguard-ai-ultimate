const isDev = import.meta.env.DEV;

export const logger = {
  info: (...args: unknown[]) => isDev && console.info('[KG]', ...args),
  warn: (...args: unknown[]) => isDev && console.warn('[KG]', ...args),
  error: (...args: unknown[]) => console.error('[KG]', ...args),
  security: (...args: unknown[]) => console.warn('[KG-SEC]', ...args),
};
