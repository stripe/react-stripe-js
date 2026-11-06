import {createDeferred} from './createDeferred';

describe('createDeferred', () => {
  it('resolves with the provided value', async () => {
    const deferred = createDeferred<string>();

    deferred.resolve('ready');

    await expect(deferred.promise).resolves.toBe('ready');
  });

  it('rejects with the provided reason', async () => {
    const deferred = createDeferred<string>();
    const error = new Error('Initialization failed');

    deferred.reject(error);

    await expect(deferred.promise).rejects.toBe(error);
  });
});
