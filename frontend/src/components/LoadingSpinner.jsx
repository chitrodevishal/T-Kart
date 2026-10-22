export function LoadingSpinner({ label = 'Loading', className = '', size = 'h-5 w-5' }) {
  return (
    <span role="status" aria-label={label} className={`inline-grid shrink-0 place-items-center ${className}`}>
      <span
        aria-hidden="true"
        className={`${size} animate-spin rounded-full border-2 border-emerald-900/15 border-t-emerald-800 border-r-emerald-500 motion-reduce:animate-none`}
      />
    </span>
  );
}
