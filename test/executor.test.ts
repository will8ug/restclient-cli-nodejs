import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RequestError, ResolvedRequest, ResponseData } from '../src/core/types';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('undici', () => ({
  request: requestMock,
}));

import { executeRequest, isRequestError } from '../src/core/executor';

function createResolvedRequest(overrides: Partial<ResolvedRequest> = {}): ResolvedRequest {
  return {
    method: 'GET',
    url: 'https://example.com/api',
    headers: {},
    body: undefined,
    ...overrides,
  };
}

function createMockResponse(overrides: {
  statusCode?: number;
  headers?: Record<string, string | string[]>;
  body?: string;
} = {}) {
  return {
    statusCode: overrides.statusCode ?? 200,
    headers: overrides.headers ?? {},
    body: {
      text: vi.fn().mockResolvedValue(overrides.body ?? ''),
    },
  };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('executeRequest', () => {
  it('returns ResponseData for a successful GET request', async () => {
    requestMock.mockResolvedValue(
      createMockResponse({
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: '{"ok":true}',
      }),
    );

    const result = await executeRequest(createResolvedRequest());

    expect(isRequestError(result)).toBe(false);
    if (isRequestError(result)) {
      throw new Error('Expected successful response');
    }

    expect(result).toEqual({
      statusCode: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"ok":true}',
      timing: {
        durationMs: expect.any(Number),
      },
      size: {
        bodyBytes: Buffer.byteLength('{"ok":true}', 'utf-8'),
      },
    });

    expect(requestMock).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        method: 'GET',
        headers: {},
        body: undefined,
      }),
    );
  });

  it('auto-sets Content-Type for JSON POST bodies', async () => {
    requestMock.mockResolvedValue(createMockResponse());

    await executeRequest(
      createResolvedRequest({
        method: 'POST',
        body: '  {"name":"test"}',
      }),
    );

    expect(requestMock).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        method: 'POST',
        body: '  {"name":"test"}',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('does not override an explicit Content-Type header', async () => {
    requestMock.mockResolvedValue(createMockResponse());

    await executeRequest(
      createResolvedRequest({
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: '{"name":"test"}',
      }),
    );

    expect(requestMock).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        headers: {
          'content-type': 'text/plain',
        },
      }),
    );
  });

  it('returns RequestError for network failures', async () => {
    const error = new Error('connect ECONNREFUSED 127.0.0.1:3000') as Error & { code?: string };
    error.code = 'ECONNREFUSED';
    requestMock.mockRejectedValue(error);

    const result = await executeRequest(createResolvedRequest());

    expect(isRequestError(result)).toBe(true);
    expect(result).toEqual({
      message: 'connect ECONNREFUSED 127.0.0.1:3000',
      code: 'ECONNREFUSED',
    });
  });

  it('type guard identifies both response and error results', () => {
    const response: ResponseData = {
      statusCode: 204,
      statusText: 'No Content',
      headers: {},
      body: '',
      timing: { durationMs: 1 },
      size: { bodyBytes: 0 },
    };
    const error: RequestError = {
      message: 'timeout',
      code: 'UND_ERR_CONNECT_TIMEOUT',
    };

    expect(isRequestError(response)).toBe(false);
    expect(isRequestError(error)).toBe(true);
  });

  it('captures positive request timing', async () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(10).mockReturnValueOnce(25.5);
    requestMock.mockResolvedValue(createMockResponse({ body: 'ok' }));

    const result = await executeRequest(createResolvedRequest());

    expect(isRequestError(result)).toBe(false);
    if (isRequestError(result)) {
      throw new Error('Expected successful response');
    }

    expect(result.timing.durationMs).toBe(15.5);
    expect(result.timing.durationMs).toBeGreaterThan(0);
  });

  it('captures response headers as a Record<string, string>', async () => {
    requestMock.mockResolvedValue(
      createMockResponse({
        headers: {
          'content-type': 'text/plain',
          'set-cookie': ['a=1', 'b=2'],
        },
      }),
    );

    const result = await executeRequest(createResolvedRequest());

    expect(isRequestError(result)).toBe(false);
    if (isRequestError(result)) {
      throw new Error('Expected successful response');
    }

    expect(result.headers).toEqual({
      'content-type': 'text/plain',
      'set-cookie': 'a=1, b=2',
    });
  });
});
