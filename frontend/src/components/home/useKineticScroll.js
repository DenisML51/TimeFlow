// src/hooks/useKineticScroll.js
import { useEffect } from "react";

export const useKineticScroll = (ref) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateParallax = (e) => {
      const speed = -15;
      const x = (window.innerWidth - e.pageX * speed) / 100;
      const y = (window.innerHeight - e.pageY * speed) / 100;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    element.addEventListener('mousemove', updateParallax);
    return () => element.removeEventListener('mousemove', updateParallax);
  }, [ref]);
};