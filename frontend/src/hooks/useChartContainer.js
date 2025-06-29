// Custom hook for managing chart container mounting
import { useState, useEffect, useRef } from 'react';

export const useChartContainer = () => {
  const containerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20;

    const checkContainer = () => {
      if (!containerRef.current) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkContainer, 50);
        }
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;

      if (width > 0 && height > 0) {
        setContainerSize({ width, height });
        setIsMounted(true);
        console.log('Chart container ready:', { width, height });
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkContainer, 50);
      } else {
        console.error('Chart container failed to mount after', maxRetries, 'retries');
      }
    };

    // Start checking after a small delay to ensure DOM is ready
    const timeoutId = setTimeout(checkContainer, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    containerRef,
    isMounted,
    containerSize
  };
};