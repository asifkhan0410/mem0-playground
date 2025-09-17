'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Short delay to show the loading bar

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-white">
        <div className="h-full bg-gray-500 animate-shimmer"></div>
      </div>
    </div>
  );
}
