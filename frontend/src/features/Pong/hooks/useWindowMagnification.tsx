import { useLayoutEffect, useState } from 'react';

export const useWindowMagnification = (width: number) => {
  const [magnification, setMagnification] = useState(window.innerWidth / width);

  useLayoutEffect(() => {
    const updateMagnification = () => {
      setMagnification(window.innerWidth / width);
    };

    window.addEventListener('resize', updateMagnification);

    return () => window.removeEventListener('resize', updateMagnification);
  }, [width]);

  return magnification;
};
