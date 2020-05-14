import React from 'react';
import {isPromise} from '../utils/guards';

type PromisePending = [undefined, undefined, 'pending'];
type PromiseResolved<T> = [T, undefined, 'resolved'];
type PromiseRejected = [undefined, any, 'rejected'];
type PromiseState<T> = PromisePending | PromiseResolved<T> | PromiseRejected;

const createPending = (): PromisePending => [undefined, undefined, 'pending'];

const createResolved = <T>(value: T): PromiseResolved<T> => [
  value,
  undefined,
  'resolved',
];

const createRejected = (reason: any): PromiseRejected => [
  undefined,
  reason,
  'rejected',
];

export const usePromiseResolver = <T>(
  mayBePromise: T | PromiseLike<T>
): PromiseState<T> => {
  const [state, setState] = React.useState<PromiseState<T>>(() =>
    isPromise(mayBePromise) ? createPending() : createResolved(mayBePromise)
  );

  React.useEffect(() => {
    if (!isPromise(mayBePromise)) return setState(createResolved(mayBePromise));

    let isMounted = true;

    setState(createPending());
    mayBePromise
      .then(
        (resolved) => createResolved(resolved),
        (error) => createRejected(error)
      )
      .then((nextState) => {
        if (isMounted) setState(nextState);
      });

    return () => {
      isMounted = false;
    };
  }, [mayBePromise]);

  return state;
};
