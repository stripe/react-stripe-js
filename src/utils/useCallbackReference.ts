import {useRef, useEffect} from 'react';

export const useCallbackReference = <A extends unknown[]>(
  cb?: (...args: A) => any
): ((...args: A) => void) => {
  const ref = useRef(cb);

  useEffect(() => {
    ref.current = cb;
  }, [cb]);

  return (...args): void => {
    if (ref.current) {
      ref.current(...args);
    }
  };
};
