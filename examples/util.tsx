/* eslint-disable no-console */
import React, {useState, useEffect, ReactNode} from 'react';

export const logEvent = (name: string) => (event: unknown) => {
  console.log(`[${name}]`, event);
};

export const Result = ({children}: {children: ReactNode}) => (
  <div className="result">{children}</div>
);

export const ErrorResult = ({children}: {children: ReactNode}) => (
  <div className="error">{children}</div>
);

// Demo hook to dynamically change font size based on window size.
export const useDynamicFontSize = (): string => {
  const [fontSize, setFontSize] = useState(
    window.innerWidth < 450 ? '14px' : '18px'
  );

  useEffect(() => {
    const onResize = () => {
      setFontSize(window.innerWidth < 450 ? '14px' : '18px');
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return fontSize;
};
