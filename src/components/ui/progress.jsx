// src/components/ui/progress.jsx
'use client';
import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils'; // Předpokládá existenci cn utility (obvykle v src/lib/utils.js)

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-slate-800', // Tmavší pozadí pro tmavý režim
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-sky-500 transition-all" // Barva indikátoru
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };