/// <reference types="vitest" />

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCurrencySnapshot } from './useCurrencySnapshot';
import type { CurrencySnapshotResponse } from './currencyData';

vi.mock('./currencyData', () => ({
  fetchCurrencySnapshot: vi.fn(),
}));

import { fetchCurrencySnapshot } from './currencyData';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function snapshot(base: string): CurrencySnapshotResponse {
  return { base, updatedAt: '2026-10-26', fetchedAt: '2026-10-26T12:00:00.000Z', rates: { USD: 1.2 } };
}

describe('useCurrencySnapshot query transitions', () => {
  afterEach(() => vi.clearAllMocks());

  it('keeps the new key pending without previous data, then exposes only its deferred response', async () => {
    const first = deferred<CurrencySnapshotResponse>();
    const second = deferred<CurrencySnapshotResponse>();
    vi.mocked(fetchCurrencySnapshot)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender, unmount } = renderHook(
      ({ base }: { base: string }) => useCurrencySnapshot(base, 'Europe'),
      { initialProps: { base: 'CAD' }, wrapper },
    );

    await waitFor(() => expect(fetchCurrencySnapshot).toHaveBeenCalledTimes(1));
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    rerender({ base: 'EUR' });
    await waitFor(() => expect(fetchCurrencySnapshot).toHaveBeenCalledTimes(2));
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    await act(async () => second.resolve(snapshot('EUR')));
    await waitFor(() => expect(result.current.data?.base).toBe('EUR'));
    expect(result.current.isPending).toBe(false);

    await act(async () => first.resolve(snapshot('CAD')));
    expect(result.current.data?.base).toBe('EUR');
    unmount();
    client.clear();
  });

  it('reports a failed new-key fetch without retaining the prior key data', async () => {
    const first = deferred<CurrencySnapshotResponse>();
    const second = deferred<CurrencySnapshotResponse>();
    vi.mocked(fetchCurrencySnapshot)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender, unmount } = renderHook(
      ({ base }: { base: string }) => useCurrencySnapshot(base, 'Europe'),
      { initialProps: { base: 'CAD' }, wrapper },
    );
    await waitFor(() => expect(fetchCurrencySnapshot).toHaveBeenCalledTimes(1));
    rerender({ base: 'EUR' });
    await waitFor(() => expect(fetchCurrencySnapshot).toHaveBeenCalledTimes(2));

    await act(async () => second.reject(new Error('network unavailable')));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();

    await act(async () => first.resolve(snapshot('CAD')));
    expect(result.current.data).toBeUndefined();
    unmount();
    client.clear();
  });
});
