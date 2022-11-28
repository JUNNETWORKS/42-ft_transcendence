import { useEffect, useRef, useState } from 'react';

export const useVerticalScrollAttr = (elementId: string) => {
  const isProcessing = useRef(false);
  const [top, setTop] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = document.getElementById(elementId);
    if (!el) {
      return;
    }
    const handler = () => {
      if (isProcessing.current) {
        return;
      }
      isProcessing.current = true;
      // Window.requestAnimationFrame()でpositionYステートの更新を間引く
      window.requestAnimationFrame(() => {
        isProcessing.current = false;
        setTop(el.scrollTop);
        setHeight(el.scrollHeight);
      });
    };
    // スクロールイベントの登録
    el.addEventListener('scroll', handler, { passive: true });
    return () => {
      // スクロールイベントの解除
      el.removeEventListener('scroll', handler);
    };
  }, [elementId]);

  // スクロール量を返却する
  return { top, height };
};