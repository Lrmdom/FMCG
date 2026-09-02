import { Hono } from 'hono';
import { DEFAULT_USER_SETTINGS } from '../../shared/constants.ts';
import type { UserFmcgSettings } from '../../shared/types.ts';

export const settingsRouter = new Hono();

let currentSettings: UserFmcgSettings = { ...DEFAULT_USER_SETTINGS };

settingsRouter.get('/', (c) => {
  return c.json(currentSettings);
});

settingsRouter.post('/', async (c) => {
  const body = await c.req.json();
  currentSettings = {
    ...currentSettings,
    ...body,
  };
  return c.json({ success: true, settings: currentSettings });
});
