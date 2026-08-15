import { describe, expect, it } from 'vitest';

import { MENU_ITEMS } from '../constants/menuItems';

describe('MENU_ITEMS', () => {
  it('/interval 경로가 없다', () => {
    expect(MENU_ITEMS.map((item) => item.href)).not.toContain('/interval');
  });
});
