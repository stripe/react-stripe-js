import {renderHook, act} from '@testing-library/react-hooks';
import {usePromiseResolver} from './usePromiseResolver';
import { mockStripe } from '../../test/mocks';

const createImperativePromise = (): [Promise<unknown>, (value?: unknown) => Promise<void>, (reason?: any) => Promise<void>] => {
  let resolveFn: (value?: unknown) => Promise<void> = () => Promise.resolve()
  let rejectFn: (reason?: any) => Promise<void> = () => Promise.resolve()

  const promise = new Promise((resolve, reject) => {
    const createVoidPromise = () => promise.then(() => undefined, () => undefined)

    resolveFn = (value) => {
      resolve(value)
      return createVoidPromise()
    }

    rejectFn = (reason) => {
      reject(reason)
      return createVoidPromise()
    }
  })

  return [promise, resolveFn, rejectFn]
}

describe('usePromiseResolver', () => {
  let stripe: ReturnType<typeof mockStripe>;

  beforeEach(() => {
    stripe = mockStripe();
  })

  it('returns resolved on mount when not promise given', () => {
    const {result} = renderHook(() => usePromiseResolver(stripe));
    expect(result.current).toEqual([stripe, undefined, 'resolved'])
  });

  it('returns pending on mount when promise given', () => {
    const [promise] = createImperativePromise()
    const {result} = renderHook(() => usePromiseResolver(promise));
    expect(result.current).toEqual([undefined, undefined, 'pending'])
  });

  it('returns resolved when given promise resolved', async () => {
    const [promise, resolve] = createImperativePromise()
    const {result} = renderHook(() => usePromiseResolver(promise));

    await act(() => resolve(stripe))
    expect(result.current).toEqual([stripe, undefined, 'resolved'])
  });

  it('returns rejected when given promise rejected', async () => {
    const [promise,, reject] = createImperativePromise()
    const {result} = renderHook(() => usePromiseResolver(promise));

    const error = new Error('Something went wrong')
    await act(() => reject(error))
    expect(result.current).toEqual([undefined, error, 'rejected'])
  });
});
