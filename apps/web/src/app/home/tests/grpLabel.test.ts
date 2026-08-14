import { describe, expect, it } from 'vitest';

import { grpLabel } from '../logic/grpLabel';

describe('grpLabel', () => {
  it('버튼 문구는 N부터 M세트다', () => {
    expect(grpLabel(0, 10)).toBe('1부터 10세트');
    expect(grpLabel(1, 10)).toBe('11부터 20세트');
    expect(grpLabel(2, 10)).toBe('21부터 30세트');
  });
});
