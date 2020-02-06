import {useRef, useEffect} from 'react';

export const usePrevious = <T>(value: T): T => {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};
