import { useLayoutEffect, useState } from 'react';

const calculateCanvasSize = (innerWidth: number, innerHeight: number) => {
  if (innerHeight * (16 / 9) <= innerWidth) {
    return { width: innerHeight * (16 / 9), height: innerHeight };
  } else {
    return { width: innerWidth, height: innerWidth * (9 / 16) };
  }
};

export const useCanvasSize = () => {
  const navBarHeight = 80;
  const [canvasSize, setCanvasSize] = useState(
    calculateCanvasSize(window.innerWidth, window.innerHeight - navBarHeight)
  );

  useLayoutEffect(() => {
    const updateMagnification = () => {
      setCanvasSize(
        calculateCanvasSize(
          window.innerWidth,
          window.innerHeight - navBarHeight
        )
      );
    };

    window.addEventListener('resize', updateMagnification);

    return () => window.removeEventListener('resize', updateMagnification);
  }, []);

  return canvasSize;
};
