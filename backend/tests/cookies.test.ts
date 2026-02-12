import { describe, expect, it } from 'vitest';

import { getClearCookieOptions, getSessionCookieOptions } from '../src/config/cookies.js';

describe('cookie security behavior', () => {
  it('does not force secure cookies for plain HTTP requests when COOKIE_SECURE is disabled', () => {
    const options = getSessionCookieOptions(true, false);
    expect(options.secure).toBe(false);
  });

  it('marks cookies as secure for HTTPS requests', () => {
    const options = getSessionCookieOptions(true, true);
    expect(options.secure).toBe(true);
  });

  it('applies trusted and untrusted session durations', () => {
    const trusted = getSessionCookieOptions(true, false);
    const untrusted = getSessionCookieOptions(false, false);

    expect(trusted.maxAge).toBe(365 * 24 * 60 * 60 * 1000);
    expect(untrusted.maxAge).toBe(24 * 60 * 60 * 1000);
  });

  it('uses matching security flags when clearing cookies', () => {
    expect(getClearCookieOptions(false).secure).toBe(false);
    expect(getClearCookieOptions(true).secure).toBe(true);
  });
});
