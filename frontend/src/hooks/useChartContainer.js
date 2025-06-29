// Custom hook for managing chart container mounting
import { useState, useEffect, useRef } from 'react';

export const useChartContainer = () => {
  const containerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // Increased retries
    let timeoutId;

    const checkContainer = () => {
      console.log(`Checking container (attempt ${retryCount + 1}/${maxRetries})`);
      
      if (!containerRef.current) {
        console.log('Container ref not available yet');
        if (retryCount < maxRetries) {
          retryCount++;
          timeoutId = setTimeout(checkContainer, 100);
        } else {
          console.error('Container ref never became available');
        }
        return;
      }

      // Get container dimensions
      const rect = containerRef.current.getBoundingClientRect();
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;
      const clientWidth = containerRef.current.clientWidth;
      const clientHeight = containerRef.current.clientHeight;

      console.log('Container dimensions:', { 
        width, 
        height, 
        clientWidth, 
        clientHeight, 
        rect: { width: rect.width, height: rect.height }
      });

      // Check if container has valid dimensions
      const hasValidDimensions = (width > 0 && height > 0) || 
                                (clientWidth > 0 && clientHeight > 0) || 
                                (rect.width > 0 && rect.height > 0);

      if (hasValidDimensions) {
        const finalWidth = width || clientWidth || rect.width;
        const finalHeight = height || clientHeight || rect.height || 500; // Default height
        
        setContainerSize({ width: finalWidth, height: finalHeight });
        setIsMounted(true);
        console.log('✅ Chart container ready:', { width: finalWidth, height: finalHeight });
      } else if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Container not ready yet, retrying in 100ms...`);
        timeoutId = setTimeout(checkContainer, 100);
      } else {
        console.error('❌ Chart container failed to mount after', maxRetries, 'retries');
        // Force mount with default dimensions as fallback
        setContainerSize({ width: 800, height: 500 });
        setIsMounted(true);
        console.log('🔧 Force mounting with default dimensions');
      }
    };

    // Start checking immediately, then with small delays
    checkContainer();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Also listen for resize events to update container size
  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth || containerRef.current.clientWidth;
        const height = containerRef.current.offsetHeight || containerRef.current.clientHeight || 500;
        setContainerSize({ width, height });
        console.log('Container resized:', { width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);

  return {
    containerRef,
    isMounted,
    containerSize
  };
};