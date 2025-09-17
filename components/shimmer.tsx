'use client';

interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className = '', children }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-muted rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
            <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
          </div>
          <div className="flex gap-2 ml-2">
            <div className="h-6 w-16 bg-muted-foreground/20 rounded"></div>
            <div className="h-6 w-12 bg-muted-foreground/20 rounded"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted-foreground/20 rounded w-full"></div>
          <div className="h-3 bg-muted-foreground/20 rounded w-5/6"></div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 w-24 bg-muted-foreground/20 rounded"></div>
          <div className="h-4 w-16 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>
    </div>
  );
}
