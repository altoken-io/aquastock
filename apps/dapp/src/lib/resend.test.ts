import { beforeEach, describe, expect, it, vi } from 'vitest';

const envMock = vi.fn();
vi.mock('@/lib/env/server', () => ({ env: envMock }));

const ResendMock = vi.fn(function (this: unknown, key: string) {
  return {
    apiKey: key,
    batch: { send: vi.fn() },
    contacts: { create: vi.fn() },
  };
});
vi.mock('resend', () => ({ Resend: ResendMock }));

describe('resend lazy client', () => {
  beforeEach(() => {
    vi.resetModules();
    ResendMock.mockClear();
    envMock.mockReset();
  });

  it('does not construct the Resend client on import, even when RESEND_API_KEY is unset', async () => {
    envMock.mockImplementation(() => {
      throw new Error(
        'Environment variable RESEND_API_KEY is not set in the server environment',
      );
    });

    await expect(import('./resend')).resolves.toBeDefined();
    expect(ResendMock).not.toHaveBeenCalled();
  });

  it('only throws once a property on the client is actually accessed', async () => {
    envMock.mockImplementation(() => {
      throw new Error(
        'Environment variable RESEND_API_KEY is not set in the server environment',
      );
    });

    const { resend } = await import('./resend');
    expect(() => resend.batch).toThrow('RESEND_API_KEY');
  });

  it('constructs the client once and reuses it across property accesses', async () => {
    envMock.mockReturnValue('test-key');

    const { resend } = await import('./resend');
    void resend.batch;
    void resend.contacts;

    expect(ResendMock).toHaveBeenCalledTimes(1);
    expect(ResendMock).toHaveBeenCalledWith('test-key');
  });
});
