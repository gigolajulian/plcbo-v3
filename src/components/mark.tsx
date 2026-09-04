import { cn } from '@/lib/utils';

/* The mark is fixed artwork. It renders flat in a single colour — currentColor —
 * and is never redrawn, recoloured into a gradient, outlined or given a shadow.
 * Clear space is half the mark's height on every side; 16px is the digital floor. */
export function Mark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 208.72 171.29"
      className={cn('block h-auto w-full', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12.87,3.05c2.03-1.36,4.4-2.04,6.78-2.04C163.73.92,157.73-.47,164.67.17c57.1,5.29,59.03,96.42,3.74,109.29-21.8,5.07-89.37-4.81-101.48,3.14-11.8,7.74,4.53,65.79-18.01,57.97-3.22-1.12-46.09-58.95-47.49-63.03-.91-2.65-1.73-5.07-1.34-8.09.2-3.37,1.65-6.77,3.61-8.84,7.89-8.32,101.66.45,122.68-4.52,37.72-8.93,33.02-56.9-1.31-62.49-6.28-1.02-18.46-.88-24.89-.08-25.13,3.13-20.71,32.5-38.13,38.63-9.52,3.35-37.32,3.18-46.62-.63C-4.21,53.45-4.69,14.78,12.87,3.05Z"
      />
    </svg>
  );
}
