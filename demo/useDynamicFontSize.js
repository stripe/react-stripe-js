// @flow
import {useState, useEffect} from 'react';

// Demo hook to dynamically change font size based on window size.
const useDynamicFontSize = () => {
  const [fontSize, setFontSize] = useState(
    window.innerWidth < 450 ? '14px' : '18px'
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 450 && fontSize !== '14px') {
        setFontSize('14px');
      } else if (window.innerWidth >= 450 && fontSize !== '18px') {
        setFontSize('18px');
      }
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return fontSize;
};

export default useDynamicFontSize;
