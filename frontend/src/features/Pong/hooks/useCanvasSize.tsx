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
    const updateCanvasSize = () => {
      setCanvasSize(
        calculateCanvasSize(
          window.innerWidth,
          window.innerHeight - navBarHeight
        )
      );
    };

    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return canvasSize;
};
