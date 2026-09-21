import { describe, expect, it } from 'vitest';

import { placeholderPoolName, shortPoolId } from './naming';

describe('shortPoolId', () => {
  it('keeps short ids and shortens long ones to their last six digits', () => {
    expect(shortPoolId('7')).toBe('7');
    expect(shortPoolId('12345678')).toBe('12345678');
    expect(shortPoolId('1789938174504')).toBe('174504');
    expect(shortPoolId('18446744073709551615')).toBe('551615');
  });
});

describe('placeholderPoolName', () => {
  it('matches what the UI falls back to', () => {
    expect(placeholderPoolName('1789938174504')).toBe('Pool #174504');
    expect(placeholderPoolName('42')).toBe('Pool #42');
  });
});
